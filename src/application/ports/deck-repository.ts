import type { Deck } from "../../domain";

/**
 * Thrown when an operation targets a deck id that does not exist.
 */
export class DeckNotFoundError extends Error {
	readonly id: string;

	constructor(id: string) {
		super(`Deck not found: ${id}`);
		this.name = "DeckNotFoundError";
		this.id = id;
	}
}

/**
 * Port: persistence of Deck aggregates.
 *
 * save: create or overwrite by id (upsert).
 * findById: throws DeckNotFoundError when the id is absent.
 * listAll: returns all saved decks in unspecified order.
 * deleteById: removes the deck; throws DeckNotFoundError when the id is absent.
 */
export interface DeckRepository {
	save(deck: Deck): Promise<void>;
	findById(id: string): Promise<Deck>;
	listAll(): Promise<Deck[]>;
	deleteById(id: string): Promise<void>;
}
