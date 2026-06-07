import { describe, expect, it } from "vitest";
import { createDeck, createSlide } from "../../domain";
import { CsvParseError, CsvParseErrorKind } from "../ports/deck-csv-parser";
import { DeckNotFoundError } from "../ports/deck-repository";
import { FakeDeckCsvParser, FakeDeckRepository } from "../testing";
import { ReimportDeck } from "./reimport-deck";

const slideA = createSlide({ textEn: "Slide A" });
const slideB = createSlide({ textEn: "Slide B" });
const slideC = createSlide({ textEn: "Slide C" });

function makeUseCase(
	parser: FakeDeckCsvParser,
	repo: FakeDeckRepository,
	now = 2000,
) {
	return new ReimportDeck(parser, repo, () => now);
}

describe("ReimportDeck", () => {
	it("replaces slides and updates importedAt", async () => {
		const repo = new FakeDeckRepository();
		const deck = createDeck({
			id: "d1",
			name: "My Deck",
			slides: [slideA],
			importedAt: 1000,
		});
		await repo.save(deck);

		const parser = FakeDeckCsvParser.withSuccess([slideB, slideC]);
		const useCase = makeUseCase(parser, repo, 2000);

		const result = await useCase.execute("d1", "new csv");

		expect(result.slides).toHaveLength(2);
		expect(result.slides[0]).toEqual(slideB);
		expect(result.slides[1]).toEqual(slideC);
		expect(result.importedAt).toBe(2000);
	});

	it("preserves id, name, and settings after re-import", async () => {
		const repo = new FakeDeckRepository();
		const deck = createDeck({
			id: "d1",
			name: "My Deck",
			slides: [slideA],
			importedAt: 1000,
		});
		await repo.save(deck);

		const parser = FakeDeckCsvParser.withSuccess([slideB]);
		const useCase = makeUseCase(parser, repo, 2000);

		const result = await useCase.execute("d1", "new csv");

		expect(result.id).toBe("d1");
		expect(result.name).toBe("My Deck");
		expect(result.settings).toEqual(deck.settings);
	});

	it("persists the updated deck in the repository", async () => {
		const repo = new FakeDeckRepository();
		const deck = createDeck({
			id: "d1",
			name: "My Deck",
			slides: [slideA],
			importedAt: 1000,
		});
		await repo.save(deck);

		const parser = FakeDeckCsvParser.withSuccess([slideB]);
		const useCase = makeUseCase(parser, repo, 2000);

		await useCase.execute("d1", "new csv");

		const saved = await repo.findById("d1");
		expect(saved.slides[0]).toEqual(slideB);
		expect(saved.importedAt).toBe(2000);
	});

	it("leaves stored deck unchanged when parse fails", async () => {
		const repo = new FakeDeckRepository();
		const deck = createDeck({
			id: "d1",
			name: "My Deck",
			slides: [slideA],
			importedAt: 1000,
		});
		await repo.save(deck);

		const error = new CsvParseError("Empty file", CsvParseErrorKind.EmptyFile);
		const parser = FakeDeckCsvParser.withFailure(error);
		const useCase = makeUseCase(parser, repo, 2000);

		await expect(useCase.execute("d1", "bad csv")).rejects.toThrow(
			CsvParseError,
		);

		const stored = await repo.findById("d1");
		expect(stored.slides).toHaveLength(1);
		expect(stored.slides[0]).toEqual(slideA);
		expect(stored.importedAt).toBe(1000);
	});

	it("throws DeckNotFoundError for unknown id", async () => {
		const repo = new FakeDeckRepository();
		const parser = FakeDeckCsvParser.withSuccess([slideA]);
		const useCase = makeUseCase(parser, repo);
		await expect(useCase.execute("nonexistent", "csv")).rejects.toThrow(
			DeckNotFoundError,
		);
	});
});
