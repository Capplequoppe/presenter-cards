import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import {
	FakeDeckCsvParser,
	FakeDeckRepository,
} from "../../application/testing";
import { DeleteDeck } from "../../application/use-cases/delete-deck";
import { GetDeck } from "../../application/use-cases/get-deck";
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
	/**
	 * Provide a pre-configured FakeDeckCsvParser. When omitted, a parser that
	 * succeeds with an empty slide list is used. This parser is wired into
	 * ImportDeck and ReimportDeck unless those use cases are overridden.
	 */
	readonly csvParser?: FakeDeckCsvParser;
	/**
	 * Provide a pre-seeded FakeDeckRepository. When omitted, an empty repository
	 * is created. This repository is wired into all use cases unless those use
	 * cases are overridden.
	 */
	readonly repository?: FakeDeckRepository;
}

/**
 * Builds a default set of use cases backed by in-memory fakes.
 */
export function createFakeUseCases(options: RenderWithUseCasesOptions = {}): {
	useCases: UseCases;
	repository: FakeDeckRepository;
} {
	const repository = options.repository ?? new FakeDeckRepository();
	const csvParser = options.csvParser ?? FakeDeckCsvParser.withSuccess([]);
	const idGenerator = () => "test-id";
	const clock = () => 0;

	const defaults: UseCases = {
		importDeck: new ImportDeck(csvParser, repository, idGenerator, clock),
		listDecks: new ListDecks(repository),
		renameDeck: new RenameDeck(repository),
		reimportDeck: new ReimportDeck(csvParser, repository, clock),
		deleteDeck: new DeleteDeck(repository),
		updateDeckSettings: new UpdateDeckSettings(repository),
		getDeck: new GetDeck(repository),
	};

	return {
		useCases: { ...defaults, ...(options.useCases ?? {}) },
		repository,
	};
}

/**
 * Test helper: renders any subtree with fake-backed use cases.
 *
 * Usage:
 *   const { getByText } = renderWithUseCases(<MyComponent />, { repository: myRepo })
 */
export function renderWithUseCases(
	ui: ReactElement,
	options: RenderWithUseCasesOptions = {},
) {
	const { useCases } = createFakeUseCases(options);
	return render(<UseCasesProvider useCases={useCases}>{ui}</UseCasesProvider>);
}
