# Task 7.1: Documentation & Sample Deck

## Description

Project README covering what the app is, the live URL, how to install it on a
phone, the CSV format with a copyable example, and local development
instructions. Ship a realistic bilingual sample CSV. Replace placeholder PWA
icons with a simple final design.

## Acceptance Criteria

- `README.md` documents: purpose, live URL, Add-to-Home-Screen installation, the CSV column reference (which columns exist, which are required, quoting rules for multi-line text), gesture reference for the presenter screen, and local dev commands (`pnpm dev/test/check/build`)
- A sample CSV with realistic bilingual toastmaster content (≥5 slides exercising title, both languages, notes, duration, speaker) lives in the repo and is linked from the README; importing it into the deployed app succeeds
- PWA icons are a final simple design (no default/placeholder artwork), correct at 192px, 512px, and maskable
- The execution-plan and spec documents are linked from the README for posterity

## Test Cases

- The sample CSV passes the real parser (an existing parser test fixture or dedicated test consumes the actual file)

## How it contributes to the overall execution plan

Makes the project usable and maintainable without this conversation as
context; the sample deck doubles as living documentation of the CSV format.

## How it applies DDD, Clean Architecture, Clean Code and SOLID principles

Documentation reflects the ubiquitous language (deck, slide, layout) used in
code and conversation.

## Status: Complete

### Summary

- **README.md** rewritten: purpose, live URL, Add-to-Home-Screen instructions for iOS Safari and Android Chrome, full CSV column reference table with quoting rules and copyable multi-line example, gesture reference table for the presenter screen, local dev command table, link to sample deck download URL, links to design spec and execution plan for posterity; existing Dependency Rule section kept and integrated.
- **public/sample-deck.csv** created: 8 realistic bilingual wedding-toastmaster slides exercising all columns (title, text_en, text_it, notes, duration_minutes, speaker), including multi-line quoted cells and one EN-only slide.
- **src/infrastructure/csv/sample-deck-csv.test.ts** added: 6 tests feeding the actual CSV file through `PapaParseDeckCsvParser` (via Node `fs.readFileSync`) asserting correct slide count, non-empty textEn, bilingual coverage, multi-line cell presence, EN-only slide presence, and optional field coverage.
- **scripts/generate-icons.py** redesigned: two overlapping landscape rounded rectangles (amber back card + white front card with dark text-row lines) on `#121212` background; icons regenerated at 192px, 512px, and 512px maskable with 80% safe-zone scale.
