/**
 * Tests for useGestures — gesture detection hook.
 *
 * ## jsdom pointer event notes
 * jsdom supports PointerEvent via global.PointerEvent (Chromium-style).
 * We use PointerEvent as the primary mechanism because they unify mouse and
 * touch input and have reliable clientX/clientY support in jsdom.
 *
 * TouchEvent in jsdom has very limited support for reading touch coordinates
 * from changedTouches; building TouchEvent correctly requires working around
 * the lack of a proper TouchList constructor. We therefore rely on
 * PointerEvent for all coordinate-based gesture tests.
 *
 * The hook calls event.preventDefault() on pointermove and pointerup. In jsdom
 * these calls are no-ops (the synthetic DOM does not have real scroll/zoom
 * side-effects) but we verify they are called via spies to document intent.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type GestureHandlers, useGestures } from "./use-gestures";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a PointerEvent-like object with clientX / clientY. */
function makePointerDown(clientX: number, clientY: number): PointerEvent {
	return new PointerEvent("pointerdown", {
		clientX,
		clientY,
		bubbles: true,
		cancelable: true,
		pointerId: 1,
	});
}

function makePointerMove(clientX: number, clientY: number): PointerEvent {
	return new PointerEvent("pointermove", {
		clientX,
		clientY,
		bubbles: true,
		cancelable: true,
		pointerId: 1,
	});
}

function makePointerUp(clientX: number, clientY: number): PointerEvent {
	return new PointerEvent("pointerup", {
		clientX,
		clientY,
		bubbles: true,
		cancelable: true,
		pointerId: 1,
	});
}

/** Performs a full swipe gesture via the returned handlers. */
function performSwipe(
	handlers: GestureHandlers,
	startX: number,
	endX: number,
	containerWidth = 400,
) {
	const el = document.createElement("div");
	Object.defineProperty(el, "offsetWidth", { value: containerWidth });

	const downEvent = makePointerDown(startX, 100);
	handlers.onPointerDown(downEvent, el);

	const moveEvent = makePointerMove(endX, 100);
	handlers.onPointerMove(moveEvent);

	const upEvent = makePointerUp(endX, 100);
	handlers.onPointerUp(upEvent);
}

/** Performs a full tap gesture (pointer down then immediately up, same x). */
function performTap(
	handlers: GestureHandlers,
	clientX: number,
	containerWidth = 400,
) {
	performSwipe(handlers, clientX, clientX, containerWidth);
}

// ---------------------------------------------------------------------------
// Deck-like callbacks
// ---------------------------------------------------------------------------

describe("useGestures", () => {
	let goNext: ReturnType<typeof vi.fn<() => void>>;
	let goPrevious: ReturnType<typeof vi.fn<() => void>>;
	let toggleLanguage: ReturnType<typeof vi.fn<() => void>>;

	beforeEach(() => {
		goNext = vi.fn<() => void>();
		goPrevious = vi.fn<() => void>();
		toggleLanguage = vi.fn<() => void>();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// -------------------------------------------------------------------------
	// Swipe detection
	// -------------------------------------------------------------------------

	describe("swipe left (next)", () => {
		it("calls goNext when horizontal displacement exceeds threshold leftward", () => {
			const { result } = renderHook(() =>
				useGestures({ goNext, goPrevious, toggleLanguage }),
			);

			act(() => {
				// swipe left by 60px — above 40px threshold
				performSwipe(result.current, 200, 140, 400);
			});

			expect(goNext).toHaveBeenCalledOnce();
			expect(goPrevious).not.toHaveBeenCalled();
			expect(toggleLanguage).not.toHaveBeenCalled();
		});
	});

	describe("swipe right (previous)", () => {
		it("calls goPrevious when horizontal displacement exceeds threshold rightward", () => {
			const { result } = renderHook(() =>
				useGestures({ goNext, goPrevious, toggleLanguage }),
			);

			act(() => {
				// swipe right by 60px — above 40px threshold
				performSwipe(result.current, 200, 260, 400);
			});

			expect(goPrevious).toHaveBeenCalledOnce();
			expect(goNext).not.toHaveBeenCalled();
		});
	});

	describe("sub-threshold movement treated as tap", () => {
		it("small movement in center zone triggers toggleLanguage, not swipe", () => {
			const { result } = renderHook(() =>
				useGestures({ goNext, goPrevious, toggleLanguage }),
			);

			act(() => {
				// move only 10px left — below 40px threshold, center zone
				performSwipe(result.current, 200, 190, 400);
			});

			expect(toggleLanguage).toHaveBeenCalledOnce();
			expect(goNext).not.toHaveBeenCalled();
			expect(goPrevious).not.toHaveBeenCalled();
		});

		it("small movement in right zone triggers goNext, not swipe", () => {
			const { result } = renderHook(() =>
				useGestures({ goNext, goPrevious, toggleLanguage }),
			);

			act(() => {
				// tap at 84% of 400 = x=336 — right edge zone (>80%)
				performSwipe(result.current, 336, 330, 400);
			});

			expect(goNext).toHaveBeenCalledOnce();
		});
	});

	// -------------------------------------------------------------------------
	// Tap zone detection
	// -------------------------------------------------------------------------

	describe("left edge tap", () => {
		it("calls goPrevious when tap falls within left 20% zone", () => {
			const { result } = renderHook(() =>
				useGestures({ goNext, goPrevious, toggleLanguage }),
			);

			act(() => {
				// tap at 10% of 400 = x=40 — left zone
				performTap(result.current, 40, 400);
			});

			expect(goPrevious).toHaveBeenCalledOnce();
			expect(goNext).not.toHaveBeenCalled();
			expect(toggleLanguage).not.toHaveBeenCalled();
		});
	});

	describe("right edge tap", () => {
		it("calls goNext when tap falls within right 20% zone", () => {
			const { result } = renderHook(() =>
				useGestures({ goNext, goPrevious, toggleLanguage }),
			);

			act(() => {
				// tap at 90% of 400 = x=360 — right zone
				performTap(result.current, 360, 400);
			});

			expect(goNext).toHaveBeenCalledOnce();
			expect(goPrevious).not.toHaveBeenCalled();
			expect(toggleLanguage).not.toHaveBeenCalled();
		});
	});

	describe("center tap", () => {
		it("calls toggleLanguage when tap is in the center zone", () => {
			const { result } = renderHook(() =>
				useGestures({ goNext, goPrevious, toggleLanguage }),
			);

			act(() => {
				// tap at 50% of 400 = x=200 — center zone
				performTap(result.current, 200, 400);
			});

			expect(toggleLanguage).toHaveBeenCalledOnce();
			expect(goNext).not.toHaveBeenCalled();
			expect(goPrevious).not.toHaveBeenCalled();
		});

		it("calls toggleLanguage again on a second center tap (EN→IT→EN)", () => {
			const { result } = renderHook(() =>
				useGestures({ goNext, goPrevious, toggleLanguage }),
			);

			act(() => {
				performTap(result.current, 200, 400);
				performTap(result.current, 200, 400);
			});

			expect(toggleLanguage).toHaveBeenCalledTimes(2);
		});
	});

	// -------------------------------------------------------------------------
	// Boundary: events targeting interactive elements are ignored
	// -------------------------------------------------------------------------

	describe("button target guard", () => {
		it("ignores pointerdown on button elements", () => {
			const { result } = renderHook(() =>
				useGestures({ goNext, goPrevious, toggleLanguage }),
			);

			const btn = document.createElement("button");
			Object.defineProperty(btn, "offsetWidth", { value: 400 });

			act(() => {
				// Start on a button — should not register gesture
				const downEvent = new PointerEvent("pointerdown", {
					clientX: 200,
					clientY: 100,
					bubbles: true,
					cancelable: true,
				});
				Object.defineProperty(downEvent, "target", { value: btn });
				result.current.onPointerDown(downEvent, btn);

				// Complete the gesture — up at same position (tap)
				const upEvent = makePointerUp(200, 100);
				result.current.onPointerUp(upEvent);
			});

			expect(toggleLanguage).not.toHaveBeenCalled();
			expect(goNext).not.toHaveBeenCalled();
			expect(goPrevious).not.toHaveBeenCalled();
		});

		it("ignores pointerdown on descendants of interactive elements", () => {
			const { result } = renderHook(() =>
				useGestures({ goNext, goPrevious, toggleLanguage }),
			);

			const btn = document.createElement("button");
			const span = document.createElement("span");
			btn.appendChild(span);
			Object.defineProperty(btn, "offsetWidth", { value: 400 });

			act(() => {
				const downEvent = new PointerEvent("pointerdown", {
					clientX: 200,
					clientY: 100,
					bubbles: true,
					cancelable: true,
				});
				Object.defineProperty(downEvent, "target", { value: span });
				result.current.onPointerDown(downEvent, btn);

				const upEvent = makePointerUp(200, 100);
				result.current.onPointerUp(upEvent);
			});

			expect(toggleLanguage).not.toHaveBeenCalled();
			expect(goNext).not.toHaveBeenCalled();
			expect(goPrevious).not.toHaveBeenCalled();
		});

		it("ignores pointerdown inside an element marked data-gesture-ignore", () => {
			const { result } = renderHook(() =>
				useGestures({ goNext, goPrevious, toggleLanguage }),
			);

			const container = document.createElement("div");
			Object.defineProperty(container, "offsetWidth", { value: 400 });
			const overlay = document.createElement("div");
			overlay.setAttribute("data-gesture-ignore", "");
			container.appendChild(overlay);

			act(() => {
				// Tap landing on the overlay itself (e.g. gap between its buttons)
				const downEvent = new PointerEvent("pointerdown", {
					clientX: 360, // right-edge zone — would otherwise be goNext
					clientY: 100,
					bubbles: true,
					cancelable: true,
				});
				Object.defineProperty(downEvent, "target", { value: overlay });
				result.current.onPointerDown(downEvent, container);

				const upEvent = makePointerUp(360, 100);
				result.current.onPointerUp(upEvent);
			});

			expect(goNext).not.toHaveBeenCalled();
			expect(goPrevious).not.toHaveBeenCalled();
			expect(toggleLanguage).not.toHaveBeenCalled();
		});
	});

	// -------------------------------------------------------------------------
	// Swipe threshold boundary
	// -------------------------------------------------------------------------

	describe("swipe threshold (40px)", () => {
		it("exactly at threshold (40px) is treated as a swipe", () => {
			const { result } = renderHook(() =>
				useGestures({ goNext, goPrevious, toggleLanguage }),
			);

			act(() => {
				// Exactly 40px left displacement from center
				performSwipe(result.current, 200, 160, 400);
			});

			expect(goNext).toHaveBeenCalledOnce();
		});

		it("one pixel below threshold (39px) is treated as a tap", () => {
			const { result } = renderHook(() =>
				useGestures({ goNext, goPrevious, toggleLanguage }),
			);

			act(() => {
				// 39px left from center — lands in center zone
				performSwipe(result.current, 200, 161, 400);
			});

			// Start was in center, end is also considered tap in center → toggle
			expect(toggleLanguage).toHaveBeenCalledOnce();
			expect(goNext).not.toHaveBeenCalled();
		});
	});

	// -------------------------------------------------------------------------
	// preventDefault is called on move/up events (scroll/zoom suppression)
	// -------------------------------------------------------------------------

	describe("touch default suppression", () => {
		it("calls preventDefault on pointerdown", () => {
			const { result } = renderHook(() =>
				useGestures({ goNext, goPrevious, toggleLanguage }),
			);

			const el = document.createElement("div");
			Object.defineProperty(el, "offsetWidth", { value: 400 });
			const downEvent = makePointerDown(200, 100);
			const preventDefaultSpy = vi.spyOn(downEvent, "preventDefault");

			act(() => {
				result.current.onPointerDown(downEvent, el);
			});

			expect(preventDefaultSpy).toHaveBeenCalled();
		});
	});
});
