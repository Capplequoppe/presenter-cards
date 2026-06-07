# Task 1.1: Project Scaffolding

## Description

Create the Vite + React + TypeScript project with pnpm, Tailwind CSS v4,
Biome (lint + format), and Vitest + React Testing Library. Establish the
four-layer source directory structure (`domain/`, `application/`,
`infrastructure/`, `presentation/`) and package scripts.

## Acceptance Criteria

- `pnpm dev` serves a minimal app shell rendering the app name "Presenter Cards" with the dark theme background
- `pnpm build` produces a production bundle without errors
- `pnpm test` runs Vitest and passes (at least one smoke test of the app shell exists)
- `pnpm check` runs Biome lint + format verification and passes
- TypeScript is in strict mode; a type error fails the build
- A Tailwind utility class used in the app shell visibly affects the rendered output (Tailwind pipeline works)
- `src/` contains `domain/`, `application/`, `infrastructure/`, `presentation/` directories
- An import from `domain/` to any other layer is impossible to merge unnoticed: a lint rule or test guards layer direction, or the constraint is documented in the project README pending tooling

## Additional Notes

- Tailwind CSS v4 (CSS-first config via `@import "tailwindcss"`)
- React 19, Vite 6+ (latest stable at implementation time)
- Node version pinned via `package.json` `engines` and `.nvmrc`

## Architectural Decision

Layer directories live directly under `src/` (not feature folders) per the
approved spec's Clean Architecture choice — Approach 1 in the design session,
chosen over pragmatic feature folders to keep use cases, parsing, and storage
independently testable.

## Test Cases

- App shell renders the application title (smoke test via React Testing Library)

## How it contributes to the overall execution plan

Everything else builds on this toolchain; CI (1.3) runs these exact scripts.

## How it applies DDD, Clean Architecture, Clean Code and SOLID principles

Establishes the physical layer boundaries that make the dependency rule
enforceable from the first commit.

## Status: Complete

Scaffolded the Vite 8 + React 19 + TypeScript strict project in the repo root
using pnpm. Created:

- `package.json` with `engines: { node: ">=22" }` and scripts: `dev`, `build`,
  `preview`, `test` (vitest run), `check` (biome check)
- `.nvmrc` pinning Node 22
- `vite.config.ts` with `@vitejs/plugin-react` and `@tailwindcss/vite`
- `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` in strict mode
- `vitest.config.ts` with jsdom environment and `@testing-library/jest-dom` setup
- `biome.json` (v2) with recommended rules, tab indent, double quotes
- `src/index.css` with `@import "tailwindcss"` (Tailwind v4 CSS-first)
- `src/main.tsx` entry point
- `src/presentation/App.tsx` — dark app shell rendering "Presenter Cards"
- `src/presentation/App.test.tsx` — RTL smoke test (written before the shell)
- `src/test-setup.ts` — imports `@testing-library/jest-dom`
- `src/domain/.gitkeep`, `src/application/.gitkeep`,
  `src/infrastructure/.gitkeep` — keeps empty layer dirs in git
- `README.md` — documents dependency rule (domain ← application ←
  infrastructure/presentation) pending tooling enforcement

All quality gates verified:
- `pnpm test`: 1 passed
- `pnpm check`: no issues
- `pnpm build`: built in ~80ms
