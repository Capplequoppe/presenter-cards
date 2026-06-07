# Task 5.3: Deck Actions

## Description

Per-deck `⋮` menu on the deck list with Rename, Re-import, and Delete
actions, including delete confirmation and re-import file picking.

## Acceptance Criteria

- Each deck row exposes a menu with exactly: Rename, Re-import, Delete
- Rename: prompts for a new name pre-filled with the current one; confirming updates the row immediately; empty name is rejected with a visible message and no change
- Re-import: opens the file picker; a valid CSV replaces the deck's slides (row's slide count and import date update) while name and position-relevant settings remain; a parse failure shows the error and leaves the deck untouched
- Delete: asks for confirmation naming the deck; confirming removes the row; cancelling changes nothing
- All action failures (including storage errors) surface as dismissible messages, never silent

## Test Cases

(Component tests with fakes.)

- Rename happy path; rename to empty → rejected, message shown
- Re-import valid CSV → slide count and date update, name/settings preserved
- Re-import with parse error → message shown, deck unchanged
- Delete: confirm → row gone; cancel → row remains
- Storage error on each action → message shown

## How it contributes to the overall execution plan

Completes the import-only deck lifecycle chosen in the design (spreadsheet as
source of truth, re-import to update).

## How it applies DDD, Clean Architecture, Clean Code and SOLID principles

UI delegates to `RenameDeck`/`ReimportDeck`/`DeleteDeck`; replacement
semantics (keep id and settings) live in the aggregate, not the component.

## Status: Complete

Implemented DeckActionsMenu component (src/presentation/pages/deck-menu/DeckActionsMenu.tsx) with:
- ⋮ button per row triggering a dropdown with Rename, Re-import, Delete
- Rename: uses window.prompt pre-filled with current name; empty input rejected with inline error message; success updates list immediately
- Re-import: file picker via hidden input; valid CSV replaces slides (count+date update) while name and settings preserved; parse failure shows error, deck untouched
- Delete: window.confirm naming the deck; confirm removes row; cancel = no-op
- All action failures (StorageError, CsvParseError) surfaced as dismissible ErrorBanner via DeckMenuPage's onError callback

10 component tests covering all action paths (rename happy/cancel/empty/storage, re-import success/parse-error/storage-error, delete confirm/cancel/storage-error). All 183 tests pass.
