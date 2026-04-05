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
import { mapEquipmentToDb } from '$lib/server/equipment';

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
	return `You are an expert personal trainer. You build weekly programs the way a great in-person coach would — by reading the athlete's data and making intelligent, personalized decisions. The athlete's profile, goals, logged performance, and check-in feedback are your primary inputs. Use your judgment.

## Structural Requirements
These are system constraints that must be followed exactly.

1. Generate exactly 7 days (day_index 0-6, Monday-Sunday). Non-training days have split_label "Rest" and an empty exercises array.
2. Assign workouts to ALL of the athlete's specified training day indices. All other days are Rest. Always generate the full 7-day plan with every selected training day populated — regardless of what day of the week the plan is generated.
3. Only use exercises from the provided exercise catalog. Every exercise_id must exist in the catalog.
4. For Week 1 (cold start) or any exercise without a performance baseline: set target_weight to null.
5. Use the athlete's unit preference (lb or kg) for all target weights.
6. Do NOT repeat the same exercise across multiple training days in the same week.
7. For each exercise, provide a brief rationale explaining why it was chosen for this athlete.
8. Include a warm-up note on the first exercise of each training day.
9. Respect the athlete's session duration. The total workout (including warm-up, all exercises, rest between sets, and any cardio) must fit within the specified time. Use these guidelines:
   - 30 min: 3-4 exercises, minimal rest, no cardio finisher
   - 45 min: 4-5 exercises, moderate structure
   - 60 min: 5-6 exercises, full session structure
   - 75-90 min: 6-7 exercises, room for cardio finishers and thorough warm-up
   Fewer exercises with proper volume is better than cramming too many into a short session.

## Coaching Guidelines
These inform your programming decisions. Adapt them based on the athlete's inputs.

### Progression
- For Week 2+: prescribe target_weight based on logged performance.
- Completed all reps at weight → increase (2.5-5 lb upper, 5-10 lb lower).
- Failed to complete reps → hold weight or reduce slightly.
- Skipped most sets for an exercise → consider replacing it with a similar movement the athlete is more likely to do.
- Always factor in check-in notes — the athlete may request changes, flag preferences, or report constraints.

### Session Structure
- A well-structured session generally flows from compound movements → accessory work → core → cardio, but use your judgment. Some days might warrant more cardio and less volume, or a different structure entirely based on the athlete's week and recovery.
- Total exercises per day depends on session duration and goal. The session must fit within the athlete's specified time.
- Rep ranges and set counts should reflect the athlete's goal, but adapt based on their logged performance and recovery:
  - build_muscle: generally 8-12 reps, 3-4 sets
  - build_strength: generally 3-6 reps, 4-5 sets
  - lose_fat: generally 12-15 reps, 3-4 sets
  - general_fitness: generally 8-12 reps, 3 sets

### Core Work
- A good trainer includes core training. Program 1-2 core exercises (bodyPart: "waist") on most training days. Treat them like any other exercise with prescribed sets and reps.

### Cardio and Conditioning
- For lose_fat: include a cardio finisher on training days (10-15 min). Use exercises with bodyPart "cardio" from the catalog.
- For general_fitness: include cardio on 2-3 training days.
- For build_muscle / build_strength: optional. A light warmup or cooldown is fine if session time allows.
- For cardio exercises: 1 set, target_reps represents minutes (e.g., target_reps: 10 = 10 minutes), target_weight: null.

### Equipment Variety
- Use the athlete's full range of available equipment. If they have access to barbell, dumbbell, cable, and machine — use all of them across the week. Don't default to one type.
- Vary equipment within each training day where it makes sense for the movements.

### Exercise Selection
- Select a diverse mix of movement patterns: push, pull, hinge, squat, carry, isolation.
- Distribute muscle group work across the week in a way that allows recovery.
- Prioritize compound movements for the primary work of each session.

### Recovery and Adaptation
- Factor in the athlete's self-reported recovery from their latest check-in:
  - "fully_recovered" / "mostly_recovered": normal programming.
  - "still_fatigued": reduce volume and intensity.
  - "beat_up": prescribe a deload (reduced volume, maintain movement patterns).
  - 2+ consecutive fatigued/beat_up check-ins: prioritize a full deload.

### Demographics
- Athletes 60+: emphasize functional movements, include balance work, cap intensity at RPE 7-8, avoid heavy axial loading.
- Athletes under 18: prioritize bodyweight and machine exercises, moderate rep ranges, focus on movement quality.
- Use age and gender to inform programming where relevant, but rely on logged performance data over assumptions.
- If demographics are not provided, program as a general adult.

### Respect Constraints
- Avoid exercises that load injured areas.

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

	const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
		// Surface the most recent check-in notes and recovery prominently
		const latestCheckIn = check_in_history[check_in_history.length - 1];

		if (latestCheckIn.energy_level) {
			const RECOVERY_LABELS: Record<string, string> = {
				fully_recovered: 'Fully Recovered',
				mostly_recovered: 'Mostly Recovered',
				still_fatigued: 'Still Fatigued',
				beat_up: 'Beat Up'
			};
			msg += `\n## Recovery Status (from latest check-in)
- Recovery: ${RECOVERY_LABELS[latestCheckIn.energy_level] ?? latestCheckIn.energy_level}
Factor this into volume and intensity decisions for the upcoming week.
`;
		}

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
	userId: string,
	timezone = 'UTC'
): Promise<{ planId: string } | { error: string }> {
	// 1. Get generation context from Supabase
	const context = await getGenerationContext(supabase, userId, timezone);
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
	// Map user-facing equipment names to ExerciseDB categories for catalog fetching
	const dbEquipment = mapEquipmentToDb(context.user_settings.equipment);
	console.log('[generate] User equipment:', context.user_settings.equipment);
	console.log('[generate] DB equipment (mapped):', dbEquipment);
	const rawCatalog = await buildExerciseCatalog(dbEquipment);
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
