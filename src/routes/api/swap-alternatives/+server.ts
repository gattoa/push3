import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ExerciseAlternative } from '$lib/types/database';
import { getExerciseById, getExercisesByMuscle } from '$lib/server/exercisedb';
import { mapEquipmentToDb } from '$lib/server/equipment';

export const GET: RequestHandler = async ({ url, locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) return json({ error: 'Not authenticated' }, { status: 401 });

	const exerciseId = url.searchParams.get('exercise_id');
	if (!exerciseId) {
		return json({ error: 'Missing exercise_id parameter' }, { status: 400 });
	}

	// Look up user's equipment server-side
	const { data: settings } = await supabase
		.from('user_settings')
		.select('equipment')
		.eq('user_id', user.id)
		.single();

	const equipmentSet = new Set(mapEquipmentToDb(settings?.equipment ?? []));

	try {
		// Fetch current exercise to get its target muscle
		const current = await getExerciseById(exerciseId);

		// Fetch candidates by same target muscle
		const candidates = await getExercisesByMuscle(current.target, 50);

		// Filter: exclude current exercise, match user's equipment
		const filtered = candidates.filter(
			(ex) => ex.id !== exerciseId && equipmentSet.has(ex.equipment)
		);

		const alternatives: ExerciseAlternative[] = filtered.slice(0, 3).map((ex) => ({
			exercise_id: ex.id,
			exercise_name: ex.name,
			body_part: ex.bodyPart,
			target: ex.target,
			equipment: ex.equipment,
			gif_url: ex.gifUrl
		}));

		return json({ alternatives });
	} catch (e) {
		console.error('[api/swap-alternatives] ExerciseDB error:', e);
		// Graceful degradation — return empty array instead of error
		return json({ alternatives: [] });
	}
};
