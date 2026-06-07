/**
 * Tests for IndexedDbDeckRepository.
 *
 * Each test gets its own unique DB name to guarantee full isolation:
 * fake-indexeddb databases survive across tests unless given different names.
 * We use "fake-indexeddb/auto" to patch the global IDBFactory used by the
 * `idb` library before any openDB call runs.
 *
 * Storage failure tests use the injectable dbFactory parameter — this avoids
 * ESM module patching (which is not configurable in strict ESM environments)
 * while keeping the repository fully testable.
 */
import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { DeckNotFoundError } from "../../application/ports/deck-repository";
import type { Deck } from "../../domain";
import {
	createDeck,
	createSlide,
	InvalidDeckNameError,
	renameDeck,
	updateDeckSettings,
} from "../../domain";
import type { DbFactory } from "./indexed-db-deck-repository";
import { IndexedDbDeckRepository } from "./indexed-db-deck-repository";
import { StorageError } from "./storage-error";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let dbCounter = 0;

/** Returns a fresh unique DB name so each test is fully isolated. */
function uniqueDbName(): string {
	dbCounter += 1;
	return `test-presenter-cards-${dbCounter}`;
}

const slide1 = createSlide({ textEn: "Hello" });
const slide2 = createSlide({ title: "Opening", textEn: "Welcome everyone" });
const slide3 = createSlide({
	textEn: "Time check",
	notes: "Smile",
	durationMinutes: 2,
	speaker: "Alice",
});

function makeDeck(overrides: Partial<{ id: string; name: string }> = {}): Deck {
	return createDeck({
		id: overrides.id ?? "deck-1",
		name: overrides.name ?? "Test Deck",
		slides: [slide1, slide2],
		importedAt: 1000,
	});
}

/** A dbFactory that always rejects — used to simulate storage failure. */
function failingDbFactory(cause: unknown): DbFactory {
	return () => Promise.reject(cause);
}

// ---------------------------------------------------------------------------
// Save → Find round trip
// ---------------------------------------------------------------------------

describe("save → findById round trip", () => {
	it("returns a deck equal in value to the saved one including slides and settings", async () => {
		const repo = new IndexedDbDeckRepository(uniqueDbName());
		const deck = makeDeck();
		await repo.save(deck);

		const found = await repo.findById(deck.id);

		expect(found.id).toBe(deck.id);
		expect(found.name).toBe(deck.name);
		expect(found.importedAt).toBe(deck.importedAt);
		expect(found.settings).toEqual(deck.settings);
		expect(found.slides).toHaveLength(deck.slides.length);
		expect(found.slides[0]?.textEn).toBe(slide1.textEn);
		expect(found.slides[1]?.title).toBe(slide2.title);
		expect(found.slides[1]?.textEn).toBe(slide2.textEn);
	});

	it("preserves slide order exactly", async () => {
		const repo = new IndexedDbDeckRepository(uniqueDbName());
		const deck = createDeck({
			id: "order-test",
			name: "Order Test",
			slides: [slide1, slide2, slide3],
			importedAt: 1000,
		});
		await repo.save(deck);

		const found = await repo.findById(deck.id);

		expect(found.slides[0]?.textEn).toBe(slide1.textEn);
		expect(found.slides[1]?.textEn).toBe(slide2.textEn);
		expect(found.slides[2]?.textEn).toBe(slide3.textEn);
	});

	it("preserves user-modified settings (layout + fontScale) without re-inference", async () => {
		const repo = new IndexedDbDeckRepository(uniqueDbName());

		// Slides have no metadata → inference would yield "text-only",
		// but we override to "full" with a custom fontScale.
		const deck = createDeck({
			id: "settings-test",
			name: "Settings Test",
			slides: [slide1],
			importedAt: 1000,
		});
		const customSettings = { layout: "full" as const, fontScale: 1.5 };
		const modified = updateDeckSettings(deck, customSettings);
		await repo.save(modified);

		const found = await repo.findById(modified.id);

		expect(found.settings.layout).toBe("full");
		expect(found.settings.fontScale).toBe(1.5);
	});

	it("round-trips isBilingual flag derived from textIt presence", async () => {
		const bilingualSlide = createSlide({ textEn: "Hello", textIt: "Ciao" });
		const repo = new IndexedDbDeckRepository(uniqueDbName());
		const deck = createDeck({
			id: "bilingual",
			name: "Bilingual",
			slides: [bilingualSlide, slide1],
			importedAt: 1000,
		});
		await repo.save(deck);

		const found = await repo.findById(deck.id);

		expect(found.slides[0]?.isBilingual).toBe(true);
		expect(found.slides[1]?.isBilingual).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Overwrite by id
// ---------------------------------------------------------------------------

describe("save → overwrite by id", () => {
	it("a second save with the same id produces one record with the latest content", async () => {
		const repo = new IndexedDbDeckRepository(uniqueDbName());
		const original = makeDeck();
		await repo.save(original);

		const renamed = renameDeck(original, "Updated Name");
		await repo.save(renamed);

		const found = await repo.findById(original.id);
		expect(found.name).toBe("Updated Name");

		const all = await repo.listAll();
		expect(all).toHaveLength(1);
	});
});

// ---------------------------------------------------------------------------
// Persistence across repository instances
// ---------------------------------------------------------------------------

describe("persistence across repository instances", () => {
	it("a new repository instance over the same DB name finds previously saved decks", async () => {
		const dbName = uniqueDbName();
		const repo1 = new IndexedDbDeckRepository(dbName);
		const deck = makeDeck();
		await repo1.save(deck);

		// Simulate page reload: new instance, same DB name.
		const repo2 = new IndexedDbDeckRepository(dbName);
		const found = await repo2.findById(deck.id);

		expect(found.id).toBe(deck.id);
		expect(found.name).toBe(deck.name);
	});
});

// ---------------------------------------------------------------------------
// listAll
// ---------------------------------------------------------------------------

describe("listAll", () => {
	it("returns an empty array when no decks have been saved", async () => {
		const repo = new IndexedDbDeckRepository(uniqueDbName());
		const all = await repo.listAll();
		expect(all).toEqual([]);
	});

	it("returns all saved decks", async () => {
		const repo = new IndexedDbDeckRepository(uniqueDbName());
		const deck1 = makeDeck({ id: "d1", name: "Alpha" });
		const deck2 = makeDeck({ id: "d2", name: "Beta" });
		const deck3 = makeDeck({ id: "d3", name: "Gamma" });
		await repo.save(deck1);
		await repo.save(deck2);
		await repo.save(deck3);

		const all = await repo.listAll();

		expect(all).toHaveLength(3);
		const ids = all.map((d) => d.id);
		expect(ids).toContain("d1");
		expect(ids).toContain("d2");
		expect(ids).toContain("d3");
	});
});

// ---------------------------------------------------------------------------
// deleteById
// ---------------------------------------------------------------------------

describe("deleteById", () => {
	it("removes exactly the targeted deck; others remain", async () => {
		const repo = new IndexedDbDeckRepository(uniqueDbName());
		const deck1 = makeDeck({ id: "keep-1" });
		const deck2 = makeDeck({ id: "delete-me" });
		const deck3 = makeDeck({ id: "keep-2" });
		await repo.save(deck1);
		await repo.save(deck2);
		await repo.save(deck3);

		await repo.deleteById("delete-me");

		const all = await repo.listAll();
		expect(all).toHaveLength(2);
		const ids = all.map((d) => d.id);
		expect(ids).toContain("keep-1");
		expect(ids).toContain("keep-2");
		expect(ids).not.toContain("delete-me");
	});
});

// ---------------------------------------------------------------------------
// DeckNotFoundError for missing ids
// ---------------------------------------------------------------------------

describe("missing id error handling", () => {
	it("findById throws DeckNotFoundError for a missing id", async () => {
		const repo = new IndexedDbDeckRepository(uniqueDbName());
		await expect(repo.findById("no-such-id")).rejects.toThrow(
			DeckNotFoundError,
		);
	});

	it("findById DeckNotFoundError contains the requested id", async () => {
		const repo = new IndexedDbDeckRepository(uniqueDbName());
		let caughtError: unknown;
		await repo.findById("missing").catch((e: unknown) => {
			caughtError = e;
		});
		expect(caughtError).toBeInstanceOf(DeckNotFoundError);
		expect((caughtError as DeckNotFoundError).id).toBe("missing");
	});

	it("deleteById throws DeckNotFoundError for a missing id", async () => {
		const repo = new IndexedDbDeckRepository(uniqueDbName());
		await expect(repo.deleteById("no-such-id")).rejects.toThrow(
			DeckNotFoundError,
		);
	});

	it("deleteById DeckNotFoundError contains the requested id", async () => {
		const repo = new IndexedDbDeckRepository(uniqueDbName());
		let caughtError: unknown;
		await repo.deleteById("missing").catch((e: unknown) => {
			caughtError = e;
		});
		expect(caughtError).toBeInstanceOf(DeckNotFoundError);
		expect((caughtError as DeckNotFoundError).id).toBe("missing");
	});
});

// ---------------------------------------------------------------------------
// Domain invariants enforced on reconstituted decks
// ---------------------------------------------------------------------------

describe("domain invariants on reconstituted decks", () => {
	it("renameDeck to empty string on a loaded deck still throws InvalidDeckNameError", async () => {
		const repo = new IndexedDbDeckRepository(uniqueDbName());
		const deck = makeDeck();
		await repo.save(deck);

		const loaded = await repo.findById(deck.id);

		expect(() => renameDeck(loaded, "")).toThrow(InvalidDeckNameError);
	});

	it("renameDeck to whitespace-only on a loaded deck throws InvalidDeckNameError", async () => {
		const repo = new IndexedDbDeckRepository(uniqueDbName());
		const deck = makeDeck();
		await repo.save(deck);

		const loaded = await repo.findById(deck.id);

		expect(() => renameDeck(loaded, "   ")).toThrow(InvalidDeckNameError);
	});
});

// ---------------------------------------------------------------------------
// Storage failures → StorageError
// (Uses injectable dbFactory to avoid ESM module patching limitations.)
// ---------------------------------------------------------------------------

describe("storage failures surface as StorageError", () => {
	it("any operation throws StorageError when the database cannot be opened", async () => {
		const cause = new DOMException("SecurityError: access denied");
		const repo = new IndexedDbDeckRepository(
			uniqueDbName(),
			failingDbFactory(cause),
		);

		await expect(repo.listAll()).rejects.toThrow(StorageError);
	});

	it("save throws StorageError when the database cannot be opened", async () => {
		const cause = new DOMException("QuotaExceededError");
		const repo = new IndexedDbDeckRepository(
			uniqueDbName(),
			failingDbFactory(cause),
		);

		await expect(repo.save(makeDeck())).rejects.toThrow(StorageError);
	});

	it("findById throws StorageError when the database cannot be opened", async () => {
		const cause = new DOMException("SecurityError");
		const repo = new IndexedDbDeckRepository(
			uniqueDbName(),
			failingDbFactory(cause),
		);

		await expect(repo.findById("any-id")).rejects.toThrow(StorageError);
	});

	it("deleteById throws StorageError when the database cannot be opened", async () => {
		const cause = new DOMException("SecurityError");
		const repo = new IndexedDbDeckRepository(
			uniqueDbName(),
			failingDbFactory(cause),
		);

		await expect(repo.deleteById("any-id")).rejects.toThrow(StorageError);
	});

	it("StorageError wraps the underlying cause", async () => {
		const cause = new DOMException("SecurityError: access denied");
		const repo = new IndexedDbDeckRepository(
			uniqueDbName(),
			failingDbFactory(cause),
		);

		let caughtError: unknown;
		await repo.listAll().catch((e: unknown) => {
			caughtError = e;
		});

		expect(caughtError).toBeInstanceOf(StorageError);
		expect((caughtError as StorageError).cause).toBe(cause);
	});

	it("StorageError has a descriptive message", async () => {
		const cause = new DOMException("SecurityError");
		const repo = new IndexedDbDeckRepository(
			uniqueDbName(),
			failingDbFactory(cause),
		);

		let caughtError: unknown;
		await repo.listAll().catch((e: unknown) => {
			caughtError = e;
		});

		expect((caughtError as StorageError).message).toContain(
			"Failed to open IndexedDB database",
		);
	});
});
