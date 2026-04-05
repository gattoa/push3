import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getFullPlan } from '$lib/server/supabase';
import { getCurrentMonday, getTodayIndex } from '$lib/utils/date';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase, timezone } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/');

	const currentMonday = getCurrentMonday(timezone);

	// Request this week's plan specifically — not "latest"
	const fullPlan = await getFullPlan(supabase, user.id, { weekStartDate: currentMonday });

	// Compute today's day index for highlighting
	const todayIndex = getTodayIndex(timezone);

	// If no active plan, check if one is currently generating
	let generationStatus: 'none' | 'generating' | 'ready' = fullPlan ? 'ready' : 'none';
	let needsCheckIn = false;
	let trainingDays: number[] = [];

	if (!fullPlan) {
		// Check for a plan that's currently being generated for this week
		const { data: generatingPlan } = await supabase
			.from('weekly_plans')
			.select('id, status')
			.eq('user_id', user.id)
			.eq('week_start_date', currentMonday)
			.eq('status', 'generating')
			.limit(1)
			.maybeSingle();

		if (generatingPlan) {
			generationStatus = 'generating';
		}

		// Look at the most recent plan (any status) to determine next action.
		//
		// - No plan at all → new user → auto-generate
		// - Most recent is 'completed' → user checked in → auto-generate this week's plan
		// - Most recent is 'active' → calendar rolled over without check-in → show Check In CTA
		// - Most recent is 'generating' → handled above (generationStatus = 'generating')
		const { data: mostRecentPlan } = await supabase
			.from('weekly_plans')
			.select('status')
			.eq('user_id', user.id)
			.order('week_start_date', { ascending: false })
			.limit(1)
			.maybeSingle();

		needsCheckIn = mostRecentPlan?.status === 'active';
	}

	// Fetch training days for skeleton display
	const { data: settings } = await supabase
		.from('user_settings')
		.select('training_days')
		.eq('user_id', user.id)
		.single();

	trainingDays = settings?.training_days ?? [];

	return { fullPlan, todayIndex, needsCheckIn, generationStatus, trainingDays };
};
