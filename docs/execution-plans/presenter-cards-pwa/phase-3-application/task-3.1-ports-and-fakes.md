# Task 3.1: Ports & In-Memory Fakes

## Description

Define the application-layer ports — `DeckRepository` (persistence) and
`DeckCsvParser` (CSV → validated slide data) — and provide in-memory fake
implementations used by use-case and presentation tests.

## Acceptance Criteria

- `DeckRepository` port covers: save (create/overwrite by id), find by id, list all, delete by id; all asynchronous
- `DeckCsvParser` port accepts raw CSV text plus a fallback deck name and returns either parsed slide data sufficient to build a `Deck`, or a typed parse failure (`CsvParseError`) carrying a human-readable message — distinguishing at minimum: missing/unrecognized header, row(s) with empty `text_en` (with row numbers), empty file
- In-memory `FakeDeckRepository` behaves observably like a real one: saved decks can be found, listed, deleted; finding a missing id reports not-found
- A `FakeDeckCsvParser` (or builder utilities) lets tests produce successful and failing parses without real CSV text
- Ports are defined in `application/`; fakes import only domain + application types

## Additional Notes

- Failure channel (thrown typed errors vs Result type) is a single consistent
  convention decided here and used by all use cases and adapters

## Architectural Decision

**Failure channel: thrown typed errors (not Result type).**

The domain layer already throws typed errors (`InvalidSlideError`, `EmptyDeckError`, `InvalidDeckNameError`). Consistency across all layers is a strong argument for the same pattern in the application layer. All ports and use cases throw typed Error subclasses on failure; callers use try/catch. This avoids a dual-convention burden and keeps error handling idioms uniform across the entire codebase.

Alternatives considered: a `Result<T, E>` type (functional style). Rejected because: (1) the domain already throws, (2) mixing throw/Result in different layers increases cognitive load, (3) TypeScript does not enforce exhaustive Result handling at the type level unless every caller wraps results.

**Hand-written fakes over a mocking library:** the ports are small, fakes give
black-box behavioral tests, and no mock framework dependency is needed
(testing-anti-patterns: test what the code does, not what the mock does).

## Test Cases

- FakeDeckRepository: save → find returns equal deck; list returns all saved; delete removes; find missing id → not-found
- Fake parser: configured success yields slide data; configured failure yields the configured `CsvParseError`

## How it contributes to the overall execution plan

Ports decouple Phases 5–6 (UI) from Phase 4 (adapters); fakes make every
use-case and component test fast and deterministic.

## How it applies DDD, Clean Architecture, Clean Code and SOLID principles

Dependency Inversion: application owns the interfaces, infrastructure
implements them. Interface Segregation: two small ports instead of one broad
"storage service".

## Status: Complete

Implemented `DeckRepository` and `DeckCsvParser` ports in `src/application/ports/`, with `DeckNotFoundError`, `CsvParseError` (carrying `kind: CsvParseErrorKind` and optional `rows`), and `ParsedDeckData`. In-memory fakes `FakeDeckRepository` and `FakeDeckCsvParser` live in `src/application/testing/` (exported cleanly for reuse in later phases). Failure channel: thrown typed errors, consistent with the domain layer. 13 new tests, all passing. `pnpm test`, `pnpm check`, and `pnpm build` all pass.
