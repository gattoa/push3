import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getFullPlan } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ params, locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/');

	const dayIndex = parseInt(params.day, 10);
	if (isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) {
		error(400, 'Invalid day index. Must be 0-6.');
	}

	const fullPlan = await getFullPlan(supabase, user.id);
	if (!fullPlan || !fullPlan.plan) {
		redirect(303, '/plan/generate');
	}

	const day = fullPlan.days.find((d) => d.day_index === dayIndex);
	if (!day) {
		error(404, 'Day not found in current plan.');
	}

	// Get user's unit preference for display
	const { data: settings } = await supabase
		.from('user_settings')
		.select('unit_pref')
		.eq('user_id', user.id)
		.single();

	return {
		plan: fullPlan.plan,
		day,
		unitPref: settings?.unit_pref ?? 'lb'
	};
};
