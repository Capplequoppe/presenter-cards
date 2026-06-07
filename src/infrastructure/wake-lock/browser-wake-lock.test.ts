import { afterEach, describe, expect, it, vi } from "vitest";
import { BrowserWakeLock } from "./browser-wake-lock";

function stubWakeLockApi(
	request: (type: "screen") => Promise<WakeLockSentinel>,
): void {
	Object.defineProperty(navigator, "wakeLock", {
		configurable: true,
		value: { request } as WakeLock,
	});
}

function makeSentinel(release: () => Promise<void>): WakeLockSentinel {
	return { release } as unknown as WakeLockSentinel;
}

describe("BrowserWakeLock", () => {
	afterEach(() => {
		Reflect.deleteProperty(navigator, "wakeLock");
	});

	describe("absent Wake Lock API", () => {
		it("acquire degrades to a silent no-op", async () => {
			// jsdom does not implement the Wake Lock API
			expect("wakeLock" in navigator).toBe(false);

			const lock = new BrowserWakeLock();
			await expect(lock.acquire()).resolves.toBeUndefined();
		});

		it("release without a prior acquire is a silent no-op", async () => {
			const lock = new BrowserWakeLock();
			await expect(lock.release()).resolves.toBeUndefined();
		});
	});

	describe("present Wake Lock API", () => {
		it("acquire requests a screen wake lock", async () => {
			const sentinel = makeSentinel(vi.fn().mockResolvedValue(undefined));
			const request = vi.fn().mockResolvedValue(sentinel);
			stubWakeLockApi(request);

			const lock = new BrowserWakeLock();
			await lock.acquire();

			expect(request).toHaveBeenCalledWith("screen");
		});

		it("release releases the acquired sentinel", async () => {
			const release = vi.fn().mockResolvedValue(undefined);
			stubWakeLockApi(vi.fn().mockResolvedValue(makeSentinel(release)));

			const lock = new BrowserWakeLock();
			await lock.acquire();
			await lock.release();

			expect(release).toHaveBeenCalledOnce();
		});

		it("does not throw when the request is rejected (e.g. document hidden)", async () => {
			stubWakeLockApi(
				vi
					.fn()
					.mockRejectedValue(new DOMException("denied", "NotAllowedError")),
			);

			const lock = new BrowserWakeLock();
			await expect(lock.acquire()).resolves.toBeUndefined();
		});

		it("does not throw when the sentinel was already released by the browser", async () => {
			const release = vi
				.fn()
				.mockRejectedValue(new DOMException("already released"));
			stubWakeLockApi(vi.fn().mockResolvedValue(makeSentinel(release)));

			const lock = new BrowserWakeLock();
			await lock.acquire();
			await expect(lock.release()).resolves.toBeUndefined();
		});
	});
});
