import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getFullPlan } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/');

	// Map JS day (0=Sun) to our scheme (0=Mon)
	const jsDay = new Date().getDay();
	const dayIndex = jsDay === 0 ? 6 : jsDay - 1;

	const fullPlan = await getFullPlan(supabase, user.id);
	if (!fullPlan || !fullPlan.plan) {
		redirect(303, '/plan/generate');
	}

	const day = fullPlan.days.find((d) => d.day_index === dayIndex);
	if (!day) {
		error(404, 'Day not found in current plan.');
	}

	// Get user's unit preference
	const { data: settings } = await supabase
		.from('user_settings')
		.select('unit_pref')
		.eq('user_id', user.id)
		.single();

	// ── Historical exercise data (for "Last" display + PR detection) ──
	const exerciseIds = day.exercises.map((e) => e.exercise_id);
	const exerciseHistory: Record<string, { lastWeight: number; lastReps: number; bestE1RM: number }> = {};

	if (exerciseIds.length > 0) {
		const { data: pastPlans } = await supabase
			.from('weekly_plans')
			.select(`
				planned_days (
					planned_exercises (
						exercise_id,
						planned_sets (
							set_logs (
								actual_weight,
								actual_reps,
								status,
								logged_at
							)
						)
					)
				)
			`)
			.eq('user_id', user.id)
			.neq('id', fullPlan.plan.id);

		if (pastPlans) {
			// Collect all completed logs per exercise
			const logsByExercise: Record<string, { weight: number; reps: number; e1rm: number; loggedAt: string | null }[]> = {};

			for (const plan of pastPlans) {
				for (const pDay of (plan as any).planned_days ?? []) {
					for (const ex of pDay.planned_exercises ?? []) {
						if (!exerciseIds.includes(ex.exercise_id)) continue;
						for (const set of ex.planned_sets ?? []) {
							for (const log of set.set_logs ?? []) {
								if (log.status !== 'completed' || !log.actual_weight || !log.actual_reps) continue;
								if (!logsByExercise[ex.exercise_id]) logsByExercise[ex.exercise_id] = [];
								logsByExercise[ex.exercise_id].push({
									weight: log.actual_weight,
									reps: log.actual_reps,
									e1rm: log.actual_weight * (1 + log.actual_reps / 30),
									loggedAt: log.logged_at
								});
							}
						}
					}
				}
			}

			// Compute last performance + best E1RM per exercise
			for (const [exId, logs] of Object.entries(logsByExercise)) {
				logs.sort((a, b) => {
					if (!a.loggedAt && !b.loggedAt) return 0;
					if (!a.loggedAt) return 1;
					if (!b.loggedAt) return -1;
					return new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime();
				});

				exerciseHistory[exId] = {
					lastWeight: logs[0].weight,
					lastReps: logs[0].reps,
					bestE1RM: Math.max(...logs.map((l) => l.e1rm))
				};
			}
		}
	}

	// ── Banner logic ──
	const isCheckInDay = jsDay === 0; // Sunday

	const planCreatedAt = new Date(fullPlan.plan.created_at);
	const hoursSinceGeneration = (Date.now() - planCreatedAt.getTime()) / (1000 * 60 * 60);
	const isNewPlan = hoursSinceGeneration < 48;

	const { data: existingCheckIn } = await supabase
		.from('check_ins')
		.select('id')
		.eq('user_id', user.id)
		.eq('week_number', fullPlan.plan.week_number)
		.maybeSingle();

	const showCheckInBanner = isCheckInDay && !existingCheckIn;
	const showPlanReviewBanner = isNewPlan && fullPlan.plan.week_number > 1;

	return {
		plan: fullPlan.plan,
		day,
		dayIndex,
		unitPref: settings?.unit_pref ?? 'lb',
		exerciseHistory,
		banner: showCheckInBanner ? 'check-in' as const : showPlanReviewBanner ? 'plan-review' as const : null
	};
};
