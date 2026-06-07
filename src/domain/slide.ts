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

export function createSlide(props: SlideProps, row?: number): Slide {
	if (props.textEn.trim() === "") {
		throw new InvalidSlideError(
			`Slide text (textEn) must not be empty${row !== undefined ? ` (row ${row})` : ""}`,
			row,
		);
	}

	const isBilingual = props.textIt !== undefined && props.textIt.trim() !== "";

	return {
		title: props.title,
		textEn: props.textEn,
		textIt: props.textIt,
		notes: props.notes,
		durationMinutes: props.durationMinutes,
		speaker: props.speaker,
		isBilingual,
	};
}

export function getSlideText(slide: Slide, language: Language): string | null {
	if (language === "en") {
		return slide.textEn;
	}

	return slide.isBilingual && slide.textIt !== undefined ? slide.textIt : null;
}
