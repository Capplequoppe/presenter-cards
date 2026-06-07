import { describe, expect, it } from "vitest";
import { createDeck, createSlide, InvalidDeckNameError } from "../../domain";
import { DeckNotFoundError } from "../ports/deck-repository";
import { FakeDeckRepository } from "../testing";
import { RenameDeck } from "./rename-deck";

const slide = createSlide({ textEn: "Hello" });

describe("RenameDeck", () => {
	it("persists the renamed deck", async () => {
		const repo = new FakeDeckRepository();
		const deck = createDeck({
			id: "d1",
			name: "Old",
			slides: [slide],
			importedAt: 1000,
		});
		await repo.save(deck);

		const useCase = new RenameDeck(repo);
		await useCase.execute("d1", "New Name");

		const found = await repo.findById("d1");
		expect(found.name).toBe("New Name");
	});

	it("preserves all other fields when renaming", async () => {
		const repo = new FakeDeckRepository();
		const deck = createDeck({
			id: "d1",
			name: "Old",
			slides: [slide],
			importedAt: 1000,
		});
		await repo.save(deck);

		const useCase = new RenameDeck(repo);
		await useCase.execute("d1", "New Name");

		const found = await repo.findById("d1");
		expect(found.slides).toEqual(deck.slides);
		expect(found.importedAt).toBe(deck.importedAt);
		expect(found.settings).toEqual(deck.settings);
	});

	it("throws DeckNotFoundError for unknown id", async () => {
		const repo = new FakeDeckRepository();
		const useCase = new RenameDeck(repo);
		await expect(useCase.execute("nonexistent", "Name")).rejects.toThrow(
			DeckNotFoundError,
		);
	});

	it("throws InvalidDeckNameError for empty name without touching the repository", async () => {
		const repo = new FakeDeckRepository();
		const deck = createDeck({
			id: "d1",
			name: "Original",
			slides: [slide],
			importedAt: 1000,
		});
		await repo.save(deck);

		const useCase = new RenameDeck(repo);
		await expect(useCase.execute("d1", "")).rejects.toThrow(
			InvalidDeckNameError,
		);

		const found = await repo.findById("d1");
		expect(found.name).toBe("Original");
	});

	it("throws InvalidDeckNameError for whitespace-only name", async () => {
		const repo = new FakeDeckRepository();
		const deck = createDeck({
			id: "d1",
			name: "Original",
			slides: [slide],
			importedAt: 1000,
		});
		await repo.save(deck);

		const useCase = new RenameDeck(repo);
		await expect(useCase.execute("d1", "   ")).rejects.toThrow(
			InvalidDeckNameError,
		);
	});
});
