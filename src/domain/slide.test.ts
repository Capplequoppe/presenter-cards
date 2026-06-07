import { describe, expect, it } from "vitest";
import { InvalidSlideError } from "./errors";
import { createSlide, getSlideText } from "./slide";

describe("createSlide", () => {
	it("creates a slide with only textEn (not bilingual)", () => {
		const slide = createSlide({ textEn: "Hello everyone" });
		expect(slide.textEn).toBe("Hello everyone");
		expect(slide.textIt).toBeUndefined();
		expect(slide.isBilingual).toBe(false);
	});

	it("creates a bilingual slide with textEn and textIt", () => {
		const slide = createSlide({ textEn: "Hello", textIt: "Ciao" });
		expect(slide.textEn).toBe("Hello");
		expect(slide.textIt).toBe("Ciao");
		expect(slide.isBilingual).toBe(true);
	});

	it("creates a slide with all optional fields", () => {
		const slide = createSlide({
			title: "Welcome",
			textEn: "Hello",
			textIt: "Ciao",
			notes: "Smile",
			durationMinutes: 2,
			speaker: "Alice",
		});
		expect(slide.title).toBe("Welcome");
		expect(slide.notes).toBe("Smile");
		expect(slide.durationMinutes).toBe(2);
		expect(slide.speaker).toBe("Alice");
	});

	it("throws InvalidSlideError for empty textEn", () => {
		expect(() => createSlide({ textEn: "" })).toThrow(InvalidSlideError);
	});

	it("throws InvalidSlideError for whitespace-only textEn", () => {
		expect(() => createSlide({ textEn: "   " })).toThrow(InvalidSlideError);
	});

	it("InvalidSlideError carries row context", () => {
		let error: InvalidSlideError | undefined;
		try {
			createSlide({ textEn: "" }, 3);
		} catch (e) {
			error = e as InvalidSlideError;
		}
		expect(error).toBeInstanceOf(InvalidSlideError);
		expect(error?.row).toBe(3);
	});

	it("treats non-empty textIt as non-bilingual when it is whitespace-only", () => {
		const slide = createSlide({ textEn: "Hello", textIt: "   " });
		expect(slide.isBilingual).toBe(false);
	});
});

describe("getSlideText", () => {
	it("returns textEn for language en", () => {
		const slide = createSlide({ textEn: "Hello", textIt: "Ciao" });
		expect(getSlideText(slide, "en")).toBe("Hello");
	});

	it("returns textIt for language it on bilingual slide", () => {
		const slide = createSlide({ textEn: "Hello", textIt: "Ciao" });
		expect(getSlideText(slide, "it")).toBe("Ciao");
	});

	it("returns null for language it on non-bilingual slide", () => {
		const slide = createSlide({ textEn: "Hello" });
		expect(getSlideText(slide, "it")).toBeNull();
	});
});
