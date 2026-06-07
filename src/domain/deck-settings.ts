import type { Slide } from "./slide";

export type Layout = "text-only" | "title-text" | "full";

export interface DeckSettings {
	readonly layout: Layout;
	readonly fontScale: number;
}

const FONT_SCALE_MIN = 0.5;
const FONT_SCALE_MAX = 2.0;
const FONT_SCALE_DEFAULT = 1.0;
const FONT_SCALE_STEPS_PER_UNIT = 10;

function snapToStep(value: number): number {
	return (
		Math.round(value * FONT_SCALE_STEPS_PER_UNIT) / FONT_SCALE_STEPS_PER_UNIT
	);
}

function hasMetadata(slide: Slide): boolean {
	return (
		slide.notes !== undefined ||
		slide.durationMinutes !== undefined ||
		slide.speaker !== undefined
	);
}

export function inferLayout(slides: ReadonlyArray<Slide>): Layout {
	if (slides.some(hasMetadata)) {
		return "full";
	}
	if (slides.some((s) => s.title !== undefined)) {
		return "title-text";
	}
	return "text-only";
}

export function createDefaultDeckSettings(
	slides: ReadonlyArray<Slide>,
): DeckSettings {
	return {
		layout: inferLayout(slides),
		fontScale: FONT_SCALE_DEFAULT,
	};
}

export function updateFontScale(
	settings: DeckSettings,
	fontScale: number,
): DeckSettings {
	const clamped = Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, fontScale));
	return { ...settings, fontScale: snapToStep(clamped) };
}
