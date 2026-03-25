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
	CheckInInsert
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
		console.error('Failed to upsert user settings:', error.message);
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
