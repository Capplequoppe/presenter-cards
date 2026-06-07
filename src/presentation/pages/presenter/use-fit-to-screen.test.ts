import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MIN_FIT_FACTOR, useFitToScreen } from "./use-fit-to-screen";

interface FakeMeasurable {
	scrollHeight: number;
	clientHeight: number;
}

/**
 * Fake content element whose scrollHeight responds to the applied factor the
 * way real text roughly does: content height shrinks proportionally.
 */
function overflowingElement(
	contentHeight: number,
	viewportHeight: number,
): FakeMeasurable {
	return { scrollHeight: contentHeight, clientHeight: viewportHeight };
}

describe("useFitToScreen", () => {
	it("keeps factor 1 when content already fits", () => {
		const el = overflowingElement(300, 400);
		const ref = { current: el as unknown as HTMLElement };

		const { result } = renderHook(() => useFitToScreen(ref, "slide-1"));

		expect(result.current).toBe(1);
	});

	it("shrinks the factor until the content fits", () => {
		const el = overflowingElement(800, 400);
		const ref = { current: el as unknown as HTMLElement };

		const { result, rerender } = renderHook(() =>
			useFitToScreen(ref, "slide-1"),
		);

		// Simulate the layout responding to the shrink: each re-render the
		// fake content height follows the current factor.
		for (let i = 0; i < 10; i++) {
			el.scrollHeight = Math.round(800 * result.current);
			rerender();
		}

		expect(result.current).toBeLessThan(1);
		expect(el.scrollHeight).toBeLessThanOrEqual(el.clientHeight + 1);
	});

	it("never shrinks below the readability floor", () => {
		// Pathologically tall content that can never fit.
		const el = overflowingElement(100000, 400);
		const ref = { current: el as unknown as HTMLElement };

		const { result, rerender } = renderHook(() =>
			useFitToScreen(ref, "slide-1"),
		);

		for (let i = 0; i < 25; i++) {
			rerender();
		}

		expect(result.current).toBe(MIN_FIT_FACTOR);
	});

	it("resets to 1 when the dependencies change (new slide)", () => {
		const el = overflowingElement(800, 400);
		const ref = { current: el as unknown as HTMLElement };

		const { result, rerender } = renderHook(
			({ dep }) => useFitToScreen(ref, dep),
			{ initialProps: { dep: "slide-1" } },
		);
		for (let i = 0; i < 10; i++) {
			el.scrollHeight = Math.round(800 * result.current);
			rerender({ dep: "slide-1" });
		}
		expect(result.current).toBeLessThan(1);

		// Next slide is short: fits at full size.
		el.scrollHeight = 200;
		rerender({ dep: "slide-2" });

		expect(result.current).toBe(1);
	});

	it("re-fits when the window resizes (e.g. rotation)", () => {
		const el = overflowingElement(300, 400);
		const ref = { current: el as unknown as HTMLElement };

		const { result, rerender } = renderHook(() =>
			useFitToScreen(ref, "slide-1"),
		);
		expect(result.current).toBe(1);

		// Viewport shrinks: content no longer fits.
		el.clientHeight = 150;
		act(() => {
			window.dispatchEvent(new Event("resize"));
		});
		for (let i = 0; i < 10; i++) {
			el.scrollHeight = Math.round(300 * result.current);
			rerender();
		}

		expect(result.current).toBeLessThan(1);
		expect(el.scrollHeight).toBeLessThanOrEqual(el.clientHeight + 1);
	});
});
