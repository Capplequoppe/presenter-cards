import { useMemo } from "react";
import { BrowserWakeLock } from "../infrastructure/wake-lock";
import {
	createRealUseCases,
	ServicesProvider,
	UseCasesProvider,
} from "./composition-root";
import { DeckMenuPage } from "./pages/DeckMenuPage";
import { PresenterPage } from "./pages/presenter/PresenterPage";
import { useHashRoute } from "./routing";

/**
 * App shell: instantiates the composition root once, sets up the dark theme,
 * and renders the correct page based on the current hash route.
 *
 * Hash routing is used for GitHub Pages compatibility — the /presenter-cards/
 * base path cannot rewrite arbitrary sub-paths to index.html, so a hash URL
 * (#/deck/:id) is safe on hard reload without any server-side configuration.
 */
export function App() {
	const useCases = useMemo(() => createRealUseCases(), []);
	const services = useMemo(() => ({ wakeLock: new BrowserWakeLock() }), []);
	const route = useHashRoute();

	return (
		<div className="min-h-screen bg-[#121212] text-gray-100">
			<UseCasesProvider useCases={useCases}>
				<ServicesProvider services={services}>
					{route.kind === "presenter" ? (
						<PresenterPage deckId={route.deckId} />
					) : (
						<DeckMenuPage />
					)}
				</ServicesProvider>
			</UseCasesProvider>
		</div>
	);
}
