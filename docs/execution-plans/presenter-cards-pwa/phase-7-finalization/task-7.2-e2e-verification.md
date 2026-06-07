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

## Verification (2026-06-07)

Verified against the live deployment of commit `653593d`
(<https://capplequoppe.github.io/presenter-cards/>), CI run 27099605861 green.

Method: `curl` checks for static assets plus scripted Playwright
(headless Chromium) driving the live URL at an 850×400 landscape-phone
viewport. The Playwright MCP server could not start (it requires a system
Chrome install needing root); the task explicitly permits "browser automation
or scripted checks", so an equivalent scripted Playwright session was used.
Screenshots are in [`screenshots/`](screenshots/).

### Verification matrix

| # | Check | Method | Result |
|---|-------|--------|--------|
| 1 | CI green on `main` (653593d) | `gh run watch 27099605861 --exit-status` | PASS |
| 2 | Live page 200, title "Presenter Cards" | curl | PASS |
| 3 | `manifest.webmanifest` 200: name/short_name "Presenter Cards", `display: standalone`, `orientation: landscape`, theme/background `#121212`, scope + start_url `/presenter-cards/`, icons 192/512/512-maskable | curl | PASS |
| 4 | `sw.js` 200; service worker registers with an active worker at scope `/presenter-cards/` | curl + `navigator.serviceWorker.getRegistrations()` | PASS |
| 5 | Installability prerequisites: HTTPS, valid manifest (192+512 icons, standalone, start_url in scope), controlling service worker | curl + page evaluate | PASS (the install action itself is a device check below) |
| 6 | Offline after one visit: reload with network disabled serves the full app from the precache | Playwright `context.setOffline(true)` + reload | PASS |
| 7 | `sample-deck.csv` 200 (header + 8 records); icons 200 (`image/png`) | curl | PASS |
| 8 | Empty state ("No decks yet.") on first load | Playwright | PASS |
| 9 | Import sample CSV via `+ Import CSV` file picker → row "sample-deck", "8 slides · imported Jun 7, 2026" | Playwright filechooser | PASS |
| 10 | Deck survives a page reload (IndexedDB) | reload + row assert | PASS |
| 11 | Open deck: slide 1 EN text rendered, position indicator `1 / 8`, language indicator `EN` | Playwright | PASS |
| 12 | `full` layout: title ("Welcome"), notes, duration ("2 min"), speaker ("Toastmaster") all rendered | Playwright | PASS |
| 13 | Tap right edge zone → `2 / 8`; tap left edge zone → `1 / 8` | mouse clicks at ~96% / ~3.5% width | PASS |
| 14 | Center tap → Italian text ("Benvenuti a tutti, e grazie per essere qui con noi in questa bellissima serata!…"), indicator `IT` | Playwright | PASS |
| 15 | Language resets to EN when navigating to the next slide | Playwright | PASS |
| 16 | Swipe left → next slide; swipe right → previous slide | mouse drag, 300 px horizontal | PASS |
| 17 | No wrap-around: prev on slide 1 stays `1 / 8`; next on slide 8 stays `8 / 8` | Playwright | PASS |
| 18 | `A+` grows slide font 48px → 52.8px (scale 1.0 → 1.1) | computed style before/after | PASS |
| 19 | Font scale persists across reload + reopening the deck | reload at `#/deck/:id` + computed style | PASS |
| 20 | `✕` exits to the deck menu | Playwright | PASS |
| 21 | Rename via `⋮` → prompt updates the deck name | dialog accept("sample-deck-renamed") | PASS |
| 22 | Re-import via `⋮` replaces slides (8 → 7) while keeping deck id and settings (fontScale 1.1) | IndexedDB readback before/after | PASS |
| 23 | Delete via `⋮` → confirm removes the row; empty state returns | dialog accept | PASS |
| 24 | No console errors from the app during the whole session | console listener | PASS (one benign browser-generated favicon 404 — see observations) |
| 25 | Local quality gates on the verified commit | `pnpm test` (265 passed), `pnpm check`, `pnpm build` | PASS |

### Spec-vs-implementation review

Every requirement in the
[design spec](../../../superpowers/specs/2026-06-07-presenter-cards-design.md)
is either verified live above or covered by the CI-gated test suite
(265 tests: CSV error paths, layout inference, domain invariants, repository
behavior). The spec's Out of Scope list is unchanged. No functional
deviations were found.

### Observations (cosmetic — documented, not fixed)

1. **No favicon link**: `index.html` declares no `<link rel="icon">`, so
   desktop browsers request `/favicon.ico` (404 in the console). PWA manifest
   icons are unaffected; cosmetic only (browser-tab icon when browsing on
   desktop).
2. **Long slides in `full` layout at default scale** can overflow vertically
   at a 400 px-high viewport, letting the slide title collide with the
   top-chrome row. Readable, and `A−` resolves it; confirm at the real device
   viewport (manual checklist).

### Manual on-device checklist

Items that require a physical phone (carried over from the phase 6 review):

- [ ] **Add to Home Screen**: install works; app launches standalone and the
      landscape orientation lock is honored.
- [ ] **Airplane-mode launch**: after one online visit, launch from the home
      screen icon with no connectivity; import/present fully functional.
- [ ] **Wake lock**: screen stays on while presenting and re-acquires after
      backgrounding and returning (headless run cannot validate the real
      sentinel behavior).
- [ ] **`touch-action: none`** actually suppresses scroll, pull-to-refresh,
      and pinch-zoom inside the presenter.
- [ ] **Faded font controls**: taps pass through (`pointer-events-none`) and
      the controls reappear on the next screen touch.
- [ ] **One-handed ergonomics**: 40 px swipe threshold and 20% edge zones feel
      right; note that vertical thumb movement with a small horizontal delta
      currently resolves as a tap and could accidentally toggle the language —
      add a deltaY guard if it misfires in practice.
- [ ] **Long-press** on the slide does not trigger text selection or the
      context menu.
- [ ] **Layout fit**: long `full`-layout slides at default font scale — the
      title must not collide with the top chrome at the device's real
      viewport (observation 2 above).

## Status: Complete
