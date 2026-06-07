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
| 1 | [Foundation & Deployment](phase-1-foundation/README.md) | 3 | — | Scaffold project, PWA config, GitHub repo + Pages CI/CD | Pending |
| 2 | [Domain Layer](phase-2-domain/README.md) | 2 | 1 | Slide, Language, Deck aggregate, DeckSettings, invariants | Pending |
| 3 | [Application Layer](phase-3-application/README.md) | 2 | 2 | Ports + in-memory fakes, deck management use cases | Pending |
| 4 | [Infrastructure Layer](phase-4-infrastructure/README.md) | 2 | 3 | PapaParse CSV parser adapter, IndexedDB repository | Pending |
| 5 | [Deck Menu UI](phase-5-deck-menu/README.md) | 3 | 4 | Composition root, deck list, import flow, deck actions | Pending |
| 6 | [Presenter Screen](phase-6-presenter/README.md) | 3 | 5 | Slide rendering, gestures, language toggle, font controls, wake lock | Pending |
| 7 | [Finalization](phase-7-finalization/README.md) | 2 | 6 | Docs, sample deck, end-to-end verification of deployed PWA | Pending |

Phases are sequential: each depends on the previous one. Tasks within a phase
may be parallelizable where noted in the phase README.

## Quality Gates (every phase)

- All tests pass (`pnpm test`)
- Biome lint + format checks pass (`pnpm check`)
- Build succeeds (`pnpm build`)
- TDD: tests written before implementation
- Phase review by subagents documented in the phase README under `## Review`

## Status: Pending
