/**
 * Background alternatives computation via a focused Claude call.
 * Runs async after plan generation to pre-cache coach-picked swap
 * alternatives so they're instantly available in the gym — no wifi needed.
 *
 * Uses a small, targeted Claude prompt (~4-5K input tokens) with the
 * plan exercises + athlete context + candidate catalog.
 */

import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ExerciseAlternative } from '$lib/types/database';
import { getExercisesByEquipment } from '$lib/server/exercisedb';
import { mapEquipmentToDb } from '$lib/server/equipment';
import type { Exercise } from '$lib/types/exercise';

// ============================================================================
// Types
// ============================================================================

interface AlternativesResult {
	exercises: {
		planned_exercise_id: string;
		alternatives: {
			exercise_id: string;
			exercise_name: string;
			body_part: string;
			target: string;
			equipment: string;
		}[];
	}[];
}

// ============================================================================
// Tool schema — one call for all exercises
// ============================================================================

const ALTERNATIVES_TOOL: Anthropic.Tool = {
	name: 'set_alternatives',
	description: 'Provide exactly 3 swap alternatives for each exercise in the plan.',
	input_schema: {
		type: 'object' as const,
		properties: {
			exercises: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						planned_exercise_id: {
							type: 'string',
							description: 'The planned_exercise ID from the input'
						},
						alternatives: {
							type: 'array',
							description: 'Exactly 3 alternative exercises from the candidate catalog',
							items: {
								type: 'object',
								properties: {
									exercise_id: { type: 'string' },
									exercise_name: { type: 'string' },
									body_part: { type: 'string' },
									target: { type: 'string' },
									equipment: { type: 'string' }
								},
								required: ['exercise_id', 'exercise_name', 'body_part', 'target', 'equipment']
							}
						}
					},
					required: ['planned_exercise_id', 'alternatives']
				}
			}
		},
		required: ['exercises']
	}
};

// ============================================================================
// Main function
// ============================================================================

/**
 * Compute and persist personalized alternatives for every exercise in a plan.
 * Called fire-and-forget after plan save — results are cached in Supabase
 * so the workout UI loads them instantly with no API calls.
 */
export async function computeAlternativesForPlan(
	supabase: SupabaseClient,
	planId: string,
	userId: string
): Promise<void> {
	console.log(`[alternatives] Starting background computation for plan ${planId}`);

	// 1. Fetch user profile
	const { data: settings } = await supabase
		.from('user_settings')
		.select('equipment, injuries, experience_level, goals')
		.eq('user_id', userId)
		.single();

	if (!settings) {
		console.warn('[alternatives] No user settings found');
		return;
	}

	// 2. Fetch all planned exercises with day context
	const { data: days } = await supabase
		.from('planned_days')
		.select('id, day_index, split_label, planned_exercises(id, exercise_id, exercise_name)')
		.eq('plan_id', planId)
		.order('day_index');

	if (!days || days.length === 0) {
		console.warn('[alternatives] No days found for plan', planId);
		return;
	}

	// Build plan summary grouped by day
	const dayGroups: { day_index: number; split_label: string; exercises: { id: string; exercise_id: string; exercise_name: string }[] }[] = [];
	const allExerciseIds = new Set<string>();

	for (const day of days) {
		const exercises = day.planned_exercises as { id: string; exercise_id: string; exercise_name: string }[];
		if (exercises.length === 0) continue;
		dayGroups.push({ day_index: day.day_index, split_label: day.split_label, exercises });
		for (const ex of exercises) allExerciseIds.add(ex.exercise_id);
	}

	if (allExerciseIds.size === 0) {
		console.log('[alternatives] No exercises in plan — skipping');
		return;
	}

	// 3. Build candidate catalog from user's equipment
	const equipment = mapEquipmentToDb(settings.equipment ?? []);
	const candidateCatalog = await buildCandidateCatalog(equipment);
	console.log(`[alternatives] Candidate catalog: ${candidateCatalog.length} exercises`);

	if (candidateCatalog.length === 0) {
		console.warn('[alternatives] Empty candidate catalog — skipping');
		return;
	}

	// 4. Build prompt
	let planSummary = '';
	for (const day of dayGroups) {
		planSummary += `\nDay ${day.day_index} (${day.split_label}):\n`;
		for (const ex of day.exercises) {
			planSummary += `  - [${ex.id}] ${ex.exercise_name} (${ex.exercise_id})\n`;
		}
	}

	const catalogJson = JSON.stringify(
		candidateCatalog.map((e) => ({
			id: e.id,
			name: e.name,
			bodyPart: e.bodyPart,
			target: e.target,
			equipment: e.equipment
		})),
		null,
		1
	);

	const systemPrompt = `You are an expert strength coach selecting swap alternatives for a workout plan. For each exercise, pick exactly 3 alternatives that:

1. Serve the same programming purpose — match the movement pattern (press for press, hinge for hinge, pull for pull), not just the target muscle
2. Are appropriate for a ${settings.experience_level} athlete with a ${settings.goals} goal
3. Use varied equipment across the 3 picks where possible (e.g., barbell, dumbbell, cable)
4. Do NOT include any exercise already prescribed on the same training day
5. Do NOT include the exercise itself as an alternative
6. Every alternative must come from the candidate catalog below
${settings.injuries?.length > 0 ? `7. AVOID exercises that load these injured areas: ${settings.injuries.join(', ')}` : ''}

Call the set_alternatives tool once with all exercises.`;

	// 5. Call Claude
	const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

	try {
		const response = await anthropic.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 4000,
			system: systemPrompt,
			tools: [ALTERNATIVES_TOOL],
			tool_choice: { type: 'tool', name: 'set_alternatives' },
			messages: [
				{
					role: 'user',
					content: `## Plan Exercises\n${planSummary}\n\n## Candidate Catalog\n\`\`\`json\n${catalogJson}\n\`\`\`\n\nProvide 3 alternatives for each exercise.`
				}
			]
		});

		const toolBlock = response.content.find((b) => b.type === 'tool_use');
		if (!toolBlock || toolBlock.type !== 'tool_use') {
			console.error('[alternatives] Claude did not return alternatives');
			return;
		}

		const result = toolBlock.input as AlternativesResult;

		// 6. Persist to database (enrich with gif URLs from catalog)
		const gifLookup = buildGifLookup(candidateCatalog);
		let successCount = 0;
		for (const item of result.exercises) {
			const alternatives: ExerciseAlternative[] = item.alternatives.slice(0, 3).map((a) => ({
				exercise_id: a.exercise_id,
				exercise_name: a.exercise_name,
				body_part: a.body_part,
				target: a.target,
				equipment: a.equipment,
				gif_url: gifLookup.get(a.exercise_id)
			}));

			const { error } = await supabase
				.from('planned_exercises')
				.update({ alternatives })
				.eq('id', item.planned_exercise_id);

			if (error) {
				console.warn(`[alternatives] Failed to update ${item.planned_exercise_id}:`, error.message);
			} else {
				successCount++;
			}
		}

		console.log(`[alternatives] Done. Updated ${successCount}/${allExerciseIds.size} exercises.`);
	} catch (e) {
		console.error('[alternatives] Claude API error:', e);
	}
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Build a lookup map from exercise ID to gifUrl using the candidate catalog.
 */
function buildGifLookup(catalog: Exercise[]): Map<string, string> {
	const map = new Map<string, string>();
	for (const ex of catalog) {
		if (ex.gifUrl) map.set(ex.id, ex.gifUrl);
	}
	return map;
}

/**
 * Build a candidate exercise catalog from user's equipment.
 * Fetches in parallel, deduplicates.
 */
async function buildCandidateCatalog(equipment: string[]): Promise<Exercise[]> {
	const seenIds = new Set<string>();
	const all: Exercise[] = [];

	const fetches = equipment.map(async (eq) => {
		try {
			return await getExercisesByEquipment(eq, 50);
		} catch {
			return [];
		}
	});

	const results = await Promise.all(fetches);
	for (const exercises of results) {
		for (const ex of exercises) {
			if (!seenIds.has(ex.id)) {
				seenIds.add(ex.id);
				all.push(ex);
			}
		}
	}

	return all;
}
