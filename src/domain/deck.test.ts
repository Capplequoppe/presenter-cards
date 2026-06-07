import { describe, expect, it } from "vitest";
import {
	createDeck,
	reconstituteDeck,
	reImportDeck,
	renameDeck,
	updateDeckSettings,
} from "./deck";
import { EmptyDeckError, InvalidDeckNameError } from "./errors";
import { createSlide } from "./slide";

const slide1 = createSlide({ textEn: "Hello" });
const slide2 = createSlide({ title: "Welcome", textEn: "World" });

describe("createDeck", () => {
	it("creates a deck with a name and slides", () => {
		const deck = createDeck({
			id: "deck-1",
			name: "Event 2026",
			slides: [slide1],
			importedAt: 1000,
		});
		expect(deck.id).toBe("deck-1");
		expect(deck.name).toBe("Event 2026");
		expect(deck.slides).toHaveLength(1);
		expect(deck.importedAt).toBe(1000);
	});

	it("infers layout from slides at creation", () => {
		const deck = createDeck({
			id: "deck-1",
			name: "Event",
			slides: [createSlide({ title: "Opening", textEn: "Hello" })],
			importedAt: 1000,
		});
		expect(deck.settings.layout).toBe("title-text");
	});

	it("sets default fontScale to 1.0", () => {
		const deck = createDeck({
			id: "deck-1",
			name: "Event",
			slides: [slide1],
			importedAt: 1000,
		});
		expect(deck.settings.fontScale).toBe(1.0);
	});

	it("throws EmptyDeckError when slides array is empty", () => {
		expect(() =>
			createDeck({ id: "deck-1", name: "Event", slides: [], importedAt: 1000 }),
		).toThrow(EmptyDeckError);
	});

	it("throws InvalidDeckNameError for empty name", () => {
		expect(() =>
			createDeck({
				id: "deck-1",
				name: "",
				slides: [slide1],
				importedAt: 1000,
			}),
		).toThrow(InvalidDeckNameError);
	});

	it("throws InvalidDeckNameError for whitespace-only name", () => {
		expect(() =>
			createDeck({
				id: "deck-1",
				name: "   ",
				slides: [slide1],
				importedAt: 1000,
			}),
		).toThrow(InvalidDeckNameError);
	});

	it("preserves slide order exactly as given", () => {
		const deck = createDeck({
			id: "deck-1",
			name: "Event",
			slides: [slide1, slide2],
			importedAt: 1000,
		});
		expect(deck.slides[0]).toBe(slide1);
		expect(deck.slides[1]).toBe(slide2);
	});

	it("infers full layout when any slide has metadata", () => {
		const deck = createDeck({
			id: "deck-1",
			name: "Event",
			slides: [createSlide({ textEn: "Hello", speaker: "Bob" })],
			importedAt: 1000,
		});
		expect(deck.settings.layout).toBe("full");
	});

	it("infers text-only when no slide has title or metadata", () => {
		const deck = createDeck({
			id: "deck-1",
			name: "Event",
			slides: [slide1],
			importedAt: 1000,
		});
		expect(deck.settings.layout).toBe("text-only");
	});
});

describe("renameDeck", () => {
	it("returns a deck with the new name and same slides/settings/id", () => {
		const original = createDeck({
			id: "deck-1",
			name: "Old Name",
			slides: [slide1],
			importedAt: 1000,
		});
		const renamed = renameDeck(original, "New Name");
		expect(renamed.name).toBe("New Name");
		expect(renamed.id).toBe(original.id);
		expect(renamed.slides).toBe(original.slides);
		expect(renamed.settings).toBe(original.settings);
		expect(renamed.importedAt).toBe(original.importedAt);
	});

	it("throws InvalidDeckNameError for empty new name", () => {
		const deck = createDeck({
			id: "deck-1",
			name: "Event",
			slides: [slide1],
			importedAt: 1000,
		});
		expect(() => renameDeck(deck, "")).toThrow(InvalidDeckNameError);
	});

	it("throws InvalidDeckNameError for whitespace-only new name", () => {
		const deck = createDeck({
			id: "deck-1",
			name: "Event",
			slides: [slide1],
			importedAt: 1000,
		});
		expect(() => renameDeck(deck, "  ")).toThrow(InvalidDeckNameError);
	});
});

describe("updateDeckSettings", () => {
	it("returns a deck with updated settings, preserving id/name/slides/importedAt", () => {
		const deck = createDeck({
			id: "deck-1",
			name: "Event",
			slides: [slide1],
			importedAt: 1000,
		});
		const newSettings = { layout: "full" as const, fontScale: 1.5 };
		const updated = updateDeckSettings(deck, newSettings);
		expect(updated.settings).toEqual(newSettings);
		expect(updated.id).toBe(deck.id);
		expect(updated.name).toBe(deck.name);
		expect(updated.slides).toBe(deck.slides);
		expect(updated.importedAt).toBe(deck.importedAt);
	});
});

describe("reImportDeck", () => {
	it("replaces slides and importedAt, preserves id, name, settings", () => {
		const deck = createDeck({
			id: "deck-1",
			name: "Event",
			slides: [slide1],
			importedAt: 1000,
		});
		const newSlides = [slide2, slide1];
		const reImported = reImportDeck(deck, newSlides, 2000);
		expect(reImported.id).toBe("deck-1");
		expect(reImported.name).toBe("Event");
		expect(reImported.settings).toBe(deck.settings);
		expect(reImported.slides).toEqual(newSlides);
		expect(reImported.importedAt).toBe(2000);
	});

	it("does NOT re-infer layout after re-import", () => {
		const deck = createDeck({
			id: "deck-1",
			name: "Event",
			slides: [createSlide({ textEn: "Hello", notes: "Smile" })],
			importedAt: 1000,
		});
		expect(deck.settings.layout).toBe("full");
		const manualSettings = { layout: "text-only" as const, fontScale: 1.0 };
		const deckWithCustomSettings = updateDeckSettings(deck, manualSettings);

		const reImported = reImportDeck(
			deckWithCustomSettings,
			[createSlide({ textEn: "New content", notes: "Nod" })],
			2000,
		);
		expect(reImported.settings.layout).toBe("text-only");
	});

	it("throws EmptyDeckError when re-importing with empty slides", () => {
		const deck = createDeck({
			id: "deck-1",
			name: "Event",
			slides: [slide1],
			importedAt: 1000,
		});
		expect(() => reImportDeck(deck, [], 2000)).toThrow(EmptyDeckError);
	});
});

describe("reconstituteDeck", () => {
	it("rebuilds a deck with all fields from persisted primitives", () => {
		const slides = [slide1, slide2];
		const settings = { layout: "title-text" as const, fontScale: 1.5 };
		const deck = reconstituteDeck({
			id: "deck-99",
			name: "Persisted Event",
			settings,
			slides,
			importedAt: 5000,
		});
		expect(deck.id).toBe("deck-99");
		expect(deck.name).toBe("Persisted Event");
		expect(deck.slides).toHaveLength(2);
		expect(deck.importedAt).toBe(5000);
		expect(deck.settings.layout).toBe("title-text");
		expect(deck.settings.fontScale).toBe(1.5);
	});

	it("preserves user-modified layout without re-inferring from slides", () => {
		// Slides have notes → inference would yield "full", but stored layout is "text-only"
		const slideWithMeta = createSlide({ textEn: "Hello", notes: "Smile" });
		const deck = reconstituteDeck({
			id: "deck-1",
			name: "Event",
			settings: { layout: "text-only", fontScale: 1.0 },
			slides: [slideWithMeta],
			importedAt: 1000,
		});
		expect(deck.settings.layout).toBe("text-only");
	});

	it("clamps and snaps fontScale to valid range on reconstitution", () => {
		const deck = reconstituteDeck({
			id: "deck-1",
			name: "Event",
			settings: { layout: "text-only", fontScale: 9.99 },
			slides: [slide1],
			importedAt: 1000,
		});
		expect(deck.settings.fontScale).toBe(2.0);
	});

	it("snaps fontScale to nearest 0.1 step", () => {
		const deck = reconstituteDeck({
			id: "deck-1",
			name: "Event",
			settings: { layout: "text-only", fontScale: 1.234 },
			slides: [slide1],
			importedAt: 1000,
		});
		expect(deck.settings.fontScale).toBe(1.2);
	});

	it("throws InvalidDeckNameError for empty name", () => {
		expect(() =>
			reconstituteDeck({
				id: "deck-1",
				name: "",
				settings: { layout: "text-only", fontScale: 1.0 },
				slides: [slide1],
				importedAt: 1000,
			}),
		).toThrow(InvalidDeckNameError);
	});

	it("throws InvalidDeckNameError for whitespace-only name", () => {
		expect(() =>
			reconstituteDeck({
				id: "deck-1",
				name: "   ",
				settings: { layout: "text-only", fontScale: 1.0 },
				slides: [slide1],
				importedAt: 1000,
			}),
		).toThrow(InvalidDeckNameError);
	});

	it("throws EmptyDeckError when slides array is empty", () => {
		expect(() =>
			reconstituteDeck({
				id: "deck-1",
				name: "Event",
				settings: { layout: "text-only", fontScale: 1.0 },
				slides: [],
				importedAt: 1000,
			}),
		).toThrow(EmptyDeckError);
	});

	it("allows domain operations on the reconstituted deck", () => {
		const deck = reconstituteDeck({
			id: "deck-1",
			name: "Event",
			settings: { layout: "text-only", fontScale: 1.0 },
			slides: [slide1],
			importedAt: 1000,
		});
		const renamed = renameDeck(deck, "New Event");
		expect(renamed.name).toBe("New Event");
	});

	it("rejects empty rename on a reconstituted deck (invariant enforced)", () => {
		const deck = reconstituteDeck({
			id: "deck-1",
			name: "Event",
			settings: { layout: "text-only", fontScale: 1.0 },
			slides: [slide1],
			importedAt: 1000,
		});
		expect(() => renameDeck(deck, "")).toThrow(InvalidDeckNameError);
	});
});
