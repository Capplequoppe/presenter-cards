# Presenter Cards

A PWA for toastmasters: bilingual (EN/IT) prompt cards on a phone held
horizontally, imported from local CSV files, fully offline.

**Live at:** `https://capplequoppe.github.io/presenter-cards/`

---

## What it does

Presenter Cards replaces printed prompt sheets at events. You author your
announcement scripts in a spreadsheet, export them as a CSV, and import the
file into the app. During the event the phone stays in your hand in landscape
orientation — swipe or tap to move between slides, tap the centre to flip
between the English and Italian versions of your script.

---

## Install on your phone

The app can be added to your home screen for a native-app experience (no
browser chrome, landscape lock, offline support).

### iOS (Safari)

1. Open `https://capplequoppe.github.io/presenter-cards/` in Safari.
2. Tap the **Share** button (rectangle with arrow pointing up) in the toolbar.
3. Scroll down and tap **Add to Home Screen**.
4. Confirm the name and tap **Add**.

### Android (Chrome)

1. Open `https://capplequoppe.github.io/presenter-cards/` in Chrome.
2. Tap the three-dot menu in the top-right corner.
3. Tap **Add to Home screen** (or **Install app** if the banner appears).
4. Confirm by tapping **Add**.

Once installed, the app works fully offline — decks are stored in the
device's local IndexedDB and the app shell is cached by the service worker.

---

## CSV format

One CSV file = one deck. The deck name defaults to the filename.

### Columns

| Column             | Required | Type    | Notes                                                         |
|--------------------|----------|---------|---------------------------------------------------------------|
| `text_en`          | yes      | string  | English slide text. Must be non-empty on every row.           |
| `title`            | no       | string  | Optional slide title shown above the main text.               |
| `text_it`          | no       | string  | Italian translation. When absent the language toggle is hidden on that slide. |
| `notes`            | no       | string  | Speaker notes shown in `full` layout only.                    |
| `duration_minutes` | no       | number  | Planned slide duration. Must be a number or blank.            |
| `speaker`          | no       | string  | Name of the person speaking this slide.                       |

Rules:

- Header row is required; column names are **case-insensitive** (`TEXT_EN`, `Text_En`, and `text_en` all work).
- Unknown columns are silently ignored — spreadsheets may carry extra working columns.
- Quoted cells support **commas**, **double quotes** (escape as `""`), and **multi-line text** (newlines inside `"..."` are preserved verbatim, which is ideal for verbatim scripts).
- Validation failures reject the entire import (all-or-nothing) with a human-readable message including row numbers.

### Example

```csv
title,text_en,text_it,notes,duration_minutes,speaker
Welcome,"Welcome everyone, and thank you for joining us!","Benvenuti a tutti, grazie per essere qui!",Warm smile; pause,2,MC
First Toast,"Ladies and gentlemen, please raise your glasses.

To our happy couple — cheers!","Signore e signori, alzate i vostri bicchieri.

Alla coppia — salute!","Hold glass while speaking",3,Best Man
Closing,Safe travels and goodnight!,,,1,MC
```

Note that the second slide uses a quoted multi-line `text_en` cell: the blank
line inside the quotes becomes a paragraph break in the rendered slide.

### Sample deck

A realistic bilingual wedding-toastmaster sample deck is included at
`public/sample-deck.csv` and is downloadable directly from the deployed app:

```
https://capplequoppe.github.io/presenter-cards/sample-deck.csv
```

Import it via the `+ Import CSV` button in the app to see the format in action.

---

## Presenter screen gestures

The presenter screen runs fullscreen in landscape orientation. All controls
are thumb-accessible from one hand.

| Gesture / Control | Action |
|-------------------|--------|
| Swipe left anywhere | Next slide |
| Swipe right anywhere | Previous slide |
| Tap right edge zone (~20% of width) | Next slide |
| Tap left edge zone (~20% of width) | Previous slide |
| Tap centre | Toggle English / Italian |
| `✕` top-left | Exit to deck menu |
| `A−` / `A+` | Decrease / increase text size (0.5–2.0 in 0.1 steps; persisted per deck) |

The screen wake-lock is active while presenting so the display stays on.
On devices that do not support the Wake Lock API this degrades silently.

The language indicator (top-centre) is hidden on slides that have no Italian
text. The slide position indicator (e.g. `3 / 14`) is shown top-right.
Font-scale controls fade after a few seconds of inactivity.

---

## Local development

Node >= 22 (see `.nvmrc`). Use pnpm.

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | TypeScript check + production build |
| `pnpm preview` | Preview the production build locally |
| `pnpm test` | Run the full Vitest test suite |
| `pnpm check` | Biome lint + format check |

---

## Icons

PWA icons in `public/icons/` are generated by a Python 3 script that uses
Pillow. The design is two overlapping landscape rounded rectangles (an amber
back card and a white front card with faint text-row lines) on a `#121212`
dark background.

To regenerate (only needed when the icon design changes):

```sh
python3 scripts/generate-icons.py
```

The generated PNGs are committed to the repository so no Python environment
is needed for normal development or CI builds.

---

## Architecture

Clean Architecture / DDD with four layers under `src/`. **Dependencies point
inward only:**

```
presentation/    React + Tailwind: pages, hooks, composition root
      |
application/     Use cases + ports (DeckRepository, DeckCsvParser)
      |
domain/          Pure TS: Deck, Slide, DeckSettings, Language, invariants
      ^
infrastructure/  Implements ports: IndexedDB, PapaParse, Wake Lock
```

### Dependency Rule

`domain/` has **zero** dependencies on other layers.
`application/` depends only on `domain/`.
`infrastructure/` and `presentation/` may depend on `application/` and
`domain/` (via ports), but **never** on each other.

Tooling-based import enforcement (e.g. ESLint `import/no-restricted-paths` or
a dedicated bundler rule) will be added in a later task. Until then the rule is
enforced by convention and documented here; cross-layer imports in the wrong
direction will be flagged in code review.

---

## Design & implementation references

- [Design specification](docs/superpowers/specs/2026-06-07-presenter-cards-design.md) — normative spec covering domain model, CSV format, gestures, screens, architecture, and error handling.
- [Execution plan](docs/execution-plans/presenter-cards-pwa/README.md) — phased implementation plan with task breakdowns and review records.
