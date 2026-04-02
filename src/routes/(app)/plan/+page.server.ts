import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getFullPlan } from '$lib/server/supabase';
import { getCurrentMonday } from '$lib/utils/date';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/');

	const currentMonday = getCurrentMonday();

	// Request this week's plan specifically — not "latest"
	const fullPlan = await getFullPlan(supabase, user.id, { weekStartDate: currentMonday });

	// Compute today's day index for highlighting
	const jsDay = new Date().getDay();
	const todayIndex = jsDay === 0 ? 6 : jsDay - 1;

	// If no active plan, check if one is currently generating
	let generationStatus: 'none' | 'generating' | 'ready' = fullPlan ? 'ready' : 'none';
	let hasPreviousPlan = false;
	let trainingDays: number[] = [];

	if (!fullPlan) {
		// Check for a plan that's currently being generated
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

		// Check for any previous completed plan
		const { data: anyPlan } = await supabase
			.from('weekly_plans')
			.select('id')
			.eq('user_id', user.id)
			.in('status', ['active', 'completed'])
			.limit(1)
			.maybeSingle();
		hasPreviousPlan = !!anyPlan;
	}

	// Fetch training days for skeleton display
	const { data: settings } = await supabase
		.from('user_settings')
		.select('training_days')
		.eq('user_id', user.id)
		.single();

	trainingDays = settings?.training_days ?? [];

	return { fullPlan, todayIndex, hasPreviousPlan, generationStatus, trainingDays };
};
