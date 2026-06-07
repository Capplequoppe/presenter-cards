# Task 5.1: Composition Root & App Shell

## Description

Wire the application together: a composition root that instantiates the real
adapters (IndexedDB repository, PapaParse parser) and exposes the use cases to
React via context; client-side routing between the deck menu and presenter
routes; the dark-theme app shell.

## Acceptance Criteria

- A single module (the composition root) is the only place that instantiates concrete adapters; components and hooks obtain use cases exclusively via a context hook
- Tests can render any component subtree with fakes substituted through the same context (a test helper exists for this)
- Two routes exist: deck menu (default) and presenter (`/deck/:id` or equivalent); unknown routes land on the deck menu
- Routing works under the `/presenter-cards/` base path on GitHub Pages, including a hard page reload on the presenter route (no 404 — hash routing or an equivalent Pages-safe strategy)
- The app shell applies the dark theme globally (background, text colors)

## Architectural Decision

Hash-based routing is the Pages-safe default (GitHub Pages cannot rewrite
arbitrary paths to `index.html`); document the choice in code. Alternative
(404.html redirect trick) considered and rejected as hacky for two routes.

## Test Cases

- Component rendered through the test helper receives fake use cases (smoke)
- Navigating to an unknown route renders the deck menu
- Deck menu renders at the root route

## How it contributes to the overall execution plan

Establishes the DI seam every UI task plugs into, and the routing skeleton the
presenter screen (Phase 6) mounts on.

## How it applies DDD, Clean Architecture, Clean Code and SOLID principles

Dependency Inversion completed at the outermost layer: exactly one module
knows concrete types. Presentation depends on use-case interfaces only.

## Status: Complete

Implemented composition root with `UseCasesContext` (context + `useUseCases` hook), `createRealUseCases` (only place that instantiates IndexedDbDeckRepository and PapaParseDeckCsvParser), and `renderWithUseCases` test helper (fake-backed via FakeDeckRepository + FakeDeckCsvParser).

Hash router implemented in `src/presentation/routing/use-hash-route.ts` (hash-based, GitHub Pages safe). Two routes: `#/deck/:id` → PresenterPlaceholder, default → DeckMenuPage. Unknown routes fall back to deck menu.

App shell in `App.tsx` applies `bg-[#121212] text-gray-100` dark theme globally.

Tests: 3 routing tests, 2 composition-root tests. All 165 tests pass. `pnpm check` clean. `pnpm build` succeeds.
