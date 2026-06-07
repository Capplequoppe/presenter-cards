import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PapaParseDeckCsvParser } from "./papa-parse-deck-csv-parser";

const SAMPLE_DECK_PATH = join(__dirname, "../../../public/sample-deck.csv");
const EXPECTED_SLIDE_COUNT = 8;

describe("public/sample-deck.csv", () => {
	it("parses without error", async () => {
		const csvText = readFileSync(SAMPLE_DECK_PATH, "utf-8");
		const parser = new PapaParseDeckCsvParser();
		const result = await parser.parse(csvText, "sample-deck");
		expect(result.slides).toHaveLength(EXPECTED_SLIDE_COUNT);
	});

	it("produces slides with non-empty textEn", async () => {
		const csvText = readFileSync(SAMPLE_DECK_PATH, "utf-8");
		const parser = new PapaParseDeckCsvParser();
		const result = await parser.parse(csvText, "sample-deck");
		for (const slide of result.slides) {
			expect(slide.textEn.trim().length).toBeGreaterThan(0);
		}
	});

	it("contains bilingual slides (textIt present on most slides)", async () => {
		const csvText = readFileSync(SAMPLE_DECK_PATH, "utf-8");
		const parser = new PapaParseDeckCsvParser();
		const result = await parser.parse(csvText, "sample-deck");
		const bilingualCount = result.slides.filter(
			(s) => s.textIt !== undefined,
		).length;
		expect(bilingualCount).toBeGreaterThanOrEqual(5);
	});

	it("includes at least one slide with a multi-line textEn (newline in cell)", async () => {
		const csvText = readFileSync(SAMPLE_DECK_PATH, "utf-8");
		const parser = new PapaParseDeckCsvParser();
		const result = await parser.parse(csvText, "sample-deck");
		const hasMultiLine = result.slides.some((s) => s.textEn.includes("\n"));
		expect(hasMultiLine).toBe(true);
	});

	it("includes at least one slide with textEn only (no textIt)", async () => {
		const csvText = readFileSync(SAMPLE_DECK_PATH, "utf-8");
		const parser = new PapaParseDeckCsvParser();
		const result = await parser.parse(csvText, "sample-deck");
		const hasEnOnly = result.slides.some((s) => s.textIt === undefined);
		expect(hasEnOnly).toBe(true);
	});

	it("includes slides with notes, duration, and speaker fields", async () => {
		const csvText = readFileSync(SAMPLE_DECK_PATH, "utf-8");
		const parser = new PapaParseDeckCsvParser();
		const result = await parser.parse(csvText, "sample-deck");

		const hasNotes = result.slides.some((s) => s.notes !== undefined);
		const hasDuration = result.slides.some(
			(s) => s.durationMinutes !== undefined,
		);
		const hasSpeaker = result.slides.some((s) => s.speaker !== undefined);

		expect(hasNotes).toBe(true);
		expect(hasDuration).toBe(true);
		expect(hasSpeaker).toBe(true);
	});
});
