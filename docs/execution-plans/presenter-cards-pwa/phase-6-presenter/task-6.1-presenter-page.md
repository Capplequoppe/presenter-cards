# Task 6.1: Presenter Page & Slide Rendering

## Description

The presenter route: loads the deck by id, renders the current slide
fullscreen on a black background according to the deck's layout setting, with
position indicator, language indicator, and exit control.

## Acceptance Criteria

- Navigating to the presenter route with a stored deck id shows the first slide; an unknown id redirects to the deck menu
- Slide text is centered and large on a black background
- Layout rendering: `text-only` shows only the slide text; `title-text` additionally shows the title above the text (when present); `full` additionally shows `notes`, `durationMinutes`, and `speaker` (when present) in a visually secondary style
- Position indicator reads "current / total" (e.g. `3 / 14`) and updates with navigation
- Language indicator at top-center shows the active language; it is hidden on slides without `textIt`
- A discreet exit control (top-left ✕) returns to the deck menu
- The currently displayed language's text is shown; slides default to English when first shown

## Additional Notes

- Landscape is enforced socially (the user holds the phone that way) plus the
  manifest orientation hint from 1.2; no JS orientation locking required
- Navigation state (current index, language) lives in a presenter hook so 6.2
  can drive it from gestures

## Test Cases

(Component tests with fakes.)

- Valid deck id → first slide text rendered, indicator `1 / N`
- Unknown deck id → redirected to menu
- Each layout setting renders/hides the right fields (slides with and without optional fields)
- Bilingual slide → language indicator visible; EN-only slide → hidden
- Exit control navigates to menu

## How it contributes to the overall execution plan

The page everything in Phase 6 builds on; after this task a deck is viewable
end to end on the live URL.

## How it applies DDD, Clean Architecture, Clean Code and SOLID principles

Layout variants are renderings of domain state (`DeckSettings.layout`) —
presentation switches on domain values, no business rules in components.

## Architectural Decision: GetDeck use case

The original use-case list (ImportDeck, ListDecks, RenameDeck, ReimportDeck,
DeleteDeck, UpdateDeckSettings) did not include a GetDeck use case. The
presenter route must load a single deck by id from the URL hash. Two options
were considered:

1. **Reuse ListDecks, filter in the presentation layer** — couples the
   presenter to a list concern; all decks are loaded even though only one is
   needed; violates SRP.

2. **Add a dedicated GetDeck use case** (chosen) — thin pass-through to
   `repository.findById`; keeps the intent explicit; makes the repository
   dependency testable in isolation; consistent with all other use cases in the
   application layer.

GetDeck was therefore added to `src/application/use-cases/get-deck.ts` and
wired into the composition root alongside the other use cases.

## Status: Complete

Implemented:

- `src/application/use-cases/get-deck.ts` — new GetDeck use case
  (`repository.findById` pass-through); exported from application index.
- `src/application/use-cases/get-deck.test.ts` — 2 tests (found/not-found).
- `src/presentation/pages/presenter/use-presenter.ts` — `usePresenter` hook:
  bounded navigation (no wrap-around), language defaulting to 'en', language
  reset on slide change, exposes `goNext`/`goPrevious`/`toggleLanguage` for
  task 6.2 gesture wiring.
- `src/presentation/pages/presenter/use-presenter.test.ts` — 11 tests.
- `src/presentation/pages/presenter/PresenterPage.tsx` — replaces
  PresenterPlaceholder; loads deck by id, redirects to menu on unknown id,
  black fullscreen layout, slide text large + centered with fontScale applied,
  layout variants (text-only / title-text / full), position indicator top-right,
  language indicator top-center (hidden on EN-only slides), ✕ exit top-left.
  Includes sr-only navigation buttons (Previous/Next) for test and keyboard
  access; gesture handling deferred to task 6.2.
- `src/presentation/pages/presenter/PresenterPage.test.tsx` — 11 tests covering
  all acceptance criteria.
- Updated composition root (`use-cases-context.tsx`, `real-use-cases.ts`,
  `render-with-use-cases.tsx`) to include GetDeck.
- Updated `App.tsx` to render `PresenterPage` (with `deckId` prop) instead of
  `PresenterPlaceholder`; updated `App.test.tsx`.

Test counts: 213 total (23 test files), all passing.
`pnpm check` (Biome) passes. `pnpm build` succeeds.
