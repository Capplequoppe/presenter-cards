export type { CreateDeckProps, Deck, ReconstituteDeckProps } from "./deck";
export {
	createDeck,
	reconstituteDeck,
	reImportDeck,
	renameDeck,
	updateDeckSettings,
} from "./deck";
export type { DeckSettings, Layout } from "./deck-settings";
export {
	createDefaultDeckSettings,
	inferLayout,
	updateFontScale,
} from "./deck-settings";
export {
	EmptyDeckError,
	InvalidDeckNameError,
	InvalidSlideError,
} from "./errors";
export type { Language } from "./language";
export { toggleLanguage } from "./language";
export type { Slide, SlideProps } from "./slide";
export { createSlide, getSlideText } from "./slide";
