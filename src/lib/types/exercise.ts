/**
 * ExerciseDB v1 API response types.
 * Source: https://github.com/bootstrapping-lab/exercisedb-api
 */

export interface Exercise {
	id: string;
	name: string;
	bodyPart: string;
	target: string;
	secondaryMuscles: string[];
	equipment: string;
	gifUrl: string;
	instructions: string[];
}

/** Query parameters for filtering exercises */
export interface ExerciseQuery {
	bodyPart?: string;
	equipment?: string;
	target?: string;
	limit?: number;
	offset?: number;
}
