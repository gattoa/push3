const BANNER_PREFIX = 'push:banner:';
const EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours

interface BannerState {
	dismissedAt: number;
}

/**
 * Returns true if the banner should be shown (not dismissed or expired).
 */
export function shouldShowBanner(type: string): boolean {
	if (typeof window === 'undefined') return true;
	const raw = localStorage.getItem(BANNER_PREFIX + type);
	if (!raw) return true;
	try {
		const state: BannerState = JSON.parse(raw);
		return Date.now() - state.dismissedAt > EXPIRY_MS;
	} catch {
		return true;
	}
}

/**
 * Dismiss a banner. It will stay dismissed for 48 hours.
 */
export function dismissBanner(type: string): void {
	if (typeof window === 'undefined') return;
	const state: BannerState = { dismissedAt: Date.now() };
	localStorage.setItem(BANNER_PREFIX + type, JSON.stringify(state));
}
