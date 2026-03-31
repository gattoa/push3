import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateUserSettings } from '$lib/server/supabase';
import type { UserSettingsUpdate } from '$lib/types/database';

const ALLOWED_FIELDS = new Set([
	'unit_pref',
	'date_of_birth',
	'gender',
	'goals',
	'experience_level',
	'training_days',
	'session_duration_minutes',
	'equipment',
	'injuries'
]);

const VALID_GENDERS = ['male', 'female', 'prefer_not_to_say'];
const VALID_DURATIONS = [30, 45, 60, 75, 90];

export const PATCH: RequestHandler = async ({ request, locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) return json({ error: 'Not authenticated' }, { status: 401 });

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	// Filter to allowed fields only
	const updates: Partial<UserSettingsUpdate> = {};
	for (const [key, value] of Object.entries(body)) {
		if (ALLOWED_FIELDS.has(key)) {
			(updates as Record<string, unknown>)[key] = value;
		}
	}

	if (Object.keys(updates).length === 0) {
		return json({ error: 'No valid fields provided' }, { status: 400 });
	}

	// Validate specific fields
	if (updates.gender !== undefined && !VALID_GENDERS.includes(updates.gender as string)) {
		return json({ error: `Invalid gender. Must be one of: ${VALID_GENDERS.join(', ')}` }, { status: 400 });
	}

	if (updates.session_duration_minutes !== undefined && !VALID_DURATIONS.includes(updates.session_duration_minutes as number)) {
		return json({ error: `Invalid duration. Must be one of: ${VALID_DURATIONS.join(', ')}` }, { status: 400 });
	}

	if (updates.training_days !== undefined) {
		const days = updates.training_days as number[];
		if (!Array.isArray(days) || days.length < 2 || days.some(d => d < 0 || d > 6)) {
			return json({ error: 'training_days must be an array of 2+ day indices (0-6)' }, { status: 400 });
		}
	}

	if (updates.equipment !== undefined) {
		const eq = updates.equipment as string[];
		if (!Array.isArray(eq) || eq.length < 1) {
			return json({ error: 'equipment must be a non-empty array' }, { status: 400 });
		}
	}

	if (updates.unit_pref !== undefined && !['lb', 'kg'].includes(updates.unit_pref as string)) {
		return json({ error: 'unit_pref must be "lb" or "kg"' }, { status: 400 });
	}

	const result = await updateUserSettings(supabase, user.id, updates as UserSettingsUpdate);

	if (!result) {
		return json({ error: 'Failed to update settings' }, { status: 500 });
	}

	return json({ ok: true });
};
