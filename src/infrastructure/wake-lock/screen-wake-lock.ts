/**
 * Interface for the Screen Wake Lock capability.
 *
 * Abstracts over the browser Wake Lock API so the presenter hook can be tested
 * with a fake and the real implementation can gracefully degrade when the API
 * is absent.
 */
export interface ScreenWakeLock {
	/**
	 * Acquires the wake lock. Resolves when acquired.
	 * Must not throw — implementations degrade silently if unsupported.
	 */
	acquire(): Promise<void>;

	/**
	 * Releases the wake lock. Resolves when released.
	 * Must not throw — no-op if nothing is currently held.
	 */
	release(): Promise<void>;
}
