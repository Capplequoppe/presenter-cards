import { describe, expect, it } from "vitest";
import {
	createDefaultDeckSettings,
	inferLayout,
	updateFontScale,
} from "./deck-settings";
import { createSlide } from "./slide";

describe("inferLayout", () => {
	it("returns text-only when slides have only textEn", () => {
		const slides = [
			createSlide({ textEn: "Hello" }),
			createSlide({ textEn: "World" }),
		];
		expect(inferLayout(slides)).toBe("text-only");
	});

	it("returns title-text when any slide has a title (and no metadata)", () => {
		const slides = [
			createSlide({ textEn: "Hello" }),
			createSlide({ title: "Welcome", textEn: "World" }),
		];
		expect(inferLayout(slides)).toBe("title-text");
	});

	it("returns full when any slide has notes", () => {
		const slides = [
			createSlide({ textEn: "Hello", notes: "Smile" }),
			createSlide({ textEn: "World" }),
		];
		expect(inferLayout(slides)).toBe("full");
	});

	it("returns full when any slide has durationMinutes", () => {
		const slides = [createSlide({ textEn: "Hello", durationMinutes: 2 })];
		expect(inferLayout(slides)).toBe("full");
	});

	it("returns full when any slide has speaker", () => {
		const slides = [createSlide({ textEn: "Hello", speaker: "Alice" })];
		expect(inferLayout(slides)).toBe("full");
	});

	it("ignores blank metadata cells (empty CSV cells must not force full)", () => {
		const slides = [
			createSlide({ textEn: "Hello", notes: "", speaker: "   " }),
			createSlide({ textEn: "World", notes: "" }),
		];
		expect(inferLayout(slides)).toBe("text-only");
	});

	it("ignores blank titles (empty CSV cells must not force title-text)", () => {
		const slides = [createSlide({ title: "  ", textEn: "Hello" })];
		expect(inferLayout(slides)).toBe("text-only");
	});

	it("full takes priority over title-text", () => {
		const slides = [
			createSlide({ title: "Opening", textEn: "Hello" }),
			createSlide({ textEn: "World", speaker: "Bob" }),
		];
		expect(inferLayout(slides)).toBe("full");
	});
});

describe("createDefaultDeckSettings", () => {
	it("creates settings with inferred layout and default fontScale 1.0", () => {
		const slides = [createSlide({ textEn: "Hello" })];
		const settings = createDefaultDeckSettings(slides);
		expect(settings.layout).toBe("text-only");
		expect(settings.fontScale).toBe(1.0);
	});
});

describe("updateFontScale", () => {
	it("returns settings with updated fontScale within bounds", () => {
		const settings = createDefaultDeckSettings([createSlide({ textEn: "Hi" })]);
		const updated = updateFontScale(settings, 1.5);
		expect(updated.fontScale).toBe(1.5);
		expect(updated.layout).toBe(settings.layout);
	});

	it("clamps fontScale to minimum 0.5", () => {
		const settings = createDefaultDeckSettings([createSlide({ textEn: "Hi" })]);
		const updated = updateFontScale(settings, 0.2);
		expect(updated.fontScale).toBe(0.5);
	});

	it("clamps fontScale to maximum 2.0", () => {
		const settings = createDefaultDeckSettings([createSlide({ textEn: "Hi" })]);
		const updated = updateFontScale(settings, 2.5);
		expect(updated.fontScale).toBe(2.0);
	});

	it("accepts exactly 0.5 (lower bound)", () => {
		const settings = createDefaultDeckSettings([createSlide({ textEn: "Hi" })]);
		const updated = updateFontScale(settings, 0.5);
		expect(updated.fontScale).toBe(0.5);
	});

	it("accepts exactly 2.0 (upper bound)", () => {
		const settings = createDefaultDeckSettings([createSlide({ textEn: "Hi" })]);
		const updated = updateFontScale(settings, 2.0);
		expect(updated.fontScale).toBe(2.0);
	});

	it("steps by 0.1 — 1.0 + 0.1 = 1.1", () => {
		const settings = createDefaultDeckSettings([createSlide({ textEn: "Hi" })]);
		const updated = updateFontScale(settings, 1.1);
		expect(updated.fontScale).toBe(1.1);
	});

	it("snaps floating-point drift to the nearest 0.1 step", () => {
		const settings = createDefaultDeckSettings([createSlide({ textEn: "Hi" })]);
		const updated = updateFontScale(settings, 1.1 + 0.1);
		expect(updated.fontScale).toBe(1.2);
	});

	it("snaps off-step values to the nearest 0.1 step", () => {
		const settings = createDefaultDeckSettings([createSlide({ textEn: "Hi" })]);
		expect(updateFontScale(settings, 1.234).fontScale).toBe(1.2);
		expect(updateFontScale(settings, 1.16).fontScale).toBe(1.2);
	});

	it("repeated 0.1 increments stay exactly on step", () => {
		let settings = createDefaultDeckSettings([createSlide({ textEn: "Hi" })]);
		for (let i = 0; i < 5; i++) {
			settings = updateFontScale(settings, settings.fontScale + 0.1);
		}
		expect(settings.fontScale).toBe(1.5);
	});
});
