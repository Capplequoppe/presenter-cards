# Task 4.1: PapaParse CSV Parser Adapter

## Description

Implement the `DeckCsvParser` port with PapaParse: header-based column
mapping, validation, and human-readable error reporting per the spec's CSV
format.

## Acceptance Criteria

- Recognizes columns `title`, `text_en`, `text_it`, `notes`, `duration_minutes`, `speaker` case-insensitively; unknown columns are ignored
- A file whose header lacks `text_en` fails with a message listing the columns found and the required column
- Quoted cells containing commas, double quotes, and newlines parse into single field values (verbatim multi-line scripts survive intact)
- Rows with empty/whitespace `text_en` fail with a message naming the offending row number(s) (1-based, counting data rows below the header)
- An empty file or header-only file fails with a "no slides" message
- `duration_minutes` parses to a number; non-numeric values are reported with the row number rather than silently dropped
- A UTF-8 BOM does not break header recognition
- Blank trailing lines are ignored, not treated as invalid rows
- Validation is all-or-nothing: any invalid row fails the whole parse (no partial slide list returned)
- All failures are the typed `CsvParseError` from the application layer with messages suitable for direct display

## Test Cases

- Full-featured CSV (all columns, quoted multi-line bilingual text) → correct slides in order
- Minimal CSV (`text_en` only) → slides created
- Mixed/upper-case headers (`Text_EN`) → recognized
- Missing `text_en` column → error listing found vs required
- Rows 2 and 4 with empty `text_en` → error naming rows 2 and 4
- Empty file, header-only file → "no slides" error
- Non-numeric `duration_minutes` → error with row number
- BOM-prefixed file → parses
- Unknown extra columns → ignored
- Trailing blank lines → ignored

## How it contributes to the overall execution plan

This is the import quality gate — the most error-prone external input in the
app, and the reason PapaParse was chosen over hand-rolled parsing.

## How it applies DDD, Clean Architecture, Clean Code and SOLID principles

Adapter pattern: PapaParse is invisible above this module; swapping CSV
libraries touches one file. Validation messages are produced where the
knowledge lives, typed errors carry them outward.

## Architectural Decision

`CsvParseErrorKind` was extended with `InvalidDuration = "InvalidDuration"` to
cover non-numeric `duration_minutes` values. The existing kinds (`EmptyFile`,
`MissingHeader`, `UnrecognizedHeader`, `EmptyTextEn`) did not represent this
failure category. The new kind follows the same pattern: it carries `rows`
(1-based row numbers of offending cells) so the presentation layer can
surface precise, row-keyed feedback without string-matching.

The `CsvParseErrorDetails.rows` field now documents that it is used by both
`EmptyTextEn` and `InvalidDuration`.

`FakeDeckCsvParser` was not changed — the enum addition is backward-compatible.

## Status: Complete

Implemented `PapaParseDeckCsvParser` in
`src/infrastructure/csv/papa-parse-deck-csv-parser.ts`.

- Full TDD: 34 tests covering all 10 test-case groups from the task file;
  all 125 project tests pass.
- `CsvParseErrorKind` extended with `InvalidDuration` (see Architectural
  Decision above).
- `src/infrastructure/.gitkeep` removed; `src/infrastructure/csv/` created.
- Key design choices:
  - `skipEmptyLines: false` so row numbers are preserved; trailing blank rows
    (all cells `""`) stripped before processing so they do not count as errors.
  - Validation is all-or-nothing: `emptyTextEnRows` and `invalidDurationRows`
    are accumulated across all rows and a single `CsvParseError` is thrown.
  - BOM stripped manually before passing to PapaParse.
  - Case-insensitive header mapping via a `Map<RecognizedColumn, actualHeader>`.
- `pnpm check`, `pnpm test`, and `pnpm build` all pass.
