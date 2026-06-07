# Phase 6: Presenter Screen

The core event-time experience: fullscreen landscape slide rendering per deck
layout, hybrid gesture navigation, EN/IT toggle, fading font-scale controls,
and screen wake lock.

## Tasks

| # | Task | Description | Status |
|---|------|-------------|--------|
| 6.1 | [Presenter Page & Slide Rendering](task-6.1-presenter-page.md) | Fullscreen layout, three deck layouts, position indicator, exit | Complete |
| 6.2 | [Gesture Navigation & Language Toggle](task-6.2-gestures-and-language.md) | Swipes + tap zones, center-tap EN ⇄ IT | Complete |
| 6.3 | [Font Controls & Wake Lock](task-6.3-font-and-wakelock.md) | Fading A−/A+ controls with persistence, Wake Lock wrapper + integration | Complete |

6.2 and 6.3 depend on 6.1; 6.2 and 6.3 are independent of each other.

## Status: Complete

## Review

Reviewed 2026-06-07 against tasks 6.1–6.3 and the spec's Presenter +
Error Handling sections. All acceptance criteria MET after fixes.
Baseline gates passed before review (248 tests); after fixes: 265 tests,
`pnpm check` clean, `pnpm build` succeeds.

| # | Severity | Finding | Resolution |
|---|----------|---------|------------|
| 1 | Critical | Faded font controls could never reappear in a real browser: `useFadingVisibility` lived inside `FontControls`, whose wrapper gets `pointer-events-none` once faded, making its own `keepVisible` handlers unreachable (jsdom masked this — `fireEvent` ignores pointer-events CSS). Violated 6.3 AC "interacting near their area brings them back". | Fixed (05da3e7): visibility lifted to `LoadedPresenter`; any pointerdown on the presenter root calls `keepVisible`; regression test added. |
| 2 | Major | Merge interaction 6.2+6.3: taps on the `FontControls` wrapper (gap between A− and A+, bottom-right = right-edge zone) leaked into gesture handling and advanced the slide — the wrapper only stopped `click` propagation while navigation is driven by `pointerup`, and the gesture guard checked only the target's own tag. Violated 6.3 AC "taps on the controls do not trigger slide navigation". | Fixed (2ceacd7): gesture guard now uses `closest()` over interactive elements plus a `data-gesture-ignore` opt-out carried by the controls wrapper (also covers button descendants); hook + component regression tests added. |
| 3 | Major | Generic deck-load failures (anything other than `DeckNotFoundError`) were silently swallowed, leaving a permanent black screen — spec Error Handling requires storage failures never produce a blank screen. | Fixed (a720ea5): any load failure now redirects to the menu (consistent with unknown-id behavior; the menu's error banner surfaces storage problems); test added. |
| 4 | Major | Task 6.2 prescribes component tests simulating pointer events, but only hook-level tests existed; the `PresenterPage` ↔ `useGestures` wiring (callback mapping, container width) was unverified. | Fixed (1a5d690): six component-level gesture tests added (swipes, edge taps, bilingual center-tap with rendered Italian text, EN-only no-op, no wrap-around, language reset). Wiring verified correct — no production change needed. |
| 5 | Minor | `usePresenter` called `setLanguage` inside the `setCurrentIndex` updater — a side effect inside a React state updater that must be pure (worked only because idempotent). | Fixed (868e83c): index + language combined into one state value with pure transition functions; behavior unchanged, guarded by existing tests. |
| 6 | Minor | 6.3 test case "Absent Wake Lock API → no error" was only exercised via `FakeWakeLock`; `BrowserWakeLock` (the production adapter the AC describes) had no tests. | Fixed (3641b23): `browser-wake-lock.test.ts` added — absent-API no-op, screen-lock request, sentinel release, silent degradation on rejected request/stale sentinel. |

Left as-is (defensible):
- `GetDeck` architectural decision (task 6.1) — sound: dedicated thin use case
  over filtering `ListDecks` in presentation; consistent with the existing
  use-case pattern and wired into both composition roots.
- `ServicesProvider` separate from `UseCasesProvider` — clean DIP seam for
  browser APIs; mirrors the established context pattern.
- sr-only Previous/Next buttons — keyboard/test affordance beyond plan scope
  (positive extra).
- Layout read from `deck.settings.layout` while fontScale uses lifted local
  state — equivalent since `FontControls` only mutates `fontScale`.
- `pointercancel` not handled in `useGestures` — stale state is overwritten on
  the next pointerdown; no reachable misfire path identified.

Verify on a real device (task 7.2 checklist):
- `touch-action: none` actually suppresses scroll/pull-to-refresh/pinch-zoom in
  the presenter (CSS behavior not observable in jsdom).
- Faded controls let taps pass through (`pointer-events-none`) and reappear on
  the next screen touch.
- Wake lock keeps the screen on and re-acquires after backgrounding
  (only `FakeWakeLock` is exercised in jsdom).
- Ergonomics: 40 px swipe threshold and 20% edge zones feel right one-handed;
  vertical finger movement with small horizontal delta currently resolves as a
  tap (could accidentally toggle language) — add a deltaY guard if it misfires.
- Long-press does not trigger text selection or the context menu on the slide.
