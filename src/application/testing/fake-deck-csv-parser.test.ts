import { describe, expect, it } from "vitest";
import { createSlide } from "../../domain";
import { CsvParseError, CsvParseErrorKind } from "../ports/deck-csv-parser";
import { FakeDeckCsvParser } from "./fake-deck-csv-parser";

describe("FakeDeckCsvParser", () => {
	it("returns configured slide data on success", async () => {
		const slides = [createSlide({ textEn: "Hello" })];
		const parser = FakeDeckCsvParser.withSuccess(slides, "test-deck");
		const result = await parser.parse("ignored csv", "test-deck");
		expect(result.slides).toEqual(slides);
		expect(result.name).toBe("test-deck");
	});

	it("returns name override from parser if provided", async () => {
		const slides = [createSlide({ textEn: "Hello" })];
		const parser = FakeDeckCsvParser.withSuccess(slides, "override-name");
		const result = await parser.parse("ignored csv", "fallback-name");
		expect(result.name).toBe("override-name");
	});

	it("falls back to the provided deck name if no override", async () => {
		const slides = [createSlide({ textEn: "Hello" })];
		const parser = FakeDeckCsvParser.withSuccess(slides);
		const result = await parser.parse("ignored csv", "fallback-name");
		expect(result.name).toBe("fallback-name");
	});

	it("throws the configured CsvParseError on failure", async () => {
		const error = new CsvParseError("Empty file", CsvParseErrorKind.EmptyFile);
		const parser = FakeDeckCsvParser.withFailure(error);
		await expect(parser.parse("", "deck")).rejects.toThrow(CsvParseError);
		await expect(parser.parse("", "deck")).rejects.toThrow("Empty file");
	});

	it("throws with correct kind for unrecognized header error", async () => {
		const error = new CsvParseError(
			"Unrecognized header: foo",
			CsvParseErrorKind.UnrecognizedHeader,
		);
		const parser = FakeDeckCsvParser.withFailure(error);
		await expect(parser.parse("", "deck")).rejects.toSatisfy(
			(e: unknown) =>
				e instanceof CsvParseError &&
				e.kind === CsvParseErrorKind.UnrecognizedHeader,
		);
	});

	it("throws with correct kind and row numbers for empty text_en error", async () => {
		const error = new CsvParseError(
			"Empty text_en at rows 2, 4",
			CsvParseErrorKind.EmptyTextEn,
			{ rows: [2, 4] },
		);
		const parser = FakeDeckCsvParser.withFailure(error);
		await expect(parser.parse("", "deck")).rejects.toSatisfy(
			(e: unknown) =>
				e instanceof CsvParseError &&
				e.kind === CsvParseErrorKind.EmptyTextEn &&
				JSON.stringify(e.rows) === JSON.stringify([2, 4]),
		);
	});
});
