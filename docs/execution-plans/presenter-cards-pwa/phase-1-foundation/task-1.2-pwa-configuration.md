# Task 1.2: PWA Configuration

## Description

Configure the app as an installable, offline-capable PWA using
vite-plugin-pwa: web manifest, icon set, service worker with app-shell
precaching and auto-update, and the GitHub Pages base path.

## Acceptance Criteria

- Production build emits a web manifest with: name "Presenter Cards", `display: standalone`, `orientation: landscape`, dark `theme_color` and `background_color`, and at least 192px and 512px icons (plus a maskable variant)
- Production build emits a service worker that precaches the full app shell (HTML, JS, CSS, icons)
- After one online visit, the app loads with the network disabled (offline app shell)
- Service worker uses the auto-update strategy: a new deploy activates on next launch without user interaction
- All asset URLs in the built `index.html` and manifest resolve under the `/presenter-cards/` base path
- `pnpm build && pnpm preview` serves an installable PWA (manifest + SW detected; verifiable via Lighthouse PWA audit or equivalent)

## Additional Notes

- Icons may be simple generated placeholders at this stage; final icon polish happens in Phase 7
- Dev mode does not need a service worker (avoid SW interference during development)

## Architectural Decision

Auto-update (`registerType: 'autoUpdate'`) over prompt-for-update: the user is
a single owner-operator; silent updates on next launch are simpler and avoid
an update prompt appearing mid-event.

## Test Cases

- Built manifest contains the required fields and icon entries (assert on build output)
- Built `index.html` references assets under `/presenter-cards/`

## How it contributes to the overall execution plan

Offline capability is a core requirement (venue may have no connectivity);
the base path must be correct before the first Pages deploy in 1.3.

## How it applies DDD, Clean Architecture, Clean Code and SOLID principles

PWA concerns are build/infrastructure configuration, kept out of application
and domain code entirely.

## Test Strategy Decision

The manifest and PWA options are exported from a typed module (`src/pwa-config.ts`) that is imported by both `vite.config.ts` and Vitest unit tests. This gives fast, build-free CI feedback on all required manifest fields (name, display, orientation, theme/background colors, icon entries). Build-output assertions (dist/ structure, index.html base paths) are verified via shell commands after `pnpm build`, documented in the task completion summary below.

## Status: Complete

**Implemented 2026-06-07.**

### What was implemented

- Added `vite-plugin-pwa` and `workbox-window` to devDependencies.
- Created `src/pwa-config.ts` — a typed module exporting `PWA_MANIFEST` and `PWA_OPTIONS`, shared between `vite.config.ts` and the unit tests (single source of truth).
- Updated `vite.config.ts`: added `base: '/presenter-cards/'` and `VitePWA(PWA_OPTIONS)`.
- Created `scripts/generate-icons.py` — generates placeholder PNGs (dark #121212 background, "PC" monogram glyph) for 192x192, 512x512, and 512x512 maskable variants. Icons committed to `public/icons/`.
- Wrote `src/pwa-config.test.ts` — 14 unit tests covering all required manifest fields and PWA plugin options.

### Verification outputs

`pnpm test` — 14 tests passed across 2 test files.
`pnpm check` — 15 files checked, no fixes required.
`pnpm build` — successful; dist/ contains `sw.js`, `workbox-*.js`, `manifest.webmanifest` (all required fields present), `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-512-maskable.png`; every asset URL in `index.html` resolves under `/presenter-cards/`.
