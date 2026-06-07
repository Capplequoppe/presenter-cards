import type { ScreenWakeLock } from "./screen-wake-lock";

/**
 * Browser implementation of ScreenWakeLock using the native Wake Lock API.
 *
 * Degrades silently to a no-op when navigator.wakeLock is not available
 * (older browsers, non-HTTPS contexts) — never throws.
 */
export class BrowserWakeLock implements ScreenWakeLock {
	private sentinel: WakeLockSentinel | null = null;

	async acquire(): Promise<void> {
		if (!("wakeLock" in navigator)) {
			return;
		}
		try {
			this.sentinel = await navigator.wakeLock.request("screen");
		} catch {
			// Silently degrade: user denied, document hidden, or unsupported
		}
	}

	async release(): Promise<void> {
		if (this.sentinel === null) {
			return;
		}
		try {
			await this.sentinel.release();
		} catch {
			// Sentinel may already be released (e.g. browser backgrounded it)
		} finally {
			this.sentinel = null;
		}
	}
}
