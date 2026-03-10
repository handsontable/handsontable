# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Handsontable is a JavaScript/TypeScript data grid monorepo (pnpm workspace). It contains the core library plus React, Angular, and Vue 3 wrappers.

### Workspace packages

| Package | Directory | Purpose |
|---|---|---|
| `handsontable` | `handsontable/` | Core data grid (vanilla JS) |
| `@handsontable/react-wrapper` | `wrappers/react-wrapper/` | React wrapper |
| `@handsontable/angular-wrapper` | `wrappers/angular-wrapper/` | Angular wrapper |
| `@handsontable/vue3` | `wrappers/vue3/` | Vue 3 wrapper |
| `handsontable-visual-tests` | `visual-tests/` | Playwright visual regression tests |
| `handsontable-examples-internal` | `examples/` | Code examples |
| `handsontable-documentation` | `docs/` | VuePress docs site (requires Node 20) |

### Prerequisites

- **Node.js 22** (see `.nvmrc`)
- **pnpm 10.30.2** (see `packageManager` in root `package.json`); activate via `corepack enable && corepack prepare pnpm@10.30.2 --activate`

### Build, lint, test

All commands below run from the workspace root (`/workspace`).

- **Build core**: `pnpm --filter handsontable run build` (must be done before wrapper tests, since wrappers depend on the built `tmp/` output)
- **Lint core**: `pnpm --filter handsontable run eslint` and `pnpm --filter handsontable run stylelint`
- **Unit tests (core)**: `pnpm --filter handsontable run test:unit` (Jest, ~2200 tests)
- **E2E tests (core)**: `pnpm --filter handsontable run test:e2e` (Puppeteer/Jasmine, headless Chrome)
- **React tests**: `pnpm --filter @handsontable/react-wrapper run test`
- **Vue3 tests**: `pnpm --filter @handsontable/vue3 run test`
- **Angular tests**: `pnpm --filter @handsontable/angular-wrapper run test` (requires `--openssl-legacy-provider`; already handled via `cross-env` in `package.json` scripts)

### Focused regression commands

- **Single unit spec (Filters, Jest)**: `cd handsontable && npm run build:styles && pnpm exec cross-env-shell BABEL_ENV=commonjs env-cmd -f ../hot.config.js jest --testPathPattern=src/plugins/filters/__tests__/methods/updateValueComponentCondition.unit.js`
- **Single core e2e spec family (Filters)**: `npm_config_testPathPattern=filters.spec.js pnpm --filter handsontable run test:e2e.dump && pnpm --filter handsontable exec node test/scripts/run-puppeteer.mjs test/E2ERunner.html`
- **Single mobile e2e spec family (Filters)**: `npm_config_testPathPattern=filters.spec.js pnpm --filter handsontable run test:mobile.dump && pnpm --filter handsontable exec node test/scripts/run-puppeteer.mjs test/MobileRunner.html`

### Gotchas

- The core build outputs to `handsontable/tmp/` (not `dist/` for wrappers' consumption). The UMD/minified builds go to `handsontable/dist/` and CSS to `handsontable/styles/`. Wrapper packages reference the `tmp/` build via workspace linking.
- The Angular wrapper tests use `NODE_OPTIONS=--openssl-legacy-provider`; this is already wired into the `test` script.
- The `pnpm-workspace.yaml` has `ignoredBuiltDependencies` and `onlyBuiltDependencies` lists. If pnpm warns about ignored build scripts (e.g., `less`), this is expected.
- Root-level `npm run lint` and `npm run test` scripts use a custom `translate-to-native-npm.mjs` script to fan out across all workspace packages.
- The docs site (`docs/`) uses Node 20 (its own `.nvmrc`) and is not needed for core library development.
- No Docker, databases, or external services are required.
