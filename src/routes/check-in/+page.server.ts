import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getFullPlan, getUserSettings, createCheckIn, updateUserSettings } from '$lib/server/supabase';
import type { FullPlanDay } from '$lib/types/database';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/');

	const fullPlan = await getFullPlan(supabase, user.id);
	if (!fullPlan || !fullPlan.plan) {
		redirect(303, '/plan/generate');
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
		const injuryChanges = formData.get('injury_changes') as string;
		const equipmentChanges = formData.get('equipment_changes') as string;
		const notes = formData.get('notes') as string;

		// Parse injury/equipment arrays from comma-separated
		const newInjuries = (formData.get('injuries') as string || '')
			.split(',').map(s => s.trim()).filter(Boolean);
		const newEquipment = (formData.get('equipment') as string || '')
			.split(',').map(s => s.trim()).filter(Boolean);

		// 1. Save check-in record
		const checkInId = await createCheckIn(supabase, {
			user_id: user.id,
			week_number: weekNumber,
			body_weight: bodyWeight ? parseFloat(bodyWeight) : null,
			injury_changes: injuryChanges || null,
			equipment_changes: equipmentChanges || null,
			notes: notes || null
		});

		if (!checkInId) {
			return fail(500, { error: 'Failed to save check-in.' });
		}

		// 2. Update user_settings with current injuries and equipment
		await updateUserSettings(supabase, user.id, {
			injuries: newInjuries,
			equipment: newEquipment
		});

		// 3. Mark current plan as completed
		await supabase
			.from('weekly_plans')
			.update({ status: 'completed' })
			.eq('user_id', user.id)
			.eq('week_number', weekNumber);

		// 4. Redirect to plan generation
		redirect(303, '/plan/generate');
	}
};
