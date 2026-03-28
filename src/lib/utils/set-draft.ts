const KEY = 'push:set-drafts';
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface SetDraft {
	weight: string;
	reps: string;
	updatedAt: number;
}

/** Save all pending set drafts to localStorage. */
export function saveDrafts(
	setStates: Record<string, { weight: string; reps: string; status: string }>
): void {
	if (typeof window === 'undefined') return;
	const drafts: Record<string, SetDraft> = {};
	for (const [id, s] of Object.entries(setStates)) {
		if (s.status === 'pending' && (s.weight || s.reps)) {
			drafts[id] = { weight: s.weight, reps: s.reps, updatedAt: Date.now() };
		}
	}
	localStorage.setItem(KEY, JSON.stringify(drafts));
}

/** Load drafts from localStorage, filtering out entries older than 24h. */
export function loadDrafts(): Record<string, SetDraft> {
	if (typeof window === 'undefined') return {};
	const raw = localStorage.getItem(KEY);
	if (!raw) return {};
	try {
		const drafts: Record<string, SetDraft> = JSON.parse(raw);
		const cutoff = Date.now() - EXPIRY_MS;
		return Object.fromEntries(Object.entries(drafts).filter(([, d]) => d.updatedAt > cutoff));
	} catch {
		return {};
	}
}

/** Clear a specific set's draft after successful save. */
export function clearDraft(setId: string): void {
	if (typeof window === 'undefined') return;
	const drafts = loadDrafts();
	delete drafts[setId];
	localStorage.setItem(KEY, JSON.stringify(drafts));
}
