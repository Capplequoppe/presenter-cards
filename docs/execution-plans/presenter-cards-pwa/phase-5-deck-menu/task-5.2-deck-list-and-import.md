# Task 5.2: Deck List & Import Flow

## Description

The deck menu page: list of imported decks (name, slide count, import date,
newest first), an "Import CSV" action opening the native file picker, success
feedback, and readable error display for every import failure mode.

## Acceptance Criteria

- With no decks stored, the page shows an empty state inviting the first CSV import
- With decks stored, each row shows name, slide count, and import date, ordered most recently imported first
- "Import CSV" opens a file picker (accepting `.csv` / `text/csv`); choosing a valid file adds the deck to the list without a page reload
- The new deck's name is the file name without extension
- Each parser failure mode (missing `text_en` column, empty rows with row numbers, empty file) is displayed to the user verbatim from the typed error — readable, dismissible, and the list stays unchanged
- A storage failure during import is shown as a dismissible error message, not a blank screen or silent failure
- Tapping a deck row navigates to the presenter route for that deck

## Test Cases

(Component tests with fakes via the 5.1 test helper.)

- Empty repository → empty state visible
- Three decks → rendered newest-first with name, count, date
- Successful import → deck appears in list; deck name = file name sans extension
- Parser error (each variant) → message shown, list unchanged
- Repository save error → error message shown
- Tap deck row → navigation to presenter route with the deck id

## How it contributes to the overall execution plan

First fully usable end-to-end slice: author CSV → import on the phone →
deck persisted offline.

## How it applies DDD, Clean Architecture, Clean Code and SOLID principles

Page is a thin orchestrator over `ListDecks`/`ImportDeck`; error-message
content comes from typed errors produced where the knowledge lives, the page
only renders them.

## Status: Complete

Implemented DeckMenuPage with full deck list, import flow, and error handling:
- Empty state when no decks stored with prompt to import
- Deck list ordered newest-first with name, slide count ("N slide(s)"), and localized import date
- Import CSV button (header) + hidden file input (accept .csv,text/csv); successful import adds deck immediately
- Deck name derived from file name sans extension via ImportDeck use case
- CsvParseError messages displayed verbatim in a dismissible ErrorBanner
- StorageError shown as dismissible ErrorBanner, list unchanged
- Tapping a deck row navigates to #/deck/:id presenter route

Sub-components: ErrorBanner, ImportButton, DeckActionsMenu (stub fleshed out in 5.3).
renderWithUseCases test helper extended with `csvParser` and `repository` options.
8 component tests (DeckMenuPage.test.tsx). All 173 tests pass.
