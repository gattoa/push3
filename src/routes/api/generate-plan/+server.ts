import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generatePlan } from '$lib/server/generate';
import { computeAlternativesForPlan } from '$lib/server/alternatives';

// ============================================================================
// GET — Check if a plan already exists (used for phone-sleep recovery)
// ============================================================================

// Vercel Hobby plan defaults to 10s — Claude calls take 10-20s
export const config = { maxDuration: 60 };

export const GET: RequestHandler = async ({ locals: { safeGetSession, supabase, timezone } }) => {
	const { user } = await safeGetSession();
	if (!user) return json({ error: 'Not authenticated' }, { status: 401 });

	// Check for active/generating plan for the current calendar week
	const { getCurrentMonday } = await import('$lib/utils/date');
	const currentMonday = getCurrentMonday(timezone);

	const { data: plan } = await supabase
		.from('weekly_plans')
		.select('id, week_number, status, week_start_date')
		.eq('user_id', user.id)
		.eq('week_start_date', currentMonday)
		.in('status', ['active', 'generating'])
		.limit(1)
		.maybeSingle();

	return json({ plan: plan ?? null });
};

// ============================================================================
// POST — Generate a new plan
// ============================================================================

export const POST: RequestHandler = async ({ locals: { safeGetSession, supabase, timezone } }) => {
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
		if (elapsed < 300_000) {
			const waitMinutes = Math.ceil((300_000 - elapsed) / 60_000);
			return json(
				{ error: `Please wait ${waitMinutes} minute${waitMinutes === 1 ? '' : 's'} before generating another plan.` },
				{ status: 429 }
			);
		}
	}

	// Block generation if there's an active plan from a previous week awaiting check-in.
	// The user must check in to close the old plan before a new one can be generated.
	const { getCurrentMonday } = await import('$lib/utils/date');
	const currentMondayForGuard = getCurrentMonday(timezone);

	const { data: pendingActivePlan } = await supabase
		.from('weekly_plans')
		.select('id, week_start_date')
		.eq('user_id', user.id)
		.eq('status', 'active')
		.lt('week_start_date', currentMondayForGuard)
		.limit(1)
		.maybeSingle();

	if (pendingActivePlan) {
		return json(
			{ error: 'You have a pending check-in for a previous week. Please check in first.' },
			{ status: 409 }
		);
	}

	try {
		const result = await generatePlan(supabase, user.id, timezone);

		if ('error' in result) {
			// If a plan already exists, return its status so the client can poll
			if (result.error.includes('already exists')) {
				return json({ status: 'exists', message: result.error }, { status: 409 });
			}
			const isClientError = result.error.includes('No exercises found');
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
