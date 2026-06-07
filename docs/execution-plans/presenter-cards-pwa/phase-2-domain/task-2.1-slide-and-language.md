# Task 2.1: Slide & Language

## Description

Implement the `Slide` value object and the `Language` concept in the domain
layer, including the invariant that a slide must have non-empty English text,
and the language-toggle behavior.

## Acceptance Criteria

- Creating a slide with non-empty `textEn` succeeds; all other fields (`title`, `textIt`, `notes`, `durationMinutes`, `speaker`) are optional
- Creating a slide with empty or whitespace-only `textEn` fails with a typed domain error (`InvalidSlideError`) carrying enough context to report a row number at higher layers
- A slide exposes whether it is bilingual (has non-empty `textIt`)
- `Language` supports exactly `'en'` and `'it'`; toggling `'en'` yields `'it'` and vice versa
- Requesting a slide's text for a language returns `textEn` for `'en'` and `textIt` for `'it'`; for `'it'` on a non-bilingual slide the behavior is explicit (no silent `undefined` leaking to the UI — return `null` or refuse, decided in implementation and tested)
- The domain module imports nothing from `application/`, `infrastructure/`, `presentation/`, or any npm package

## Test Cases

- Valid slide with only `textEn` → created, not bilingual
- Valid slide with `textEn` + `textIt` → created, bilingual
- Empty / whitespace `textEn` → `InvalidSlideError`
- Toggle en→it→en round-trips
- Text lookup per language for bilingual and non-bilingual slides (including the explicit non-bilingual `'it'` behavior)

## How it contributes to the overall execution plan

The presenter screen's language toggle and the CSV parser's row validation
both rest on these rules.

## How it applies DDD, Clean Architecture, Clean Code and SOLID principles

Invariants live with the data (DDD value object); the rule "English text is
required" exists in exactly one place. Zero dependencies keep the domain at
the center of the dependency graph.

## Architectural Decision

Non-bilingual `'it'` text lookup returns `null` (not `undefined`) so callers
get an explicit signal rather than an accidental `undefined` leaking to the UI.
Whitespace-only `textIt` is treated as absent (isBilingual = false) because a
blank Italian field in a CSV row is effectively the same as no field.

## Status: Complete

Implemented `src/domain/language.ts` (`Language` type + `toggleLanguage`),
`src/domain/slide.ts` (`Slide` interface + `createSlide` + `getSlideText`),
and `src/domain/errors.ts` (`InvalidSlideError` with optional `row` context,
`EmptyDeckError`, `InvalidDeckNameError`). All 14 tests pass, `pnpm check`
and `pnpm build` pass cleanly.
