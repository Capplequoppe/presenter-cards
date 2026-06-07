# Phase 4: Infrastructure Layer

Concrete adapters for the application ports: PapaParse-backed CSV parsing
with full validation, and an IndexedDB deck repository.

## Tasks

| # | Task | Description | Status |
|---|------|-------------|--------|
| 4.1 | [PapaParse CSV Parser Adapter](task-4.1-csv-parser-adapter.md) | CSV → slides with validation and readable errors | Complete |
| 4.2 | [IndexedDB Deck Repository](task-4.2-indexeddb-repository.md) | Persistent DeckRepository implementation | Complete |

Tasks are independent and may be implemented in parallel.

## Status: Complete

## Review

Reviewed 2026-06-07. All task 4.1 and 4.2 acceptance criteria verified MET.
Layer purity confirmed: papaparse/idb/fake-indexeddb imports exist only inside
`src/infrastructure/`; no domain/application file references infrastructure.
`reconstituteDeck` is sound, fully tested, and consistent with domain style.

| # | Severity | Finding | Resolution |
|---|----------|---------|------------|
| 1 | Minor | Header-only file threw `CsvParseErrorKind.MissingHeader`, contradicting the port's documented semantics ("header row is missing entirely") — the AC groups header-only with empty file under "no slides" | Fixed (f4fe76c): now throws `EmptyFile`; test added |
| 2 | Minor | Dead code in parser: unreachable `slides.length === 0` guard in `buildSlides`; unused `_rowNumber` parameter in `parseDuration` | Fixed (refactor commit): removed |
| 3 | Minor | `PapaParseDeckCsvParser` did not declare `implements DeckCsvParser` (repository declares its port; inconsistent, hides port drift) | Fixed: clause added |
| 4 | Minor | CSV adapter not exported from `src/infrastructure/index.ts` (no `csv/` barrel) — Phase 5 composition root needs it | Fixed: barrel added, exported |
| 5 | Minor | No tests for CRLF line endings (Excel default), quoted CRLF cells, rows with extra cells, duplicate headers — behavior verified correct via PapaParse probes, but unguarded | Fixed: 6 characterization tests added (156 → 162) |
| 6 | Note | `MissingHeader` kind is now never produced by the real parser: with `header: true` PapaParse always treats row 1 as the header, so a headerless file surfaces as `UnrecognizedHeader` listing the data found. Phase 5 should not build UI flows expecting `MissingHeader` | Left as-is — enum member kept for port semantics |
| 7 | Note | Mid-file blank lines are reported as empty `text_en` with the 1-based row number (only trailing blanks are stripped) | Left as-is — accurate, actionable, all-or-nothing per spec |
| 8 | Note | `deleteById` uses get-then-delete in two transactions (non-atomic) | Left as-is — single-user PWA, no concurrent writers |
| 9 | Note | Task 4.2 doc says `reconstituteDeck` "rebuilds slides via createSlide"; in code the repository's `fromPersisted` does that before calling `reconstituteDeck` | Left as-is — combined read path matches the decision's intent |

Verification after fixes: `pnpm test` 162 passed, `pnpm check` clean, `pnpm build` succeeds.
