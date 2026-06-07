import { describe, expect, it } from "vitest";
import { createDeck, createSlide } from "../../domain";
import { DeckNotFoundError } from "../ports/deck-repository";
import { FakeDeckRepository } from "../testing";
import { GetDeck } from "./get-deck";

const slide = createSlide({ textEn: "Hello" });

describe("GetDeck", () => {
	it("returns the deck when the id exists", async () => {
		const repo = new FakeDeckRepository();
		const deck = createDeck({
			id: "abc",
			name: "My Deck",
			slides: [slide],
			importedAt: 1000,
		});
		await repo.save(deck);

		const useCase = new GetDeck(repo);
		const result = await useCase.execute("abc");

		expect(result.id).toBe("abc");
		expect(result.name).toBe("My Deck");
	});

	it("throws DeckNotFoundError when the id does not exist", async () => {
		const repo = new FakeDeckRepository();
		const useCase = new GetDeck(repo);

		await expect(useCase.execute("unknown")).rejects.toThrow(DeckNotFoundError);
	});
});
