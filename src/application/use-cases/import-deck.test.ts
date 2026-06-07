import { describe, expect, it } from "vitest";
import { createSlide, EmptyDeckError } from "../../domain";
import { CsvParseError, CsvParseErrorKind } from "../ports/deck-csv-parser";
import { FakeDeckCsvParser, FakeDeckRepository } from "../testing";
import { ImportDeck } from "./import-deck";

const slide = createSlide({ textEn: "Hello" });
const slideFull = createSlide({
	textEn: "Hello",
	notes: "Smile",
	title: "Welcome",
	speaker: "Bob",
});

function makeUseCase(
	parser: FakeDeckCsvParser,
	repo: FakeDeckRepository,
	idCounter = { value: 0 },
) {
	return new ImportDeck(
		parser,
		repo,
		() => `id-${++idCounter.value}`,
		() => 1_000_000,
	);
}

describe("ImportDeck", () => {
	it("saves and returns the new deck with name from file name (no extension)", async () => {
		const repo = new FakeDeckRepository();
		const parser = FakeDeckCsvParser.withSuccess([slide]);
		const useCase = makeUseCase(parser, repo);

		const deck = await useCase.execute("raw csv", "event-2026.csv");

		expect(deck.name).toBe("event-2026");
		expect(deck.slides).toHaveLength(1);
		expect(deck.id).toBe("id-1");
		expect(deck.importedAt).toBe(1_000_000);
	});

	it("saves the deck to the repository", async () => {
		const repo = new FakeDeckRepository();
		const parser = FakeDeckCsvParser.withSuccess([slide]);
		const useCase = makeUseCase(parser, repo);

		const deck = await useCase.execute("raw csv", "my-deck.csv");

		const saved = await repo.findById(deck.id);
		expect(saved).toEqual(deck);
	});

	it("strips extension from file name regardless of case", async () => {
		const repo = new FakeDeckRepository();
		const parser = FakeDeckCsvParser.withSuccess([slide]);
		const useCase = makeUseCase(parser, repo);

		const deck = await useCase.execute("raw csv", "Summer.CSV");
		expect(deck.name).toBe("Summer");
	});

	it("uses parser name override when parser provides a name", async () => {
		const repo = new FakeDeckRepository();
		const parser = FakeDeckCsvParser.withSuccess([slide], "parser-override");
		const useCase = makeUseCase(parser, repo);

		const deck = await useCase.execute("raw csv", "original.csv");
		expect(deck.name).toBe("parser-override");
	});

	it("infers layout from slides (text-only)", async () => {
		const repo = new FakeDeckRepository();
		const parser = FakeDeckCsvParser.withSuccess([slide]);
		const useCase = makeUseCase(parser, repo);

		const deck = await useCase.execute("raw csv", "deck.csv");
		expect(deck.settings.layout).toBe("text-only");
	});

	it("infers layout from slides (full when metadata present)", async () => {
		const repo = new FakeDeckRepository();
		const parser = FakeDeckCsvParser.withSuccess([slideFull]);
		const useCase = makeUseCase(parser, repo);

		const deck = await useCase.execute("raw csv", "deck.csv");
		expect(deck.settings.layout).toBe("full");
	});

	it("propagates domain error and does not save anything when parsed data is invalid", async () => {
		const repo = new FakeDeckRepository();
		const parser = FakeDeckCsvParser.withSuccess([]);
		const useCase = makeUseCase(parser, repo);

		await expect(useCase.execute("raw csv", "deck.csv")).rejects.toThrow(
			EmptyDeckError,
		);
		const all = await repo.listAll();
		expect(all).toHaveLength(0);
	});

	it("propagates parse error and does not save anything", async () => {
		const repo = new FakeDeckRepository();
		const error = new CsvParseError("Empty file", CsvParseErrorKind.EmptyFile);
		const parser = FakeDeckCsvParser.withFailure(error);
		const useCase = makeUseCase(parser, repo);

		await expect(useCase.execute("", "deck.csv")).rejects.toThrow(
			CsvParseError,
		);
		const all = await repo.listAll();
		expect(all).toHaveLength(0);
	});
});
