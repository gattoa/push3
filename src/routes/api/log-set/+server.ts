import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) return json({ error: 'Not authenticated' }, { status: 401 });

	const body = await request.json();
	const { planned_set_id, actual_weight, actual_reps, status } = body;

	if (!planned_set_id || !status) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	// Check if a log already exists for this set
	const { data: existing } = await supabase
		.from('set_logs')
		.select('id')
		.eq('planned_set_id', planned_set_id)
		.maybeSingle();

	if (existing) {
		// Update existing log
		const { error: updateError } = await supabase
			.from('set_logs')
			.update({
				actual_weight: actual_weight ?? null,
				actual_reps: actual_reps ?? null,
				status,
				logged_at: status !== 'pending' ? new Date().toISOString() : null
			})
			.eq('id', existing.id);

		if (updateError) {
			return json({ error: updateError.message }, { status: 500 });
		}

		return json({ id: existing.id, updated: true });
	} else {
		// Insert new log
		const { data: newLog, error: insertError } = await supabase
			.from('set_logs')
			.insert({
				planned_set_id,
				actual_weight: actual_weight ?? null,
				actual_reps: actual_reps ?? null,
				status,
				logged_at: status !== 'pending' ? new Date().toISOString() : null
			})
			.select('id')
			.single();

		if (insertError) {
			return json({ error: insertError.message }, { status: 500 });
		}

		return json({ id: newLog.id, updated: false });
	}
};
