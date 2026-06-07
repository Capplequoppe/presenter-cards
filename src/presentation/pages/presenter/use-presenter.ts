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

interface NavigationState {
	readonly index: number;
	readonly language: Language;
}

const INITIAL_NAVIGATION: NavigationState = { index: 0, language: "en" };

/**
 * Manages navigation and language state for the presenter screen.
 *
 * Navigation is bounded: goNext stops at the last slide, goPrevious stops at
 * the first. No wrap-around. Each slide change resets the language to 'en'
 * so gesture handlers (task 6.2) do not need to worry about residual state.
 *
 * Index and language are a single state value so each transition is a pure
 * updater function (a slide change must atomically reset the language).
 */
export function usePresenter(deck: Deck): PresenterState {
	const [navigation, setNavigation] =
		useState<NavigationState>(INITIAL_NAVIGATION);

	const goNext = useCallback(() => {
		setNavigation((nav) =>
			nav.index + 1 >= deck.slides.length
				? nav
				: { index: nav.index + 1, language: "en" },
		);
	}, [deck.slides.length]);

	const goPrevious = useCallback(() => {
		setNavigation((nav) =>
			nav.index <= 0 ? nav : { index: nav.index - 1, language: "en" },
		);
	}, []);

	const handleToggleLanguage = useCallback(() => {
		setNavigation((nav) => ({
			...nav,
			language: toggleLanguage(nav.language),
		}));
	}, []);

	return {
		currentIndex: navigation.index,
		totalSlides: deck.slides.length,
		currentSlide: deck.slides[navigation.index],
		language: navigation.language,
		goNext,
		goPrevious,
		toggleLanguage: handleToggleLanguage,
	};
}
