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

## Status: Pending
