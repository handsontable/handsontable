# Handsontable Performance Tests

Automated performance measurement suite for Handsontable using [Playwright](https://playwright.dev/) and Chrome DevTools Protocol (CDP) traces.

The system traces real user interactions (scrolling, filtering, sorting, editing), parses the CDP trace into the same categories shown by the DevTools Performance panel, and produces a compact markdown PR comment plus a self-contained interactive HTML report comparing against a golden baseline from `develop`.

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
- A compact markdown report at `output/result.md`
- An interactive HTML report at `output/report.html`

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

The suite measures whatever Chromium the `@playwright/test` pin ships, and every
snapshot records which one (`environment.chromium`, captured by the Playwright
`globalSetup` in `lib/setup.mjs`). The baseline is a median over develop goldens
with the **same Chromium build, platform, and harness version** only, so after a
Playwright bump or platform change the first PR run reports "no comparable baseline" with the reason. Deltas
resume with the next develop push (against that single run, and the footer says
so), and as a median once two have run on the new engine. The comment's `Δ vs
shift` column and `Run shift` footer name how much faster or slower the CI runner
was than the baseline's, which every scenario shares; callouts still fire on the
raw delta. A golden (develop-push) run is compared against the trailing median
too, and annotates its own run with a `::warning` per regressed scenario. Expect
noise there: replaying 42 develop goldens, 8% of no-change rows crossed the 15%
threshold, and with nine rows per push roughly two develop pushes in five carried
a warning that measured the runner rather than the code. There are twelve rows since the three undo
scenarios landed, so expect such warnings more often. Read a warning against
the `Run shift` in the job summary, and re-derive the threshold with
`scripts/replay-goldens.mjs` before trusting a single one.

### Linting and type checking

```bash
npm run lint
npm run typecheck
```

## Scenarios

Each scenario measures a specific user interaction pattern:

| Scenario | Grid size | Action | Notes |
|---|---|---|---|
| **scroll-down** | 10000 x 50 | `mouse.wheel(0, 350)` x 500 | Vertical scroll from top |
| **scroll-up** | 10000 x 50 | `mouse.wheel(0, -350)` x 500 | Pre-scrolls to bottom, then scrolls up |
| **scroll-right** | 10 x 5000 | `mouse.wheel(350, 0)` x 500 | Horizontal scroll from left |
| **scroll-left** | 10 x 5000 | `mouse.wheel(-350, 0)` x 500 | Pre-scrolls to right, then scrolls left |
| **filtering** | 100000 x 100 | `filters.addCondition()` + `filter()` | Hook timing: beforeFilter -> afterFilter |
| **sorting** | 100000 x 100 | `columnSorting.sort()` | Hook timing: beforeColumnSort -> afterColumnSort |
| **cell-editing** | 5000 x 10 | selectCell + Enter + type + Enter x 20 | Sequential cell edits |
| **initial-load** | 100000 x 100 | `new Handsontable(...)` | Grid construction only |
| **source-data-validator-load** | 100000 x 100 | `new Handsontable(...)` with `sourceDataValidator` | Same fixture as initial-load plus the one option |
| **column-autosize-refill** | 2000 x 200 | `manualColumnResize.setManualSize(2, 320)` + `render()` | 25px columns (~72 rendered), 40 wrapped rows shrink and the row band is refilled in several passes within the draw |
| **undo-edit** | 100000 x 100 | `undo()` of one `setDataAtCell()` | Hook timing: beforeUndo -> afterUndo. Must not scale with the grid: one journaled cell, every index map shared |
| **undo-sort** | 100000 x 100 | `undo()` of a `columnSorting.sort()` | Hook timing: beforeUndo -> afterUndo. The index-map restore path (the 100000-row order) |
| **undo-remove-rows** | 100000 x 100 | `undo()` of `alter('remove_row', 1000, 100)` | Hook timing: beforeUndo -> afterUndo. The structural path: physical-order replay, rows re-created, maps restored |

Each scenario runs **1 warmup iteration** (discarded) followed by **3 measured iterations** with CDP tracing. Eleven scenarios (filtering, sorting, initial-load, source-data-validator-load, undo-edit, undo-sort, undo-remove-rows, row-selection-select-all, row-selection-deselect-all, checkbox-header-toggle, checkbox-column-set-data) run **5**; each states its own reason in its `scenario.config.mjs` (short windows on a 300 to 350 MB heap where one GC pause moves a mean of three by 10 to 20%; for `source-data-validator-load`, a 20% run-to-run spread after removing the runner factor), and their iterations cost seconds next to the fixture load. The runner forces a full GC before every measured iteration, so garbage from the previous reset is never collected inside the next window, and reads the live heap after every end mark (`jsHeapAfterGcBytes`, recorded beside the windowed extrema).

## Project structure

```
performance-tests/
  scripts/
    run.mjs                   # Orchestrator (install, build, copy, run, confirm re-run)
    enforce-gate.mjs          # The PR job's last step: verdict.json -> `verdict` output + annotation
    replay-goldens.mjs        # Replays the develop goldens to calibrate the thresholds and the gate
  playwright.config.ts         # Sequential execution, 1 worker, 5 min timeout
  trace-parser.mjs             # CDP trace -> DevTools category breakdown
  .eslintrc.js                 # ESLint config (extends root)
  lib/
    setup.mjs                  # Playwright globalSetup: Chromium build + platform + machine -> output/environment.json
    environment.mjs            # Run provenance and the baseline compatibility key
    trace-runner.mjs           # CDP Tracing.start/stop + warmup/iteration loop; owns HARNESS_VERSION
    hook-timing.mjs            # performance.now() on before/after hook pairs + save
    snapshot-store.mjs         # Golden baseline save/load; refuses an incompatible baseline
    median-snapshot.mjs        # The median-of-5 baseline, and the newest golden behind it
    thresholds.mjs             # The gate's lines and the shared classification (regression/improvement %)
    gate.mjs                   # The regression gate: one verdict per run, and the confirm re-run rules
    gate-enforce.mjs           # Turns the verdict into the PR job's outcome (`regressed` asks for approval)
    confirm-pass.mjs           # Sets up the re-run of the failing scenarios
    chart-generator.mjs        # Inline SVG bar charts for reports
    report-builder.mjs         # Compact markdown PR comment
    html-report-builder.mjs    # Self-contained interactive HTML report
    build-history-index.mjs    # gh-pages history listing for develop runs
    teardown.mjs               # Playwright globalTeardown: traces -> report
    fs-utils.mjs               # Shared filesystem helpers (exists)
    scroll-utils.mjs           # Scroll-and-wait helpers for scroll scenarios
  scenarios/
    <name>/
      scenario.config.mjs      # { name, warmupRuns, iterations, measurementVersion }
      fixture.html              # Standalone HTML loading HOT UMD
      <name>.spec.ts            # Playwright test using runTracedScenario()
  fixtures/                     # Built JS/CSS (gitignored, copied by run.mjs)
  golden/                       # Golden snapshots (gitignored, from gh-pages)
  output/                       # Trace JSONs + result.md + report.html + verdict.json (gitignored);
                                # first-pass/ + verdict-first-pass.json after a confirm re-run
```

## How it works

### Trace pipeline

1. The **spec file** calls `runTracedScenario()`, which starts CDP tracing (`Tracing.start`), marks the start of the measured window, executes the action, waits for the resulting frame to reach the compositor, marks the end, stops tracing (`Tracing.end`), and writes the raw JSON per iteration.

2. The **globalTeardown** (`lib/teardown.mjs`) discovers all `output/*/iteration-*.json` files and feeds them to the trace parser.

3. The **trace parser** (`trace-parser.mjs`) categorizes every trace event into DevTools-equivalent categories: scripting, rendering, painting, loading, system (other), and idle. It measures the window the runner marked around the action, synthesizes ProfileCall scripting from CPU profile data, and extracts UpdateCounters (heap, nodes, listeners). Traces recorded without the marks fall back to the auto-zoomed window (matching DevTools' `MainThreadActivity.calculateWindow`); teardown warns when that happens, because the two are not comparable -- see [The measured window](#the-measured-window).

4. Results are **averaged** across iterations with per-iteration values retained for CV% (coefficient of variation) calculation.

5. Two **report builders** produce output:
   - **Markdown** (`report-builder.mjs`): compact summary table with regression callouts, posted as a sticky PR comment.
   - **HTML** (`html-report-builder.mjs`): self-contained interactive page with inline SVG bar charts, sortable tables, and scenario detail views. Deployed to GitHub Pages per branch.

### The measured window

Everything the suite publishes describes one slice of the trace, and picking that slice
correctly is the difference between measuring the grid and measuring the harness.

`runTracedScenario()` brackets the action with `performance.mark` (recorded via the
`blink.user_timing` category) and the parser measures between those marks. It does **not**
auto-zoom onto the busiest region of the trace, because for any scenario driven through
`page.evaluate` the busiest region is the V8 interrupt CDP uses to enter the isolate -- a
blob of a few hundred milliseconds that maps to no category, lands in `other`, and is
excluded from `Total`. Worse, a window fitted to it closes before the `Paint`, `Layout` and
`Commit` events the action caused, so rendering and painting score exactly zero.

Two rules follow for anyone writing or changing a scenario:

- **Keep harness round trips out of the window.** A `page.evaluate` inside `actionFn` that
  reads a value back is billed to the action. Use `afterActionFn`, which runs after the end
  mark, for readbacks such as hook timings.
- **Let the reset settle.** A reset renders synchronously but paints a frame later. The
  runner settles after `setupFn` and `resetFn` for this reason, and `skipSettle` does not
  reach those -- it gates only the in-window settle. Note that `scrollToRow` and
  `scrollToColumn` wait on trimming, not scroll position, so they return before the scroll
  has rendered; the settle is what makes those resets deterministic.

A category measured as exactly `0`, or a CV of `sqrt(n) × 100%` (one nonzero iteration among
zeros, with the sample standard deviation `calcCv` uses: `173.21%` at three iterations, `223.61%`
at five), means the window is wrong -- not that the operation was cheap.

### Golden baseline workflow

The CI workflow (`.github/workflows/performance-tests.yml`) operates in two modes:

- **On push to `develop`** (`PERF_MODE=golden`): Runs all scenarios, saves the averaged results as `golden/snapshots.json` with their provenance (commit, run, Chromium build, platform, CPU, harness version), and deploys them to the `gh-pages` branch under `performance-reports/develop/<timestamp>/`. A `latest.json` pointer is updated for PR comparisons. A history index page lists all past runs with their commit, Chromium build, platform, and CPU. The run is also compared against the trailing median of compatible develop goldens: the report goes to the job summary and each regressed scenario becomes a `::warning` annotation on the run, so a shift on develop is seen where it happened. The saved snapshot is never derived from history.

- **On pull request** (`PERF_MODE=compare`): Fetches the last 20 develop goldens from `gh-pages` into `golden/history/` (and `latest.json` as a single-file fallback), runs all scenarios, and generates a delta report against a median of the newest 5 goldens that share this run's Chromium build, platform, and harness version. The markdown summary is posted as a sticky PR comment; the full HTML report is deployed to GitHub Pages at `performance-reports/<branch-slug>/`. The regression gate then decides the run (see [Regression gate](#regression-gate)).

If no compatible golden baseline exists (first run, `gh-pages` branch not yet created, or before the first develop push after the Chromium, platform, or harness changed), the report shows raw metrics in self-compare mode and states why. One compatible develop golden serves as the single-run baseline. The median starts after the second.

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
- JS heap size (min/max), plus the live heap after a forced GC once the end mark is down (`JS heap after GC` in the HTML memory table; informational until enough goldens carry it to derive a threshold, the gate stays on the max)
- DOM node count (min/max)
- Event listener count (min/max)

### Reading a delta

Two spreads appear beside every delta, and they answer different questions. Both are a coefficient
of variation over the sample standard deviation. Only the second is flagged above
`CV_WARNING_THRESHOLD` (15%): a few scenarios' iterations disagree widely by construction (undo-edit's
read ~100% apart on every run while its develop runs sit 1.5% apart), so a flag on the first fired on
every comment and meant nothing.

| Column | What it measures | Typical value |
|---|---|---|
| **CV run** | How much the iterations of this one run disagreed | under 4% on most scenarios |
| **CV base** | How far apart the develop runs behind the median baseline sit | 0.3–2.2% |

A tight `CV run` says the run measured itself consistently. It says nothing about whether the run is
comparable to the baseline, which is what `CV base` reports. When the second number is wide, the
delta beside it is measured against a moving target.

A third figure, **`Δ vs shift`**, is the row's delta with the run's common shift removed. The
footer's `Run shift` is the median delta across scenarios: how much faster or slower this CI runner
ran than the baseline's, which every scenario shares. On the self-hosted Apple M1 runner the suite
uses since 2026-09-15 it stays within ±1%; on the shared runners before it, it spanned 0.63x–1.12x and
made whole tables read -25% green or +12% yellow. A row at `+18%` raw and `+2%` vs shift moved with
the runner; a row at `+45%` raw and `+40%` vs shift moved on its own. The gate judges the raw delta
regardless, because a change that slows every scenario alike is exactly what a median across
scenarios cannot see; a shift above +5% fails the run on its own (see [Regression gate](#regression-gate)).

Markers appear only where the gate acts: 🔴 over the fail line, 🟡 over the watch line, 🟢 under the
mirror of the fail line. A smaller change is the runner's noise and carries none.

`n/a` means the spread is genuinely unknown, not zero. The baseline spread is absent in golden mode,
in the self-compare fallback, in the single-run `latest.json` fallback (fewer than
`MIN_VALID_SNAPSHOTS` qualifying develop snapshots, so `computeMedianSnapshot` returns `null`), and
whenever the history window is too thin for a median.

### Thresholds

The lines live in `lib/thresholds.mjs`. The reports' red band is the gate's fail line, so a row is
painted red exactly where the gate fails it.

| Constant | Value | What it is |
|---|---|---|
| `GATE_TIMING_THRESHOLD` | 10 | A scenario fails when its total active time is more than 10% slower… |
| `GATE_TIMING_FLOOR_MS` | 2 | …and more than 2 ms slower. 10% of the 13–19 ms scenarios is timer rounding |
| `WATCH_TIMING_THRESHOLD` | 5 | Above this a scenario is listed "to watch"; it never fails |
| `GATE_RUN_SHIFT_THRESHOLD` | 5 | Every scenario slower by more than this, together, fails the run |
| `REGRESSION_CALLOUT_THRESHOLD_HEAP` | 5 | A scenario fails when its JS heap is more than 5% larger (10% on scroll-left and scroll-right, `HEAP_THRESHOLDS_BY_SCENARIO`) |

None of these is a guess, and none should be changed by eye. They come from replaying every develop
golden against a median of the goldens before it: every such comparison measures develop against
develop, so every delta it produces is noise, and the rate at which a line fires on that set is its
false-positive rate. The replay runs the gate itself, rule for rule, and counts runs as well as
comparisons, because one failing scenario fails the whole job. On the 98 develop runs since
2026-09-18 (the Apple M1 runner) it gives:

| | Runs that fire |
|---|---|
| Gate (all rules) | 0 of 98 |
| Watch (> 5%) | 2 of 98 |
| Timing at 7.5% | 1 of 98 |
| Heap at 3% | 10 of 98 |

The run-to-run spread of total active time is 0.3–2.4% per scenario there, and the run shift stays
within -0.7% to +0.8%. Reproduce it with:

```bash
git fetch origin gh-pages
node scripts/replay-goldens.mjs --since 2026-09-18
node scripts/replay-goldens.mjs --since 2026-09-18 --floor-ms 3   # another floor
```

The script prints the curves, marks the values in force, replays the gate, and prints the noise per
scenario (`|Δ| p95` and `|Δ| max` against the trailing median, and what the fail line means in ms).
Use those columns to calibrate, not the `CV all*` column: it is taken over every golden in the range,
so a speed-up merged on develop inflates it. Re-run the replay after any change to the runner, to how
the suite measures, or to which baseline it compares against, and move each line to the knee of its
curve.

### Regression gate

The gate turns the comparison into a result on every pull request into `develop`. It is decided once,
in the teardown (`lib/gate.mjs`), from the same assessment the comment renders, and written to
`output/verdict.json`.

- **A scenario fails** when it crosses the timing line (both parts) or the heap line, **unless the
  newest develop golden crosses the same line against the same median**. Then the level came from
  develop (a median still catching up with a merged change, or a runner change the compatibility key
  does not see), and the scenario is listed as "already on develop". A one-off spike on that newest
  golden would hide a real slowdown on the same scenario for one run; the replay found none in 109
  goldens.
- **The run fails** when its shift is above +5% and the newest golden's is not.
- **Not assessed, never failed:** a pull request into any branch other than `develop` (the baseline is
  always develop's), a run with no compatible baseline, and, per scenario, a scenario with no baseline
  yet or a comparison the report withholds.
- **Confirm re-run.** On a pull request run, every failing scenario (up to `CONFIRM_MAX_SCENARIOS`, 4)
  runs once more on its own, and fails only if it is slow both times. The self-hosted runner has
  short slow spells that move one scenario and nothing else (PR #13917: Scroll Down +21.4% at a 0.6%
  run spread), and no replay of the goldens can see them. `scripts/run.mjs` moves the first traces
  to `output/first-pass/` and re-runs the spec files; Playwright then runs the global teardown again,
  which merges the two verdicts (`rerun.confirmed`, `rerun.cleared`). More failing scenarios than the
  cap, or a run that failed only on its shift, is not re-run.
- **Approval, not a red job.** In block mode a regression does not fail `Performance / run`: the last
  step (`scripts/enforce-gate.mjs`) exports `verdict=regressed`, and `performance.yml`'s `approve` job
  waits on the `performance-approval` environment, the same mechanism as the visual and manual QA
  gates. GitHub notifies the reviewers; approving lets the pull request through, rejecting fails the
  job and `CI Gate`. The job asserts a recorded approval through the approvals API and fails closed.
  Approval is per run: a new push measures and asks again. Afterwards the job rewrites the sticky
  comment to say who approved.
- **Warn mode first.** `GATE_MODE` is `'warn'`: a regression exports `warned`, prints a warning, and
  nothing waits. It moves to `'block'` once the warn period has measured the false-fail rate on real
  pull request runs. Count it from the job logs: every pull request run prints one
  `::notice title=perf-gate::status=… failing=… cleared=…` line. `PERF_GATE_MODE=block` forces block
  mode for one run.
- **Before block mode** (repo admin): create the `performance-approval` environment with required
  reviewers and "Prevent self-review" off, like the other approval environments (`.ai/CI.md`). A job
  that references a missing environment auto-creates it unprotected.
- **Only a missing verdict fails the run job**, and only in block mode. The step writes its output
  before it sets the exit code and has no `continue-on-error`, so an unset `verdict` (which skips
  `approve`) always comes with a red job.
- The develop golden run is never gated. It keeps its `::warning` annotations, on the same line.

### What the report refuses to publish

A percentage is withheld when the comparison cannot support one. The label names the cause --
`baseline incomplete`, `capture incomplete`, or `window mismatch` -- and the reasons are:

- The baseline recorded zero for an active category that the current run did record
  (`baseline incomplete`). That is a failed capture, not a cheap operation, and dividing into it is
  what produced the `+115.7%` regressions this reporting layer was rewritten to stop.
- This run recorded zero for an active category that the baseline did record (`capture incomplete`).
  The mirror case: a capture failure on this run's side is no more supportable than one on the
  baseline's, and would otherwise publish a fake win a reader cannot tell from a real one.
- The two sides were measured through different trace windows (`windowSource` disagrees, rendered
  `window mismatch`). After the measurement fix this is a safety net rather than a common case.

Such a scenario is listed under "Not assessed" in the HTML report (the markdown comment says "Total
delta not assessed") rather than folded into "within tolerance": it was neither cleared nor flagged,
and the comment says so.

The **Trace window** row is informational and never coloured. After the measurement fix it is
mark-to-mark harness wall clock, which on the scroll scenarios is 500 sequential wheel round trips
sitting at a run-to-run CV of 0.0-0.2% regardless of what the grid does.

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
- Every `waitForFunction()` passes an explicit `{ polling }` (the tier's lint enforces it): the default polls on `requestAnimationFrame`, which a loaded machine starves, so a healthy page can time out.

### 3. `<name>.spec.ts`

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
    actionFn: async() => {
      // The measured action
    },
    // Optional: resetFn to restore state between iterations (the runner settles after it)
    // Optional: afterActionFn for readbacks, which run once the measured window has closed
    // Optional: settleFn to replace the default settle, or skipSettle to opt out of it
  });
});
```

### Adding hook timing

For scenarios that measure a specific Handsontable hook pair (like filtering or sorting):

1. Call `injectHookTimer(page, beforeHook, afterHook)` once before `runTracedScenario`. It is idempotent -- safe to call again in `resetFn` to reset the timer store.
2. In `afterActionFn` -- **not** `actionFn` -- call `getHookTiming(page, beforeHook, afterHook)` and push `timing.deltaMs` to a deltas array. It is a `page.evaluate`, so inside the action its CDP round trip would be measured as part of the operation.
3. After `runTracedScenario`, call `saveHookTimings(outputDir, deltas)` to persist the data.

All three functions are exported from `lib/hook-timing.mjs`. See the `filtering` or `sorting` scenario specs for the complete pattern.

### Scroll helpers

For scenarios that need to scroll the grid before or between iterations, use `scrollToRow(page, row)` and `scrollToColumn(page, col)` from `lib/scroll-utils.mjs`. These combine `scrollViewportTo` with a deterministic wait (no `waitForTimeout`) that verifies the target index is renderable.

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

When running in compare mode with a golden baseline, the **PR comment** leads with the gate's verdict
and lists only the scenarios that need attention; the full table and the hook timing are folded
under `<details>`. A quiet run:

```
## ⚡ Performance: ✅ all 18 scenarios within tolerance

<sub>Gate: a scenario fails above +10% and +2 ms of active time, or +5% of JS heap (…), and is
watched above +5%. …</sub>

<sub>Baseline: median of 5 develop runs (…). Current: … Run shift: +0.0% (…)</sub>

📊 **[Full interactive report →](https://handsontable.github.io/handsontable/performance-reports/my-branch/)**

<details><summary>All 18 scenarios</summary> … </details>
```

A regression, in block mode:

```
## ⚡ Performance: ❌ 1 of 18 scenarios regressed

Waiting for approval: if the slowdown is intended, a reviewer approves the pending
`performance-approval` deployment on the [workflow run](…); otherwise push a fix. …

| Scenario | Status      | Δ Total | Δ ms     | Δ Heap | What moved                                         |
| -------- | ----------- | ------- | -------- | ------ | -------------------------------------------------- |
| Sorting  | ❌ regressed | +32.5%  | +10.6 ms | +0.0%  | Scripting +32.5% slower, Rendering +32.5% slower, … |
```

The other statuses are `❌ regressed, confirmed on re-run`, `➖ already on develop`, `✔️ cleared on
re-run` (with the first run's numbers), and `🟡 to watch`. A pull request into another branch reads
`⏸ not assessed` with the reason.

The **HTML report** (linked from the PR comment) includes inline SVG bar charts, sortable detail tables, CV% stability indicators, and per-category breakdowns.

Without a golden baseline, the report shows raw metrics in self-compare mode.
