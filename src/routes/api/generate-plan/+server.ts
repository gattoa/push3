import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generatePlan } from '$lib/server/generate';

export const POST: RequestHandler = async ({ locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const result = await generatePlan(supabase, user.id);

	if ('error' in result) {
		return json({ error: result.error }, { status: 400 });
	}

	return json({ planId: result.planId });
};
