# Phase 3: Application Layer

Use cases and ports. Defines the `DeckRepository` and `DeckCsvParser`
interfaces, ships in-memory fakes for testing, and implements the six deck
management use cases against the ports.

## Tasks

| # | Task | Description | Status |
|---|------|-------------|--------|
| 3.1 | [Ports & In-Memory Fakes](task-3.1-ports-and-fakes.md) | DeckRepository + DeckCsvParser interfaces, test fakes | Complete |
| 3.2 | [Deck Management Use Cases](task-3.2-deck-use-cases.md) | ImportDeck, ListDecks, RenameDeck, ReimportDeck, DeleteDeck, UpdateDeckSettings | Complete |

3.2 depends on 3.1.

## Status: Complete

## Review

Reviewed against tasks 3.1 and 3.2 acceptance criteria. All criteria met;
layer purity verified (no React/browser APIs, no `Date.now`/`crypto` in use
cases — clock and id generator injected). Quality gates: 102 tests pass,
`pnpm check` and `pnpm build` clean.

| # | Severity | Finding | Resolution |
|---|----------|---------|------------|
| 1 | Minor | Task 3.2 AC1 ("on parse or domain failure nothing is saved") had test coverage for the parse-failure path only; the domain-failure path (parser succeeds with zero slides → `EmptyDeckError`) was untested. Code was already correct — save happens last. | Fixed in d63012d: added ImportDeck test asserting `EmptyDeckError` propagates and repository stays empty. |
| 2 | Minor | `src/application/.gitkeep` left behind after real modules landed; phase 2 removed `src/domain/.gitkeep` in the same situation. | Fixed in 873758b: removed the placeholder. |
| 3 | Suggestion | `CsvParseErrorKind` is a TypeScript `enum` while the domain uses string-literal unions (`Layout`, `Language`). Defensible — the enum gives a single importable value namespace for the presentation layer — so left as-is. | No action. |
