/**
 * Estimated 1RM using the Epley formula.
 * Returns null if weight or reps are invalid.
 */
export function estimatedE1RM(weight: number, reps: number): number | null {
	if (weight <= 0 || reps <= 0) return null;
	if (reps === 1) return weight;
	return weight * (1 + reps / 30);
}

/**
 * Returns true if the current set's estimated 1RM exceeds the stored best.
 * Returns false if there's no valid comparison (null inputs, zero values).
 */
export function isPR(weight: number, reps: number, bestE1RM: number | null): boolean {
	if (bestE1RM === null || bestE1RM <= 0) return false;
	const current = estimatedE1RM(weight, reps);
	if (current === null) return false;
	return current > bestE1RM;
}
