import type { Slide } from "./slide";

export type Layout = "text-only" | "title-text" | "full";

export interface DeckSettings {
	readonly layout: Layout;
	readonly fontScale: number;
}

const FONT_SCALE_MIN = 0.5;
const FONT_SCALE_MAX = 2.0;
const FONT_SCALE_DEFAULT = 1.0;

function hasMetadata(slide: Slide): boolean {
	return (
		slide.notes !== undefined ||
		slide.durationMinutes !== undefined ||
		slide.speaker !== undefined
	);
}

export function inferLayout(slides: Slide[]): Layout {
	if (slides.some(hasMetadata)) {
		return "full";
	}
	if (slides.some((s) => s.title !== undefined)) {
		return "title-text";
	}
	return "text-only";
}

export function createDefaultDeckSettings(slides: Slide[]): DeckSettings {
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
	return { ...settings, fontScale: clamped };
}
