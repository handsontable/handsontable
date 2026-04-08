# Handsontable Performance Tests

Automated performance measurement suite for Handsontable using [Playwright](https://playwright.dev/) and Chrome DevTools Protocol (CDP) traces.

The system traces real user interactions (scrolling, filtering, sorting, editing), parses the CDP trace into the same categories shown by the DevTools Performance panel, and produces a markdown report with Mermaid charts comparing against a golden baseline from `develop`.

## Prerequisites

- **Node.js 22** (see `.nvmrc` in the repo root)
- **pnpm 10.30.2** (`corepack enable && corepack prepare pnpm@10.30.2 --activate`)

This package is **standalone** -- it is not part of the pnpm workspace. It has its own `package.json` and `node_modules`. However, it depends on the workspace being installed (for `cross-env-shell`, `webpack`, and other build tools) and on Handsontable being built (for the UMD bundle).

## Quick start

The orchestrator script handles everything -- installing dependencies, building Handsontable, copying build artifacts, installing Playwright, and running all scenarios:

```bash
cd performance-tests
node scripts/run.mjs
```

This takes approximately 3-4 minutes and produces:
- Trace JSON files in `output/<scenario>/iteration-{1,2,3}.json`
- A markdown report at `output/result.md`

### Running a single scenario

If Handsontable is already built and fixtures are in place:

```bash
npx playwright test --grep "scroll-down"
```

### Running with golden baseline

```bash
# Save a golden baseline
PERF_MODE=golden node scripts/run.mjs

# Compare current code against the golden baseline
PERF_MODE=compare node scripts/run.mjs
```

### Linting

```bash
npm run lint
```

## Scenarios

Each scenario measures a specific user interaction pattern:

| Scenario | Grid size | Action | Notes |
|---|---|---|---|
| **scroll-down** | 5000 x 10 | `mouse.wheel(0, 350)` x 500 | Vertical scroll from top |
| **scroll-up** | 5000 x 10 | `mouse.wheel(0, -350)` x 500 | Pre-scrolls to bottom, then scrolls up |
| **scroll-right** | 10 x 5000 | `mouse.wheel(350, 0)` x 500 | Horizontal scroll from left |
| **scroll-left** | 10 x 5000 | `mouse.wheel(-350, 0)` x 500 | Pre-scrolls to right, then scrolls left |
| **filtering** | 1000 x 1000 | `filters.addCondition()` + `filter()` | Hook timing: beforeFilter -> afterFilter |
| **sorting** | 1000 x 1000 | `columnSorting.sort()` | Hook timing: beforeColumnSort -> afterColumnSort |
| **cell-editing** | 5000 x 10 | selectCell + Enter + type + Enter x 20 | Sequential cell edits |

Each scenario runs **1 warmup iteration** (discarded) followed by **3 measured iterations** with CDP tracing.

## Project structure

```
performance-tests/
  scripts/
    run.mjs                   # Orchestrator (install, build, copy, run)
  playwright.config.ts         # Sequential execution, 1 worker, 5 min timeout
  trace-parser.mjs             # CDP trace -> DevTools category breakdown
  .eslintrc.js                 # ESLint config (extends root)
  lib/
    trace-runner.mjs           # CDP Tracing.start/stop + warmup/iteration loop
    hook-timing.mjs            # performance.now() on before/after hook pairs
    snapshot-store.mjs         # Golden baseline save/load/compare
    chart-generator.mjs        # Mermaid xychart-beta horizontal charts
    report-builder.mjs         # Markdown report assembly with detail tables
    teardown.mjs               # Playwright globalTeardown: traces -> report
  scenarios/
    <name>/
      scenario.config.mjs      # { name, warmupRuns, iterations }
      fixture.html              # Standalone HTML loading HOT UMD
      <name>.spec.ts            # Playwright test using runTracedScenario()
  fixtures/                     # Built JS/CSS (gitignored, copied by run.mjs)
  golden/                       # Golden snapshots (gitignored, from CI artifacts)
  output/                       # Trace JSONs + result.md (gitignored)
```

## How it works

### Trace pipeline

1. The **spec file** calls `runTracedScenario()`, which starts CDP tracing (`Tracing.start`), executes the action, stops tracing (`Tracing.end`), and writes the raw JSON per iteration.

2. The **globalTeardown** (`lib/teardown.mjs`) discovers all `output/*/iteration-*.json` files and feeds them to the trace parser.

3. The **trace parser** (`trace-parser.mjs`) categorizes every trace event into DevTools-equivalent categories: scripting, rendering, painting, loading, system (other), and idle. It computes the auto-zoomed window (matching DevTools' `MainThreadActivity.calculateWindow`), synthesizes ProfileCall scripting from CPU profile data, and extracts UpdateCounters (heap, nodes, listeners).

4. Results are **averaged** across iterations with per-iteration values retained for CV% (coefficient of variation) calculation.

5. The **report builder** assembles a markdown report with:
   - Per-scenario summary lines
   - Mermaid `xychart-beta horizontal` bar charts (golden vs current)
   - Collapsible detail tables with all metrics and CV%
   - Hook timing deltas for filtering/sorting scenarios

### Golden baseline workflow

The CI workflow (`.github/workflows/performance-tests.yml`) operates in two modes:

- **On push to `develop`** (`PERF_MODE=golden`): Runs all scenarios, saves the averaged results as `golden/snapshots.json`, and uploads it as the `perf-golden-snapshots` GitHub Actions artifact (90-day retention).

- **On pull request** (`PERF_MODE=compare`): Fetches the latest golden artifact from the most recent successful `develop` run via `gh api`, runs all scenarios, and generates a delta report. The report is posted as a sticky PR comment with Mermaid charts comparing golden vs current.

If no golden baseline exists (first run, or artifact expired), the report shows raw metrics with "No baseline available".

### Metrics

The report includes these categories (matching the DevTools Performance panel):

| Category | What it measures |
|---|---|
| **Scripting** | JavaScript execution, event handlers, timers, GC |
| **Rendering** | Style recalculation, layout, layer updates |
| **Painting** | Paint, rasterization, compositing |
| **Loading** | HTML parsing, resource loading |
| **System** | Internal browser overhead (RunTask, etc.) |
| **Idle** | Time between tasks |

Additional metrics from `UpdateCounters`:
- JS heap size (min/max)
- DOM node count (min/max)
- Event listener count (min/max)

**CV%** (coefficient of variation) is shown per metric. Values above 15% are flagged with `!!!` -- these indicate unstable measurements that may not be reliable for comparison.

## Adding a new scenario

Create a new directory under `scenarios/` with three files:

### 1. `scenario.config.mjs`

```js
export default {
  name: 'my-scenario',   // Must match the directory name
  warmupRuns: 1,
  iterations: 3,
};
```

### 2. `fixture.html`

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
    });
    window.__hot = hot;
  </script>
</body>
</html>
```

Important:
- Always set `autoRowSize: false` and `autoColumnSize: false` -- these async plugins interfere with trace measurements.
- The CSS file is `handsontable.css` (not `handsontable.full.css`).
- Always expose the instance as `window.__hot`.

### 3. `<name>.spec.ts`

```ts
import { test } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');

test(config.name, async({ page }) => {
  await page.goto(`file://${fixturePath}`);
  await page.waitForFunction(() => (window as any).__hot);

  await runTracedScenario({
    page,
    warmupRuns: config.warmupRuns,
    iterations: config.iterations,
    outputDir: path.resolve('output', config.name),
    actionFn: async() => {
      // The measured action
    },
    // Optional: resetFn to restore state between iterations
  });
});
```

### Adding hook timing

For scenarios that measure a specific Handsontable hook pair (like filtering or sorting), use `injectHookTimer` and `getHookTiming` from `lib/hook-timing.mjs`. See the `filtering` or `sorting` scenario specs for the complete pattern.

## Trace parser

The `trace-parser.mjs` module can also be used standalone to analyze any Chrome trace JSON:

```bash
# Parse a single trace
node trace-parser.mjs output/scroll-down/iteration-1.json

# Average multiple traces
node trace-parser.mjs output/scroll-down/iteration-*.json

# Show all categories including zero values
node trace-parser.mjs trace.json --full

# Show debug info (thread IDs, window range, event counts)
node trace-parser.mjs trace.json --debug
```

## Sample report output

When running in compare mode with a golden baseline, the PR comment looks like:

```
### Scroll Down
> JS Execution +12.3% slower, Rendering -2.1% faster, Painting +5.0% slower, Cumulative +8.0% slower

[Mermaid bar chart comparing golden vs current]

<details><summary>All metrics</summary>

| Metric    | Golden   | Current  | Change | CV%  |
|-----------|----------|----------|--------|------|
| Scripting | 3100 ms  | 3472 ms  | +12.0% | 3.2% |
| Rendering | 1758 ms  | 1721 ms  | -2.1%  | 1.8% |
| ...       |          |          |        |      |

</details>
```

Without a golden baseline, the report shows raw metrics only.
