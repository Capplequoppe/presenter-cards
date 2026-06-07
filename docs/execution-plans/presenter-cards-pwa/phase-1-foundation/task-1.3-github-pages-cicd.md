# Task 1.3: GitHub Repository & Pages CI/CD

## Description

Create the public GitHub repository `Capplequoppe/presenter-cards`, push the
project, add a GitHub Actions workflow that lints, tests, builds, and deploys
to GitHub Pages on every push to `main`, and configure the Pages source as
"GitHub Actions".

## Acceptance Criteria

- Repository `Capplequoppe/presenter-cards` exists on GitHub with `main` as default branch and full local history pushed
- Workflow `.github/workflows/deploy.yml` triggers on push to `main` and runs, in order: install (pnpm, cached), Biome check, tests, build, deploy via `actions/upload-pages-artifact` + `actions/deploy-pages`
- A failing lint, test, or build step prevents deployment (deploy job depends on the quality job)
- Repository Pages configuration has build type "GitHub Actions" (set via `gh api`, no manual UI steps)
- The first workflow run completes green and `https://capplequoppe.github.io/presenter-cards/` serves the app shell (HTTP 200, correct title)

## Additional Notes

- `gh` CLI is authenticated as Capplequoppe with `repo` + `workflow` scopes
- Public repo (Pages on free plan); confirmed with user
- Concurrency group on the workflow so overlapping pushes don't race deploys

## Test Cases

- CI workflow itself is the test: quality job runs `pnpm check`, `pnpm test`, `pnpm build`; a deliberate local verification that these commands pass precedes the push

## How it contributes to the overall execution plan

From this point every phase lands on the live URL automatically; the user can
test on a real phone throughout development.

## How it applies DDD, Clean Architecture, Clean Code and SOLID principles

Quality gates (lint, tests, build) enforced in CI keep every later phase
honest about its acceptance criteria.

## Status: Complete

### Summary

- Created `.github/workflows/deploy.yml` with a `quality` job (checkout, pnpm
  setup via pnpm/action-setup@v4 + actions/setup-node@v4 with Node 22 and pnpm
  cache, frozen install, `pnpm check`, `pnpm test`, `pnpm build`,
  `actions/upload-pages-artifact@v3`) and a `deploy` job (needs quality,
  github-pages environment, `actions/deploy-pages@v4`). Concurrency group
  `pages` with `cancel-in-progress: false`.
- Added `"packageManager": "pnpm@9.12.2"` to `package.json` so corepack/CI
  resolves the exact pnpm version.
- Added `.npmrc` with `auto-install-peers=false` to match the lockfile setting
  and prevent a `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` on CI.
- Created public repository `Capplequoppe/presenter-cards` via `gh repo create`
  and pushed `main`.
- Enabled Pages with `build_type=workflow` via `gh api POST
  repos/Capplequoppe/presenter-cards/pages`.
- Workflow run 27097477112 completed green (quality 22 s, deploy 10 s).
- Live site `https://capplequoppe.github.io/presenter-cards/` returns HTTP 200
  with `<title>Presenter Cards</title>`.
- Commits: `3901c4c` (workflow + packageManager), `69e5515` (.npmrc fix).
