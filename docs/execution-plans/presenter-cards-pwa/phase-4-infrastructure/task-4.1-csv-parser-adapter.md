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

## Status: Pending
