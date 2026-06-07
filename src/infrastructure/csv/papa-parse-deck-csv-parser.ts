import Papa from "papaparse";
import type { ParsedDeckData } from "../../application/ports/deck-csv-parser";
import {
	CsvParseError,
	CsvParseErrorKind,
} from "../../application/ports/deck-csv-parser";
import type { Slide } from "../../domain";
import { createSlide, InvalidSlideError } from "../../domain";

/**
 * Recognized CSV column names mapped to their normalized form.
 * Comparison is done case-insensitively.
 */
const RECOGNIZED_COLUMNS = [
	"title",
	"text_en",
	"text_it",
	"notes",
	"duration_minutes",
	"speaker",
] as const;

type RecognizedColumn = (typeof RECOGNIZED_COLUMNS)[number];

/**
 * PapaParse-backed implementation of DeckCsvParser.
 *
 * Parses a CSV text string into validated deck data using PapaParse for
 * robust handling of quoted cells, commas, and multi-line values.
 * All validation failures produce a typed CsvParseError with a
 * human-readable message suitable for direct display.
 */
export class PapaParseDeckCsvParser {
	async parse(csvText: string, fallbackName: string): Promise<ParsedDeckData> {
		const trimmed = stripBom(csvText);

		if (trimmed.trim() === "") {
			throw new CsvParseError(
				"The file is empty. Please provide a CSV with at least one slide.",
				CsvParseErrorKind.EmptyFile,
			);
		}

		const result = Papa.parse<Record<string, string>>(trimmed, {
			header: true,
			skipEmptyLines: false,
		});

		const rawHeaders: string[] = result.meta.fields ?? [];

		if (rawHeaders.length === 0) {
			throw new CsvParseError(
				"The file is empty. Please provide a CSV with at least one slide.",
				CsvParseErrorKind.EmptyFile,
			);
		}

		const columnMap = buildColumnMap(rawHeaders);

		if (!columnMap.has("text_en")) {
			const found = rawHeaders.join(", ");
			throw new CsvParseError(
				`Missing required column "text_en". Found columns: ${found}. The CSV must include a "text_en" column.`,
				CsvParseErrorKind.UnrecognizedHeader,
			);
		}

		const rows = stripTrailingBlankRows(result.data);

		if (rows.length === 0) {
			throw new CsvParseError(
				"No slides found. The CSV has a header row but no data rows.",
				CsvParseErrorKind.EmptyFile,
			);
		}

		const slides = buildSlides(rows, columnMap);

		return { name: fallbackName, slides };
	}
}

/**
 * Strips a UTF-8 BOM character from the start of the string if present.
 */
function stripBom(text: string): string {
	return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Removes trailing rows where every cell value is an empty string "".
 * PapaParse produces empty strings for lines that are truly blank.
 * Rows with whitespace-only values are retained so they can be flagged
 * as invalid (e.g. whitespace-only text_en).
 */
function stripTrailingBlankRows(
	rows: Record<string, string>[],
): Record<string, string>[] {
	let end = rows.length;
	while (end > 0 && Object.values(rows[end - 1]).every((v) => v === "")) {
		end--;
	}
	return rows.slice(0, end);
}

/**
 * Builds a map from recognized column names (lower-case canonical) to the
 * actual header string in the CSV (for value lookup).
 */
function buildColumnMap(rawHeaders: string[]): Map<RecognizedColumn, string> {
	const map = new Map<RecognizedColumn, string>();

	for (const header of rawHeaders) {
		const lower = header.toLowerCase() as RecognizedColumn;
		if ((RECOGNIZED_COLUMNS as readonly string[]).includes(lower)) {
			map.set(lower, header);
		}
	}

	return map;
}

/**
 * Reads a field value from a row by canonical column name.
 * Returns the raw string or undefined if the column is absent or the cell is blank.
 */
function getField(
	row: Record<string, string>,
	columnMap: Map<RecognizedColumn, string>,
	column: RecognizedColumn,
): string | undefined {
	const actualHeader = columnMap.get(column);
	if (actualHeader === undefined) return undefined;
	const value = row[actualHeader];
	return value !== undefined && value.trim() !== "" ? value : undefined;
}

/**
 * Reads the raw (untrimmed) field value — used for text_en to detect blank correctly.
 */
function getRawField(
	row: Record<string, string>,
	columnMap: Map<RecognizedColumn, string>,
	column: RecognizedColumn,
): string {
	const actualHeader = columnMap.get(column);
	if (actualHeader === undefined) return "";
	return row[actualHeader] ?? "";
}

/**
 * Converts parsed rows into domain Slide objects.
 * Throws CsvParseError aggregating all validation failures.
 */
function buildSlides(
	rows: Record<string, string>[],
	columnMap: Map<RecognizedColumn, string>,
): ReadonlyArray<Slide> {
	const emptyTextEnRows: number[] = [];
	const invalidDurationRows: number[] = [];
	const slides: Slide[] = [];

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const rowNumber = i + 1;

		const durationResult = parseDuration(
			getRawField(row, columnMap, "duration_minutes"),
			rowNumber,
		);

		if (durationResult.kind === "invalid") {
			invalidDurationRows.push(rowNumber);
			continue;
		}

		try {
			const slide = createSlide(
				{
					title: getField(row, columnMap, "title"),
					textEn: getRawField(row, columnMap, "text_en"),
					textIt: getField(row, columnMap, "text_it"),
					notes: getField(row, columnMap, "notes"),
					durationMinutes: durationResult.value,
					speaker: getField(row, columnMap, "speaker"),
				},
				rowNumber,
			);
			slides.push(slide);
		} catch (e) {
			if (e instanceof InvalidSlideError) {
				emptyTextEnRows.push(rowNumber);
			} else {
				throw e;
			}
		}
	}

	if (invalidDurationRows.length > 0) {
		const rowList = invalidDurationRows.join(", ");
		throw new CsvParseError(
			`Invalid duration_minutes value on row${invalidDurationRows.length > 1 ? "s" : ""} ${rowList}. Expected a number or blank.`,
			CsvParseErrorKind.InvalidDuration,
			{ rows: invalidDurationRows },
		);
	}

	if (emptyTextEnRows.length > 0) {
		const rowList = emptyTextEnRows.join(", ");
		throw new CsvParseError(
			`Empty text_en on row${emptyTextEnRows.length > 1 ? "s" : ""} ${rowList}. Each slide must have a non-empty text_en value.`,
			CsvParseErrorKind.EmptyTextEn,
			{ rows: emptyTextEnRows },
		);
	}

	if (slides.length === 0) {
		throw new CsvParseError(
			"No slides found. The CSV has a header row but no data rows.",
			CsvParseErrorKind.MissingHeader,
		);
	}

	return slides;
}

type DurationResult =
	| { kind: "absent"; value: undefined }
	| { kind: "valid"; value: number }
	| { kind: "invalid" };

/**
 * Parses a duration_minutes cell value.
 * - Blank → absent (undefined)
 * - Valid number string → number
 * - Anything else → invalid
 */
function parseDuration(raw: string, _rowNumber: number): DurationResult {
	if (raw.trim() === "") {
		return { kind: "absent", value: undefined };
	}

	const parsed = Number(raw.trim());

	if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
		return { kind: "invalid" };
	}

	return { kind: "valid", value: parsed };
}
