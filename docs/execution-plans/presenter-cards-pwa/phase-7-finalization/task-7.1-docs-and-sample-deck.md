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

## Status: Pending
