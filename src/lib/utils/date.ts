/**
 * Get the current date parts (year, month, day, weekday) in a specific timezone.
 * Falls back to UTC if the timezone is invalid.
 */
function getLocalDateParts(timezone: string): { year: number; month: number; day: number; weekday: number } {
	const now = new Date();
	try {
		// Use Intl to format date parts in the target timezone
		const fmt = new Intl.DateTimeFormat('en-US', {
			timeZone: timezone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			weekday: 'short'
		});
		const parts = fmt.formatToParts(now);
		const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';

		const year = parseInt(get('year'), 10);
		const month = parseInt(get('month'), 10);
		const day = parseInt(get('day'), 10);

		// Map weekday abbreviation to JS day number (0=Sun)
		const weekdayMap: Record<string, number> = {
			Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
		};
		const weekday = weekdayMap[get('weekday')] ?? now.getDay();

		return { year, month, day, weekday };
	} catch {
		// Invalid timezone — fall back to UTC
		return {
			year: now.getUTCFullYear(),
			month: now.getUTCMonth() + 1,
			day: now.getUTCDate(),
			weekday: now.getUTCDay()
		};
	}
}

/**
 * Compute Monday of the current calendar week (ISO: Monday = start of week)
 * in the user's local timezone.
 */
export function getCurrentMonday(timezone = 'UTC'): string {
	const { year, month, day, weekday } = getLocalDateParts(timezone);

	// weekday: 0=Sun. Offset to get back to Monday.
	const mondayOffset = weekday === 0 ? -6 : 1 - weekday;

	// Build a Date in UTC to do the arithmetic, then extract the parts
	const d = new Date(Date.UTC(year, month - 1, day + mondayOffset));
	const y = d.getUTCFullYear();
	const m = String(d.getUTCMonth() + 1).padStart(2, '0');
	const dd = String(d.getUTCDate()).padStart(2, '0');
	return `${y}-${m}-${dd}`;
}

/**
 * Get the current day index (0=Monday, 6=Sunday) in the user's local timezone.
 */
export function getTodayIndex(timezone = 'UTC'): number {
	const { weekday } = getLocalDateParts(timezone);
	return weekday === 0 ? 6 : weekday - 1;
}

/**
 * Get today's date formatted for display (e.g. "Apr 2") in the user's local timezone.
 */
export function getTodayDisplay(timezone = 'UTC'): string {
	const now = new Date();
	try {
		return now.toLocaleDateString('en-US', {
			timeZone: timezone,
			month: 'short',
			day: 'numeric'
		});
	} catch {
		return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
}
