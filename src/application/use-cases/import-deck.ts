import { createDeck, type Deck } from "../../domain";
import type { DeckCsvParser } from "../ports/deck-csv-parser";
import type { DeckRepository } from "../ports/deck-repository";

function stripExtension(fileName: string): string {
	const lastDot = fileName.lastIndexOf(".");
	if (lastDot === -1) {
		return fileName;
	}
	return fileName.slice(0, lastDot);
}

/**
 * Parses a CSV file and saves the resulting deck.
 *
 * The deck name is derived from the file name with its extension removed.
 * Clock and id generator are injected so the use case remains deterministic
 * in tests and does not depend on browser globals.
 *
 * Throws CsvParseError or domain errors (EmptyDeckError, InvalidDeckNameError)
 * on failure — nothing is saved when an error is thrown.
 */
export class ImportDeck {
	constructor(
		private readonly csvParser: DeckCsvParser,
		private readonly repository: DeckRepository,
		private readonly idGenerator: () => string,
		private readonly clock: () => number,
	) {}

	async execute(csvText: string, fileName: string): Promise<Deck> {
		const fallbackName = stripExtension(fileName);
		const parsed = await this.csvParser.parse(csvText, fallbackName);
		const deck = createDeck({
			id: this.idGenerator(),
			name: parsed.name,
			slides: parsed.slides,
			importedAt: this.clock(),
		});
		await this.repository.save(deck);
		return deck;
	}
}
