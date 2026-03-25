import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generatePlan } from '$lib/server/generate';

export const POST: RequestHandler = async ({ locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	// Rate limit: reject if a plan was created within the last 60 seconds
	const { data: recentPlan } = await supabase
		.from('weekly_plans')
		.select('created_at')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (recentPlan) {
		const elapsed = Date.now() - new Date(recentPlan.created_at).getTime();
		if (elapsed < 60_000) {
			const waitSeconds = Math.ceil((60_000 - elapsed) / 1000);
			return json(
				{ error: `Please wait ${waitSeconds} seconds before generating another plan.` },
				{ status: 429 }
			);
		}
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
