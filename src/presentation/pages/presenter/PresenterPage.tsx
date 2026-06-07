import { useCallback, useEffect, useRef, useState } from "react";
import { DeckNotFoundError } from "../../../application/ports/deck-repository";
import type { Deck } from "../../../domain";
import { getSlideText } from "../../../domain";
import { useUseCases } from "../../composition-root";
import { navigateToMenu } from "../../routing";
import { useGestures } from "./use-gestures";
import { usePresenter } from "./use-presenter";

interface PresenterPageProps {
	readonly deckId: string;
}

/**
 * Presenter screen: fullscreen black background, slide text centered large,
 * layout variants per deck settings, position indicator, language indicator,
 * and exit control.
 *
 * Loads the deck by id from the URL; unknown id redirects to menu.
 * Navigation state lives in usePresenter so 6.2 can wire gestures.
 */
export function PresenterPage({ deckId }: PresenterPageProps) {
	const { getDeck } = useUseCases();
	const [deck, setDeck] = useState<Deck | null>(null);

	useEffect(() => {
		getDeck
			.execute(deckId)
			.then(setDeck)
			.catch((err: unknown) => {
				if (err instanceof DeckNotFoundError) {
					navigateToMenu();
				}
			});
	}, [getDeck, deckId]);

	if (deck === null) {
		return <div className="fixed inset-0 bg-black" />;
	}

	return <LoadedPresenter deck={deck} />;
}

interface LoadedPresenterProps {
	readonly deck: Deck;
}

function LoadedPresenter({ deck }: LoadedPresenterProps) {
	const state = usePresenter(deck);
	const { currentIndex, totalSlides, currentSlide, language } = state;
	const slideText = getSlideText(currentSlide, language) ?? currentSlide.textEn;
	const layout = deck.settings.layout;
	const fontScaleStyle = { fontSize: `${deck.settings.fontScale * 3}rem` };

	const containerRef = useRef<HTMLDivElement>(null);
	const gestures = useGestures({
		goNext: state.goNext,
		goPrevious: state.goPrevious,
		toggleLanguage: state.toggleLanguage,
	});

	const handlePointerDown = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (containerRef.current !== null) {
				gestures.onPointerDown(e.nativeEvent, containerRef.current);
			}
		},
		[gestures],
	);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			gestures.onPointerMove(e.nativeEvent);
		},
		[gestures],
	);

	const handlePointerUp = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			gestures.onPointerUp(e.nativeEvent);
		},
		[gestures],
	);

	return (
		<div
			ref={containerRef}
			className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden touch-none"
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
		>
			{/* Top chrome */}
			<div className="relative flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
				{/* Exit button — top-left */}
				<button
					type="button"
					aria-label="Exit presenter"
					onClick={navigateToMenu}
					className="text-gray-400 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center"
				>
					✕
				</button>

				{/* Language indicator — top-center */}
				{currentSlide.isBilingual ? (
					<span
						data-testid="language-indicator"
						className="absolute left-1/2 -translate-x-1/2 text-sm text-gray-400 uppercase tracking-widest"
					>
						{language}
					</span>
				) : null}

				{/* Position indicator — top-right */}
				<span className="text-sm text-gray-400 tabular-nums">
					{currentIndex + 1} / {totalSlides}
				</span>
			</div>

			{/* Slide content — centered */}
			<main className="flex-1 flex flex-col items-center justify-center px-8 text-center min-h-0">
				{/* Title — shown in title-text and full layouts */}
				{(layout === "title-text" || layout === "full") &&
				currentSlide.title !== undefined ? (
					<h2
						data-testid="slide-title"
						className="text-gray-300 mb-4"
						style={{ fontSize: `${deck.settings.fontScale * 1.5}rem` }}
					>
						{currentSlide.title}
					</h2>
				) : null}

				{/* Main slide text */}
				<p className="font-semibold leading-tight" style={fontScaleStyle}>
					{slideText}
				</p>

				{/* Secondary fields — shown only in full layout */}
				{layout === "full" ? <SlideMetadata slide={currentSlide} /> : null}
			</main>

			{/* Hidden navigation buttons for tests and keyboard fallback */}
			<div className="sr-only">
				<button
					type="button"
					onClick={state.goPrevious}
					aria-label="Previous slide"
				>
					Previous
				</button>
				<button type="button" onClick={state.goNext} aria-label="Next slide">
					Next
				</button>
			</div>
		</div>
	);
}

interface SlideMetadataProps {
	readonly slide: Deck["slides"][number];
}

function SlideMetadata({ slide }: SlideMetadataProps) {
	const hasMeta =
		slide.notes !== undefined ||
		slide.durationMinutes !== undefined ||
		slide.speaker !== undefined;

	if (!hasMeta) return null;

	return (
		<div className="mt-6 flex flex-col items-center gap-1 text-gray-500 text-sm">
			{slide.notes !== undefined ? (
				<span data-testid="slide-notes">{slide.notes}</span>
			) : null}
			{slide.durationMinutes !== undefined ? (
				<span data-testid="slide-duration">{slide.durationMinutes} min</span>
			) : null}
			{slide.speaker !== undefined ? (
				<span data-testid="slide-speaker">{slide.speaker}</span>
			) : null}
		</div>
	);
}
