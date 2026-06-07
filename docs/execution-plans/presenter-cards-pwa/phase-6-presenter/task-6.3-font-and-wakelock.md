# Task 6.3: Font Controls & Wake Lock

## Description

Fading A−/A+ font-scale controls persisted to deck settings, and a Wake Lock
infrastructure wrapper integrated into the presenter so the screen stays on
while presenting.

## Acceptance Criteria

- A− and A+ controls adjust the slide text size in 0.1 steps within [0.5, 2.0]; at a bound the control is disabled or no-ops (per the domain rule from 2.2)
- The adjusted fontScale is persisted via `UpdateDeckSettings`; reopening the deck presents at the saved scale
- The controls fade out after a few seconds without interaction; interacting near their area brings them back; taps on the controls do not trigger slide navigation or language toggle
- A Wake Lock wrapper in `infrastructure/` exposes acquire/release behind a small interface; on browsers without the Wake Lock API it degrades to a no-op without throwing
- The wake lock is requested when the presenter mounts and released when leaving the presenter
- The lock is re-acquired when the page becomes visible again after backgrounding (Wake Lock API releases on visibility loss)

## Test Cases

- A+ from 1.0 → 1.1 rendered larger and `UpdateDeckSettings` invoked with 1.1 (observable via fake repository)
- At 2.0, A+ does not exceed bound; at 0.5, A− does not go below
- Reopening deck → saved scale applied
- Controls hidden after fade timeout (fake timers); reappear on interaction; control tap does not navigate/toggle
- Fake wake-lock interface: acquired on mount, released on unmount, re-acquired on visibilitychange to visible
- Absent Wake Lock API → no error, presenter fully functional

## How it contributes to the overall execution plan

The two "mid-event survival" features: readable text at arm's length and a
screen that never sleeps during a speech.

## How it applies DDD, Clean Architecture, Clean Code and SOLID principles

fontScale bounds enforced by the domain, UI merely renders; Wake Lock is a
browser API behind an infrastructure interface (DIP), trivially faked in
tests.

## Status: Complete

### Summary

**Part A — Wake Lock infrastructure:**
- `src/infrastructure/wake-lock/screen-wake-lock.ts` — `ScreenWakeLock` interface with `acquire()`/`release()`
- `src/infrastructure/wake-lock/browser-wake-lock.ts` — `BrowserWakeLock` using `navigator.wakeLock`; degrades silently when API absent
- `src/infrastructure/wake-lock/fake-wake-lock.ts` — `FakeWakeLock` with observable `isAcquired`, `acquireCount`, `releaseCount`
- `src/infrastructure/wake-lock/index.ts` — barrel export
- `src/infrastructure/index.ts` — re-exports `ScreenWakeLock`, `BrowserWakeLock`, `FakeWakeLock`
- `src/presentation/composition-root/services-context.tsx` — `Services` interface + `ServicesProvider` + `useServices` hook (parallel to `UseCasesContext`)
- `src/presentation/composition-root/index.ts` — exports `Services`, `ServicesProvider`, `useServices`
- `src/presentation/composition-root/render-with-use-cases.tsx` — extended to provide `ServicesProvider` with `FakeWakeLock` in tests
- `src/presentation/pages/presenter/use-wake-lock.ts` — hook: acquires on mount, releases on unmount, re-acquires on `visibilitychange` to visible
- `src/presentation/pages/presenter/use-wake-lock.test.ts` — 5 tests covering mount/unmount/visibility/absent-API

**Part B — Font controls:**
- `src/presentation/pages/presenter/use-fading-visibility.ts` — hook that fades to invisible after 3 s of inactivity; `keepVisible()` resets the timer
- `src/presentation/pages/presenter/FontControls.tsx` — A−/A+ buttons; adjusts fontScale via `updateFontScale` (domain rule); persists via `UpdateDeckSettings`; fades out; stops event propagation
- `src/presentation/pages/presenter/FontControls.test.tsx` — 10 tests: A+ 1.0→1.1, bounds disable, no-op at bounds, persistence, fade timeout, fade reset on interaction, no navigation side effect
- `src/presentation/pages/presenter/PresenterPage.tsx` — minimal additions: imports `FontControls`, `useWakeLock`, `useServices`; lifts `settings` state for immediate font feedback; wires `FontControls` in bottom-right overlay
- `src/presentation/App.tsx` — provides `ServicesProvider` with `BrowserWakeLock` alongside `UseCasesProvider`

**Deleted:** `src/presentation/pages/PresenterPlaceholder.tsx` — dead file, not imported anywhere

**Quality gates:** 228 tests pass, `pnpm check` clean, `pnpm build` succeeds.
