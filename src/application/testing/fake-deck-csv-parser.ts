import type { Slide } from "../../domain";
import type {
	CsvParseError,
	DeckCsvParser,
	ParsedDeckData,
} from "../ports/deck-csv-parser";

/**
 * In-memory implementation of DeckCsvParser for use in tests.
 *
 * Constructed via static factory methods to either return a configured success
 * result or throw a configured CsvParseError — no real CSV parsing occurs.
 */
export class FakeDeckCsvParser implements DeckCsvParser {
	private constructor(
		private readonly result:
			| { success: true; slides: ReadonlyArray<Slide>; nameOverride?: string }
			| { success: false; error: CsvParseError },
	) {}

	/**
	 * Creates a parser that resolves with the given slides.
	 *
	 * @param slides - Slide data to return.
	 * @param nameOverride - When provided, the parsed result uses this name
	 *   instead of the fallback name supplied to parse().
	 */
	static withSuccess(
		slides: ReadonlyArray<Slide>,
		nameOverride?: string,
	): FakeDeckCsvParser {
		return new FakeDeckCsvParser({ success: true, slides, nameOverride });
	}

	/**
	 * Creates a parser that rejects with the given CsvParseError.
	 */
	static withFailure(error: CsvParseError): FakeDeckCsvParser {
		return new FakeDeckCsvParser({ success: false, error });
	}

	async parse(_csvText: string, fallbackName: string): Promise<ParsedDeckData> {
		if (!this.result.success) {
			throw this.result.error;
		}
		return {
			name: this.result.nameOverride ?? fallbackName,
			slides: this.result.slides,
		};
	}
}
