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

## Status: Pending
