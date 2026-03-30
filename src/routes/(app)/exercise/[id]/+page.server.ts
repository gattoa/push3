import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getExerciseById, searchExercises } from '$lib/server/exercisedb';

export const load: PageServerLoad = async ({ params, url, locals: { safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/');

	const id = params.id;
	const name = url.searchParams.get('name');

	try {
		// If we have a numeric ExerciseDB ID, fetch directly
		if (/^\d+$/.test(id)) {
			const exercise = await getExerciseById(id);
			return { exercise };
		}

		// Otherwise use the name query param to search
		if (name) {
			const results = await searchExercises(name, 5);
			const exact = results.find((r) => r.name.toLowerCase() === name.toLowerCase());
			if (exact) return { exercise: exact };
			if (results.length > 0) return { exercise: results[0] };
		}

		error(404, 'Exercise not found');
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		console.error('Exercise detail fetch failed:', e);
		error(404, 'Exercise not found');
	}
};
