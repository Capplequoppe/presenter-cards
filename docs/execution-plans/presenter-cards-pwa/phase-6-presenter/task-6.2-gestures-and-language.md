# Task 6.2: Gesture Navigation & Language Toggle

## Description

The hybrid gesture model on the presenter screen: swipe left/right anywhere
and edge tap zones for prev/next, center tap for EN ⇄ IT toggle.

## Acceptance Criteria

- Swiping left anywhere advances to the next slide; swiping right goes to the previous slide
- Tapping the right edge zone (~20% width) advances; tapping the left edge zone goes back
- Tapping the center zone toggles the displayed language EN ⇄ IT on a bilingual slide; on a slide without `textIt` the tap does nothing visible
- On the first slide, "previous" does nothing; on the last slide, "next" does nothing (no wrap-around, no crash)
- A swipe is not also interpreted as a tap (movement threshold distinguishes them)
- Language resets to English when navigating to a different slide
- Navigation gestures do not scroll, zoom, or trigger browser navigation (touch defaults suppressed within the presenter)

## Architectural Decision

No wrap-around at deck ends: mid-speech, silently jumping from last slide to
first is worse than a dead gesture. Language resets per slide because each
announcement starts in English (user's stated speaking order).

## Test Cases

(Component tests simulating pointer/touch events.)

- Swipe left → index +1; swipe right → index −1
- Right-edge tap → +1; left-edge tap → −1; indicator updates
- Center tap on bilingual slide → Italian text shown; again → English
- Center tap on EN-only slide → text unchanged
- Previous on first / next on last → index unchanged
- Touch-move below threshold counts as tap; above counts as swipe
- Navigating after toggling to IT → new slide shows EN

## How it contributes to the overall execution plan

This is the thumb-driven interaction that motivated the entire app.

## How it applies DDD, Clean Architecture, Clean Code and SOLID principles

Gesture interpretation (pixels → intents like next/prev/toggle) is separated
from presenter state transitions, each unit testable alone; toggle rules rest
on the domain's `Language`/bilingual logic from 2.1.

## Status: Pending
