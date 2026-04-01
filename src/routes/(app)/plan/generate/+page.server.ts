import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// The blocking generate page has been replaced by async generation on /plan.
// This redirect catches bookmarks, stale links, and browser back button.
export const load: PageServerLoad = async () => {
	redirect(303, '/plan');
};
