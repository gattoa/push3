import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/';

	// Handle OAuth error responses from provider
	const oauthError = url.searchParams.get('error');
	const errorDescription = url.searchParams.get('error_description');
	if (oauthError) {
		const params = new URLSearchParams({ reason: errorDescription || oauthError });
		redirect(303, `/auth/error?${params.toString()}`);
	}

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			redirect(303, next);
		}
		console.error('[auth/callback] Code exchange failed:', error.message);
		const params = new URLSearchParams({ reason: 'Authentication failed. Please try again.' });
		redirect(303, `/auth/error?${params.toString()}`);
	}

	redirect(303, '/auth/error?reason=No+authorization+code+received');
};
