import { InvalidSlideError } from "./errors";
import type { Language } from "./language";

export interface SlideProps {
	readonly title?: string;
	readonly textEn: string;
	readonly textIt?: string;
	readonly notes?: string;
	readonly durationMinutes?: number;
	readonly speaker?: string;
}

export interface Slide {
	readonly title?: string;
	readonly textEn: string;
	readonly textIt?: string;
	readonly notes?: string;
	readonly durationMinutes?: number;
	readonly speaker?: string;
	readonly isBilingual: boolean;
}

function normalizeOptionalText(value: string | undefined): string | undefined {
	return value !== undefined && value.trim() !== "" ? value : undefined;
}

export function createSlide(props: SlideProps, row?: number): Slide {
	if (props.textEn.trim() === "") {
		throw new InvalidSlideError(
			`Slide text (textEn) must not be empty${row !== undefined ? ` (row ${row})` : ""}`,
			row,
		);
	}

	const textIt = normalizeOptionalText(props.textIt);

	return {
		title: normalizeOptionalText(props.title),
		textEn: props.textEn,
		textIt,
		notes: normalizeOptionalText(props.notes),
		durationMinutes: props.durationMinutes,
		speaker: normalizeOptionalText(props.speaker),
		isBilingual: textIt !== undefined,
	};
}

export function getSlideText(slide: Slide, language: Language): string | null {
	if (language === "en") {
		return slide.textEn;
	}

	return slide.textIt ?? null;
}
