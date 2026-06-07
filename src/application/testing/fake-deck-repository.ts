import type { Deck } from "../../domain";
import type { DeckRepository } from "../ports/deck-repository";
import { DeckNotFoundError } from "../ports/deck-repository";

/**
 * In-memory implementation of DeckRepository for use in tests.
 *
 * Behaves observably like a real repository: saved decks can be found, listed,
 * and deleted; operations on missing ids throw DeckNotFoundError.
 */
export class FakeDeckRepository implements DeckRepository {
	private readonly store = new Map<string, Deck>();

	async save(deck: Deck): Promise<void> {
		this.store.set(deck.id, deck);
	}

	async findById(id: string): Promise<Deck> {
		const deck = this.store.get(id);
		if (deck === undefined) {
			throw new DeckNotFoundError(id);
		}
		return deck;
	}

	async listAll(): Promise<Deck[]> {
		return Array.from(this.store.values());
	}

	async deleteById(id: string): Promise<void> {
		if (!this.store.has(id)) {
			throw new DeckNotFoundError(id);
		}
		this.store.delete(id);
	}
}
