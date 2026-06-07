# Task 3.2: Deck Management Use Cases

## Description

Implement the six use cases against the ports: `ImportDeck`, `ListDecks`,
`RenameDeck`, `ReimportDeck`, `DeleteDeck`, `UpdateDeckSettings`.

## Acceptance Criteria

- `ImportDeck(csvText, fileName)`: parses, builds a deck named after the file name (extension stripped), infers layout, saves, returns the new deck; on parse or domain failure nothing is saved and the typed error propagates
- `ListDecks()`: returns all decks ordered most recently imported first
- `RenameDeck(id, newName)`: persists the renamed deck; unknown id and invalid name yield typed errors
- `ReimportDeck(id, csvText)`: replaces the deck's slides per the aggregate's re-import semantics (id and settings kept, `importedAt` updated); on parse failure the stored deck is unchanged
- `DeleteDeck(id)`: removes the deck; deleting an unknown id is reported (typed error) rather than silently succeeding
- `UpdateDeckSettings(id, settings)`: persists updated layout/fontScale through the aggregate
- Use cases depend only on the ports and domain; no React, no browser APIs
- `ImportDeck` receives the current time from an injected clock (no `Date.now()` inside the use case)

## Test Cases

(All against the in-memory fakes from 3.1.)

- ImportDeck: valid CSV → deck saved and returned, name from file name without extension, layout inferred per spec rule
- ImportDeck: parse failure → error propagates, repository unchanged
- ListDecks: three decks imported at different times → newest first; empty repository → empty list
- RenameDeck: happy path; unknown id → error; empty name → error, repository unchanged
- ReimportDeck: slides replaced, id + settings kept, importedAt updated; parse failure → stored deck untouched
- DeleteDeck: removes; unknown id → error
- UpdateDeckSettings: fontScale and layout changes persisted; other state untouched

## How it contributes to the overall execution plan

This is the complete behavioral API the UI consumes; Phases 5–6 add no new
business logic.

## How it applies DDD, Clean Architecture, Clean Code and SOLID principles

Single Responsibility per use case; orchestration only — invariants stay in
the domain; clock injection keeps use cases deterministic.

## Status: Pending
