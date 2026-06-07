# Phase 1: Foundation & Deployment

Scaffold the project with the full toolchain, configure it as an installable
PWA, create the GitHub repository, and stand up the CI/CD pipeline so that
every subsequent phase deploys automatically to GitHub Pages.

Ending this phase, a minimal app shell is live at
`https://capplequoppe.github.io/presenter-cards/` and installable to a phone
home screen.

## Tasks

| # | Task | Description | Status |
|---|------|-------------|--------|
| 1.1 | [Project Scaffolding](task-1.1-project-scaffolding.md) | Vite + React + TS + Tailwind v4 + pnpm + Biome + Vitest | Complete |
| 1.2 | [PWA Configuration](task-1.2-pwa-configuration.md) | vite-plugin-pwa, manifest, icons, offline precache, base path | Complete |
| 1.3 | [GitHub Repository & Pages CI/CD](task-1.3-github-pages-cicd.md) | Create repo, Actions workflow, Pages deployment | Complete |

Tasks are sequential: 1.2 depends on 1.1; 1.3 depends on 1.2.

## Status: Complete

## Review

Reviewed 2026-06-07 against tasks 1.1–1.3 and the spec's PWA & Deployment /
Technology Stack sections. All 19 acceptance criteria verified MET, including
live checks: `https://capplequoppe.github.io/presenter-cards/` returns 200
with the correct title; `manifest.webmanifest` (all required fields, maskable
icon) and `sw.js` are served under the base path; Pages `build_type` is
`workflow`; deploy job gated via `needs: quality`; concurrency group `pages`
present. Quality gates after fixes: `pnpm test` 56/56, `pnpm check` clean,
`pnpm build` green (SW precaches 11 entries incl. HTML/JS/CSS/icons).

| # | Severity | Finding | Resolution |
|---|----------|---------|------------|
| 1 | Minor | `scripts/generate-icons.py`: maskable branch duplicated all of `draw_glyph` (font loading + centering) and had a dead `padding` variable | Fixed in `22dfa75` — extracted `load_font`, parameterized glyph scale; regenerated icons byte-identical |
| 2 | Minor | Python dev-time icon generator in a TS project was undocumented | Fixed in `7e8dd88` — README "Icons" section added. Keeping it in Python is acceptable: Pillow makes PNG generation trivial and avoids adding a TS image dependency for a one-shot placeholder tool |
| 3 | Suggestion | Base path `/presenter-cards/` is written literally in `vite.config.ts` (`base`) and `src/pwa-config.ts` (`start_url`, `scope`) | Left as-is — standard Vite idiom; the values are covered by unit tests and a drift would fail the live-URL check in CI/phase 7 verification |
| 4 | Suggestion | Offline behavior (load with network disabled) verified by precache manifest inspection only, not a real device test | Left as-is — full on-device offline/install verification is scheduled for Phase 7 end-to-end verification |
