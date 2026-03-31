import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserSettings } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/');

	const settings = await getUserSettings(supabase, user.id);
	if (!settings) {
		redirect(303, '/onboarding');
	}

	return { settings };
};
