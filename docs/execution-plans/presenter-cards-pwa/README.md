# Execution Plan: Presenter Cards PWA

Implementation of the Presenter Cards PWA as specified in
[the approved design spec](../../superpowers/specs/2026-06-07-presenter-cards-design.md).

A PWA used by a toastmaster at events: phone held horizontally, thumb-driven
navigation through bilingual (EN/IT) verbatim prompt cards, decks imported from
local CSV files, hosted on GitHub Pages at
`https://capplequoppe.github.io/presenter-cards/`.

## Architecture Summary

Clean Architecture / DDD with four layers (dependencies point inward only):

- `domain/` — pure TS: `Deck`, `Slide`, `DeckSettings`, `Language`, invariants, typed errors
- `application/` — use cases + ports (`DeckRepository`, `DeckCsvParser`)
- `infrastructure/` — IndexedDB repository, PapaParse CSV parser, Wake Lock wrapper
- `presentation/` — React + Tailwind pages/hooks, composition root (DI via context)

Stack: Vite, React, TypeScript, Tailwind CSS v4, pnpm, Biome, vite-plugin-pwa,
PapaParse, Vitest + React Testing Library, fake-indexeddb.

## Phases

| # | Phase | Tasks | Dependencies | Description | Status |
|---|-------|-------|--------------|-------------|--------|
| 1 | [Foundation & Deployment](phase-1-foundation/README.md) | 3 | — | Scaffold project, PWA config, GitHub repo + Pages CI/CD | Complete |
| 2 | [Domain Layer](phase-2-domain/README.md) | 2 | 1 | Slide, Language, Deck aggregate, DeckSettings, invariants | Complete |
| 3 | [Application Layer](phase-3-application/README.md) | 2 | 2 | Ports + in-memory fakes, deck management use cases | Complete |
| 4 | [Infrastructure Layer](phase-4-infrastructure/README.md) | 2 | 3 | PapaParse CSV parser adapter, IndexedDB repository | Complete |
| 5 | [Deck Menu UI](phase-5-deck-menu/README.md) | 3 | 4 | Composition root, deck list, import flow, deck actions | Complete |
| 6 | [Presenter Screen](phase-6-presenter/README.md) | 3 | 5 | Slide rendering, gestures, language toggle, font controls, wake lock | Complete |
| 7 | [Finalization](phase-7-finalization/README.md) | 2 | 6 | Docs, sample deck, end-to-end verification of deployed PWA | Complete |

Phases are sequential: each depends on the previous one. Tasks within a phase
may be parallelizable where noted in the phase README.

## Quality Gates (every phase)

- All tests pass (`pnpm test`)
- Biome lint + format checks pass (`pnpm check`)
- Build succeeds (`pnpm build`)
- TDD: tests written before implementation
- Phase review by subagents documented in the phase README under `## Review`

## Status: Complete

All seven phases are complete. The app is live at
<https://capplequoppe.github.io/presenter-cards/> and verified end to end
against the design spec (task 7.2); the only remaining items are the
documented manual on-device checks in the task 7.2 file.

## Final Review

Whole-plan regression review (2026-06-07) across all 7 phases / 17 tasks.
Verified: every task and phase marked Complete with status claims
spot-checked against code; layer dependency rule holds in the final tree
(domain imports nothing, application imports domain only, infrastructure
imports domain + application ports, presentation reaches infrastructure only
via the composition root / `App.tsx` — plus the plan-sanctioned type-only
`ScreenWakeLock` import from task 6.3); no out-of-scope (YAGNI) features
crept in; spec core flows all covered by the suite. Final gates: 265/265
tests, `pnpm check` clean, `pnpm build` succeeds.

| # | Severity | Finding | Resolution |
|---|----------|---------|------------|
| 1 | Minor | Five barrel files had zero consumers — `src/application/index.ts`, `src/application/use-cases/index.ts`, `src/infrastructure/index.ts`, `src/infrastructure/csv/index.ts`, `src/infrastructure/storage/index.ts` — orphaned as parallel-worktree tasks settled on deep module imports; the dead infra barrel also re-exported the test-only `FakeWakeLock` from a production surface | Fixed: deleted all five (`4ae7eb2`); barrels with real consumers kept |
| 2 | Minor | `scripts/__pycache__/` (Python bytecode from `generate-icons.py`) showed up as untracked noise; not gitignored | Fixed: added `__pycache__/` to `.gitignore` (`522f5a7`) |
| 3 | Minor | Phase 7 README lacked the `## Review` section required by the plan's quality gates | Fixed: added, pointing to this final review (phase 7 is docs/verification-only) |
| 4 | Info | `use-wake-lock.ts` and `services-context.tsx` import the `ScreenWakeLock` type from `infrastructure/wake-lock` — strictly the port could live in `application/ports`, but task 6.3's AC explicitly placed the interface in `infrastructure/`, and the import is type-only | Left as-is: plan-sanctioned; revisit only if a second consumer of the port appears |
| 5 | Info | Mixed import granularity in presentation (domain via barrel, application use cases via deep paths) and small file-input duplication between import (DeckMenuPage) and re-import (DeckActionsMenu) | Left as-is: both are consistent within their module, behavior-identical, and not worth churn |

No cross-phase regressions found: interfaces from phases 2–4 are consumed
unchanged by phases 5–6, `CsvParseErrorKind` contract intact, all
phase-level test suites still pass, and the precache globs cover the full
app shell incl. the phase 7 icons (11 precache entries; `sample-deck.csv` is
deliberately not precached — it is a README-linked download, not part of the
offline app shell).
