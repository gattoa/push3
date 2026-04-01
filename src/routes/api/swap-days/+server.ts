import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * POST /api/swap-days
 * Swap two planned_days' day_index values within the same weekly plan.
 * Used by drag-to-swap on the weekly plan page.
 */
export const POST: RequestHandler = async ({ request, locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) return json({ error: 'Not authenticated' }, { status: 401 });

	let body: { day_id_a: string; day_id_b: string };

	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { day_id_a, day_id_b } = body;

	if (!day_id_a || !day_id_b || day_id_a === day_id_b) {
		return json({ error: 'Two distinct day_id values are required' }, { status: 400 });
	}

	// Fetch both days and verify they belong to the same plan
	const { data: dayA, error: errA } = await supabase
		.from('planned_days')
		.select('id, plan_id, day_index')
		.eq('id', day_id_a)
		.single();

	const { data: dayB, error: errB } = await supabase
		.from('planned_days')
		.select('id, plan_id, day_index')
		.eq('id', day_id_b)
		.single();

	if (errA || errB || !dayA || !dayB) {
		return json({ error: 'One or both days not found' }, { status: 404 });
	}

	if (dayA.plan_id !== dayB.plan_id) {
		return json({ error: 'Days must belong to the same plan' }, { status: 400 });
	}

	// Verify plan ownership
	const { data: plan, error: planError } = await supabase
		.from('weekly_plans')
		.select('user_id')
		.eq('id', dayA.plan_id)
		.single();

	if (planError || !plan || plan.user_id !== user.id) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	// Swap day_index values using a temporary value to avoid unique constraint violation
	// planned_days has unique(plan_id, day_index), so we use a 3-step swap via temp index
	const tempIndex = 99;

	// Step 1: Move A to temp
	const { error: e1 } = await supabase
		.from('planned_days')
		.update({ day_index: tempIndex })
		.eq('id', dayA.id);

	if (e1) {
		return json({ error: e1.message }, { status: 500 });
	}

	// Step 2: Move B to A's old index
	const { error: e2 } = await supabase
		.from('planned_days')
		.update({ day_index: dayA.day_index })
		.eq('id', dayB.id);

	if (e2) {
		// Rollback step 1
		await supabase.from('planned_days').update({ day_index: dayA.day_index }).eq('id', dayA.id);
		return json({ error: e2.message }, { status: 500 });
	}

	// Step 3: Move A (at temp) to B's old index
	const { error: e3 } = await supabase
		.from('planned_days')
		.update({ day_index: dayB.day_index })
		.eq('id', dayA.id);

	if (e3) {
		// Rollback — best effort
		await supabase.from('planned_days').update({ day_index: dayB.day_index }).eq('id', dayB.id);
		await supabase.from('planned_days').update({ day_index: dayA.day_index }).eq('id', dayA.id);
		return json({ error: e3.message }, { status: 500 });
	}

	return json({ success: true });
};
