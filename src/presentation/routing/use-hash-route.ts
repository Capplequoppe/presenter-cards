import { useEffect, useState } from "react";

/**
 * Parses the current hash to determine the active route.
 *
 * Hash-based routing is used because GitHub Pages cannot rewrite arbitrary
 * paths to index.html. A hash URL (e.g. #/deck/abc123) always loads the same
 * index.html regardless of the path prefix, making hard reloads safe under
 * /presenter-cards/ without a 404.html redirect trick.
 *
 * Routes:
 *   (empty) or #/  → { kind: 'menu' }
 *   #/deck/:id     → { kind: 'presenter', deckId: string }
 *   anything else  → { kind: 'menu' } (fallback)
 */
export type Route = { kind: "menu" } | { kind: "presenter"; deckId: string };

function parseHash(hash: string): Route {
	const path = hash.startsWith("#") ? hash.slice(1) : hash;
	const match = /^\/deck\/([^/]+)$/.exec(path);
	if (match) {
		return { kind: "presenter", deckId: match[1] };
	}
	return { kind: "menu" };
}

/**
 * Returns the current route derived from window.location.hash and
 * re-renders when the hash changes.
 */
export function useHashRoute(): Route {
	const [route, setRoute] = useState<Route>(() =>
		parseHash(window.location.hash),
	);

	useEffect(() => {
		function handleHashChange() {
			setRoute(parseHash(window.location.hash));
		}
		window.addEventListener("hashchange", handleHashChange);
		return () => window.removeEventListener("hashchange", handleHashChange);
	}, []);

	return route;
}

/**
 * Navigates to the presenter route for a given deck id.
 */
export function navigateToPresenter(deckId: string): void {
	window.location.hash = `/deck/${deckId}`;
}

/**
 * Navigates to the deck menu.
 */
export function navigateToMenu(): void {
	window.location.hash = "/";
}
