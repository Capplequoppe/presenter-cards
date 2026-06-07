import { describe, expect, it } from "vitest";
import { createDeck, createSlide } from "../../domain";
import { DeckNotFoundError } from "../ports/deck-repository";
import { FakeDeckRepository } from "../testing";
import { DeleteDeck } from "./delete-deck";

const slide = createSlide({ textEn: "Hello" });

describe("DeleteDeck", () => {
	it("removes the deck from the repository", async () => {
		const repo = new FakeDeckRepository();
		const deck = createDeck({
			id: "d1",
			name: "My Deck",
			slides: [slide],
			importedAt: 1000,
		});
		await repo.save(deck);

		const useCase = new DeleteDeck(repo);
		await useCase.execute("d1");

		const all = await repo.listAll();
		expect(all).toHaveLength(0);
	});

	it("throws DeckNotFoundError for unknown id", async () => {
		const repo = new FakeDeckRepository();
		const useCase = new DeleteDeck(repo);
		await expect(useCase.execute("nonexistent")).rejects.toThrow(
			DeckNotFoundError,
		);
	});
});
