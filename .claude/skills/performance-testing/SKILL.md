---
name: performance-testing
path: performance-tests/**
description: Use when adding, modifying, or debugging Handsontable performance test scenarios in performance-tests/ - covers the CDP trace-based measurement system, scenario structure (fixture + config + spec), trace-parser integration, hook timing for filtering/sorting, golden snapshot workflow on GitHub Pages, and the CI comparison pipeline. Trigger whenever work touches performance-tests/ files, when asked to benchmark a Handsontable feature, or when adding a new performance scenario.
---

# Performance Testing

`performance-tests/` measures rendering and interaction performance with Playwright + CDP traces. It is a standalone package outside the pnpm workspace (own `package.json`, `node_modules`, ESLint config). Each scenario traces one interaction, parses the trace into DevTools categories (scripting, rendering, painting, idle), and produces a markdown PR comment plus an HTML report compared against a golden baseline from `develop`. Fuller reference: `performance-tests/README.md`.

## Package structure

`scripts/run.mjs` (build HOT UMD, copy to `fixtures/`, run Playwright), `scripts/replay-goldens.mjs` (replays gh-pages develop goldens to re-derive callout thresholds), `trace-parser.mjs`, `lib/` (`trace-runner.mjs` owns `HARNESS_VERSION`; `environment.mjs`, `snapshot-store.mjs`, `median-snapshot.mjs`, `thresholds.mjs`, `hook-timing.mjs`, `scroll-utils.mjs`, `fs-utils.mjs`, `teardown.mjs`, report builders), `scenarios/<name>/{scenario.config.mjs, fixture.html, <name>.spec.ts}`. Playwright runs sequentially, 1 worker, 5 min timeout, chromium only. `fixtures/`, `golden/` (fetched from gh-pages) and `output/` are gitignored.

## Adding a scenario

Three files in `scenarios/<name>/`.

### 1. scenario.config.mjs

```js
// Grid: <rows> x <cols> -- <rationale for this grid size>
export default {
  name: 'my-scenario',   // must equal the directory name
  warmupRuns: 1,
  iterations: 3,
  measurementVersion: 1,
};
```

`name` determines `output/<name>/`, and teardown reads `measurementVersion` by that name. Comment the grid size and why.

Bump `measurementVersion` when the spec changes what the marked window contains or when `iterations` changes: the median baseline draws only on develop goldens at the same version. `HARNESS_VERSION` covers runner-wide changes; when both change in one PR the harness bump already restarts the golden pool, so skip the scenario bump and say so in the config comment.

### 2. fixture.html

Standalone page that exposes the instance as `window.__hot`:

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
  window.__hot = new Handsontable(document.getElementById('hot'), {
    data: Handsontable.helper.createSpreadsheetData(5000, 10),
    rowHeaders: true, colHeaders: true, width: 1280, height: 600,
    autoRowSize: false, autoColumnSize: false,
    licenseKey: 'non-commercial-and-evaluation',
  });
</script>
</body>
</html>
```

Set `autoRowSize: false` and `autoColumnSize: false` (async sizing interferes with measurements). CSS is `handsontable.css` (no `full` CSS variant); JS is `handsontable.full.js`.

### 3. Spec

```ts
import { test } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');

test(config.name, async({ page }) => {
  await page.goto(`file://${fixturePath}`);
  await page.waitForFunction(() => (window as any).__hot, undefined, { polling: 100 });
  await runTracedScenario({
    page,
    warmupRuns: config.warmupRuns,
    iterations: config.iterations,
    outputDir: path.resolve('output', config.name),
    actionFn: async() => { /* measured action */ },
    // optional: setupFn, resetFn, afterActionFn, skipSettle
  });
});
```

`runTracedScenario` creates the output dir, runs untraced warmups, runs traced iterations, and writes `iteration-{n}.json`. Add a `resetFn` for repeatable actions, otherwise iterations 2+ start from iteration 1's end state.

### Hook timing (filtering/sorting)

```ts
import { injectHookTimer, getHookTiming, saveHookTimings } from '../../lib/hook-timing.mjs';

await injectHookTimer(page, 'beforeFilter', 'afterFilter');   // before tracing; call again in resetFn (idempotent, resets the store)
const hookDeltas: number[] = [];

// in runTracedScenario:
afterActionFn: async() => {   // afterActionFn, because getHookTiming is a page.evaluate and inside actionFn its CDP round trip is measured as part of the operation
  const timing = await getHookTiming(page, 'beforeFilter', 'afterFilter');
  if (timing.deltaMs != null) hookDeltas.push(timing.deltaMs);
},

await saveHookTimings(path.resolve('output', config.name), hookDeltas); // writes hook-timing.json; teardown picks it up
```

### Scroll helpers

`scrollToRow(page, row)` and `scrollToColumn(page, col)` from `lib/scroll-utils.mjs` combine `scrollViewportTo()` with a deterministic `waitForFunction` on the index mapper; use them in place of `waitForTimeout`.

## Existing scenarios

Listed under `scenarios/`: scroll-down/up/right/left (500 wheel events each; up and left pre-scroll via `scrollToRow`/`scrollToColumn`), filtering, sorting, cell-editing (5000x10), initial-load, source-data-validator-load (initial-load's fixture plus the one option), undo-edit, undo-sort, undo-remove-rows (redo in `resetFn`). Filtering, sorting and the undo scenarios use hook timing. Grids are 10000x50 (vertical scroll), 10x5000 (horizontal scroll), 100000x100 (the rest).

Iterations: 3 for scroll and cell-editing; 5 for filtering, sorting, initial-load, source-data-validator-load, undo-edit, undo-sort, undo-remove-rows. Each of those seven states its reason in its `scenario.config.mjs` (short windows on a 300 to 350 MB heap where one GC pause moves a mean of three by 10 to 20%; for `source-data-validator-load`, a 20% run-to-run spread after removing the runner factor). `lib/__tests__/scenario-configs.test.mjs` pins the counts, so change config and test together. Keep the scroll scenarios at 3: each iteration is 500 wheel round trips.

## Run commands

```bash
cd performance-tests && node scripts/run.mjs        # build HOT + copy fixtures + run all
npx playwright test --grep "scroll-down"            # one scenario (fixtures must exist)
PERF_MODE=golden node scripts/run.mjs               # save baseline snapshot
PERF_MODE=compare node scripts/run.mjs              # load golden, generate delta report
npm run lint
npm run typecheck                                   # spec files
```

`handsontable/dist/` and `handsontable/styles/` must exist before running `npx playwright test` directly; `scripts/run.mjs` builds them.

## CI workflow

`.github/workflows/performance-tests.yml`:

- **`push` to `develop`**: runs all scenarios in `golden` mode, deploys `snapshots.json` + `report.html` to `gh-pages` under `performance-reports/develop/<timestamp>/`, updates `latest.json` (the pointer for PR comparisons), and builds a history index page. The run is also compared against the trailing median of compatible develop goldens, for its report, job summary and one `::warning` annotation per regressed scenario. The snapshot it saves is never derived from history (teardown saves before it loads).
- **`pull_request`**: fetches the last 20 develop goldens into `golden/history/` (plus `latest.json` as a single-file fallback), runs all scenarios in `compare` mode, posts a sticky PR comment (summary table + regression callouts), and deploys the HTML report to `performance-reports/<branch-slug>/`.

Push retries with rebase (up to 3 attempts) for concurrent gh-pages writes.

### Baseline compatibility and provenance

All in `lib/environment.mjs`. A Playwright bump (new Chromium) once shifted initial-load by -18% and sorting by -20% in one develop push, and the median-of-5 baseline carried the old browser's numbers for five more pushes.

- **Provenance.** `lib/setup.mjs` (Playwright `globalSetup`) records the Chromium build (`browser.version()`), CPU model and count, memory, platform and GitHub runner image into `output/environment.json`. Teardown stamps it on the snapshot (`environment`, `harnessVersion`); both reports print it in the footer.
- **Compatibility key.** `{ chromium, platform, harnessVersion }` per snapshot, `measurementVersion` per scenario. `computeMedianSnapshot(..., { compatibleWith })` draws only on goldens with the same key, and within a scenario only on entries at the same `measurementVersion`. A golden without the provenance fields is excluded, as a pre-marks golden is by `windowSource`. With no compatible golden the comment says "no comparable baseline" and why (`describeKeyMismatch`, or one of `BASELINE_REFUSALS` in `snapshot-store.mjs`: empty history, no marks-valid golden, every scenario redefined, disjoint scenarios, empty `latest.json`). With exactly one, the single-file fallback serves and the footer says "single develop run"; the median needs two. **Bump `HARNESS_VERSION` in `trace-runner.mjs`** when the runner changes what a window contains (settle, GC between iterations, work moved in or out); **bump a scenario's `measurementVersion`** when only that spec's definition changes.
- **Run shift.** The comment's `Δ vs shift` column and the footer's `Run shift` line give the median delta across scenarios (how much faster or slower this runner ran than the baseline's; the per-run factor spans 0.63x-1.12x across develop goldens, and removing it takes the scroll scenarios' CV from ~13% to ~3%). It is reported only; callouts fire on the raw `Δ Total`, because a change that slows every scenario alike is invisible to a median.

`scripts/replay-goldens.mjs` groups goldens by key before replaying; its `Compatibility groups` block shows the counts per group.

## The trace pipeline

### The measured window (read before adding a scenario)

Everything published describes the slice between the two `performance.mark`s that `runTracedScenario()` writes around the action.

- Keep harness round trips out of `actionFn`: a `page.evaluate` that reads a value back is measured as part of the operation. Put readbacks in `afterActionFn`, which runs after the end mark.
- A `resetFn` must leave no frame behind. The runner settles after `setupFn` and `resetFn`, and `skipSettle` does not turn those off. `scrollToRow`/`scrollToColumn` report trimming, not scroll position, so their `waitForFunction` returns before the scroll has rendered.

A category measured as exactly `0`, or a CV of `sqrt(n) × 100%` (one nonzero iteration among zeros: `173.21%` at three iterations, `223.61%` at five, using the sample standard deviation `calcCv` uses), means the window is wrong, not that the operation was cheap.

1. **Spec** calls `runTracedScenario()`: forced GC (over a control CDP session), `Tracing.start`, start mark, action, settle, end mark, `afterActionFn`, forced GC + `Runtime.getHeapUsage` readback, `Tracing.end` -> raw JSON per iteration, plus `heap-after-gc.json` per scenario. The GC before tracing keeps the previous reset's garbage out of the window (initial-load's third iteration read ~50% slower before it); the readback is recorded as `updateCounters.jsHeapAfterGcBytes`. Both are part of `HARNESS_VERSION` 2.
2. **Teardown** (`lib/teardown.mjs`) runs `parseTrace()` (`trace-parser.mjs`) on `output/*/iteration-*.json`, measuring the marked window (the auto-zoomed window only for traces recorded without marks), averages via `averageParsedTraces()`, collects per-iteration values for CV%, and strips `_iterationValues` and `_debug` from saved snapshots.
3. `PERF_MODE=golden`: `snapshot-store.mjs` saves averaged results for gh-pages. `PERF_MODE=compare`: teardown loads the golden and the report shows deltas.

## Shared utilities

Import from `lib/` (`fs-utils.mjs` `exists`, `scroll-utils.mjs`, `hook-timing.mjs`, `environment.mjs`, `thresholds.mjs`) in specs and scripts. `thresholds.mjs` is the single source of the callout thresholds and colour bands: reference them from there, never restate either number elsewhere, and derive any retune from `scripts/replay-goldens.mjs`, never by eye. Heap has per-scenario overrides in `HEAP_THRESHOLDS_BY_SCENARIO` (the horizontal-scroll scenarios' peak heap is GC timing, CV 4.4-6.3%); read them through `heapThresholdFor(name)`. Never read `REGRESSION_CALLOUT_THRESHOLD_HEAP` directly at a render site: a bypass disagrees with the callouts.

## .mjs convention

Follow `node-scripts-dev`. `.mjs` files are plain JavaScript: use `/** @type {any} */ (window)` JSDoc casts instead of `as any`.

## Common mistakes

| Mistake | Fix |
|---|---|
| `npx playwright test` without built fixtures | Run `node scripts/run.mjs` or build HOT and copy dist files |
| `waitForFunction()` without `{ polling }` | The rAF default is starved on a loaded machine. Pass `undefined, { polling: 100 }`; the tier's eslint config bans the default |
| `waitForTimeout()` for scroll/render waits | `scrollToRow()` / `scrollToColumn()`, or `waitForFunction` with a renderable-index check |
| Changing a window's contents without a version bump | Bump `HARNESS_VERSION` (`lib/trace-runner.mjs`) for a runner change, or the scenario's `measurementVersion` for a spec change; otherwise the median averages two definitions of the scenario for five develop pushes |
| Gating a callout on `Δ vs shift` | Gate on the raw delta; the shift is a median across scenarios and is shown beside it for the reader to weigh |
