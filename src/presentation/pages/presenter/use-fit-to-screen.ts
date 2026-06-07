import { useEffect, useLayoutEffect, useState } from "react";

/** Readability floor: text never shrinks below 30% of the base size. */
export const MIN_FIT_FACTOR = 0.3;

/** Small margin so fitted text keeps breathing room rather than touching edges. */
const SAFETY_MARGIN = 0.95;

/** Measurement tolerance for sub-pixel rounding. */
const FIT_TOLERANCE_PX = 1;

/**
 * Shrink-to-fit factor for the slide content area.
 *
 * Returns a factor in [MIN_FIT_FACTOR, 1] to multiply into the base font
 * scale. Content renders at factor 1 (the user's chosen A−/A+ size) and is
 * shrunk iteratively after layout only when it overflows its container —
 * short slides keep their size, long slides always fit.
 *
 * The factor resets to 1 whenever `resetKey` changes (encode slide, language
 * and base font scale into it) and on window resize/rotation, then
 * re-converges.
 */
export function useFitToScreen(
	contentRef: React.RefObject<HTMLElement | null>,
	resetKey: string,
): number {
	const [factor, setFactor] = useState(1);

	// New slide / language / base scale: start over from the full size.
	// State-adjustment-during-render per React docs — no effect needed.
	const [previousKey, setPreviousKey] = useState(resetKey);
	if (previousKey !== resetKey) {
		setPreviousKey(resetKey);
		setFactor(1);
	}

	// Viewport changed (rotation, resize): re-fit from the full size.
	useEffect(() => {
		const handleResize = () => setFactor(1);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// After every layout, shrink while the content overflows. Each state
	// update re-renders, the browser re-wraps the text, and we measure again —
	// converging in a few iterations. The factor only ever decreases between
	// resets, so this terminates.
	useLayoutEffect(() => {
		const element = contentRef.current;
		if (element === null || factor <= MIN_FIT_FACTOR) {
			return;
		}
		const overflows =
			element.scrollHeight > element.clientHeight + FIT_TOLERANCE_PX;
		if (!overflows) {
			return;
		}
		const ratio = (element.clientHeight / element.scrollHeight) * SAFETY_MARGIN;
		setFactor((current) => Math.max(MIN_FIT_FACTOR, current * ratio));
	});

	return factor;
}
