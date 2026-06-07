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

## Status: Pending
