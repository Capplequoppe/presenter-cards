import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FakeWakeLock } from "../../../infrastructure/wake-lock";
import { useWakeLock } from "./use-wake-lock";

describe("useWakeLock", () => {
	afterEach(() => {
		// Reset visibility state
		Object.defineProperty(document, "visibilityState", {
			configurable: true,
			value: "visible",
		});
	});

	it("acquires the wake lock on mount", async () => {
		const fake = new FakeWakeLock();

		renderHook(() => useWakeLock(fake));

		// Wait for the async acquire to complete
		await act(async () => {});

		expect(fake.isAcquired).toBe(true);
		expect(fake.acquireCount).toBe(1);
	});

	it("releases the wake lock on unmount", async () => {
		const fake = new FakeWakeLock();

		const { unmount } = renderHook(() => useWakeLock(fake));

		await act(async () => {});
		expect(fake.isAcquired).toBe(true);

		unmount();

		await act(async () => {});
		expect(fake.isAcquired).toBe(false);
		expect(fake.releaseCount).toBe(1);
	});

	it("re-acquires the wake lock when page becomes visible again", async () => {
		const fake = new FakeWakeLock();

		renderHook(() => useWakeLock(fake));
		await act(async () => {});
		expect(fake.acquireCount).toBe(1);

		// Simulate page becoming visible again
		Object.defineProperty(document, "visibilityState", {
			configurable: true,
			value: "visible",
		});

		act(() => {
			document.dispatchEvent(new Event("visibilitychange"));
		});

		await act(async () => {});
		expect(fake.acquireCount).toBe(2);
	});

	it("does not re-acquire when page becomes hidden", async () => {
		const fake = new FakeWakeLock();

		renderHook(() => useWakeLock(fake));
		await act(async () => {});
		expect(fake.acquireCount).toBe(1);

		// Simulate page becoming hidden
		Object.defineProperty(document, "visibilityState", {
			configurable: true,
			value: "hidden",
		});

		act(() => {
			document.dispatchEvent(new Event("visibilitychange"));
		});

		await act(async () => {});
		expect(fake.acquireCount).toBe(1);
	});

	it("does not throw when the wake lock implementation is a no-op", async () => {
		// FakeWakeLock never throws; BrowserWakeLock degrades silently —
		// this test verifies the hook does not propagate any error.
		const fake = new FakeWakeLock();

		expect(() => {
			const { unmount } = renderHook(() => useWakeLock(fake));
			unmount();
		}).not.toThrow();
	});
});
