import { type Deck, type DeckSettings, updateDeckSettings } from "../../domain";
import type { DeckRepository } from "../ports/deck-repository";

/**
 * Updates the layout and fontScale settings of a deck and persists the change.
 *
 * Throws DeckNotFoundError when the id does not exist.
 */
export class UpdateDeckSettings {
	constructor(private readonly repository: DeckRepository) {}

	async execute(id: string, settings: DeckSettings): Promise<Deck> {
		const deck = await this.repository.findById(id);
		const updated = updateDeckSettings(deck, settings);
		await this.repository.save(updated);
		return updated;
	}
}
