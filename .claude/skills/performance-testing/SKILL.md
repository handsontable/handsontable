---
name: performance-testing
path: performance-tests/**
description: Use when adding, modifying, or debugging Handsontable performance test scenarios in performance-tests/ - covers the CDP trace-based measurement system, scenario structure (fixture + config + spec), trace-parser integration, hook timing for filtering/sorting, golden snapshot workflow on GitHub Pages, and the CI comparison pipeline. Trigger whenever work touches performance-tests/ files, when asked to benchmark a Handsontable feature, or when adding a new performance scenario.
---

# Performance Testing

## Overview

The `performance-tests/` package measures Handsontable rendering and interaction performance using Playwright + Chrome DevTools Protocol (CDP) traces. It is a **standalone package outside the pnpm workspace** -- it has its own `package.json`, `node_modules`, and ESLint config.

Each scenario traces a specific user interaction (scrolling, filtering, sorting, editing), parses the CDP trace into DevTools-equivalent categories (scripting, rendering, painting, idle), and produces a compact markdown PR comment plus a self-contained interactive HTML report comparing against a golden baseline from `develop`.

## Package Structure

```
performance-tests/
  scripts/run.mjs           # Orchestrator: build HOT UMD -> copy to fixtures -> run Playwright
  scripts/replay-goldens.mjs # Replays gh-pages develop goldens to re-derive the callout thresholds
  playwright.config.ts       # Sequential, 1 worker, 5 min timeout, chromium only
  trace-parser.mjs           # CDP trace -> DevTools-equivalent category breakdown
  .eslintrc.js               # Extends root config, relaxes JSDoc/console/await-in-loop rules
  lib/
    setup.mjs                 # Playwright globalSetup: records Chromium build + machine to output/environment.json
    environment.mjs           # Run provenance and the baseline compatibility key (Chromium, harness version)
    trace-runner.mjs          # CDP Tracing.start/stop + warmup/iteration loop + progress output; owns HARNESS_VERSION
    hook-timing.mjs           # Hook pair timing (inject/get/save) for before/after measurements
    snapshot-store.mjs        # Golden baseline save/load; refuses an incompatible baseline and says why
    median-snapshot.mjs       # Synthesizes the rolling-median develop baseline (+ its run-to-run spread)
    thresholds.mjs            # Shared classification logic (regression/improvement thresholds)
    chart-generator.mjs       # Inline SVG horizontal bar charts (base64 data URIs)
    report-builder.mjs        # Compact markdown PR comment (summary table + regression callouts)
    html-report-builder.mjs   # Self-contained interactive HTML report (inline CSS + JS)
    build-history-index.mjs   # Generates gh-pages history listing for develop runs
    teardown.mjs              # Playwright globalTeardown: parse traces -> report
    fs-utils.mjs              # Shared filesystem helpers (exists)
    scroll-utils.mjs          # Scroll-and-wait helpers (scrollToRow, scrollToColumn)
  scenarios/
    <name>/
      scenario.config.mjs     # { name, warmupRuns, iterations }
      fixture.html             # Standalone HTML loading HOT UMD from ../../fixtures/
      <name>.spec.ts           # Playwright test using runTracedScenario()
  fixtures/
    .gitkeep                   # Built JS/CSS copied here by run.mjs (gitignored)
  golden/                      # Golden snapshots (gitignored, fetched from gh-pages branch)
  output/                      # Trace JSONs + result.md + report.html (gitignored)
```

## Adding a New Scenario

Every scenario needs exactly three files in `scenarios/<name>/`:

### 1. scenario.config.mjs

```js
// Grid: <rows> x <cols> -- <rationale for this grid size>
export default {
  name: 'my-scenario',
  warmupRuns: 1,
  iterations: 3,
  // Bump when this spec changes what the marked window contains: the median baseline only draws on
  // develop goldens recorded at the same version (see lib/environment.mjs).
  measurementVersion: 1,
};
```

The `name` must match the directory name -- it determines the `output/<name>/` subdirectory, and the teardown reads `measurementVersion` from the config by that name. Add a comment documenting the grid size and why it was chosen.

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
- Running warmup iterations (no tracing) with progress output
- Running measured iterations with CDP tracing and heartbeat dots
- Writing trace JSON files as `iteration-{n}.json`

### Adding hook timing (filtering/sorting scenarios)

For scenarios that measure a specific hook pair (e.g., `beforeFilter` -> `afterFilter`):

```ts
import { injectHookTimer, getHookTiming, saveHookTimings } from '../../lib/hook-timing.mjs';

// Before tracing, inject the timer:
await injectHookTimer(page, 'beforeFilter', 'afterFilter');

const hookDeltas: number[] = [];
const outputDir = path.resolve('output', config.name);

// In afterActionFn -- NOT actionFn. getHookTiming is a page.evaluate, and inside
// actionFn its CDP round trip falls inside the marked window, so it is measured as
// part of the operation on measured iterations only:
afterActionFn: async() => {
  const timing = await getHookTiming(page, 'beforeFilter', 'afterFilter');
  if (timing.deltaMs != null) {
    hookDeltas.push(timing.deltaMs);
  }
},

// Inside resetFn, call injectHookTimer again to reset the store
// (it is idempotent -- prevents duplicate listener registration):
await injectHookTimer(page, 'beforeFilter', 'afterFilter');

// After runTracedScenario, save hook timing:
await saveHookTimings(outputDir, hookDeltas);
```

The `saveHookTimings` helper computes the average and writes `hook-timing.json`. The teardown automatically picks it up from each scenario directory.

### Using scroll helpers

For scenarios that need to pre-scroll the grid (e.g., scroll-up starts from the bottom):

```ts
import { scrollToRow, scrollToColumn } from '../../lib/scroll-utils.mjs';

// Scroll to row 4999 and wait until it's rendered (no arbitrary timeouts)
await scrollToRow(page, 4999);

// Or scroll to column 4999
await scrollToColumn(page, 4999);
```

These combine `scrollViewportTo()` with a deterministic `waitForFunction` that checks the index mapper -- always use them instead of `waitForTimeout`.

## Existing Scenarios

| Scenario | Grid size | Action | Special |
|---|---|---|---|
| scroll-down | 10000x50 | `mouse.wheel(0, 350)` x 500 | - |
| scroll-up | 10000x50 | `mouse.wheel(0, -350)` x 500 | Pre-scrolls to bottom via `scrollToRow` |
| scroll-right | 10x5000 | `mouse.wheel(350, 0)` x 500 | - |
| scroll-left | 10x5000 | `mouse.wheel(-350, 0)` x 500 | Pre-scrolls to right via `scrollToColumn` |
| filtering | 100000x100 | `filters.addCondition` + `filter()` | Hook timing |
| sorting | 100000x100 | `columnSorting.sort()` asc/desc alternating | Hook timing |
| cell-editing | 5000x10 | selectCell + Enter + type + Enter x 20 | - |
| initial-load | 100000x100 | `new Handsontable(...)` | Grid construction only |
| source-data-validator-load | 100000x100 | `new Handsontable(...)` with `sourceDataValidator` | initial-load's fixture plus the one option |

Iterations: 3 for the scroll and cell-editing scenarios, 5 for filtering, sorting, initial-load and source-data-validator-load. Those four have 50 to 150 ms windows on a 300 MB heap, where one GC pause inside the window moves a mean of three by 10 to 20%, and their iterations are cheap next to the fixture load. Do not raise the scroll scenarios: each iteration is 500 wheel round trips.

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

# Type-check spec files
npm run typecheck
```

Build artifacts (`handsontable/dist/` and `handsontable/styles/`) must exist before running tests directly with `npx playwright test`. The `scripts/run.mjs` orchestrator handles building automatically.

## CI Workflow

The GitHub Actions workflow (`.github/workflows/performance-tests.yml`) operates in two modes:

- **`push` to `develop`**: Runs all scenarios in `golden` mode, deploys `snapshots.json` + `report.html` to the `gh-pages` branch under `performance-reports/develop/<timestamp>/`. Updates `latest.json` as a pointer for PR comparisons. Builds a history index page listing all past runs with their commit, Chromium build and CPU. The run is also **compared against the trailing median** of compatible develop goldens, for its report, the job summary and one `::warning` annotation per regressed scenario -- so a shift on develop is seen on the develop run that introduced it. The snapshot it saves is never derived from history (teardown saves before it loads).
- **`pull_request`**: Fetches the last 20 develop goldens from `gh-pages` into `golden/history/` (plus `latest.json` as a single-file fallback), runs all scenarios in `compare` mode, posts a compact sticky PR comment with a summary table and regression callouts, and deploys the full HTML report to `performance-reports/<branch-slug>/` on GitHub Pages.

Push retries with rebase (up to 3 attempts) protect against concurrent gh-pages writes.

### Baseline compatibility and provenance

Replaying the develop goldens showed that the numbers move for reasons unrelated to the grid: a Playwright bump (new Chromium) shifted initial-load by -18% and sorting by -20% in one develop push, and the median-of-5 baseline carried the old browser's numbers for five more pushes, so unrelated PRs were told they had regressed. Three mechanisms now address that, all in `lib/environment.mjs`:

- **Provenance.** `lib/setup.mjs` (Playwright `globalSetup`) records the Chromium build (`browser.version()`), CPU model and count, memory, platform and the GitHub runner image into `output/environment.json`. The teardown stamps it on the snapshot (`environment`, `harnessVersion`) and both reports print it in their footer.
- **Compatibility key.** `{ chromium, harnessVersion }` at the snapshot level, `measurementVersion` per scenario. `computeMedianSnapshot(..., { compatibleWith })` draws only on goldens with the same key, and within a scenario only on entries at the same `measurementVersion`. A golden recorded before provenance existed has no key and is excluded by the absence of the fields, like a pre-marks golden is by `windowSource`. With fewer than 2 compatible goldens the comment says "no comparable baseline" and why (`describeKeyMismatch`), and deltas resume two develop pushes later. **Bump `HARNESS_VERSION` in `trace-runner.mjs`** when the runner changes what a window contains (settle, GC between iterations, work moved in or out); **bump a scenario's `measurementVersion`** when only that spec's definition changes.
- **Run shift.** The comment's `Δ vs shift` column and the footer's `Run shift` line name the median delta across scenarios: how much faster or slower this runner ran than the baseline's, which every scenario shares (the per-run factor spans 0.63x-1.12x across develop goldens and removing it takes the scroll scenarios' run-to-run CV from ~13% to ~3%). It is reported, never gated on: the callouts fire on the raw `Δ Total`, because a change that slows every scenario alike is exactly what a median cannot see.

`scripts/replay-goldens.mjs` groups goldens by key before replaying, so a replay across a Chromium change never medians two environments together; its `Compatibility groups` block shows how many goldens sit in each.

## The Trace Pipeline

Understanding the data flow helps when debugging or extending:

### The measured window (read before adding a scenario)

Everything published describes the slice between the two `performance.mark`s that
`runTracedScenario()` writes around the action. Two rules follow:

- **No harness round trips inside `actionFn`.** A `page.evaluate` that reads a value back
  is measured as part of the operation. Put readbacks in `afterActionFn`, which runs after
  the end mark.
- **A `resetFn` must leave no frame behind.** The runner settles after `setupFn` and
  `resetFn` for this reason, and `skipSettle` does not turn those off. Note that
  `scrollToRow`/`scrollToColumn` report trimming, not scroll position, so their
  `waitForFunction` returns before the scroll has rendered.

A category measured as exactly `0`, or a CV of `141.42%` (the CV of `{x, 0, 0}` at three
iterations), means the window is wrong -- not that the operation was cheap.

1. **Spec** calls `runTracedScenario()` -> forced GC (over a control CDP session), CDP `Tracing.start`, start mark, action, settle, end mark, `afterActionFn`, forced GC + `Runtime.getHeapUsage` readback, `Tracing.end` -> raw JSON per iteration, plus `heap-after-gc.json` for the scenario. The GC before tracing keeps the previous reset's garbage out of the window (initial-load's third iteration read ~50% slower than its first two before it); the readback after the end mark is the live set, recorded as `updateCounters.jsHeapAfterGcBytes`. Both are part of `HARNESS_VERSION` 2.
2. **Teardown** (`lib/teardown.mjs`) discovers `output/*/iteration-*.json`, calls `parseTrace()` from `trace-parser.mjs`
3. **trace-parser.mjs** categorizes events into DevTools categories (scripting, rendering, painting, loading, system, idle), measures the window `runTracedScenario()` marked around the action (falling back to the auto-zoomed window only for traces recorded without marks), synthesizes ProfileCall scripting from CPU profile data
4. **Teardown** averages across iterations via `averageParsedTraces()`, collects per-iteration values for CV% calculation, strips internal fields (`_iterationValues`, `_debug`) from saved snapshots
5. **report-builder.mjs** assembles a compact markdown PR comment; **html-report-builder.mjs** generates a full interactive HTML report with inline SVG charts from **chart-generator.mjs**
6. If `PERF_MODE=golden`: `snapshot-store.mjs` saves averaged results, deployed to gh-pages
7. If `PERF_MODE=compare`: teardown loads golden from gh-pages, report shows deltas

## Shared Utilities

The `lib/` directory provides reusable helpers to avoid duplication across scenarios:

| Module | Exports | Purpose |
|---|---|---|
| `fs-utils.mjs` | `exists(path)` | Async file existence check (used by teardown, snapshot-store, run.mjs) |
| `scroll-utils.mjs` | `scrollToRow(page, row)`, `scrollToColumn(page, col)` | Scroll + deterministic wait for renderable index |
| `thresholds.mjs` | `pctChange()`, `classifyChange()`, `sumActiveComparable()`, `calcCv()`, `heapThresholdFor()`, `runShift()`, `relativeToShift()`, `fmtMs()`, `fmtPct()`, `fmtCv()`, etc. | Shared classification and formatting for both report builders. The single source of the callout thresholds and colour bands: never restate either number elsewhere, and never retune one by eye (see `scripts/replay-goldens.mjs`). Heap has per-scenario overrides in `HEAP_THRESHOLDS_BY_SCENARIO` (the horizontal-scroll scenarios' peak heap is GC timing, CV 4.4-6.3%); read them through `heapThresholdFor(name)` |
| `environment.mjs` | `collectEnvironment()`, `baselineKey()`, `isCompatibleBaseline()`, `describeKeyMismatch()`, `formatEnvironment()`, `currentKey()` | Run provenance and the baseline compatibility key; see [Baseline compatibility and provenance](#baseline-compatibility-and-provenance) |
| `hook-timing.mjs` | `injectHookTimer()`, `getHookTiming()`, `saveHookTimings()` | Hook pair timing injection, retrieval, and persistence |

Always import from these shared modules rather than duplicating logic in scenario specs.

## .mjs Convention

All `.mjs` files in this package follow the `node-scripts-dev` skill conventions:
- `node:` prefix for builtins
- `node:fs/promises` async APIs (never sync)
- `import.meta.dirname` for paths
- `join()` from `node:path` for cross-platform paths
- **No TypeScript syntax** -- `.mjs` files are plain JavaScript. Use `/** @type {any} */` JSDoc casts, not `as any`.

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
| Using `waitForTimeout()` for scroll/render waits | Use `scrollToRow()` / `scrollToColumn()` from `lib/scroll-utils.mjs`, or `waitForFunction` with a renderable index check |
| Manually writing `hook-timing.json` with `writeFile` | Use `saveHookTimings(outputDir, deltas)` from `lib/hook-timing.mjs` |
| Using TypeScript syntax (`as any`) in `.mjs` files | Use JSDoc casts: `/** @type {any} */ (window)` -- `.mjs` is not transpiled |
| Defining `exists()` locally in a new `.mjs` file | Import from `lib/fs-utils.mjs` -- it is the single source |
| Changing what a window contains without bumping a version | Bump `HARNESS_VERSION` (`lib/trace-runner.mjs`) for a runner change, or the scenario's `measurementVersion` for a spec change; otherwise the median window averages two definitions of the scenario for five develop pushes |
| Reading `REGRESSION_CALLOUT_THRESHOLD_HEAP` directly at a render site | Use `heapThresholdFor(name)` -- two scenarios carry a wider band, and a site that bypasses it disagrees with the callouts |
| Gating a callout on `Δ vs shift` | Never. The shift is a median across scenarios, blind to a uniform regression; it is shown beside the raw delta so a reader can weigh it, not used to suppress anything |
