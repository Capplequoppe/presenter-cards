import type { Deck } from "../../domain";
import type { DeckRepository } from "../ports/deck-repository";

/**
 * Retrieves a single deck by its id.
 *
 * Architectural Decision: GetDeck was not in the original use-case list
 * (the plan listed ListDecks, ImportDeck, etc.) but the presenter route
 * requires loading a specific deck by id from the URL hash. Rather than
 * abusing ListDecks and filtering in the presentation layer (which would
 * couple the presenter to a list concern), a dedicated GetDeck use case is
 * introduced. It is a thin pass-through to repository.findById, keeping the
 * application layer's intention explicit and making the dependency on
 * DeckRepository testable in isolation.
 *
 * Throws DeckNotFoundError when the id does not exist.
 */
export class GetDeck {
	constructor(private readonly repository: DeckRepository) {}

	async execute(id: string): Promise<Deck> {
		return this.repository.findById(id);
	}
}
