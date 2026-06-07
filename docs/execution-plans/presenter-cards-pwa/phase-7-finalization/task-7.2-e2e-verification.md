# Task 7.2: End-to-End Verification

## Description

Verify the complete deployed application against the design spec on the live
GitHub Pages URL: installability, offline behavior, the full import →
present → manage lifecycle, and a final spec-vs-implementation review.

## Acceptance Criteria

- CI is green on `main` and the live URL serves the latest build
- Verified on the deployed URL (browser automation or scripted checks where possible, documented manual phone checks otherwise):
  - Manifest and service worker load; the app passes an installability audit
  - After one visit, the app loads offline
  - Importing the sample CSV creates a deck; the deck survives a reload
  - Presenting: slide rendering per layout, position indicator, EN/IT center-tap toggle, edge taps and swipes, no wrap-around at ends, exit to menu
  - Rename / re-import / delete behave per spec
- A final review confirms every spec requirement is implemented or explicitly listed as out of scope; deviations are documented in this task file and resolved or accepted by the user
- All execution-plan status markers updated to reflect reality

## Steps to Reproduce

1. Open `https://capplequoppe.github.io/presenter-cards/` on a phone
2. Add to Home Screen, then enable airplane mode and relaunch
3. Import the sample CSV, open the deck, run through all gestures

## Test Cases

- This task verifies rather than adds behavior; any defect found is fixed
  TDD-style (failing test first) in the owning layer

## How it contributes to the overall execution plan

The exit gate: proof that the deployed product matches the approved design.

## How it applies DDD, Clean Architecture, Clean Code and SOLID principles

Spec-vs-implementation analysis closes the loop between the documented design
and the shipped behavior.

## Status: Pending
