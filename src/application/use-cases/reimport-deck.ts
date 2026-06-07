import { type Deck, reImportDeck } from "../../domain";
import type { DeckCsvParser } from "../ports/deck-csv-parser";
import type { DeckRepository } from "../ports/deck-repository";

/**
 * Re-imports a deck: replaces its slides from new CSV while keeping id and settings.
 *
 * Throws DeckNotFoundError when the id does not exist.
 * Throws CsvParseError when parsing fails — the stored deck is left unchanged.
 */
export class ReimportDeck {
	constructor(
		private readonly csvParser: DeckCsvParser,
		private readonly repository: DeckRepository,
		private readonly clock: () => number,
	) {}

	async execute(id: string, csvText: string): Promise<Deck> {
		const existing = await this.repository.findById(id);
		const parsed = await this.csvParser.parse(csvText, existing.name);
		const updated = reImportDeck(existing, parsed.slides, this.clock());
		await this.repository.save(updated);
		return updated;
	}
}
