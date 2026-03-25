/**
 * Injury hardening — server-side filtering of the exercise catalog
 * based on user-reported injuries.
 *
 * Maps common injury strings (from onboarding / check-in) to ExerciseDB
 * bodyPart and target values that should be excluded from the catalog.
 */

import type { Exercise } from '$lib/types/exercise';

// ============================================================================
// Injury → body part/target mapping
// ============================================================================

interface InjuryFilter {
	bodyParts: string[];
	targets: string[];
}

/**
 * Maps common injury keywords to ExerciseDB bodyPart and target values
 * that should be excluded. Uses substring matching — e.g., "right knee"
 * matches the "knee" entry.
 */
const INJURY_BODY_MAP: Record<string, InjuryFilter> = {
	knee: {
		bodyParts: ['upper legs'],
		targets: ['quads', 'hamstrings', 'glutes', 'adductors', 'abductors']
	},
	shoulder: {
		bodyParts: [],
		targets: ['delts', 'serratus anterior']
	},
	back: {
		bodyParts: ['back'],
		targets: ['lats', 'traps', 'spine', 'upper back', 'lower back']
	},
	'lower back': {
		bodyParts: [],
		targets: ['spine', 'lower back']
	},
	wrist: {
		bodyParts: [],
		targets: ['forearms']
	},
	elbow: {
		bodyParts: [],
		targets: ['forearms', 'triceps', 'biceps']
	},
	hip: {
		bodyParts: ['upper legs'],
		targets: ['glutes', 'hip flexors', 'adductors', 'abductors']
	},
	ankle: {
		bodyParts: ['lower legs'],
		targets: ['calves']
	},
	neck: {
		bodyParts: ['neck'],
		targets: ['levator scapulae', 'traps']
	},
	chest: {
		bodyParts: ['chest'],
		targets: ['pectorals']
	}
};

// ============================================================================
// Filtering
// ============================================================================

/**
 * Given a list of user-reported injury strings, returns the set of
 * ExerciseDB bodyPart and target values that should be excluded.
 */
function getExcludedParts(injuries: string[]): { bodyParts: Set<string>; targets: Set<string> } {
	const bodyParts = new Set<string>();
	const targets = new Set<string>();

	for (const injury of injuries) {
		const normalized = injury.toLowerCase().trim();

		for (const [keyword, filter] of Object.entries(INJURY_BODY_MAP)) {
			if (normalized.includes(keyword)) {
				filter.bodyParts.forEach((bp) => bodyParts.add(bp));
				filter.targets.forEach((t) => targets.add(t));
			}
		}
	}

	return { bodyParts, targets };
}

/**
 * Filters an exercise catalog to remove exercises that load injured areas.
 * Uses substring matching on injury strings to map to ExerciseDB fields.
 *
 * Returns the filtered catalog and a summary of what was excluded (for logging).
 */
export function filterByInjuries(
	exercises: Exercise[],
	injuries: string[]
): { filtered: Exercise[]; excluded: { bodyParts: string[]; targets: string[] } } {
	if (injuries.length === 0) {
		return { filtered: exercises, excluded: { bodyParts: [], targets: [] } };
	}

	const { bodyParts, targets } = getExcludedParts(injuries);

	if (bodyParts.size === 0 && targets.size === 0) {
		return { filtered: exercises, excluded: { bodyParts: [], targets: [] } };
	}

	const filtered = exercises.filter(
		(ex) => !bodyParts.has(ex.bodyPart) && !targets.has(ex.target)
	);

	return {
		filtered,
		excluded: {
			bodyParts: [...bodyParts],
			targets: [...targets]
		}
	};
}
