import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { swapExercise } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request, locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) return json({ error: 'Not authenticated' }, { status: 401 });

	const body = await request.json();
	const { planned_exercise_id, new_exercise_id, new_exercise_name } = body;

	if (!planned_exercise_id || !new_exercise_id || !new_exercise_name) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	// Verify ownership: planned_exercise → planned_day → weekly_plan → user_id
	const { data: exercise, error: lookupError } = await supabase
		.from('planned_exercises')
		.select('id, planned_days!inner(weekly_plans!inner(user_id))')
		.eq('id', planned_exercise_id)
		.maybeSingle();

	if (lookupError) {
		console.error('[api/swap-exercise] Lookup error:', lookupError.message);
		return json({ error: 'Failed to verify exercise ownership' }, { status: 500 });
	}

	if (!exercise) {
		return json({ error: 'Exercise not found' }, { status: 404 });
	}

	// RLS enforces ownership, but check explicitly for a clear 403
	const plan = exercise.planned_days as unknown as { weekly_plans: { user_id: string } };
	if (plan.weekly_plans.user_id !== user.id) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const result = await swapExercise(supabase, planned_exercise_id, new_exercise_id, new_exercise_name);

	if (!result.success) {
		return json({ error: result.error }, { status: 500 });
	}

	return json({ success: true });
};
