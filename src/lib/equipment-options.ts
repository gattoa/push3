/**
 * Shared equipment constants — importable from both client and server.
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

/** Grouped equipment for segmented UI display */
export const EQUIPMENT_GROUPS = [
	{ label: 'Free weights', items: ['barbell', 'dumbbell', 'ez barbell', 'kettlebell'] },
	{ label: 'Machines & cables', items: ['cable', 'machine', 'smith machine'] },
	{ label: 'Stations', items: ['bench', 'squat rack', 'pull-up bar'] },
	{ label: 'Other', items: ['resistance band'] }
] as const;
