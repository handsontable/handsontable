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

### Gotchas

- The core build outputs to `handsontable/tmp/` (not `dist/` for wrappers' consumption). The UMD/minified builds go to `handsontable/dist/` and CSS to `handsontable/styles/`. Wrapper packages reference the `tmp/` build via workspace linking.
- The Angular wrapper tests use `NODE_OPTIONS=--openssl-legacy-provider`; this is already wired into the `test` script.
- The `pnpm-workspace.yaml` has `ignoredBuiltDependencies` and `onlyBuiltDependencies` lists. If pnpm warns about ignored build scripts (e.g., `less`), this is expected.
- Root-level `npm run lint` and `npm run test` scripts use a custom `translate-to-native-npm.mjs` script to fan out across all workspace packages.
- The docs site (`docs/`) uses Node 20 (its own `.nvmrc`) and is not needed for core library development.
- No Docker, databases, or external services are required.

### Common pitfalls & best practices

#### Large dataset handling
- **Avoid spread operator with large arrays**: When working with potentially large arrays (10k+ elements), avoid using the spread operator to push elements (e.g., `arr.push(...largeArray)`). This creates excessive function arguments and can cause stack overflow errors. Use `forEach` loops instead.
- **Batch scroll events**: When handling scroll events that may fire rapidly (e.g., trackpad scrolling), use `requestAnimationFrame` to batch updates and prevent excessive redraws. This ensures smooth 60fps performance even with 100k+ row datasets.
- **Test with large datasets**: When fixing bugs or adding features that handle data arrays, add unit tests with 50k+ rows to catch stack overflow and performance issues.

#### Selection and state preservation
- **React wrapper state updates**: When calling `updateSettings()` in the React wrapper, preserve and restore the selection state using `selection.exportSelection()` and `selection.importSelection()` to maintain non-consecutive selections, active layers, and focus positions across React re-renders.
- **Selection testing**: Test non-consecutive selections (Ctrl/Cmd+click), row/column header selections, and active selection layers when modifying selection-related code.

#### Column stretching
- **Respect minimum widths**: When implementing column stretching strategies, always respect the defined column widths as minimum values. If a column would shrink below its base width, disable stretching entirely rather than allowing unusable column widths.
- **Strategy parity**: Different stretching strategies (`'all'`, `'last'`) should behave consistently regarding minimum width handling.

#### File locations reference
- **HTML parsing**: `handsontable/src/utils/parseTable.js`
- **Scroll handling**: `handsontable/src/3rdparty/walkontable/src/overlays.js`
- **Column stretching**: `handsontable/src/plugins/stretchColumns/strategies/`
- **Selection logic**: `handsontable/src/selection/`
- **React wrapper core**: `wrappers/react-wrapper/src/hotTableInner.tsx`
- **Unit tests**: `__tests__/` or `test/spec/` directories next to source files
- **E2E tests**: `handsontable/test/e2e/`
