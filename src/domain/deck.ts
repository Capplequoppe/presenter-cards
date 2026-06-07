import type { DeckSettings } from "./deck-settings";
import { createDefaultDeckSettings } from "./deck-settings";
import { EmptyDeckError, InvalidDeckNameError } from "./errors";
import type { Slide } from "./slide";

export interface Deck {
	readonly id: string;
	readonly name: string;
	readonly settings: DeckSettings;
	readonly slides: ReadonlyArray<Slide>;
	readonly importedAt: number;
}

export interface CreateDeckProps {
	readonly id: string;
	readonly name: string;
	readonly slides: ReadonlyArray<Slide>;
	readonly importedAt: number;
}

function assertNonEmptyName(name: string): void {
	if (name.trim() === "") {
		throw new InvalidDeckNameError();
	}
}

function assertNonEmptySlides(slides: ReadonlyArray<Slide>): void {
	if (slides.length === 0) {
		throw new EmptyDeckError();
	}
}

export function createDeck(props: CreateDeckProps): Deck {
	assertNonEmptyName(props.name);
	assertNonEmptySlides(props.slides);

	return {
		id: props.id,
		name: props.name,
		slides: props.slides,
		importedAt: props.importedAt,
		settings: createDefaultDeckSettings(props.slides),
	};
}

export function renameDeck(deck: Deck, name: string): Deck {
	assertNonEmptyName(name);
	return { ...deck, name };
}

export function updateDeckSettings(deck: Deck, settings: DeckSettings): Deck {
	return { ...deck, settings };
}

export function reImportDeck(
	deck: Deck,
	slides: ReadonlyArray<Slide>,
	importedAt: number,
): Deck {
	assertNonEmptySlides(slides);
	return { ...deck, slides, importedAt };
}
