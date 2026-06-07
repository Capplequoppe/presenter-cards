import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createDeck, createSlide } from "../../../domain";
import { usePresenter } from "./use-presenter";

const enOnlySlide = createSlide({ textEn: "Hello" });
const bilingualSlide = createSlide({ textEn: "Hello", textIt: "Ciao" });
const secondSlide = createSlide({ textEn: "Second slide" });

const deckWithOneSlide = createDeck({
	id: "d1",
	name: "One Slide Deck",
	slides: [enOnlySlide],
	importedAt: 1000,
});

const deckWithThreeSlides = createDeck({
	id: "d3",
	name: "Three Slide Deck",
	slides: [bilingualSlide, secondSlide, enOnlySlide],
	importedAt: 1000,
});

describe("usePresenter", () => {
	describe("initial state", () => {
		it("starts at index 0 with language 'en'", () => {
			const { result } = renderHook(() => usePresenter(deckWithOneSlide));
			expect(result.current.currentIndex).toBe(0);
			expect(result.current.language).toBe("en");
		});

		it("exposes the total slide count", () => {
			const { result } = renderHook(() => usePresenter(deckWithThreeSlides));
			expect(result.current.totalSlides).toBe(3);
		});

		it("exposes the current slide", () => {
			const { result } = renderHook(() => usePresenter(deckWithThreeSlides));
			expect(result.current.currentSlide).toBe(bilingualSlide);
		});
	});

	describe("goNext", () => {
		it("increments the current index", () => {
			const { result } = renderHook(() => usePresenter(deckWithThreeSlides));
			act(() => result.current.goNext());
			expect(result.current.currentIndex).toBe(1);
		});

		it("does not advance past the last slide (no wrap-around)", () => {
			const { result } = renderHook(() => usePresenter(deckWithThreeSlides));
			act(() => result.current.goNext());
			act(() => result.current.goNext());
			act(() => result.current.goNext()); // already at last — should not advance
			expect(result.current.currentIndex).toBe(2);
		});

		it("resets language to 'en' when moving to the next slide", () => {
			const { result } = renderHook(() => usePresenter(deckWithThreeSlides));
			// Toggle to 'it' on slide 0 (bilingual)
			act(() => result.current.toggleLanguage());
			expect(result.current.language).toBe("it");
			// Move forward
			act(() => result.current.goNext());
			expect(result.current.language).toBe("en");
		});
	});

	describe("goPrevious", () => {
		it("decrements the current index", () => {
			const { result } = renderHook(() => usePresenter(deckWithThreeSlides));
			act(() => result.current.goNext());
			act(() => result.current.goPrevious());
			expect(result.current.currentIndex).toBe(0);
		});

		it("does not go before the first slide (no wrap-around)", () => {
			const { result } = renderHook(() => usePresenter(deckWithThreeSlides));
			act(() => result.current.goPrevious()); // already at first — should stay
			expect(result.current.currentIndex).toBe(0);
		});

		it("resets language to 'en' when moving to the previous slide", () => {
			const { result } = renderHook(() => usePresenter(deckWithThreeSlides));
			act(() => result.current.goNext());
			act(() => result.current.toggleLanguage());
			act(() => result.current.goPrevious());
			expect(result.current.language).toBe("en");
		});
	});

	describe("toggleLanguage", () => {
		it("toggles from 'en' to 'it'", () => {
			const { result } = renderHook(() => usePresenter(deckWithThreeSlides));
			act(() => result.current.toggleLanguage());
			expect(result.current.language).toBe("it");
		});

		it("toggles from 'it' back to 'en'", () => {
			const { result } = renderHook(() => usePresenter(deckWithThreeSlides));
			act(() => result.current.toggleLanguage());
			act(() => result.current.toggleLanguage());
			expect(result.current.language).toBe("en");
		});
	});
});
