import type { MouseEvent } from "react";
import type { DeckSettings } from "../../../domain";
import { updateFontScale } from "../../../domain";
import { useUseCases } from "../../composition-root";

const FONT_SCALE_MIN = 0.5;
const FONT_SCALE_MAX = 2.0;
const FONT_SCALE_STEP = 0.1;

interface FontControlsProps {
	readonly deckId: string;
	readonly settings: DeckSettings;
	readonly onSettingsChange: (settings: DeckSettings) => void;
	/**
	 * Visibility is owned by the presenter (useFadingVisibility): while faded
	 * the wrapper has pointer-events-none, so only the presenter root can
	 * observe the interaction that should bring the controls back.
	 */
	readonly visible: boolean;
	readonly keepVisible: () => void;
}

/**
 * Fading A− / A+ font-scale controls for the presenter screen.
 *
 * - Adjusts fontScale in 0.1 steps within [0.5, 2.0] using the domain rule.
 * - Persists the new settings via UpdateDeckSettings on every press.
 * - Fades out after 3 seconds of inactivity; interaction brings controls back.
 * - Stops event propagation so taps do not bubble into slide navigation.
 */
export function FontControls({
	deckId,
	settings,
	onSettingsChange,
	visible,
	keepVisible,
}: FontControlsProps) {
	const { updateDeckSettings } = useUseCases();

	function stopPropagation(e: MouseEvent): void {
		e.stopPropagation();
	}

	async function handleDecrease(e: MouseEvent): Promise<void> {
		e.stopPropagation();
		keepVisible();
		const newSettings = updateFontScale(
			settings,
			settings.fontScale - FONT_SCALE_STEP,
		);
		onSettingsChange(newSettings);
		await updateDeckSettings.execute(deckId, newSettings);
	}

	async function handleIncrease(e: MouseEvent): Promise<void> {
		e.stopPropagation();
		keepVisible();
		const newSettings = updateFontScale(
			settings,
			settings.fontScale + FONT_SCALE_STEP,
		);
		onSettingsChange(newSettings);
		await updateDeckSettings.execute(deckId, newSettings);
	}

	const atMin = settings.fontScale <= FONT_SCALE_MIN;
	const atMax = settings.fontScale >= FONT_SCALE_MAX;

	return (
		// The wrapper intercepts pointer events to stop propagation to slide navigation.
		// No keyboard interaction is needed here — the buttons inside handle keyboard focus.
		// biome-ignore lint/a11y/noStaticElementInteractions: wrapper intercepts pointer events only; interactive children (buttons) handle keyboard
		// biome-ignore lint/a11y/useKeyWithClickEvents: same reason
		<div
			className={`flex items-center gap-2 transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
			data-testid="font-controls"
			onClick={stopPropagation}
			onPointerMove={keepVisible}
		>
			<button
				type="button"
				aria-label="Decrease font size"
				disabled={atMin}
				onClick={handleDecrease}
				className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-sm font-semibold"
			>
				A−
			</button>
			<button
				type="button"
				aria-label="Increase font size"
				disabled={atMax}
				onClick={handleIncrease}
				className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-sm font-semibold"
			>
				A+
			</button>
		</div>
	);
}
