import type { DeckRepository } from "../ports/deck-repository";

/**
 * Deletes a deck by id.
 *
 * Throws DeckNotFoundError when the id does not exist.
 */
export class DeleteDeck {
	constructor(private readonly repository: DeckRepository) {}

	async execute(id: string): Promise<void> {
		await this.repository.deleteById(id);
	}
}
