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

## Status: Pending
