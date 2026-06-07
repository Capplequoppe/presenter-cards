# Task 4.2: IndexedDB Deck Repository

## Description

Implement the `DeckRepository` port on IndexedDB: schema/versioning,
serialization of the `Deck` aggregate, and reconstruction of domain objects on
read.

## Acceptance Criteria

- Saved decks survive a "page reload" (new repository instance over the same database finds them)
- Save overwrites by deck id (re-import and rename persist as the same record)
- Find by id returns a fully reconstructed `Deck` aggregate (methods/invariants intact, not a bare JSON blob); missing id reports not-found via the convention from 3.1
- List returns all stored decks; delete removes exactly the targeted deck
- Database name and store schema are versioned so future migrations are possible
- IndexedDB failures (e.g. storage denied) surface as a typed infrastructure error, not an unhandled rejection
- No layer above infrastructure imports anything IndexedDB-specific

## Additional Notes

- Tested with `fake-indexeddb` in Vitest
- A thin promise wrapper (e.g. the `idb` package) may be used; decide at
  implementation time — it stays inside this adapter either way

## Test Cases

(Against `fake-indexeddb`.)

- Save → find returns deck equal in value to the saved one, including slides order and settings
- Save twice with same id → one record, latest content
- New repository instance over same DB → previously saved decks found (persistence)
- List with 0 and N decks; delete removes only the target
- Find/delete on missing id → not-found per convention
- Reconstructed deck enforces invariants (e.g. rename to empty name on a loaded deck still fails)

## How it contributes to the overall execution plan

Device-local persistence is what makes decks available offline at the venue.

## How it applies DDD, Clean Architecture, Clean Code and SOLID principles

Repository pattern (DDD): aggregates go in, aggregates come out; persistence
shape is a private concern of this adapter (Liskov-substitutable with the
in-memory fake).

## Architectural Decision

**`reconstituteDeck` factory for reading from storage (pre-approved by phase-2 review, finding #4)**

`createDeck` always re-infers the layout from slides. This means that if a user changes the layout setting (e.g., from "full" to "text-only") and the deck is saved and reloaded, the original inference would silently overwrite their choice on every read.

To resolve this, a `reconstituteDeck` factory was added to `src/domain/deck.ts`. It accepts a `ReconstituteDeckProps` that includes the full `DeckSettings` (including the stored `layout`). It:
- Validates name non-empty and slides non-empty (same invariants as `createDeck`)
- Rebuilds slides via `createSlide` (re-derives `isBilingual`)
- Re-applies `updateFontScale` clamping/snapping as a corruption guard
- Preserves the stored `layout` value exactly — no re-inference

Alternatives considered:
- Passing `settings` to `createDeck` via an optional field — rejected: muddies the "new deck" creation path and the layout inference concern.
- Using `Object.assign` directly — rejected: bypasses invariant validation entirely.

`reconstituteDeck` is exported from `src/domain/index.ts` and has full test coverage in `src/domain/deck.test.ts`.

## Status: Complete

### Summary

Implemented the `DeckRepository` port on IndexedDB with full TDD coverage.

**Files created:**
- `src/infrastructure/storage/indexed-db-deck-repository.ts` — `IndexedDbDeckRepository` class implementing `DeckRepository` using the `idb` library with a typed `PresenterCardsDbSchema`. Supports injectable `DbFactory` for test isolation without ESM module patching. DB: "presenter-cards" v1, store: "decks".
- `src/infrastructure/storage/storage-error.ts` — `StorageError` class wrapping IndexedDB failures.
- `src/infrastructure/storage/index.ts` — barrel export for the storage module.
- `src/infrastructure/index.ts` — barrel export for infrastructure.
- `src/infrastructure/storage/indexed-db-deck-repository.test.ts` — 30 tests covering all acceptance criteria using `fake-indexeddb/auto`.

**Files modified:**
- `src/domain/deck.ts` — added `reconstituteDeck` factory and `ReconstituteDeckProps` interface.
- `src/domain/index.ts` — exported `reconstituteDeck` and `ReconstituteDeckProps`.
- `src/domain/deck.test.ts` — added 9 tests for `reconstituteDeck`.

**Verification:** 131 tests pass, `pnpm check` clean, `pnpm build` succeeds.
