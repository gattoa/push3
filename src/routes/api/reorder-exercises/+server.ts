import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * PATCH /api/reorder-exercises
 * Batch-update order_index on planned_exercises within a day.
 * Used by the edit-mode reorder UI on the workout day page.
 */
export const PATCH: RequestHandler = async ({ request, locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) return json({ error: 'Not authenticated' }, { status: 401 });

	let body: { day_id: string; exercise_order: { id: string; order_index: number }[] };

	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { day_id, exercise_order } = body;

	if (!day_id || !Array.isArray(exercise_order) || exercise_order.length === 0) {
		return json({ error: 'day_id and exercise_order[] are required' }, { status: 400 });
	}

	// Verify ownership: day → plan → user
	const { data: dayRow, error: dayError } = await supabase
		.from('planned_days')
		.select('id, plan_id')
		.eq('id', day_id)
		.single();

	if (dayError || !dayRow) {
		return json({ error: 'Day not found' }, { status: 404 });
	}

	const { data: plan, error: planError } = await supabase
		.from('weekly_plans')
		.select('user_id, status')
		.eq('id', dayRow.plan_id)
		.single();

	if (planError || !plan || plan.user_id !== user.id) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	// Block modifications to completed plans — the week is closed
	if (plan.status === 'completed') {
		return json({ error: 'Cannot modify a completed plan' }, { status: 409 });
	}

	// Batch update order indices
	for (const item of exercise_order) {
		const { error: updateError } = await supabase
			.from('planned_exercises')
			.update({ order_index: item.order_index })
			.eq('id', item.id)
			.eq('day_id', day_id);

		if (updateError) {
			console.error('[reorder-exercises] Failed to update:', updateError.message);
			return json({ error: updateError.message }, { status: 500 });
		}
	}

	return json({ success: true });
};
