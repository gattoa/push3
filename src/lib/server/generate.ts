/**
 * Plan generation logic — assembles context, calls Claude, validates, saves.
 * Uses Claude tool use for structured JSON output.
 * Alternatives are computed async after generation (see alternatives.ts).
 */

import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { GenerationContext } from '$lib/types/database';
import type { Exercise } from '$lib/types/exercise';
import { getGenerationContext, savePlan } from '$lib/server/supabase';
import { getExercisesByEquipment } from '$lib/server/exercisedb';
import { filterByInjuries } from '$lib/server/injuries';

// ============================================================================
// Types for Claude's structured output
// ============================================================================

export interface GeneratedPlan {
	days: GeneratedDay[];
}

export interface GeneratedDay {
	day_index: number;
	split_label: string;
	exercises: GeneratedExercise[];
}

export interface GeneratedAlternative {
	exercise_id: string;
	exercise_name: string;
	body_part: string;
	target: string;
	equipment: string;
}

export interface GeneratedExercise {
	exercise_id: string;
	exercise_name: string;
	notes: string | null;
	rationale: string | null;
	alternatives: GeneratedAlternative[]; // populated async after generation
	sets: GeneratedSet[];
}

export interface GeneratedSet {
	set_number: number;
	target_reps: number;
	target_weight: number | null;
}

// ============================================================================
// Tool schema for Claude (alternatives removed — computed server-side)
// ============================================================================

const PLAN_TOOL: Anthropic.Tool = {
	name: 'generate_weekly_plan',
	description: 'Generate a complete weekly workout plan for the athlete. Call this tool once with the full plan.',
	input_schema: {
		type: 'object' as const,
		properties: {
			days: {
				type: 'array',
				description: 'Array of 7 days (training days on athlete-specified indices, rest days on all others)',
				items: {
					type: 'object',
					properties: {
						day_index: {
							type: 'number',
							description: 'Day of the week: 0=Monday, 1=Tuesday, ..., 6=Sunday'
						},
						split_label: {
							type: 'string',
							description: 'Training split label (e.g. "Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Rest")'
						},
						exercises: {
							type: 'array',
							description: 'Exercises for this day. Empty array for rest days.',
							items: {
								type: 'object',
								properties: {
									exercise_id: {
										type: 'string',
										description: 'ExerciseDB exercise ID. Must be from the provided exercise catalog.'
									},
									exercise_name: {
										type: 'string',
										description: 'Human-readable exercise name from the catalog.'
									},
									notes: {
										type: ['string', 'null'],
										description: 'Optional coaching note for this exercise (e.g. "Focus on slow eccentric", "Superset with next exercise")'
									},
									rationale: {
										type: ['string', 'null'],
										description: 'Brief explanation of why this exercise was chosen for this athlete (e.g. "Compound chest press to build pressing strength — progressed from 135 lb last week")'
									},
									sets: {
										type: 'array',
										items: {
											type: 'object',
											properties: {
												set_number: { type: 'number', description: '1-indexed set number' },
												target_reps: { type: 'number', description: 'Target reps for this set' },
												target_weight: {
													type: ['number', 'null'],
													description: 'Target weight in athlete\'s preferred unit. NULL for cold start (week 1) or new exercises without baseline.'
												}
											},
											required: ['set_number', 'target_reps', 'target_weight']
										}
									}
								},
								required: ['exercise_id', 'exercise_name', 'notes', 'rationale', 'sets']
							}
						}
					},
					required: ['day_index', 'split_label', 'exercises']
				}
			}
		},
		required: ['days']
	}
};

// ============================================================================
// System prompt
// ============================================================================

function buildSystemPrompt(): string {
	return `You are an expert strength and conditioning coach. You create personalized weekly training programs based on the athlete's profile, goals, experience, equipment, and performance history.

## Rules
1. Generate exactly 7 days (day_index 0-6, Monday-Sunday). Non-training days should have split_label "Rest" and empty exercises array.
2. Assign workouts to the athlete's specified training day indices. All other days are Rest. If the plan is generated mid-week, do not schedule training on days that have already passed. Distribute the athlete's training volume across the remaining available days. Always generate a plan regardless of how many days remain — even a single training day has value.
3. Only use exercises from the provided exercise catalog. Every exercise_id must exist in the catalog.
4. For Week 1 (cold start) or any exercise without an established performance baseline: set target_weight to null. The athlete will log their working weight to establish a baseline.
5. For Week 2+ with baselines: prescribe target_weight based on historical performance.
   - If the athlete completed all prescribed reps at a given weight: increase by 2.5-5 lb (1-2.5 kg) for upper body, 5-10 lb (2.5-5 kg) for lower body.
   - If the athlete failed to complete prescribed reps: keep weight the same or reduce slightly.
   - If the athlete skipped most sets for an exercise: consider swapping it for a similar movement.
   - Factor in check-in notes — the athlete may request changes, report schedule constraints, or flag new preferences.
6. Rep ranges should match the athlete's goal:
   - build_muscle: 8-12 reps, 3-4 sets per exercise
   - build_strength: 3-6 reps, 4-5 sets per exercise
   - lose_fat: 12-15 reps, 3-4 sets per exercise
   - general_fitness: 8-12 reps, 3 sets per exercise
7. Respect injury constraints — avoid exercises that load injured areas.
8. Total exercises per training day: 4-6, depending on session duration.
9. Prioritize compound movements early in each session.
10. Include warm-up notes for the first exercise of each day.
11. Use the athlete's unit preference (lb or kg) for all target weights.
12. Exercise variety is critical. Do NOT repeat the same exercise across multiple training days in the same week. Each training day should have a distinct set of exercises. Exercises may recur across weeks but not within the same week.
13. Select a diverse mix of exercises from the catalog — vary movement patterns (push, pull, hinge, squat, carry, isolation) and target different muscle groups across the week.
14. For each exercise, provide a brief rationale explaining why it was chosen — reference the athlete's goals, progression, or programming logic.
15. Demographic-aware programming:
    - Athletes aged 60+: cap working intensity at RPE 7-8, emphasize functional movements (squats to chair, farmer carries, step-ups), include balance work, avoid heavy axial loading.
    - Athletes under 18: prioritize bodyweight and machine exercises, limit heavy compound barbell lifts (no 1-3RM), focus on movement quality and moderate rep ranges (8-15).
    - Use gender to inform volume distribution where applicable (e.g., upper/lower volume split), but do not make assumptions about strength levels — rely on logged performance data.
    - If age or gender is not provided, program as a general adult.

## Output
Call the generate_weekly_plan tool exactly once with the complete plan.`;
}

// ============================================================================
// Helpers
// ============================================================================

function calculateAge(dob: string): number {
	const birth = new Date(dob);
	const today = new Date();
	let age = today.getFullYear() - birth.getFullYear();
	const m = today.getMonth() - birth.getMonth();
	if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
	return age;
}

/**
 * Trim exercise catalog to a manageable size for Claude's context window.
 * Balances across body parts so Claude has diverse options.
 */
function trimCatalog(catalog: Exercise[], maxSize = 80): Exercise[] {
	if (catalog.length <= maxSize) return catalog;

	const byBodyPart = new Map<string, Exercise[]>();
	for (const ex of catalog) {
		const group = byBodyPart.get(ex.bodyPart) ?? [];
		group.push(ex);
		byBodyPart.set(ex.bodyPart, group);
	}

	const perGroup = Math.max(5, Math.floor(maxSize / byBodyPart.size));
	const trimmed = [...byBodyPart.values()].flatMap((g) => g.slice(0, perGroup));

	console.log(`[generate] Trimmed catalog from ${catalog.length} to ${trimmed.length} exercises (${byBodyPart.size} body parts, ${perGroup} per group)`);
	return trimmed;
}

// ============================================================================
// User message builder
// ============================================================================

function buildUserMessage(
	context: GenerationContext,
	exerciseCatalog: Exercise[]
): string {
	const { user_settings, check_in_history, previous_plans, historical_set_logs, next_week_number } = context;

	const age = user_settings.date_of_birth ? calculateAge(user_settings.date_of_birth) : null;

	// Mid-week awareness: tell the trainer what day it is
	const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const jsDay = new Date().getDay();
	const todayIndex = jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Mon scheme
	const daysRemaining = 7 - todayIndex;

	let msg = `## Athlete Profile
- Date of birth: ${user_settings.date_of_birth ?? 'Not provided'}
- Gender: ${user_settings.gender ?? 'Not provided'}
- Age: ${age !== null ? age : 'Unknown'}
- Goal: ${user_settings.goals}
- Experience: ${user_settings.experience_level}
- Equipment: ${user_settings.equipment.join(', ')}
- Training days: ${user_settings.training_days.map((d: number) => DAY_NAMES[d]).join(', ')} (day indices: ${user_settings.training_days.join(', ')})
- Session duration: ${user_settings.session_duration_minutes} minutes
- Unit preference: ${user_settings.unit_pref}
- Injuries: ${user_settings.injuries.length > 0 ? user_settings.injuries.join(', ') : 'None'}
- Today: ${DAY_NAMES[todayIndex]} (day_index ${todayIndex})
- Days remaining this week: ${daysRemaining}

## Week Number: ${next_week_number}
${next_week_number === 1 ? '**This is Week 1 (cold start). Set ALL target_weight values to null.**' : ''}

## Exercise Catalog
The following exercises are available. Use ONLY exercise IDs from this list.
\`\`\`json
${JSON.stringify(exerciseCatalog.map(e => ({ id: e.id, name: e.name, bodyPart: e.bodyPart, target: e.target, equipment: e.equipment })), null, 1)}
\`\`\`
`;

	// Add historical data for Week 2+
	if (next_week_number > 1 && historical_set_logs.length > 0) {
		msg += `\n## Historical Performance (per-exercise baselines)
\`\`\`json
${JSON.stringify(historical_set_logs, null, 1)}
\`\`\`
`;
	}

	if (check_in_history.length > 0) {
		// Surface the most recent check-in notes prominently
		const latestCheckIn = check_in_history[check_in_history.length - 1];
		if (latestCheckIn.notes) {
			msg += `\n## Athlete Notes (from latest check-in)
"${latestCheckIn.notes}"
Pay attention to these preferences when building the plan.
`;
		}

		msg += `\n## Check-In History
\`\`\`json
${JSON.stringify(check_in_history, null, 1)}
\`\`\`
`;
	}

	if (previous_plans.length > 0) {
		msg += `\n## Previous Plans (for adherence analysis)
\`\`\`json
${JSON.stringify(previous_plans.map(p => ({ week: p.week_number, status: p.status })), null, 1)}
\`\`\`
`;
	}

	msg += '\nGenerate the weekly plan now.';

	return msg;
}

// ============================================================================
// Exercise catalog assembly
// ============================================================================

async function buildExerciseCatalog(equipment: string[]): Promise<Exercise[]> {
	const allExercises: Exercise[] = [];
	const seenIds = new Set<string>();

	// Fetch exercises for each equipment type the athlete has
	const fetches = equipment.map(async (eq) => {
		try {
			return await getExercisesByEquipment(eq, 100);
		} catch (e) {
			console.warn(`Failed to fetch exercises for equipment "${eq}":`, e);
			return [];
		}
	});

	const results = await Promise.all(fetches);

	for (const exercises of results) {
		for (const ex of exercises) {
			if (!seenIds.has(ex.id)) {
				seenIds.add(ex.id);
				allExercises.push(ex);
			}
		}
	}

	return allExercises;
}

// ============================================================================
// Main generation function
// ============================================================================

export async function generatePlan(
	supabase: SupabaseClient,
	userId: string
): Promise<{ planId: string } | { error: string }> {
	// 1. Get generation context from Supabase
	const context = await getGenerationContext(supabase, userId);
	if (!context) {
		return { error: 'Failed to load generation context.' };
	}

	// 2. Check for existing plan for this calendar week
	const { data: existingPlan } = await supabase
		.from('weekly_plans')
		.select('id')
		.eq('user_id', userId)
		.eq('week_start_date', context.next_week_start_date)
		.in('status', ['generating', 'active'])
		.maybeSingle();

	if (existingPlan) {
		return { error: `A plan already exists for the week of ${context.next_week_start_date}.` };
	}

	// 3. Build exercise catalog filtered by athlete's equipment + injuries
	console.log('[generate] Equipment:', context.user_settings.equipment);
	const rawCatalog = await buildExerciseCatalog(context.user_settings.equipment);
	console.log('[generate] Raw catalog size:', rawCatalog.length);

	const { filtered: fullCatalog, excluded } = filterByInjuries(rawCatalog, context.user_settings.injuries);
	if (excluded.bodyParts.length > 0 || excluded.targets.length > 0) {
		console.log('[generate] Injury filter excluded bodyParts:', excluded.bodyParts, 'targets:', excluded.targets);
		console.log('[generate] Catalog size after injury filter:', fullCatalog.length);
	}

	if (fullCatalog.length === 0) {
		return { error: 'No exercises found for your equipment. Please update your profile.' };
	}

	// Trim catalog for Claude's prompt (keep full catalog for alternatives computation)
	const catalogForPrompt = trimCatalog(fullCatalog);
	console.log('[generate] Catalog for Claude prompt:', catalogForPrompt.length);
	console.log('[generate] Sample exercises:', catalogForPrompt.slice(0, 10).map(e => `${e.id} — ${e.name} (${e.bodyPart}/${e.target})`));

	// 4. Call Claude
	const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

	let generatedPlan: GeneratedPlan;

	try {
		const response = await anthropic.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 8000,
			system: buildSystemPrompt(),
			tools: [PLAN_TOOL],
			tool_choice: { type: 'tool', name: 'generate_weekly_plan' },
			messages: [
				{ role: 'user', content: buildUserMessage(context, catalogForPrompt) }
			]
		});

		// Extract tool use result
		const toolBlock = response.content.find((block) => block.type === 'tool_use');
		if (!toolBlock || toolBlock.type !== 'tool_use') {
			return { error: 'Claude did not return a plan. Please try again.' };
		}

		generatedPlan = toolBlock.input as GeneratedPlan;
	} catch (e) {
		console.error('Claude API error:', e);
		return { error: `AI generation failed: ${e instanceof Error ? e.message : 'Unknown error'}` };
	}

	// 5. Validate the plan
	const catalogIds = new Set(fullCatalog.map((e) => e.id));
	for (const day of generatedPlan.days) {
		for (const ex of day.exercises) {
			if (!catalogIds.has(ex.exercise_id)) {
				console.warn(`Exercise ${ex.exercise_id} (${ex.exercise_name}) not in catalog — allowing with warning`);
			}
		}
	}

	// Ensure exactly 7 days
	if (generatedPlan.days.length !== 7) {
		return { error: `Plan has ${generatedPlan.days.length} days instead of 7.` };
	}

	// 6. Save to Supabase (alternatives empty — populated async by background task)
	const planId = await savePlan(
		supabase,
		{
			user_id: userId,
			week_number: context.next_week_number,
			week_start_date: context.next_week_start_date,
			status: 'generating'
		},
		generatedPlan.days.map((day) => ({
			plan_id: '', // will be set by savePlan
			day_index: day.day_index,
			split_label: day.split_label,
			exercises: day.exercises.map((ex, i) => ({
				exercise_id: ex.exercise_id,
				exercise_name: ex.exercise_name,
				order_index: i,
				notes: ex.notes,
				rationale: ex.rationale ?? null,
				alternatives: [], // populated async after save
				sets: ex.sets.map((s) => ({
					set_number: s.set_number,
					target_reps: s.target_reps,
					target_weight: s.target_weight
				}))
			}))
		}))
	);

	if (!planId) {
		return { error: 'Failed to save plan to database.' };
	}

	return { planId };
}
