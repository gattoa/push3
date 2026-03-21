import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generatePlan } from '$lib/server/generate';

export const POST: RequestHandler = async ({ locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		const result = await generatePlan(supabase, user.id);

		if ('error' in result) {
			// Distinguish client vs server errors
			const isClientError = result.error.includes('already exists') || result.error.includes('No exercises found');
			return json({ error: result.error }, { status: isClientError ? 409 : 500 });
		}

		return json({ planId: result.planId });
	} catch (e) {
		console.error('[api/generate-plan] Unhandled error:', e);
		return json(
			{ error: 'An unexpected error occurred during plan generation. Please try again.' },
			{ status: 500 }
		);
	}
};
