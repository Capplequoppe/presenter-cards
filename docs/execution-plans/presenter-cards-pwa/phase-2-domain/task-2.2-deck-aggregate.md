# Task 2.2: Deck Aggregate & DeckSettings

## Description

Implement the `Deck` aggregate root and `DeckSettings` value object:
construction invariants, layout inference from slide content, font-scale
bounds, rename, settings update, and re-import (content replacement)
semantics.

## Acceptance Criteria

- Creating a deck requires a non-empty name and at least one slide; an empty slide list fails with `EmptyDeckError`; an empty/whitespace name fails with a typed error
- A new deck gets a generated unique id and an `importedAt` timestamp supplied by the caller (no clock access inside the domain)
- Layout inference: any slide with `notes`, `durationMinutes`, or `speaker` → `'full'`; else any slide with `title` → `'title-text'`; else `'text-only'`
- `fontScale` is clamped to [0.5, 2.0]; default 1.0; adjustments step by 0.1; values outside bounds are rejected or clamped (decided in implementation and tested)
- Renaming produces a deck with the new name and otherwise identical state; empty name rejected
- Updating settings (layout, fontScale) preserves id, name, slides, `importedAt`
- Re-import semantics: replacing a deck's slides keeps id and settings, updates `importedAt`, re-runs nothing implicitly (layout is NOT re-inferred — settings are user state once created)
- Slide order is preserved exactly as given

## Architectural Decision

Re-import keeps existing settings rather than re-inferring layout: the user
may have manually changed layout/fontScale, and a content update must not
silently revert their choices.

## Test Cases

- Deck with ≥1 slide created; empty slide list → `EmptyDeckError`; empty name → error
- Layout inference for the three cases (metadata → `full`; titles only → `title-text`; bare text → `text-only`)
- fontScale: default 1.0, clamp/reject at both bounds, 0.1 stepping
- Rename happy path + empty-name rejection
- Re-import: new slides, same id/settings, updated `importedAt`
- Settings update preserves all other state

## How it contributes to the overall execution plan

Every use case in Phase 3 manipulates decks exclusively through this
aggregate.

## How it applies DDD, Clean Architecture, Clean Code and SOLID principles

Aggregate root guards all deck invariants (DDD); timestamp injection keeps
the domain pure and deterministic (testability, DIP for time).

## Status: Pending
