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

## Status: Pending
