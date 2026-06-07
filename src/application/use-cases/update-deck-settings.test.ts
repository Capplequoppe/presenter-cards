import { describe, expect, it } from "vitest";
import { createDeck, createSlide } from "../../domain";
import { DeckNotFoundError } from "../ports/deck-repository";
import { FakeDeckRepository } from "../testing";
import { UpdateDeckSettings } from "./update-deck-settings";

const slide = createSlide({ textEn: "Hello" });

describe("UpdateDeckSettings", () => {
	it("persists updated layout and fontScale", async () => {
		const repo = new FakeDeckRepository();
		const deck = createDeck({
			id: "d1",
			name: "My Deck",
			slides: [slide],
			importedAt: 1000,
		});
		await repo.save(deck);

		const useCase = new UpdateDeckSettings(repo);
		const newSettings = { layout: "full" as const, fontScale: 1.5 };
		const result = await useCase.execute("d1", newSettings);

		expect(result.settings.layout).toBe("full");
		expect(result.settings.fontScale).toBe(1.5);
	});

	it("persists the updated settings in the repository", async () => {
		const repo = new FakeDeckRepository();
		const deck = createDeck({
			id: "d1",
			name: "My Deck",
			slides: [slide],
			importedAt: 1000,
		});
		await repo.save(deck);

		const useCase = new UpdateDeckSettings(repo);
		await useCase.execute("d1", { layout: "title-text", fontScale: 0.8 });

		const saved = await repo.findById("d1");
		expect(saved.settings.layout).toBe("title-text");
		expect(saved.settings.fontScale).toBe(0.8);
	});

	it("preserves id, name, slides, and importedAt when updating settings", async () => {
		const repo = new FakeDeckRepository();
		const deck = createDeck({
			id: "d1",
			name: "My Deck",
			slides: [slide],
			importedAt: 1000,
		});
		await repo.save(deck);

		const useCase = new UpdateDeckSettings(repo);
		const result = await useCase.execute("d1", {
			layout: "full",
			fontScale: 2.0,
		});

		expect(result.id).toBe("d1");
		expect(result.name).toBe("My Deck");
		expect(result.slides).toEqual(deck.slides);
		expect(result.importedAt).toBe(1000);
	});

	it("throws DeckNotFoundError for unknown id", async () => {
		const repo = new FakeDeckRepository();
		const useCase = new UpdateDeckSettings(repo);
		await expect(
			useCase.execute("nonexistent", { layout: "text-only", fontScale: 1.0 }),
		).rejects.toThrow(DeckNotFoundError);
	});
});
