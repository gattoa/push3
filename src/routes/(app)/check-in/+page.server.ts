import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getFullPlan, getUserSettings, createCheckIn, updateUserSettings } from '$lib/server/supabase';
import type { FullPlanDay } from '$lib/types/database';
// Equipment is stored as user-facing names. Mapping to ExerciseDB categories
// happens at plan generation time in generate.ts.

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/');

	// Check-in reflects on the most recent plan (not necessarily this week)
	const fullPlan = await getFullPlan(supabase, user.id, { latest: true });
	if (!fullPlan || !fullPlan.plan) {
		console.warn('[check-in] No plan found for user:', user.id, '— redirecting to /plan');
		redirect(303, '/plan');
	}

	const settings = await getUserSettings(supabase, user.id);
	if (!settings) {
		redirect(303, '/workout');
	}

	// Compute week stats for display
	const weekStats = computeWeekStats(fullPlan.days);

	return {
		plan: fullPlan.plan,
		settings,
		weekStats
	};
};

function computeWeekStats(days: FullPlanDay[]) {
	let totalSets = 0;
	let completedSets = 0;
	let skippedSets = 0;
	let totalVolume = 0;
	let daysWorkedOut = 0;

	for (const day of days) {
		if (day.exercises.length === 0) continue;

		let dayHasLog = false;
		for (const ex of day.exercises) {
			for (const set of ex.sets) {
				totalSets++;
				if (set.log) {
					if (set.log.status === 'completed') {
						completedSets++;
						dayHasLog = true;
						if (set.log.actual_weight && set.log.actual_reps) {
							totalVolume += set.log.actual_weight * set.log.actual_reps;
						}
					} else if (set.log.status === 'skipped') {
						skippedSets++;
						dayHasLog = true;
					}
				}
			}
		}
		if (dayHasLog) daysWorkedOut++;
	}

	return { totalSets, completedSets, skippedSets, totalVolume, daysWorkedOut };
}

export const actions: Actions = {
	default: async ({ request, locals: { safeGetSession, supabase } }) => {
		const { user } = await safeGetSession();
		if (!user) return fail(401, { error: 'Not authenticated' });

		const formData = await request.formData();
		const weekNumber = parseInt(formData.get('week_number') as string, 10);
		const bodyWeight = formData.get('body_weight') as string;
		const energyLevel = formData.get('energy_level') as string || null;
		const notes = formData.get('notes') as string;

		// Parse structured fields
		const trainingDays = (formData.getAll('training_days') as string[])
			.map(Number)
			.filter((n) => !isNaN(n) && n >= 0 && n <= 6);
		const sessionDuration = parseInt(formData.get('session_duration_minutes') as string, 10);
		const newInjuries = (formData.getAll('injuries') as string[]).filter(Boolean);
		const userEquipment = (formData.getAll('equipment') as string[]).filter(Boolean);

		// Validate training days
		if (trainingDays.length < 2) {
			return fail(400, { error: 'Select at least 2 training days.' });
		}

		// 1. Save check-in record
		const checkInId = await createCheckIn(supabase, {
			user_id: user.id,
			week_number: weekNumber,
			body_weight: bodyWeight ? parseFloat(bodyWeight) : null,
			energy_level: energyLevel as 'fully_recovered' | 'mostly_recovered' | 'still_fatigued' | 'beat_up' | null,
			notes: notes || null
		});

		if (!checkInId) {
			return fail(500, { error: 'Failed to save check-in.' });
		}

		// 2. Update user_settings with all editable fields
		const settingsResult = await updateUserSettings(supabase, user.id, {
			injuries: newInjuries,
			equipment: userEquipment,
			training_days: trainingDays,
			session_duration_minutes: sessionDuration
		});

		if (!settingsResult) {
			console.error('[check-in] Failed to update user_settings for user', user.id);
			return fail(500, { error: 'Failed to update settings. Check-in was saved — please try again.' });
		}

		// 3. Mark current plan as completed
		const { error: planError } = await supabase
			.from('weekly_plans')
			.update({ status: 'completed' })
			.eq('user_id', user.id)
			.eq('week_number', weekNumber);

		if (planError) {
			console.error('[check-in] Failed to mark plan completed:', planError.message);
			return fail(500, { error: 'Failed to finalize plan. Check-in was saved — please try again.' });
		}

		// 4. Redirect to plan page (generation happens async)
		redirect(303, '/plan');
	}
};
