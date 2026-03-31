/**
 * Shared equipment constants used by onboarding and check-in.
 * Maps user-facing equipment names to ExerciseDB categories.
 */

/** Equipment options shown in the UI (user-facing names) */
export const EQUIPMENT_OPTIONS = [
	// Free weights
	'barbell', 'dumbbell', 'ez barbell', 'kettlebell',
	// Stations
	'cable', 'machine', 'smith machine',
	// Furniture
	'bench', 'squat rack', 'pull-up bar',
	// Minimal
	'resistance band'
] as const;

/**
 * Station/furniture items are not ExerciseDB equipment types.
 * Map them to the actual equipment they imply access to.
 */
export const EQUIPMENT_EXPANSIONS: Record<string, string[]> = {
	'bench': [],              // bench exercises are covered by barbell/dumbbell
	'squat rack': ['barbell'], // squat rack implies barbell access
	'pull-up bar': []          // pull-up exercises are covered by 'body weight'
};

/**
 * Convert user-facing equipment selections to ExerciseDB-compatible values.
 * Always includes 'body weight'.
 */
export function mapEquipmentToDb(userSelections: string[]): string[] {
	let dbEquipment = userSelections.flatMap((eq) => EQUIPMENT_EXPANSIONS[eq] ?? [eq]);
	dbEquipment = [...new Set(dbEquipment)];

	// Always include bodyweight — ExerciseDB uses "body weight" (with space)
	if (!dbEquipment.includes('body weight')) {
		dbEquipment.push('body weight');
	}

	return dbEquipment;
}

/**
 * Reverse-map DB equipment values back to user-facing names.
 * Used to pre-fill the check-in equipment selector.
 * If a DB value matches a user-facing option, include it.
 * 'body weight' is excluded since it's auto-added.
 */
export function mapDbToUserFacing(dbEquipment: string[]): string[] {
	const userFacing: string[] = [];
	const dbSet = new Set(dbEquipment);

	for (const option of EQUIPMENT_OPTIONS) {
		const expansion = EQUIPMENT_EXPANSIONS[option];
		if (expansion !== undefined) {
			// Furniture/station item — include if the user had it before
			// We check if the original user-facing name was stored
			// Since furniture maps to [], they won't appear in DB values
			// We need to re-include them based on what the user originally selected
			// For now, include the option if any of its expansions are in DB
			if (expansion.length === 0) {
				// Items like 'bench' and 'pull-up bar' map to nothing — we can't detect them from DB alone
				// They'll be included if they were in the original user_settings.equipment
				if (dbSet.has(option)) userFacing.push(option);
			} else if (expansion.some(e => dbSet.has(e))) {
				userFacing.push(option);
			}
		} else if (dbSet.has(option)) {
			userFacing.push(option);
		}
	}

	return userFacing;
}
