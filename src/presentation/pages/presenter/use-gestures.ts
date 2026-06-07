import { useCallback, useRef } from "react";

/**
 * Callbacks the gesture hook translates pointer interactions into.
 * These map directly to the intents exposed by usePresenter.
 */
export interface GestureCallbacks {
	readonly goNext: () => void;
	readonly goPrevious: () => void;
	readonly toggleLanguage: () => void;
}

/**
 * Handlers to spread on the fullscreen presenter container element.
 * The container element reference is passed to onPointerDown so the hook
 * can read the element width for zone calculations without needing a ref
 * stored outside this module.
 */
export interface GestureHandlers {
	readonly onPointerDown: (event: PointerEvent, container: HTMLElement) => void;
	readonly onPointerMove: (event: PointerEvent) => void;
	readonly onPointerUp: (event: PointerEvent) => void;
}

/**
 * The minimum horizontal displacement (in pixels) that distinguishes a swipe
 * from a tap.  Below this the gesture resolves to a zone tap.
 */
const SWIPE_THRESHOLD_PX = 40;

/**
 * The fractional width of the left and right tap zones (0..1).
 * A tap starting at x < width * EDGE_ZONE_RATIO is "left edge";
 * a tap at x > width * (1 - EDGE_ZONE_RATIO) is "right edge".
 */
const EDGE_ZONE_RATIO = 0.2;

interface PointerState {
	/** X coordinate when the pointer was pressed. */
	startX: number;
	/** Width of the container element at pointer-down time. */
	containerWidth: number;
	/** Whether this gesture started on an interactive element and should be ignored. */
	ignored: boolean;
}

/**
 * Translates pointer interactions on the presenter fullscreen area into
 * navigation or language-toggle intents.
 *
 * Gesture model:
 * - Swipe left  (displacement ≥ SWIPE_THRESHOLD_PX leftward)  → goNext
 * - Swipe right (displacement ≥ SWIPE_THRESHOLD_PX rightward) → goPrevious
 * - Tap in left 20% zone  → goPrevious
 * - Tap in right 20% zone → goNext
 * - Tap in center 60%     → toggleLanguage
 *
 * Events originating within interactive elements (or any element marked
 * with the data-gesture-ignore attribute, e.g. the font-controls overlay)
 * are ignored to preserve exit ✕, sr-only nav buttons, and overlay controls.
 *
 * Call preventDefault on pointerdown to suppress scroll / zoom within the
 * presenter area (complements CSS touch-action: none on the container).
 */
export function useGestures(callbacks: GestureCallbacks): GestureHandlers {
	const { goNext, goPrevious, toggleLanguage } = callbacks;
	const stateRef = useRef<PointerState | null>(null);

	const onPointerDown = useCallback(
		(event: PointerEvent, container: HTMLElement) => {
			// Suppress scroll / zoom within the presenter area.
			event.preventDefault();

			// Ignore gestures that originate on interactive elements.
			const target = event.target as Element | null;
			if (target !== null && isInteractiveElement(target)) {
				stateRef.current = {
					startX: event.clientX,
					containerWidth: container.offsetWidth,
					ignored: true,
				};
				return;
			}

			stateRef.current = {
				startX: event.clientX,
				containerWidth: container.offsetWidth,
				ignored: false,
			};
		},
		[],
	);

	const onPointerMove = useCallback((event: PointerEvent) => {
		event.preventDefault();
	}, []);

	const onPointerUp = useCallback(
		(event: PointerEvent) => {
			event.preventDefault();

			const state = stateRef.current;
			stateRef.current = null;

			if (state === null || state.ignored) return;

			const deltaX = event.clientX - state.startX;
			const absDeltaX = Math.abs(deltaX);

			if (absDeltaX >= SWIPE_THRESHOLD_PX) {
				// Swipe gesture: direction determines intent.
				if (deltaX < 0) {
					goNext();
				} else {
					goPrevious();
				}
				return;
			}

			// Below threshold — resolve as zone tap using the start position.
			const ratio = state.startX / state.containerWidth;
			if (ratio <= EDGE_ZONE_RATIO) {
				goPrevious();
			} else if (ratio >= 1 - EDGE_ZONE_RATIO) {
				goNext();
			} else {
				toggleLanguage();
			}
		},
		[goNext, goPrevious, toggleLanguage],
	);

	return { onPointerDown, onPointerMove, onPointerUp };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Elements whose pointer events must never be interpreted as gestures:
 * interactive controls plus anything explicitly opted out via the
 * data-gesture-ignore attribute (e.g. the font-controls overlay, whose
 * wrapper would otherwise leak taps between its buttons into the
 * right-edge navigation zone).
 */
const GESTURE_IGNORED_SELECTOR =
	"button, a, input, select, textarea, [data-gesture-ignore]";

function isInteractiveElement(el: Element): boolean {
	return el.closest(GESTURE_IGNORED_SELECTOR) !== null;
}
