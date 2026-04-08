---
name: performance-testing
description: Use when adding, modifying, or debugging Handsontable performance test scenarios in performance-tests/ - covers the CDP trace-based measurement system, scenario structure (fixture + config + spec), trace-parser integration, hook timing for filtering/sorting, golden snapshot workflow, and the CI comparison pipeline. Trigger whenever work touches performance-tests/ files, when asked to benchmark a Handsontable feature, or when adding a new performance scenario.
---

# Performance Testing

## Overview

The `performance-tests/` package measures Handsontable rendering and interaction performance using Playwright + Chrome DevTools Protocol (CDP) traces. It is a **standalone package outside the pnpm workspace** -- it has its own `package.json`, `node_modules`, and ESLint config.

Each scenario traces a specific user interaction (scrolling, filtering, sorting, editing), parses the CDP trace into DevTools-equivalent categories (scripting, rendering, painting, idle), and produces a markdown report with Mermaid charts comparing against a golden baseline from `develop`.

## Package Structure

```
performance-tests/
  scripts/run.mjs           # Orchestrator: build HOT UMD → copy to fixtures → run Playwright
  playwright.config.ts       # Sequential, 1 worker, 5 min timeout, chromium only
  trace-parser.mjs           # CDP trace → DevTools-equivalent category breakdown
  .eslintrc.js               # Extends root config, relaxes JSDoc/console/await-in-loop rules
  lib/
    trace-runner.mjs          # CDP Tracing.start/stop + warmup/iteration loop
    hook-timing.mjs           # Inject performance.now() on before/after hook pairs
    snapshot-store.mjs        # Golden baseline save/load/compare
    chart-generator.mjs       # Mermaid xychart-beta horizontal charts
    report-builder.mjs        # Full markdown report assembly
    teardown.mjs              # Playwright globalTeardown: parse traces → report
  scenarios/
    <name>/
      scenario.config.mjs     # { name, warmupRuns, iterations }
      fixture.html             # Standalone HTML loading HOT UMD from ../../fixtures/
      <name>.spec.ts           # Playwright test using runTracedScenario()
  fixtures/
    .gitkeep                   # Built JS/CSS copied here by run.mjs (gitignored)
  golden/                      # Golden snapshots (gitignored, fetched from CI artifacts)
  output/                      # Trace JSONs + result.md (gitignored)
```

## Adding a New Scenario

Every scenario needs exactly three files in `scenarios/<name>/`:

### 1. scenario.config.mjs

```js
export default {
  name: 'my-scenario',
  warmupRuns: 1,
  iterations: 3,
};
```

The `name` must match the directory name -- it determines the `output/<name>/` subdirectory.

### 2. fixture.html

A standalone HTML file that creates a Handsontable instance and exposes it as `window.__hot`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>My Scenario</title>
  <link rel="stylesheet" href="../../fixtures/handsontable.css">
  <script src="../../fixtures/handsontable.full.js"></script>
</head>
<body>
  <div id="hot"></div>
  <script>
    const hot = new Handsontable(document.getElementById('hot'), {
      data: Handsontable.helper.createSpreadsheetData(5000, 10),
      rowHeaders: true,
      colHeaders: true,
      width: 1280,
      height: 600,
      autoRowSize: false,
      autoColumnSize: false,
      licenseKey: 'non-commercial-and-evaluation',
      // Add scenario-specific options (filters, columnSorting, etc.)
    });
    window.__hot = hot;
  </script>
</body>
</html>
```

Important rules for fixtures:
- Always set `autoRowSize: false` and `autoColumnSize: false` -- these async plugins interfere with measurements.
- CSS path is `../../fixtures/handsontable.css` (not `handsontable.full.css`).
- JS path is `../../fixtures/handsontable.full.js`.
- Always expose the instance as `window.__hot`.

### 3. Spec file (`<name>.spec.ts`)

```ts
import { test } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');

test(config.name, async({ page }) => {
  await page.goto(`file://${fixturePath}`);
  await page.waitForFunction(() => (window as any).__hot);

  // Optional pre-trace setup (e.g., scroll to position)

  await runTracedScenario({
    page,
    warmupRuns: config.warmupRuns,
    iterations: config.iterations,
    outputDir: path.resolve('output', config.name),
    actionFn: async() => {
      // The measured action goes here
    },
    // Optional: resetFn to restore state between iterations
  });
});
```

The `runTracedScenario` function handles:
- Creating the output directory
- Running warmup iterations (no tracing)
- Running measured iterations with CDP tracing
- Writing trace JSON files as `iteration-{n}.json`

### Adding hook timing (filtering/sorting scenarios)

For scenarios that measure a specific hook pair (e.g., `beforeFilter` → `afterFilter`):

```ts
import { writeFile } from 'node:fs/promises';
import { injectHookTimer, getHookTiming } from '../../lib/hook-timing.mjs';

// Before tracing, inject the timer:
await injectHookTimer(page, 'beforeFilter', 'afterFilter');

const hookDeltas: number[] = [];

// Inside actionFn, capture timing after the action:
const timing = await getHookTiming(page, 'beforeFilter', 'afterFilter');
if (timing.deltaMs != null) {
  hookDeltas.push(timing.deltaMs);
}

// Inside resetFn, re-inject the timer after resetting state:
await injectHookTimer(page, 'beforeFilter', 'afterFilter');

// After runTracedScenario, save hook timing:
if (hookDeltas.length > 0) {
  const avgDelta = hookDeltas.reduce((a, b) => a + b, 0) / hookDeltas.length;
  await writeFile(
    path.join(outputDir, 'hook-timing.json'),
    JSON.stringify({ deltas: hookDeltas, averageDeltaMs: avgDelta }, null, 2),
    'utf8',
  );
}
```

The teardown automatically picks up `hook-timing.json` from each scenario directory.

## Existing Scenarios

| Scenario | Grid size | Action | Special |
|---|---|---|---|
| scroll-down | 5000x10 | `mouse.wheel(0, 350)` x 500 | - |
| scroll-up | 5000x10 | `mouse.wheel(0, -350)` x 500 | Pre-scrolls to bottom |
| scroll-right | 10x5000 | `mouse.wheel(350, 0)` x 500 | - |
| scroll-left | 10x5000 | `mouse.wheel(-350, 0)` x 500 | Pre-scrolls to right |
| filtering | 1000x1000 | `filters.addCondition` + `filter()` | Hook timing |
| sorting | 1000x1000 | `columnSorting.sort()` | Hook timing |
| cell-editing | 5000x10 | selectCell + Enter + type + Enter x 20 | - |

## Run Commands

```bash
# Full pipeline (build HOT + copy fixtures + run all scenarios)
cd performance-tests && node scripts/run.mjs

# Run specific scenario only (fixtures must exist)
npx playwright test --grep "scroll-down"

# Golden mode (saves baseline snapshot)
PERF_MODE=golden node scripts/run.mjs

# Compare mode (loads golden, generates delta report)
PERF_MODE=compare node scripts/run.mjs

# Lint
npm run lint
```

Build artifacts (`handsontable/dist/` and `handsontable/styles/`) must exist before running tests directly with `npx playwright test`. The `scripts/run.mjs` orchestrator handles building automatically.

## CI Workflow

The GitHub Actions workflow (`.github/workflows/performance-tests.yml`) operates in two modes:

- **`push` to `develop`**: Runs all scenarios in `golden` mode, uploads `perf-golden-snapshots` artifact (90-day retention).
- **`pull_request`**: Fetches golden from the latest successful `develop` run via `gh api`, runs all scenarios in `compare` mode, posts a sticky PR comment with Mermaid charts and metric tables.

## The Trace Pipeline

Understanding the data flow helps when debugging or extending:

1. **Spec** calls `runTracedScenario()` → CDP `Tracing.start` / `Tracing.end` → raw JSON per iteration
2. **Teardown** (`lib/teardown.mjs`) discovers `output/*/iteration-*.json`, calls `parseTrace()` from `trace-parser.mjs`
3. **trace-parser.mjs** categorizes events into DevTools categories (scripting, rendering, painting, loading, system, idle), computes the auto-zoomed window, synthesizes ProfileCall scripting from CPU profile data
4. **Teardown** averages across iterations via `averageParsedTraces()`, collects per-iteration values for CV% calculation
5. **report-builder.mjs** assembles markdown with `chart-generator.mjs` (Mermaid) and detail tables
6. If `PERF_MODE=golden`: `snapshot-store.mjs` saves averaged results
7. If `PERF_MODE=compare`: teardown loads golden, report shows deltas

## .mjs Convention

All `.mjs` files in this package follow the `node-scripts-dev` skill conventions:
- `node:` prefix for builtins
- `node:fs/promises` async APIs (never sync)
- `import.meta.dirname` for paths
- `join()` from `node:path` for cross-platform paths

## Common Mistakes

| Mistake | Fix |
|---|---|
| Using `handsontable.full.css` in fixture | Use `handsontable.css` -- there is no `full` CSS variant |
| Forgetting `autoRowSize: false` | Always disable -- async sizing interferes with measurements |
| Scenario name doesn't match directory name | The `name` in config must match the directory name exactly |
| Running `npx playwright test` without built fixtures | Run `node scripts/run.mjs` or build HOT first and copy dist files |
| Using sync fs APIs in `.mjs` files | Use `node:fs/promises` async APIs |
| Missing `window.__hot` in fixture | The spec's `waitForFunction` and `page.evaluate` depend on it |
| Forgetting `resetFn` when measuring repeatable actions | Without reset, iterations 2+ start from the end state of iteration 1 |
| Using `fs.writeFileSync` in spec files | Use `import { writeFile } from 'node:fs/promises'` + `await` |
