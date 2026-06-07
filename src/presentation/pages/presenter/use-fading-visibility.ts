import { useCallback, useEffect, useRef, useState } from "react";

const FADE_DELAY_MS = 3000;

/**
 * Returns a visibility flag that starts as true, then fades to false after
 * FADE_DELAY_MS of inactivity. Calling the returned `keepVisible` function
 * resets the timer and keeps the element visible.
 *
 * Used by FontControls to fade out after a few seconds of no interaction.
 */
export function useFadingVisibility(): {
	visible: boolean;
	keepVisible: () => void;
} {
	const [visible, setVisible] = useState(true);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const keepVisible = useCallback(() => {
		setVisible(true);

		if (timerRef.current !== null) {
			clearTimeout(timerRef.current);
		}

		timerRef.current = setTimeout(() => {
			setVisible(false);
		}, FADE_DELAY_MS);
	}, []);

	// Start the fade timer immediately on mount
	useEffect(() => {
		keepVisible();

		return () => {
			if (timerRef.current !== null) {
				clearTimeout(timerRef.current);
			}
		};
	}, [keepVisible]);

	return { visible, keepVisible };
}
