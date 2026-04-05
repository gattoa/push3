import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { computeAlternativesForPlan } from '$lib/server/alternatives';

/**
 * POST /api/refresh-alternatives
 * Re-compute swap alternatives for the user's active plan.
 * Does not touch the plan, exercises, sets, or logs — only the
 * pre-cached alternatives on each planned_exercise.
 */
export const POST: RequestHandler = async ({ locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) return json({ error: 'Not authenticated' }, { status: 401 });

	// Find the user's active plan
	const { data: plan, error: planError } = await supabase
		.from('weekly_plans')
		.select('id')
		.eq('user_id', user.id)
		.eq('status', 'active')
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (planError || !plan) {
		return json({ error: 'No active plan found' }, { status: 404 });
	}

	// Run alternatives computation (this overwrites the alternatives JSON column)
	await computeAlternativesForPlan(supabase, plan.id, user.id);

	return json({ success: true, plan_id: plan.id });
};
