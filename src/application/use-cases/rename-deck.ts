import { type Deck, renameDeck } from "../../domain";
import type { DeckRepository } from "../ports/deck-repository";

/**
 * Renames a deck and persists the change.
 *
 * Throws DeckNotFoundError when the id does not exist.
 * Throws InvalidDeckNameError when the new name is blank (domain invariant).
 */
export class RenameDeck {
	constructor(private readonly repository: DeckRepository) {}

	async execute(id: string, name: string): Promise<Deck> {
		const deck = await this.repository.findById(id);
		const renamed = renameDeck(deck, name);
		await this.repository.save(renamed);
		return renamed;
	}
}
