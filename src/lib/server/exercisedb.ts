/**
 * ExerciseDB client — server-side only.
 * Queries the self-hosted ExerciseDB v1 instance deployed on Vercel.
 * Endpoint paths sourced from: https://exercisedb-api-khaki.vercel.app/docs
 *
 * All responses are wrapped: { success: boolean, data: T }
 * Metadata endpoints return objects with a `name` field, not plain strings.
 */

import { EXERCISEDB_API_URL } from '$env/static/private';
import type { Exercise } from '$lib/types/exercise';

const BASE_URL = EXERCISEDB_API_URL.replace(/\/$/, '');

/** ExerciseDB wraps all responses in this envelope */
interface ApiResponse<T> {
	success: boolean;
	data: T;
}

/** Metadata endpoints return arrays of { name: string } */
interface NamedItem {
	name: string;
}

async function fetchExerciseDB<T>(path: string): Promise<T> {
	const url = `${BASE_URL}${path}`;
	const response = await fetch(url, {
		headers: { 'Accept': 'application/json' }
	});

	if (!response.ok) {
		throw new Error(`ExerciseDB request failed: ${response.status} ${response.statusText} — ${url}`);
	}

	const body: ApiResponse<T> = await response.json();

	if (!body.success) {
		throw new Error(`ExerciseDB returned success=false — ${url}`);
	}

	return body.data;
}

// ============================================================================
// Exercise Queries
// ============================================================================

/** Get all exercises (with optional search and pagination) */
export async function getExercises(limit = 50, offset = 0): Promise<Exercise[]> {
	return fetchExerciseDB<Exercise[]>(`/api/v1/exercises?limit=${limit}&offset=${offset}`);
}

/** Raw shape returned by ExerciseDB v1 API */
interface ExerciseDBResponse {
	exerciseId: string;
	name: string;
	gifUrl: string;
	targetMuscles: string[];
	bodyParts: string[];
	equipments: string[];
	secondaryMuscles: string[];
	instructions: string[];
}

/** Map ExerciseDB v1 response to our Exercise type */
function mapExercise(raw: ExerciseDBResponse): Exercise {
	return {
		id: raw.exerciseId,
		name: raw.name,
		gifUrl: raw.gifUrl,
		target: raw.targetMuscles?.[0] ?? '',
		bodyPart: raw.bodyParts?.[0] ?? '',
		equipment: raw.equipments?.[0] ?? '',
		secondaryMuscles: raw.secondaryMuscles ?? [],
		instructions: (raw.instructions ?? []).map((s) => s.replace(/^Step:\d+\s*/, ''))
	};
}

/** Search exercises by name (fuzzy matching) */
export async function searchExercises(query: string, limit = 50, offset = 0): Promise<Exercise[]> {
	const raw = await fetchExerciseDB<ExerciseDBResponse[]>(
		`/api/v1/exercises/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`
	);
	return raw.map(mapExercise);
}

/** Get a single exercise by ID */
export async function getExerciseById(id: string): Promise<Exercise> {
	return fetchExerciseDB<Exercise>(`/api/v1/exercises/${encodeURIComponent(id)}`);
}

/** Get exercises by body part (e.g., "chest", "back", "upper legs") */
export async function getExercisesByBodyPart(bodyPart: string, limit = 50, offset = 0): Promise<Exercise[]> {
	return fetchExerciseDB<Exercise[]>(
		`/api/v1/bodyparts/${encodeURIComponent(bodyPart)}/exercises?limit=${limit}&offset=${offset}`
	);
}

/** Get exercises by equipment type (e.g., "barbell", "dumbbell", "cable") */
export async function getExercisesByEquipment(equipment: string, limit = 50, offset = 0): Promise<Exercise[]> {
	return fetchExerciseDB<Exercise[]>(
		`/api/v1/equipments/${encodeURIComponent(equipment)}/exercises?limit=${limit}&offset=${offset}`
	);
}

/** Get exercises by target muscle (e.g., "pectorals", "lats", "quads") */
export async function getExercisesByMuscle(muscle: string, limit = 50, offset = 0): Promise<Exercise[]> {
	return fetchExerciseDB<Exercise[]>(
		`/api/v1/muscles/${encodeURIComponent(muscle)}/exercises?limit=${limit}&offset=${offset}`
	);
}

// ============================================================================
// Metadata Queries
// ============================================================================

/** Get all available body part categories */
export async function getBodyPartList(): Promise<string[]> {
	const items = await fetchExerciseDB<NamedItem[]>('/api/v1/bodyparts');
	return items.map((item) => item.name);
}

/** Get all available equipment types */
export async function getEquipmentList(): Promise<string[]> {
	const items = await fetchExerciseDB<NamedItem[]>('/api/v1/equipments');
	return items.map((item) => item.name);
}

/** Get all available target muscles */
export async function getMuscleList(): Promise<string[]> {
	const items = await fetchExerciseDB<NamedItem[]>('/api/v1/muscles');
	return items.map((item) => item.name);
}

// ============================================================================
// Filtered query for plan generation
// ============================================================================

/**
 * Get exercises filtered by the athlete's available equipment.
 * Excludes exercises that require equipment the athlete doesn't have.
 * Used during plan generation context assembly.
 */
export async function getExercisesForAthlete(
	availableEquipment: string[],
	limit = 200
): Promise<Exercise[]> {
	// "body weight" exercises are always available
	const equipmentSet = new Set([...availableEquipment, 'body weight']);

	// Fetch a broad set and filter client-side
	// (ExerciseDB doesn't support multi-equipment queries natively)
	const allExercises = await getExercises(limit, 0);
	return allExercises.filter((ex) => equipmentSet.has(ex.equipment));
}
