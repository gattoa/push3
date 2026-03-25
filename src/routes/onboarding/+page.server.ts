import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { UserSettingsUpdate } from '$lib/types/database';
import { updateUserSettings } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/');

	// If already onboarded, go to plan
	const { data: settings } = await supabase
		.from('user_settings')
		.select('equipment')
		.eq('user_id', user.id)
		.single();

	if (settings?.equipment && settings.equipment.length > 0) {
		redirect(303, '/plan');
	}

	return { userId: user.id };
};

export const actions: Actions = {
	default: async ({ request, locals: { safeGetSession, supabase } }) => {
		const { user } = await safeGetSession();
		if (!user) return fail(401, { message: 'Not authenticated' });

		const formData = await request.formData();

		const date_of_birth = formData.get('date_of_birth') as string;
		const gender = formData.get('gender') as string;
		const goals = formData.get('goals') as string;
		const experience_level = formData.get('experience_level') as string;
		const equipment = formData.getAll('equipment') as string[];

		// Station/furniture items are not ExerciseDB equipment types.
		// Map them to the actual equipment they imply access to.
		const EQUIPMENT_EXPANSIONS: Record<string, string[]> = {
			'bench': [],              // bench exercises are covered by barbell/dumbbell
			'squat rack': ['barbell'], // squat rack implies barbell access
			'pull-up bar': []          // pull-up exercises are covered by 'body weight'
		};

		let dbEquipment = equipment.flatMap((eq) => EQUIPMENT_EXPANSIONS[eq] ?? [eq]);
		dbEquipment = [...new Set(dbEquipment)];

		// Always include bodyweight — it's not "equipment", everyone has a body
		// ExerciseDB uses "body weight" (with space) as the equipment key
		if (!dbEquipment.includes('body weight')) {
			dbEquipment.push('body weight');
		}
		const training_days_per_week = parseInt(formData.get('training_days_per_week') as string, 10);
		const session_duration_minutes = parseInt(formData.get('session_duration_minutes') as string, 10);
		const injuries = (formData.get('injuries') as string)
			?.split(',')
			.map((s) => s.trim())
			.filter(Boolean) ?? [];
		const unit_pref = (formData.get('unit_pref') as 'lb' | 'kg') || 'lb';

		// Validate required fields (check original equipment selection, not mapped)
		if (!date_of_birth || !gender || !goals || !experience_level || equipment.length === 0 || !training_days_per_week || !session_duration_minutes) {
			return fail(400, { message: 'Please complete all required fields.' });
		}

		// Validate gender value
		if (!['male', 'female', 'prefer_not_to_say'].includes(gender)) {
			return fail(400, { message: 'Invalid gender value.' });
		}

		const settingsPayload: UserSettingsUpdate = {
			date_of_birth,
			gender: gender as 'male' | 'female' | 'prefer_not_to_say',
			goals,
			experience_level,
			equipment: dbEquipment,
			injuries,
			training_days_per_week,
			session_duration_minutes,
			unit_pref
		};

		console.log('[onboarding] Saving settings for user:', user.id, JSON.stringify(settingsPayload));

		const result = await updateUserSettings(supabase, user.id, settingsPayload);

		if (!result) {
			console.error('[onboarding] updateUserSettings returned null for user:', user.id);
			return fail(500, { message: 'Failed to save settings. Please try again.' });
		}

		redirect(303, '/plan/generate');
	}
};
