import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getFullPlan } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/');

	// Get the latest active plan (no week_number = latest)
	const fullPlan = await getFullPlan(supabase, user.id);

	if (!fullPlan || !fullPlan.plan) {
		// No plan exists yet — redirect to generate
		redirect(303, '/plan/generate');
	}

	// Compute today's day index for highlighting
	const jsDay = new Date().getDay();
	const todayIndex = jsDay === 0 ? 6 : jsDay - 1;

	return { fullPlan, todayIndex };
};
