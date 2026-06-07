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
| 1.3 | [GitHub Repository & Pages CI/CD](task-1.3-github-pages-cicd.md) | Create repo, Actions workflow, Pages deployment | Pending |

Tasks are sequential: 1.2 depends on 1.1; 1.3 depends on 1.2.

## Status: In Progress
