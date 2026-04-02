import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * POST /api/swap-days
 * Swap the content (split_label + exercises) between two planned_days.
 * The day_index values stay fixed — only the content moves.
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
		.select('id, plan_id, day_index, split_label')
		.eq('id', day_id_a)
		.single();

	const { data: dayB, error: errB } = await supabase
		.from('planned_days')
		.select('id, plan_id, day_index, split_label')
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

	// 1. Swap split_label values
	const { error: labelErrA } = await supabase
		.from('planned_days')
		.update({ split_label: dayB.split_label })
		.eq('id', dayA.id);

	if (labelErrA) {
		return json({ error: labelErrA.message }, { status: 500 });
	}

	const { error: labelErrB } = await supabase
		.from('planned_days')
		.update({ split_label: dayA.split_label })
		.eq('id', dayB.id);

	if (labelErrB) {
		// Rollback A's label
		await supabase.from('planned_days').update({ split_label: dayA.split_label }).eq('id', dayA.id);
		return json({ error: labelErrB.message }, { status: 500 });
	}

	// 2. Reassign exercises: move A's exercises to B, and B's exercises to A.
	//    Use a temp day_id to avoid any potential issues — but planned_exercises
	//    has no unique constraint on day_id, so we can do direct reassignment.
	//    We batch by fetching IDs first, then updating.

	const { data: exA } = await supabase
		.from('planned_exercises')
		.select('id')
		.eq('day_id', dayA.id);

	const { data: exB } = await supabase
		.from('planned_exercises')
		.select('id')
		.eq('day_id', dayB.id);

	const idsA = (exA ?? []).map((e) => e.id);
	const idsB = (exB ?? []).map((e) => e.id);

	console.log(`[swap-days] Moving ${idsA.length} exercises from day ${dayA.day_index} → day ${dayB.day_index}, and ${idsB.length} exercises back`);

	// Move A's exercises to B
	if (idsA.length > 0) {
		const { error, count } = await supabase
			.from('planned_exercises')
			.update({ day_id: dayB.id })
			.in('id', idsA);

		console.log(`[swap-days] A→B update: error=${error?.message ?? 'none'}, count=${count}`);

		if (error) {
			await supabase.from('planned_days').update({ split_label: dayA.split_label }).eq('id', dayA.id);
			await supabase.from('planned_days').update({ split_label: dayB.split_label }).eq('id', dayB.id);
			return json({ error: error.message }, { status: 500 });
		}
	}

	// Move B's exercises to A
	if (idsB.length > 0) {
		const { error, count } = await supabase
			.from('planned_exercises')
			.update({ day_id: dayA.id })
			.in('id', idsB);

		console.log(`[swap-days] B→A update: error=${error?.message ?? 'none'}, count=${count}`);

		if (error) {
			if (idsA.length > 0) {
				await supabase.from('planned_exercises').update({ day_id: dayA.id }).in('id', idsA);
			}
			await supabase.from('planned_days').update({ split_label: dayA.split_label }).eq('id', dayA.id);
			await supabase.from('planned_days').update({ split_label: dayB.split_label }).eq('id', dayB.id);
			return json({ error: error.message }, { status: 500 });
		}
	}

	// Verify the swap
	const { data: verifyA } = await supabase
		.from('planned_exercises')
		.select('id, exercise_name')
		.eq('day_id', dayA.id);
	const { data: verifyB } = await supabase
		.from('planned_exercises')
		.select('id, exercise_name')
		.eq('day_id', dayB.id);
	console.log(`[swap-days] After swap — Day ${dayA.day_index} (${dayB.split_label}):`, verifyA?.map(e => e.exercise_name));
	console.log(`[swap-days] After swap — Day ${dayB.day_index} (${dayA.split_label}):`, verifyB?.map(e => e.exercise_name));

	return json({
		success: true,
		debug: {
			labelsSwapped: `${dayA.split_label} ↔ ${dayB.split_label}`,
			exercisesMoved: { aToB: idsA.length, bToA: idsB.length },
			verification: {
				dayA: verifyA?.map(e => e.exercise_name) ?? [],
				dayB: verifyB?.map(e => e.exercise_name) ?? []
			}
		}
	});
};
