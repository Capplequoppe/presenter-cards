# Phase 2: Domain Layer

Pure TypeScript domain model with zero external dependencies: value objects,
the `Deck` aggregate, invariants, and typed domain errors. Fully unit-tested.

## Tasks

| # | Task | Description | Status |
|---|------|-------------|--------|
| 2.1 | [Slide & Language](task-2.1-slide-and-language.md) | Slide value object with invariants; Language toggle logic | Complete |
| 2.2 | [Deck Aggregate & DeckSettings](task-2.2-deck-aggregate.md) | Deck aggregate root, DeckSettings, layout inference, fontScale bounds | Complete |

2.2 depends on 2.1.

## Status: Complete

## Review

Reviewed against task 2.1/2.2 acceptance criteria and the Domain Model
section of the design spec. All ACs verified; layer purity confirmed
(`src/domain` imports nothing outside the domain). Quality gates after
fixes: `pnpm test` 63/63 pass, `pnpm check` clean, `pnpm build` clean.

| # | Severity | Finding | Resolution |
|---|----------|---------|------------|
| 1 | Major | Inconsistent blank-field handling: whitespace-only `textIt` was treated as absent (documented decision), but blank `title`/`notes`/`speaker` were stored as-is and counted by `inferLayout` (`!== undefined`). Empty CSV cells (PapaParse yields `""`) would force `'full'`/`'title-text'` layout in Phase 4. | Fixed in 2eec006 — `createSlide` normalizes blank optional string fields to `undefined`; `getSlideText` simplified; tests added. |
| 2 | Major | Task 2.2 AC "adjustments step by 0.1" not enforced: `updateFontScale` stored arbitrary values (e.g. 1.234) and repeated ±0.1 stepping accumulated floating-point drift (1.1 + 0.1 = 1.2000000000000002) that would be persisted per deck. The stepping test only asserted a pre-computed 1.1. | Fixed in 82a3e22 — clamped value is snapped to the nearest 0.1 step; tests for drift, off-step values, and repeated stepping added. |
| 3 | Minor | `inferLayout`/`createDefaultDeckSettings` took mutable `Slide[]`, forcing a redundant `[...props.slides]` copy in `createDeck`. | Fixed in 82a3e22 — signatures widened to `ReadonlyArray<Slide>`, copy removed. |
| 4 | Suggestion | `CreateDeckProps` has no `settings` field, so Phase 4's repository must reconstruct persisted decks via `createDeck` + `updateDeckSettings` (re-running layout inference needlessly) or bypass the factory. | Left as-is — YAGNI until Phase 4; a `reconstituteDeck` factory can be added when the repository needs it. |
| 5 | Suggestion | `getSlideText` returns `string \| null` even for `'en'`, where text is guaranteed; callers must null-check both branches. | Left as-is — uniform return type is a defensible, documented API decision (task 2.1). |

Positive extras: re-import test explicitly proves layout is not re-inferred
after a manual settings change; `InvalidSlideError` row context is asserted
black-box; functional immutable aggregate style is consistent and documented.
