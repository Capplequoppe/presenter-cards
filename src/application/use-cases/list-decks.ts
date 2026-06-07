import type { Deck } from "../../domain";
import type { DeckRepository } from "../ports/deck-repository";

/**
 * Returns all saved decks ordered most recently imported first (descending importedAt).
 */
export class ListDecks {
	constructor(private readonly repository: DeckRepository) {}

	async execute(): Promise<Deck[]> {
		const decks = await this.repository.listAll();
		return decks.slice().sort((a, b) => b.importedAt - a.importedAt);
	}
}
