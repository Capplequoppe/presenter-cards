import { describe, expect, it } from "vitest";
import { createDeck, createSlide } from "../../domain";
import { DeckNotFoundError } from "../ports/deck-repository";
import { FakeDeckRepository } from "./fake-deck-repository";

const slide = createSlide({ textEn: "Hello" });

function makeDeck(id: string, importedAt = 1000) {
	return createDeck({ id, name: "Test Deck", slides: [slide], importedAt });
}

describe("FakeDeckRepository", () => {
	it("saves a deck and finds it by id", async () => {
		const repo = new FakeDeckRepository();
		const deck = makeDeck("deck-1");
		await repo.save(deck);
		const found = await repo.findById("deck-1");
		expect(found).toEqual(deck);
	});

	it("listAll returns all saved decks", async () => {
		const repo = new FakeDeckRepository();
		const deck1 = makeDeck("deck-1");
		const deck2 = makeDeck("deck-2");
		await repo.save(deck1);
		await repo.save(deck2);
		const all = await repo.listAll();
		expect(all).toHaveLength(2);
		expect(all).toEqual(expect.arrayContaining([deck1, deck2]));
	});

	it("listAll returns empty array when no decks saved", async () => {
		const repo = new FakeDeckRepository();
		const all = await repo.listAll();
		expect(all).toEqual([]);
	});

	it("deleteById removes the deck", async () => {
		const repo = new FakeDeckRepository();
		const deck = makeDeck("deck-1");
		await repo.save(deck);
		await repo.deleteById("deck-1");
		const all = await repo.listAll();
		expect(all).toHaveLength(0);
	});

	it("save overwrites an existing deck with the same id", async () => {
		const repo = new FakeDeckRepository();
		const original = makeDeck("deck-1");
		await repo.save(original);
		const updated = { ...original, name: "Updated Name" };
		await repo.save(updated);
		const found = await repo.findById("deck-1");
		expect(found.name).toBe("Updated Name");
	});

	it("findById throws DeckNotFoundError for missing id", async () => {
		const repo = new FakeDeckRepository();
		await expect(repo.findById("nonexistent")).rejects.toThrow(
			DeckNotFoundError,
		);
	});

	it("deleteById throws DeckNotFoundError for missing id", async () => {
		const repo = new FakeDeckRepository();
		await expect(repo.deleteById("nonexistent")).rejects.toThrow(
			DeckNotFoundError,
		);
	});
});
