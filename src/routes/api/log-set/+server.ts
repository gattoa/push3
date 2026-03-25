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

	// Validate UUID format
	const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (!UUID_RE.test(planned_set_id)) {
		return json({ error: 'Invalid planned_set_id format' }, { status: 400 });
	}

	// Validate status enum
	const VALID_STATUSES = ['pending', 'completed', 'skipped'];
	if (!VALID_STATUSES.includes(status)) {
		return json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
	}

	// Validate weight and reps ranges (if provided)
	if (actual_weight != null && (typeof actual_weight !== 'number' || actual_weight < 0 || actual_weight > 2000)) {
		return json({ error: 'actual_weight must be a number between 0 and 2000' }, { status: 400 });
	}
	if (actual_reps != null && (typeof actual_reps !== 'number' || actual_reps < 0 || actual_reps > 500 || !Number.isInteger(actual_reps))) {
		return json({ error: 'actual_reps must be an integer between 0 and 500' }, { status: 400 });
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
