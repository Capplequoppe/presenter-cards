import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import {
	FakeDeckCsvParser,
	FakeDeckRepository,
} from "../../application/testing";
import { DeleteDeck } from "../../application/use-cases/delete-deck";
import { ImportDeck } from "../../application/use-cases/import-deck";
import { ListDecks } from "../../application/use-cases/list-decks";
import { ReimportDeck } from "../../application/use-cases/reimport-deck";
import { RenameDeck } from "../../application/use-cases/rename-deck";
import { UpdateDeckSettings } from "../../application/use-cases/update-deck-settings";
import { type UseCases, UseCasesProvider } from "./use-cases-context";

/**
 * Options for the test helper.
 * All fields are optional: defaults produce a working set of fakes with an
 * empty repository and a success parser.
 */
export interface RenderWithUseCasesOptions {
	/** Override specific use cases. When omitted, fakes are used. */
	readonly useCases?: Partial<UseCases>;
}

/**
 * Builds a default set of use cases backed by in-memory fakes.
 */
export function createFakeUseCases(overrides?: Partial<UseCases>): {
	useCases: UseCases;
	repository: FakeDeckRepository;
} {
	const repository = new FakeDeckRepository();
	const csvParser = FakeDeckCsvParser.withSuccess([]);
	const idGenerator = () => "test-id";
	const clock = () => 0;

	const defaults: UseCases = {
		importDeck: new ImportDeck(csvParser, repository, idGenerator, clock),
		listDecks: new ListDecks(repository),
		renameDeck: new RenameDeck(repository),
		reimportDeck: new ReimportDeck(csvParser, repository, clock),
		deleteDeck: new DeleteDeck(repository),
		updateDeckSettings: new UpdateDeckSettings(repository),
	};

	return {
		useCases: { ...defaults, ...overrides },
		repository,
	};
}

/**
 * Test helper: renders any subtree with fake-backed use cases.
 *
 * Usage:
 *   const { getByText } = renderWithUseCases(<MyComponent />, { useCases: { importDeck: myFake } })
 */
export function renderWithUseCases(
	ui: ReactElement,
	options: RenderWithUseCasesOptions = {},
) {
	const { useCases } = createFakeUseCases(options.useCases);
	return render(<UseCasesProvider useCases={useCases}>{ui}</UseCasesProvider>);
}
