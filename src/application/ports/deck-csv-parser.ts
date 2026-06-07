import type { Slide } from "../../domain";

/**
 * Discriminated enum for CSV parse failure categories.
 */
export enum CsvParseErrorKind {
	/** The file is completely empty. */
	EmptyFile = "EmptyFile",
	/** The header row is missing entirely. */
	MissingHeader = "MissingHeader",
	/** The header row was present but none of the required columns were found. */
	UnrecognizedHeader = "UnrecognizedHeader",
	/** One or more data rows have an empty `text_en` value. */
	EmptyTextEn = "EmptyTextEn",
	/** One or more data rows have a non-numeric value in `duration_minutes`. */
	InvalidDuration = "InvalidDuration",
}

/** Extra details carried by certain error kinds. */
export interface CsvParseErrorDetails {
	/**
	 * Row numbers (1-based) relevant to the error.
	 * Present when kind is EmptyTextEn (rows with empty text_en) or
	 * InvalidDuration (rows with non-numeric duration_minutes).
	 */
	readonly rows?: number[];
}

/**
 * Thrown by DeckCsvParser when the CSV cannot be turned into valid slide data.
 *
 * Carries a human-readable `message` and a structured `kind` so the
 * presentation layer can display specific feedback without string-matching.
 */
export class CsvParseError extends Error {
	readonly kind: CsvParseErrorKind;
	readonly rows: number[] | undefined;

	constructor(
		message: string,
		kind: CsvParseErrorKind,
		details?: CsvParseErrorDetails,
	) {
		super(message);
		this.name = "CsvParseError";
		this.kind = kind;
		this.rows = details?.rows;
	}
}

/** Data returned by the parser on success. */
export interface ParsedDeckData {
	/** The deck name — the parser may suggest one or fall back to the caller's name. */
	readonly name: string;
	/** Validated, ordered slides ready to pass to createDeck. */
	readonly slides: ReadonlyArray<Slide>;
}

/**
 * Port: parses raw CSV text into validated deck data.
 *
 * parse: accepts raw CSV text and a fallback deck name; returns ParsedDeckData
 * or throws CsvParseError on any validation failure.
 */
export interface DeckCsvParser {
	parse(csvText: string, fallbackName: string): Promise<ParsedDeckData>;
}
