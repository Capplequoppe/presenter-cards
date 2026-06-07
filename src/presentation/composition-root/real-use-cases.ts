import { DeleteDeck } from "../../application/use-cases/delete-deck";
import { ImportDeck } from "../../application/use-cases/import-deck";
import { ListDecks } from "../../application/use-cases/list-decks";
import { ReimportDeck } from "../../application/use-cases/reimport-deck";
import { RenameDeck } from "../../application/use-cases/rename-deck";
import { UpdateDeckSettings } from "../../application/use-cases/update-deck-settings";
import { PapaParseDeckCsvParser } from "../../infrastructure/csv/papa-parse-deck-csv-parser";
import { IndexedDbDeckRepository } from "../../infrastructure/storage/indexed-db-deck-repository";
import type { UseCases } from "./use-cases-context";

/**
 * Composition root: the only module that instantiates concrete adapters.
 *
 * This function wires real infrastructure implementations (IndexedDB, PapaParse)
 * to the use cases. React components never import concrete adapters directly;
 * they call use cases via the context hook, satisfying the Dependency Inversion Principle.
 *
 * Hash routing keeps the app Pages-safe (no server-side rewrite needed) — see App.tsx.
 */
export function createRealUseCases(): UseCases {
	const repository = new IndexedDbDeckRepository();
	const csvParser = new PapaParseDeckCsvParser();
	const idGenerator = () => crypto.randomUUID();
	const clock = () => Date.now();

	return {
		importDeck: new ImportDeck(csvParser, repository, idGenerator, clock),
		listDecks: new ListDecks(repository),
		renameDeck: new RenameDeck(repository),
		reimportDeck: new ReimportDeck(csvParser, repository, clock),
		deleteDeck: new DeleteDeck(repository),
		updateDeckSettings: new UpdateDeckSettings(repository),
	};
}
