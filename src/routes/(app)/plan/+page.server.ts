import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getFullPlan } from '$lib/server/supabase';

/** Compute Monday of the current calendar week (ISO: Monday = start of week) */
function getCurrentMonday(): string {
	const now = new Date();
	const jsDay = now.getDay(); // 0=Sun
	const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
	const monday = new Date(now);
	monday.setDate(now.getDate() + mondayOffset);
	return monday.toISOString().split('T')[0];
}

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/');

	const currentMonday = getCurrentMonday();

	// Request this week's plan specifically — not "latest"
	const fullPlan = await getFullPlan(supabase, user.id, { weekStartDate: currentMonday });

	// Compute today's day index for highlighting
	const jsDay = new Date().getDay();
	const todayIndex = jsDay === 0 ? 6 : jsDay - 1;

	// Check if any previous plan exists (to determine if this is Week 1)
	let hasPreviousPlan = false;
	if (!fullPlan) {
		const { data: anyPlan } = await supabase
			.from('weekly_plans')
			.select('id')
			.eq('user_id', user.id)
			.limit(1)
			.maybeSingle();
		hasPreviousPlan = !!anyPlan;
	}

	return { fullPlan, todayIndex, hasPreviousPlan };
};
