# Phase 5: Deck Menu UI

The deck management surface: composition root wiring real adapters to use
cases, the deck list, CSV import flow with error display, and per-deck
actions (rename / re-import / delete).

## Tasks

| # | Task | Description | Status |
|---|------|-------------|--------|
| 5.1 | [Composition Root & App Shell](task-5.1-composition-root.md) | DI context, routing, dark theme shell | Complete |
| 5.2 | [Deck List & Import Flow](task-5.2-deck-list-and-import.md) | Deck list page, file picker import, error toasts | Complete |
| 5.3 | [Deck Actions](task-5.3-deck-actions.md) | Rename, re-import, delete (with confirmation) via ⋮ menu | Complete |

5.2 depends on 5.1; 5.3 depends on 5.2.

## Status: Complete

## Review

Reviewed 2026-06-07. All task 5.1, 5.2, and 5.3 acceptance criteria verified
MET (one test-coverage gap, fixed). Composition-root purity confirmed:
`IndexedDbDeckRepository`/`PapaParseDeckCsvParser` are instantiated only in
`src/presentation/composition-root/real-use-cases.ts`; all components obtain
use cases via `useUseCases()`. Hash routing is hard-reload-safe and documented
in code. Newest-first ordering comes from `ListDecks` (application layer),
name-sans-extension and re-import keep-name/settings semantics live in the
use cases/aggregate — pages stay thin orchestrators, per the plan.

| # | Severity | Finding | Resolution |
|---|----------|---------|------------|
| 1 | Minor | Task 5.2 AC "each parser failure mode displayed verbatim": tests covered `UnrecognizedHeader` and `EmptyTextEn` but not `EmptyFile` | Fixed (df4c03f): EmptyFile variant test added |
| 2 | Minor | Task 5.3 ACs "prompt pre-filled with the current name" and "confirmation naming the deck" were implemented but not asserted by any test | Fixed (d502a0f): prompt/confirm call-argument assertions added |
| 3 | Minor | Open `⋮` dropdown did not close on an outside tap — multiple menus could be open at once and a stale dropdown lingered on screen | Fixed (c94db5c): outside `pointerdown` closes the menu; test added |
| 4 | Minor | `⋮` button tap area was ~32px, below the 44px phone touch-target minimum for the primary per-deck affordance | Fixed (0bf3cbb): `min-h-11 min-w-11` |
| 5 | Note | Inline rename-validation message ("Deck name cannot be empty.") has no dismiss button; it clears on next menu toggle. The 5.3 AC only requires a *visible* message for empty-name rejection (dismissibility is required for action *failures*, which all route to the dismissible ErrorBanner) | Left as-is — AC-compliant |
| 6 | Note | `navigateToMenu` is exported from the routing barrel but currently unused — it serves the Phase 6 presenter `✕` back action | Left as-is — Phase 6 consumer |
| 7 | Note | `App.test.tsx` renders `App` with real adapters in jsdom (no IndexedDB); the rejected `listDecks` is caught by the page's error path, so the routing smoke tests stay green. Acceptable for shell smoke tests | Left as-is |
| 8 | Note | Re-import updates `importedAt` (clock), so a re-imported deck jumps to the top of the newest-first list — consistent with "import date updates" in the AC | Left as-is — matches spec semantics |

Verification after fixes: `pnpm test` 191 passed (189 → 191), `pnpm check`
clean, `pnpm build` (tsc + vite + PWA) succeeds.
