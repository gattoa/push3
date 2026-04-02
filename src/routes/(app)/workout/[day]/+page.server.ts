import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getFullPlan, getExerciseHistory } from '$lib/server/supabase';
import { getCurrentMonday } from '$lib/utils/date';

export const load: PageServerLoad = async ({ params, locals: { safeGetSession, supabase, timezone } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/');

	const dayIndex = parseInt(params.day, 10);
	if (isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) {
		error(400, 'Invalid day index. Must be 0-6.');
	}

	const currentMonday = getCurrentMonday(timezone);
	const fullPlan = await getFullPlan(supabase, user.id, { weekStartDate: currentMonday });

	if (!fullPlan || !fullPlan.plan) {
		// No plan for this week — send to plan page (shows empty state)
		redirect(303, '/plan');
	}

	const day = fullPlan.days.find((d) => d.day_index === dayIndex);
	if (!day) {
		error(404, 'Day not found in current plan.');
	}

	// Fetch unit preference + exercise history in parallel
	const exerciseIds = day.exercises.map((e) => e.exercise_id);
	const [{ data: settings }, historyMap] = await Promise.all([
		supabase.from('user_settings').select('unit_pref').eq('user_id', user.id).single(),
		getExerciseHistory(supabase, user.id, exerciseIds)
	]);

	// Transform snake_case RPC result to camelCase for component consistency
	const exerciseHistory: Record<string, { lastWeight: number; lastReps: number; bestE1RM: number }> = {};
	for (const [exId, hist] of Object.entries(historyMap)) {
		if (hist.last_weight != null && hist.last_reps != null && hist.best_e1rm != null) {
			exerciseHistory[exId] = {
				lastWeight: hist.last_weight,
				lastReps: hist.last_reps,
				bestE1RM: hist.best_e1rm
			};
		}
	}

	return {
		plan: fullPlan.plan,
		day,
		unitPref: settings?.unit_pref ?? 'lb',
		exerciseHistory
	};
};
