import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { redirect, type Handle } from '@sveltejs/kit';

/** Routes that don't require authentication */
const PUBLIC_ROUTES = ['/', '/auth/callback', '/auth/error'];

/** Routes that should skip the onboarding check */
const SKIP_ONBOARDING_CHECK = ['/onboarding', '/api/'];

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (!session) return { session: null, user: null };

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error) return { session: null, user: null };

		return { session, user };
	};

	// --- Auth guard ---
	const path = event.url.pathname;
	const isPublicRoute = PUBLIC_ROUTES.includes(path);
	const isApiRoute = path.startsWith('/api/');

	const { session, user } = await event.locals.safeGetSession();

	// Unauthenticated users can only access public routes and API routes
	if (!session && !isPublicRoute && !isApiRoute) {
		redirect(303, '/');
	}

	// Authenticated users on the login page → check onboarding status
	if (session && user && path === '/') {
		const { data: settings } = await event.locals.supabase
			.from('user_settings')
			.select('equipment')
			.eq('user_id', user.id)
			.single();

		// equipment defaults to '{}' on auto-create; onboarding always sets at least one
		const hasOnboarded = settings?.equipment && settings.equipment.length > 0;
		redirect(303, hasOnboarded ? '/workout' : '/onboarding');
	}

	// Authenticated users on protected routes (not onboarding/api) → verify onboarding
	if (session && user && !isPublicRoute && !SKIP_ONBOARDING_CHECK.some((r) => path.startsWith(r))) {
		const { data: settings } = await event.locals.supabase
			.from('user_settings')
			.select('equipment')
			.eq('user_id', user.id)
			.single();

		const hasOnboarded = settings?.equipment && settings.equipment.length > 0;
		if (!hasOnboarded) {
			redirect(303, '/onboarding');
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
