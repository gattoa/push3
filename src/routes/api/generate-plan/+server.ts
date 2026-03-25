import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generatePlan } from '$lib/server/generate';
import { computeAlternativesForPlan } from '$lib/server/alternatives';

// ============================================================================
// GET — Check if a plan already exists (used for phone-sleep recovery)
// ============================================================================

export const GET: RequestHandler = async ({ locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) return json({ error: 'Not authenticated' }, { status: 401 });

	const { data: plan } = await supabase
		.from('weekly_plans')
		.select('id, week_number, status')
		.eq('user_id', user.id)
		.in('status', ['active', 'generating'])
		.order('week_number', { ascending: false })
		.limit(1)
		.maybeSingle();

	return json({ plan: plan ?? null });
};

// ============================================================================
// POST — Generate a new plan
// ============================================================================

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

		// Fire-and-forget: compute alternatives in background
		// Don't await — return the planId to the client immediately
		computeAlternativesForPlan(supabase, result.planId, user.id).catch(
			(e) => console.error('[api/generate-plan] Background alternatives failed:', e)
		);

		return json({ planId: result.planId });
	} catch (e) {
		console.error('[api/generate-plan] Unhandled error:', e);
		return json(
			{ error: 'An unexpected error occurred during plan generation. Please try again.' },
			{ status: 500 }
		);
	}
};
