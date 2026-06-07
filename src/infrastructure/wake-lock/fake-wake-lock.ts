import type { ScreenWakeLock } from "./screen-wake-lock";

/**
 * In-memory fake for ScreenWakeLock.
 *
 * Records acquire/release calls so tests can assert on observable behaviour
 * without needing a real browser environment.
 */
export class FakeWakeLock implements ScreenWakeLock {
	private _acquired = false;
	private _acquireCount = 0;
	private _releaseCount = 0;

	get isAcquired(): boolean {
		return this._acquired;
	}

	get acquireCount(): number {
		return this._acquireCount;
	}

	get releaseCount(): number {
		return this._releaseCount;
	}

	async acquire(): Promise<void> {
		this._acquired = true;
		this._acquireCount++;
	}

	async release(): Promise<void> {
		this._acquired = false;
		this._releaseCount++;
	}
}
