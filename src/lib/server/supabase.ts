/**
 * Server-side Supabase helpers for data operations.
 * These wrap common queries used across API routes and server load functions.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	FullPlan,
	GenerationContext,
	ExerciseHistoryMap,
	UserSettings,
	UserSettingsUpdate,
	WeeklyPlanInsert,
	PlannedDayInsert,
	PlannedExerciseInsert,
	PlannedSetInsert,
	SetLogInsert,
	SetLogUpdate,
	CheckInInsert,
	ExerciseAlternative
} from '$lib/types/database';

// ============================================================================
// User Settings
// ============================================================================

export async function getUserSettings(
	supabase: SupabaseClient,
	userId: string
): Promise<UserSettings | null> {
	const { data, error } = await supabase
		.from('user_settings')
		.select('*')
		.eq('user_id', userId)
		.single();

	if (error) {
		console.error('Failed to fetch user settings:', error.message);
		return null;
	}
	return data;
}

export async function updateUserSettings(
	supabase: SupabaseClient,
	userId: string,
	updates: UserSettingsUpdate
): Promise<UserSettings | null> {
	const { data, error } = await supabase
		.from('user_settings')
		.upsert(
			{ user_id: userId, ...updates, updated_at: new Date().toISOString() },
			{ onConflict: 'user_id' }
		)
		.select()
		.single();

	if (error) {
		console.error('Failed to upsert user settings:', error.message, '| code:', error.code, '| details:', error.details, '| hint:', error.hint);
		return null;
	}
	return data;
}

// ============================================================================
// Plan Retrieval (via RPC)
// ============================================================================

export async function getFullPlan(
	supabase: SupabaseClient,
	userId: string,
	weekNumber?: number
): Promise<FullPlan | null> {
	const { data, error } = await supabase.rpc('get_full_plan', {
		p_user_id: userId,
		p_week_number: weekNumber ?? null
	});

	if (error) {
		console.error('Failed to fetch full plan:', error.message);
		return null;
	}
	return data;
}

export async function getGenerationContext(
	supabase: SupabaseClient,
	userId: string
): Promise<GenerationContext | null> {
	const { data, error } = await supabase.rpc('get_generation_context', {
		p_user_id: userId
	});

	if (error) {
		console.error('Failed to fetch generation context:', error.message);
		return null;
	}
	return data;
}

// ============================================================================
// Exercise History (per-exercise context for workout UI)
// ============================================================================

export async function getExerciseHistory(
	supabase: SupabaseClient,
	userId: string,
	exerciseIds: string[]
): Promise<ExerciseHistoryMap> {
	if (exerciseIds.length === 0) return {};

	const { data, error } = await supabase.rpc('get_exercise_history', {
		p_user_id: userId,
		p_exercise_ids: exerciseIds
	});

	if (error) {
		console.error('Failed to fetch exercise history:', error.message);
		return {};
	}
	return (data as ExerciseHistoryMap) ?? {};
}

// ============================================================================
// Plan Creation (used by generation API route)
// ============================================================================

export async function savePlan(
	supabase: SupabaseClient,
	plan: WeeklyPlanInsert,
	days: (PlannedDayInsert & {
		exercises: (Omit<PlannedExerciseInsert, 'day_id'> & {
			sets: Omit<PlannedSetInsert, 'planned_exercise_id'>[];
		})[];
	})[]
): Promise<string | null> {
	// Insert the plan
	const { data: planRow, error: planError } = await supabase
		.from('weekly_plans')
		.insert(plan)
		.select('id')
		.single();

	if (planError || !planRow) {
		console.error('Failed to insert plan:', planError?.message);
		return null;
	}

	const planId = planRow.id;

	// Insert days, exercises, and sets
	for (const day of days) {
		const { data: dayRow, error: dayError } = await supabase
			.from('planned_days')
			.insert({ plan_id: planId, day_index: day.day_index, split_label: day.split_label })
			.select('id')
			.single();

		if (dayError || !dayRow) {
			console.error('Failed to insert day:', dayError?.message);
			return null;
		}

		for (const exercise of day.exercises) {
			const { data: exRow, error: exError } = await supabase
				.from('planned_exercises')
				.insert({
					day_id: dayRow.id,
					exercise_id: exercise.exercise_id,
					exercise_name: exercise.exercise_name,
					order_index: exercise.order_index,
					notes: exercise.notes ?? null,
					alternatives: exercise.alternatives ?? null,
					rationale: exercise.rationale ?? null
				})
				.select('id')
				.single();

			if (exError || !exRow) {
				console.error('Failed to insert exercise:', exError?.message);
				return null;
			}

			if (exercise.sets.length > 0) {
				const setRows = exercise.sets.map((s) => ({
					planned_exercise_id: exRow.id,
					set_number: s.set_number,
					target_reps: s.target_reps,
					target_weight: s.target_weight ?? null
				}));

				const { error: setsError } = await supabase.from('planned_sets').insert(setRows);

				if (setsError) {
					console.error('Failed to insert sets:', setsError.message);
					return null;
				}
			}
		}
	}

	// Mark plan as active
	await supabase.from('weekly_plans').update({ status: 'active' }).eq('id', planId);

	return planId;
}

// ============================================================================
// Set Logging
// ============================================================================

export async function logSet(
	supabase: SupabaseClient,
	log: SetLogInsert
): Promise<string | null> {
	const { data, error } = await supabase
		.from('set_logs')
		.insert(log)
		.select('id')
		.single();

	if (error) {
		console.error('Failed to insert set log:', error.message);
		return null;
	}
	return data.id;
}

export async function updateSetLog(
	supabase: SupabaseClient,
	logId: string,
	updates: SetLogUpdate
): Promise<boolean> {
	const { error } = await supabase
		.from('set_logs')
		.update(updates)
		.eq('id', logId);

	if (error) {
		console.error('Failed to update set log:', error.message);
		return false;
	}
	return true;
}

// ============================================================================
// Check-Ins
// ============================================================================

export async function createCheckIn(
	supabase: SupabaseClient,
	checkIn: CheckInInsert
): Promise<string | null> {
	const { data, error } = await supabase
		.from('check_ins')
		.upsert(checkIn, { onConflict: 'user_id,week_number' })
		.select('id')
		.single();

	if (error) {
		console.error('Failed to upsert check-in:', error.message);
		return null;
	}
	return data.id;
}

// ============================================================================
// Exercise Swaps
// ============================================================================

export async function swapExercise(
	supabase: SupabaseClient,
	plannedExerciseId: string,
	newExerciseId: string,
	newExerciseName: string
): Promise<{ success: true } | { success: false; error: string }> {
	// 1. Read current exercise row to preserve alternatives
	const { data: currentExercise, error: exerciseQueryError } = await supabase
		.from('planned_exercises')
		.select('exercise_id, exercise_name, alternatives')
		.eq('id', plannedExerciseId)
		.single();

	if (exerciseQueryError || !currentExercise) {
		console.error('Failed to query planned exercise:', exerciseQueryError?.message);
		return { success: false, error: exerciseQueryError?.message ?? 'Exercise not found' };
	}

	// Build rotated alternatives: original exercise replaces the picked one
	const originalAsAlt: ExerciseAlternative = {
		exercise_id: currentExercise.exercise_id,
		exercise_name: currentExercise.exercise_name,
		body_part: '',
		target: '',
		equipment: ''
	};
	const remaining = ((currentExercise.alternatives as ExerciseAlternative[] | null) ?? []).filter(
		(a) => a.exercise_id !== newExerciseId
	);
	const rotatedAlternatives = [originalAsAlt, ...remaining];

	// 2. Get planned_sets IDs for this exercise
	const { data: sets, error: setsQueryError } = await supabase
		.from('planned_sets')
		.select('id')
		.eq('planned_exercise_id', plannedExerciseId);

	if (setsQueryError) {
		console.error('Failed to query planned sets:', setsQueryError.message);
		return { success: false, error: setsQueryError.message };
	}

	const setIds = (sets ?? []).map((s) => s.id);

	// 3. Delete set_logs for those planned_sets
	if (setIds.length > 0) {
		const { error: logsDeleteError } = await supabase
			.from('set_logs')
			.delete()
			.in('planned_set_id', setIds);

		if (logsDeleteError) {
			console.error('Failed to delete set logs:', logsDeleteError.message);
			return { success: false, error: logsDeleteError.message };
		}
	}

	// 4. Delete planned_sets for this exercise
	const { error: setsDeleteError } = await supabase
		.from('planned_sets')
		.delete()
		.eq('planned_exercise_id', plannedExerciseId);

	if (setsDeleteError) {
		console.error('Failed to delete planned sets:', setsDeleteError.message);
		return { success: false, error: setsDeleteError.message };
	}

	// 5. Update planned_exercises row
	const { error: updateError } = await supabase
		.from('planned_exercises')
		.update({
			exercise_id: newExerciseId,
			exercise_name: newExerciseName,
			notes: null,
			rationale: null,
			alternatives: rotatedAlternatives
		})
		.eq('id', plannedExerciseId);

	if (updateError) {
		console.error('Failed to update planned exercise:', updateError.message);
		return { success: false, error: updateError.message };
	}

	// 6. Insert 3 fresh default planned_sets
	const { error: insertError } = await supabase.from('planned_sets').insert([
		{ planned_exercise_id: plannedExerciseId, set_number: 1, target_reps: 10, target_weight: null },
		{ planned_exercise_id: plannedExerciseId, set_number: 2, target_reps: 10, target_weight: null },
		{ planned_exercise_id: plannedExerciseId, set_number: 3, target_reps: 10, target_weight: null }
	]);

	if (insertError) {
		console.error('Failed to insert default sets:', insertError.message);
		return { success: false, error: insertError.message };
	}

	return { success: true };
}
