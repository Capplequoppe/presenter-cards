# Presenter Cards — Design Specification

**Date:** 2026-06-07
**Status:** Approved by user (brainstorming session)

## Purpose

A PWA used by a toastmaster at events, replacing printed prompt and reference
cards. The phone is held horizontally in one hand; the thumb drives navigation.
The toastmaster speaks every announcement twice — in English (fluent) and
Italian (B1) — so slides carry near-verbatim scripts in both languages.

## Core User Flows

1. **Author** deck content in a spreadsheet → export CSV → import into the app.
2. **At the event**: open the app (offline-capable), pick a deck, present —
   swipe/tap through slides, tap center to flip EN ⇄ IT.

## Domain Model

### Deck (aggregate root)

| Field        | Type           | Notes                                      |
| ------------ | -------------- | ------------------------------------------ |
| `id`         | string         | Generated at import (UUID)                 |
| `name`       | string         | From filename at import; renameable        |
| `settings`   | `DeckSettings` | Per-deck presentation settings             |
| `slides`     | `Slide[]`      | Ordered; **invariant: at least one slide** |
| `importedAt` | timestamp      | Set at import/re-import                    |

### Slide

| Field             | Type    | Required | Notes                              |
| ----------------- | ------- | -------- | ---------------------------------- |
| `title`           | string  | no       |                                    |
| `textEn`          | string  | **yes**  | Invariant: non-empty               |
| `textIt`          | string  | no       | Absent → language toggle disabled on that slide |
| `notes`           | string  | no       |                                    |
| `durationMinutes` | number  | no       |                                    |
| `speaker`         | string  | no       |                                    |

### DeckSettings

| Field       | Type                                       | Notes                                                        |
| ----------- | ------------------------------------------ | ------------------------------------------------------------ |
| `layout`    | `'text-only' \| 'title-text' \| 'full'`    | Default inferred at import (rule below) |
| `fontScale` | number                                     | Range 0.5–2.0 in 0.1 steps, default 1.0; persisted per deck; adjusted via A−/A+ on presenter screen |

Layout inference at import: any slide has `notes`, `durationMinutes`, or
`speaker` → `full`; else any slide has `title` → `title-text`; else
`text-only`. The user can change the layout later via deck settings
(`UpdateDeckSettings`).

### Language

Value object `'en' | 'it'` with toggle logic. Presenter shows one language at
a time, full screen.

## CSV Format

- One CSV file = one deck. Deck name defaults to the filename.
- Header row required; column names case-insensitive.
- Recognized columns: `title`, `text_en`, `text_it`, `notes`,
  `duration_minutes`, `speaker`. Only `text_en` is required.
- Unknown columns are ignored (spreadsheets may carry extra working columns).
- Quoted cells support commas, quotes, and multi-line text (verbatim scripts).
- Validation failures reject the entire import (all-or-nothing) with a
  human-readable message including row numbers where applicable.

Example:

```csv
title,text_en,text_it,notes,duration_minutes,speaker
Welcome,"Welcome everyone! Raise your glasses...","Benvenuti a tutti!...",Smile & pause,2,
```

## Screens & UX

Dark theme throughout (discreet at evening events).

### Deck menu

- List of imported decks: name, slide count, import date; ordered most
  recently imported first.
- `+ Import CSV` button → native file picker.
- Per-deck `⋮` menu: **Rename / Re-import / Delete** (delete asks for
  confirmation; re-import replaces slides, keeps id and settings).
- Tapping a deck opens the presenter.
- Deck lifecycle is **import-only**: no in-app content editing; the
  spreadsheet is the source of truth.

### Presenter screen (landscape, fullscreen)

- Slide text centered, large; title shown above when the deck layout includes
  titles; `notes`/`durationMinutes`/`speaker` rendered only in `full` layout.
- **Gestures (hybrid model):**
  - Swipe left anywhere → next slide; swipe right → previous.
  - Tap right edge zone (~20%) → next; tap left edge zone → previous.
  - Tap center → toggle EN ⇄ IT (one language visible at a time).
- **Chrome:**
  - Position indicator `3 / 14` top-right.
  - Language indicator top-center (hidden when slide has no `textIt`).
  - Discreet `✕` top-left → back to deck menu.
  - `A− A+` font-scale controls, fading after a few seconds of inactivity;
    persisted to deck settings.
- **Screen wake-lock** active while presenting (graceful no-op when the Wake
  Lock API is unsupported).
- **Shrink-to-fit** (added post-launch): slides render at the user's chosen
  font scale and automatically shrink — down to a 30% readability floor —
  only when the content would overflow the screen. Short slides keep the
  base size; the fit re-computes per slide, language toggle, font change,
  and rotation/resize.

## Architecture

Clean Architecture / DDD; dependencies point inward only.

```
presentation/    React + Tailwind: DeckMenuPage, PresenterPage,
                 useDecks/usePresenter hooks, composition root (DI via context)
       │ calls
application/     Use cases: ImportDeck, ListDecks, RenameDeck, ReimportDeck,
                 DeleteDeck, UpdateDeckSettings
                 Ports: DeckRepository, DeckCsvParser
       │ depends on
domain/          Pure TS, zero dependencies: Deck, Slide, DeckSettings,
                 Language, invariants, typed errors
       ▲ implements ports
infrastructure/  IndexedDbDeckRepository, PapaParseDeckCsvParser,
                 WakeLock wrapper
```

- React components never touch IndexedDB or PapaParse directly; they call use
  cases obtained from the composition root (the only module aware of concrete
  adapters — DIP).
- State management: React context + hooks. No state library (YAGNI at this
  size).

### Import data flow

File picker → `File` → `ImportDeck` use case → `DeckCsvParser` parses &
validates → `Deck.create()` enforces invariants → `DeckRepository.save()` →
IndexedDB → UI refreshes. On failure nothing is saved.

## Technology Stack

| Concern         | Choice                                  |
| --------------- | ---------------------------------------- |
| Build           | Vite + React + TypeScript                |
| Styling         | Tailwind CSS v4                          |
| Package manager | pnpm                                     |
| Lint/format     | Biome                                    |
| PWA             | vite-plugin-pwa                          |
| CSV parsing     | PapaParse (quoted/multi-line cell support) |
| Storage         | IndexedDB (behind `DeckRepository` port) |
| Tests           | Vitest + React Testing Library; `fake-indexeddb` for repository tests |

## PWA & Deployment

- **Manifest:** name "Presenter Cards", `display: standalone`,
  `orientation: landscape`, dark theme color, generated icon set.
- **Offline:** service worker precaches the full app shell; decks live in
  device-local IndexedDB — the app is fully functional with no connectivity.
- **Updates:** auto-update strategy; new deploys activate on next launch.
- **Base path:** Vite `base: '/presenter-cards/'`.
- **Hosting:** GitHub Pages from repo `Capplequoppe/presenter-cards` (public),
  URL `https://capplequoppe.github.io/presenter-cards/`.
- **CI/CD:** GitHub Actions on push to `main`: pnpm install → Biome check →
  tests → build → `actions/deploy-pages`. Lint and tests gate the deploy.
  Pages source set to "GitHub Actions" via `gh api`.

## Error Handling

- **CSV import:** distinct messages for missing/unrecognized header (found vs
  expected), empty `text_en` (with row numbers), empty file, non-CSV file.
  All-or-nothing import.
- **Storage:** IndexedDB failures surface as a toast, never a blank screen.
- **Presenter:** missing `textIt` → toggle hidden/no-op; Wake Lock
  unsupported → silent degradation; unknown deck id → redirect to menu.
- **Typed domain errors** (`InvalidSlideError`, `EmptyDeckError`, …)
  translated to friendly messages in the presentation layer only.

## Testing Strategy

TDD throughout.

- **Domain:** unit tests for invariants, language toggle, settings defaults.
- **Application:** use-case tests against in-memory fakes of the ports.
- **Infrastructure:** parser tests for CSV edge cases (quoted commas,
  multi-line cells, BOM, missing columns); repository tests with
  `fake-indexeddb`.
- **Presentation:** component tests for deck menu, import flow (success and
  every error path), presenter gestures (tap zones, swipes, language toggle,
  position indicator, font controls).
- CI runs the full suite before deploying.

## Out of Scope (YAGNI)

- In-app deck/slide editing or creation.
- Clock/elapsed-time display and slide-overview/jump (explicitly declined).
- More than two languages; language config per deck.
- Cloud sync or sharing of decks between devices.
- Private repository hosting.
