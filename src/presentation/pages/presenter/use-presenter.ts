import { useCallback, useState } from "react";
import type { Deck, Language, Slide } from "../../../domain";
import { toggleLanguage } from "../../../domain";

export interface PresenterState {
	readonly currentIndex: number;
	readonly totalSlides: number;
	readonly currentSlide: Slide;
	readonly language: Language;
	readonly goNext: () => void;
	readonly goPrevious: () => void;
	readonly toggleLanguage: () => void;
}

/**
 * Manages navigation and language state for the presenter screen.
 *
 * Navigation is bounded: goNext stops at the last slide, goPrevious stops at
 * the first. No wrap-around. Each slide change resets the language to 'en'
 * so gesture handlers (task 6.2) do not need to worry about residual state.
 */
export function usePresenter(deck: Deck): PresenterState {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [language, setLanguage] = useState<Language>("en");

	const goNext = useCallback(() => {
		setCurrentIndex((idx) => {
			const next = idx + 1;
			if (next >= deck.slides.length) return idx;
			setLanguage("en");
			return next;
		});
	}, [deck.slides.length]);

	const goPrevious = useCallback(() => {
		setCurrentIndex((idx) => {
			if (idx <= 0) return idx;
			setLanguage("en");
			return idx - 1;
		});
	}, []);

	const handleToggleLanguage = useCallback(() => {
		setLanguage((lang) => toggleLanguage(lang));
	}, []);

	return {
		currentIndex,
		totalSlides: deck.slides.length,
		currentSlide: deck.slides[currentIndex],
		language,
		goNext,
		goPrevious,
		toggleLanguage: handleToggleLanguage,
	};
}
