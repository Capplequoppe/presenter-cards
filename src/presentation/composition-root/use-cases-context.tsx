import { createContext, type ReactNode, useContext } from "react";
import type { DeleteDeck } from "../../application/use-cases/delete-deck";
import type { GetDeck } from "../../application/use-cases/get-deck";
import type { ImportDeck } from "../../application/use-cases/import-deck";
import type { ListDecks } from "../../application/use-cases/list-decks";
import type { ReimportDeck } from "../../application/use-cases/reimport-deck";
import type { RenameDeck } from "../../application/use-cases/rename-deck";
import type { UpdateDeckSettings } from "../../application/use-cases/update-deck-settings";

/**
 * The set of use cases exposed to the React component tree.
 * Components depend on this interface, not on concrete adapters.
 */
export interface UseCases {
	readonly importDeck: ImportDeck;
	readonly listDecks: ListDecks;
	readonly renameDeck: RenameDeck;
	readonly reimportDeck: ReimportDeck;
	readonly deleteDeck: DeleteDeck;
	readonly updateDeckSettings: UpdateDeckSettings;
	readonly getDeck: GetDeck;
}

const UseCasesContext = createContext<UseCases | null>(null);

interface UseCasesProviderProps {
	readonly useCases: UseCases;
	readonly children: ReactNode;
}

/**
 * Provides the use-case instances to the React component tree.
 * The composition root creates this provider with real adapters;
 * tests create it with fakes via the renderWithUseCases helper.
 */
export function UseCasesProvider({
	useCases,
	children,
}: UseCasesProviderProps) {
	return (
		<UseCasesContext.Provider value={useCases}>
			{children}
		</UseCasesContext.Provider>
	);
}

/**
 * Hook for components to obtain use cases.
 * Must be called inside a UseCasesProvider.
 */
export function useUseCases(): UseCases {
	const ctx = useContext(UseCasesContext);
	if (ctx === null) {
		throw new Error("useUseCases must be used within a UseCasesProvider");
	}
	return ctx;
}
