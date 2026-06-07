export {
	EmptyDeckError,
	InvalidDeckNameError,
	InvalidSlideError,
} from "./errors";
export type { Language } from "./language";
export { toggleLanguage } from "./language";
export type { Slide, SlideProps } from "./slide";
export { createSlide, getSlideText } from "./slide";
