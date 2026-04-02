/**
 * Compute Monday of the current calendar week (ISO: Monday = start of week).
 * Uses local date parts — toISOString() shifts to UTC and can return the wrong day.
 */
export function getCurrentMonday(): string {
	const now = new Date();
	const jsDay = now.getDay(); // 0=Sun
	const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
	const monday = new Date(now);
	monday.setDate(now.getDate() + mondayOffset);
	const y = monday.getFullYear();
	const m = String(monday.getMonth() + 1).padStart(2, '0');
	const d = String(monday.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}
