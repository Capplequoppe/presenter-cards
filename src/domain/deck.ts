import type { DeckSettings } from "./deck-settings";
import { createDefaultDeckSettings, updateFontScale } from "./deck-settings";
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

/**
 * Props for reconstituting a persisted Deck.
 *
 * Unlike CreateDeckProps, this includes the full DeckSettings so that
 * user-modified settings (layout overrides, fontScale) survive round-trips
 * without being overwritten by inference.
 */
export interface ReconstituteDeckProps {
	readonly id: string;
	readonly name: string;
	readonly settings: DeckSettings;
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

/**
 * Rebuilds a Deck from persisted primitives without re-running layout inference.
 *
 * Use this factory when reading from storage. It re-validates all invariants
 * (name non-empty, at least one slide) and re-applies fontScale clamping/snapping
 * via the existing settings functions, but preserves the stored layout choice
 * rather than re-inferring it from the slides.
 *
 * Architectural Decision (pre-approved by phase-2 review, finding #4):
 * createDeck always re-infers layout, which would silently overwrite a user's
 * layout preference on load. reconstituteDeck keeps stored settings intact
 * while still enforcing domain invariants.
 */
export function reconstituteDeck(props: ReconstituteDeckProps): Deck {
	assertNonEmptyName(props.name);
	assertNonEmptySlides(props.slides);

	// Re-apply fontScale clamping/snapping to guard against data corruption.
	const sanitizedSettings = updateFontScale(
		props.settings,
		props.settings.fontScale,
	);

	return {
		id: props.id,
		name: props.name,
		slides: props.slides,
		importedAt: props.importedAt,
		settings: sanitizedSettings,
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
