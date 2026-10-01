# Test-generation evals

The enforcement gates prove that a test *exists*, *passes*, and resists *gaming*.
This harness measures the missing dimension: whether the skills, rules, and
prompts that agents use actually produce **meaningful** tests. Tracked in
DEV-2061 (part of the DEV-2055 test-enforcement effort).

**North star: a low number of extremely meaningful tests.** Not coverage
maximization, not test count. One test that catches every injected bug beats ten
that catch none. **Coverage is the floor** (the new code ran); **mutation score
is the ceiling** (the test fails when the code is broken). The static signals in
this harness sit between the two: they are necessary conditions for
meaningfulness, not sufficient ones.

## The two eval types

1. **Per-change mutation check** — inject bugs (mutants) into changed source
   with StrykerJS (Jest runner) scoped to the changed files, and measure the
   kill rate of the new test. **Status: installed, manual-only.** StrykerJS is a
   root devDependency, and no CI workflow runs it: you run it by hand with
   `--mutate` (see [Mutation layer](#mutation-layer-installed-manual-only)).
   Without `--mutate`, a score reports `mutation: { available: true, reason:
   "stryker installed — pass --mutate <files> to run the kill-rate check" }`;
   in a checkout where `@stryker-mutator/core` does not resolve, it reports
   `mutation: { available: false, reason: "stryker not installed" }`.
2. **Prompt/skill regression eval** — **runnable now, zero dependencies.** The
   test-generation skills (`test-writing-discipline`,
   `handsontable-unit-testing`, `handsontable-playwright-e2e`) are artifacts
   under test. Each fixture case is a representative change brief; an agent
   authors a test for it per the skills, and the scorer grades the output. Run
   it whenever a skill or prompt changes, so an edit that quietly degrades
   generated-test quality is caught before it scales across every PR.

## How to run

```bash
# Score every fixture reference and counterexample (the harness self-test) —
# exits non-zero when a reference fails its own meaningfulness bar or a
# counterexample is not caught for the smell its file name declares:
node evals/run-eval.mjs

# Score an agent-generated candidate against a case (repeatable flag):
node evals/run-eval.mjs --candidate bug-fix-number-helper /path/to/generated.unit.ts

# Machine-readable output:
node evals/run-eval.mjs --json

# Score a single test file directly:
node evals/score.mjs <test-file> [--diff <diff-file>]

# Unit tests for the scorer:
node --test evals/__tests__/*.test.mjs
```

The eval flow for a candidate: give the agent `fixtures/<case>/case.md` as its
task brief, let it write the test, then pass the resulting file via
`--candidate <case> <file>`. Compare its row against the reference row — fewer
tests at the same quality is better.

## Fixture layout

```
evals/fixtures/<case>/
  case.md           # the change brief an agent receives, plus rubric notes
  change.diff       # optional — the source diff, feeds the relevance signal
  reference/        # hand-written example(s) of a meaningful test for the case
  counterexamples/  # optional — near-misses the scorer MUST catch for the one smell
                    # each is named after: <scenario>.<smell>.spec.ts
                    # (e.g. escape-cancels-edit.set-timeout.spec.ts)
```

A counterexample is the reference with exactly one scorer smell added (a fixed
`setTimeout`, a frame-count wait, a rendered-row count with no pinned viewport, a
captured value that never reaches an assertion), and it declares that smell in
its file name — `<scenario>.<smell>.spec.ts` (or `.spec.js` / `.unit.ts` /
`.unit.js`), where `<smell>` is one of the scorer's `determinismSmells` or
`structureSmells` ids. The self-test then proves the scorer still sees that one
signal, in the tier the smell lives in: a determinism smell is a problem (the
verdict flips to `suspect`), while a structure smell such as `unasserted-capture`
is a warning while its precision is measured (the verdict stays `meaningful` and
`structure-smells` lands in `warnings`) — so a counterexample is caught whether
its smell is reported as a problem or as a warning. `run-eval.mjs` fails when a
counterexample is not flagged for its declared smell, when it carries a second
smell or a problem besides the smell (a hollow test would keep it `suspect`
after the declared signal was lost, hiding the regression), or when a file in
the folder names no known smell (a stray README cannot count as "caught") — the
same way it fails when a reference scores `suspect`. The contract lives in
`evals/lib/counterexamples.mjs`. The scorer is text-based, so a counterexample's
comments must not spell a banned call with its parenthesis, or the file carries
two smells instead of the one it exists to prove.

The first three cases cover the representative change kinds from the eval
design: a **bug fix** (`bug-fix-number-helper`, a numeric-helper edge case), a
**feature** (`feature-percent-helper`, a small new helper API), and a
**granular interaction** (`e2e-escape-cancels-edit`, keyboard-driven editor
behavior on the Playwright tier; its `counterexamples/` carry the five
fixed-wait smells). Two more each pin one scorer smell with a
reference/counterexample pair: `e2e-rendered-rows-viewport`
(`theme-sensitive-viewport`) and `e2e-unasserted-capture`
(`unasserted-capture`).

Reference tests are written exactly as they would land in their real tier
(`handsontable/src/helpers/__tests__/`, `tests/e2e/`), so their imports resolve
there — the harness scores them statically, it does not execute them. To add a
case, create the folder with `case.md` and at least one reference test;
`run-eval.mjs` picks it up automatically and fails if the reference does not
score clean — or if a `counterexamples/` file is not caught for the smell its
name declares (a problem, or the `structure-smells` warning for a warning-tier
smell such as `unasserted-capture`), which means the smell it demonstrates is
documented but not detected. Add a `counterexamples/` file when a new smell
signal lands, so the signal has a fixture that proves it fires — the scorer test
compares the fixtures against the exported `DETERMINISM_SIGNALS` and
`STRUCTURE_SIGNALS` lists, so a signal without its fixture fails
`npm run test:tooling`. The hollow-test and gaming signals have no fixtures; the
inline-source unit tests in `evals/__tests__/score.test.mjs` cover them.

## What the scorer measures

`evals/score.mjs` emits one JSON object per file. It imports the shared
assertion/skip-focus regexes and the exact/bounded matcher tables from
`.github/scripts/lib/test-weakening.mjs` — one source of truth with the CI
weakening detector.

| Field | Signal |
|---|---|
| `tests`, `assertions` | Block and assertion counts — the count matters (fewer tests for the same quality is better). A parameterized `it.each` table counts one test per row of its array literal (one when the table cannot be read), the same count the detector's `tests-removed` uses. |
| `matchers` | `{ exact, bounded }` — how many matcher calls pin a value (`toBe`, `toEqual`, `toHaveBeenCalledTimes`, Playwright's `toHaveText`, …) versus bound it (`toBeGreaterThan`, `toBeTruthy`, `toContain`, `toHaveBeenCalled`, a bare `toThrow()`, …), classified by the detector's `matcherKind`; a negated call (`.not.toBe(0)`) counts as bounded. The single-file analogue of the detector's `matcher-downgrade`: when every assertion resolves to a bounded matcher, a `loose-matchers-only` **warning** is raised — warning-only, because a relational assertion is legitimate where no exact value exists. `toBeCloseTo` never raises it: pinning a float to N digits is not loose (the detector's `precision-widened` owns its loosening). |
| `hollowTests` | `it()`/`test()` blocks with no `expect`/`assert`/`verify` call — a test that only executes code. |
| `gamingSignals` | `.only`/`.skip`/`xit`/`fit` in any opener form the block count reads (`xit.each`, `test.concurrent.only`), `it.flaky`, `fixme`/`todo`, and failure-swallowing `try/catch`. |
| `determinismSmells` | `sleep(`, `waitForTimeout(`, `networkidle`, a global `setTimeout(` (bare, `window.`, or `globalThis.`) with a non-zero numeric-literal delay, `waitForNextAnimationFrames(` with anything but a literal `0` — timing-based instead of condition-based waits. Mirrors the lint bans in `tests/.eslintrc.cjs` and `handsontable/no-fixed-sleep-in-spec`, exemptions included: `test.setTimeout(ms)` is a budget, `setTimeout(fn, 0)` and `waitForNextAnimationFrames(0)` are zero-duration hand-offs, and a computed delay cannot be judged statically. And `theme-sensitive-viewport`: a rendered-count read (the legacy helpers by exact name — `countVisibleRows()`/`countVisibleCols()`, `countRenderedRows()`/`countRenderedCols()`, `getRenderedRowsCount()` — a look-alike such as `countVisibleCustomBorders()` does not read; or a `:visible` selector that something counts — `toHaveCount(` or `.count()` on the selector or on the locator it is captured into; a `:visible` click or `.first()` counts nothing) inside a describe whose grid setup hands no top-level `width`/`height` to an options object (`handsontable({ … })`, `grid.initGrid({ … })`, `new Handsontable(host, { … })`, or a local passed to one whole or spread) and never calls `scrollViewportTo`. A nested `width` (`border: { width: 2 }`, `columns: [{ width: 100 }]`) is not the grid's size, and an expected value (`toEqual({ width: 2, … })`) is not a setup. Row height differs per theme, so that count is a different number on each leg of the theme matrix. |
| `structureSmells` | `unasserted-capture`: a `const x = await …` in a test body whose value never reaches an assertion — neither `x` nor a local derived from it in one step (`const tokens = String(x).split(' ')`) lands inside `expect(…)`/`assert…(…)`, its matcher chain, or as the receiver of an `x.expect…(` helper. A value fetched and dropped is code run without being checked. **Warning-only** until its precision is measured: over the 69 Playwright specs shipped when it landed, it flagged 4 captures in 3 files, each a value fetched to drive an action (a bounding box for a pointer move, a count for a keyboard loop) whose outcome the test asserts by other means. Over the 158 specs in `tests/e2e/` on 2026-09-23 it flags 21 captures in 9 files. |
| `relevance` | With `--diff`: does the test reference any changed symbol? Warning-only (E2E tests assert behavior, not symbols). |
| `mutation` | The ceiling: with `--mutate`, the scored test's kill rate on those source files from a scoped StrykerJS run; without it, only the availability status. |
| `verdict` | `meaningful` when there is at least one test block, no hollow test, no gaming signal, and no determinism smell; otherwise `suspect` with `problems`. A structure smell is a warning while its precision is measured, so it never flips the verdict. |

The signals are heuristic and text-based, like the weakening detector they
build on: strong signals to surface, not proof. A reviewer or the mutation
layer still judges intent.


## Mutation layer (installed, manual-only)

StrykerJS is installed (root devDependencies: `@stryker-mutator/core` +
`@stryker-mutator/jest-runner`), and nothing in CI runs it; the scorer's
`mutation.available` flips to true automatically. Config: `handsontable/stryker.config.json` (jest runner via
`handsontable/jest.stryker.config.js`, which pins the Babel transform +
`envName: 'commonjs'` — Stryker's worker cwd breaks cwd-relative Babel
discovery). `inPlace` mode is used because the sandbox breaks pnpm workspace
links — do not run it while editing files in the same clone.

Per-change run — wired into the scorer via `--mutate` (DEV-2061). Pass the
changed source file(s); the scorer runs scoped Stryker and reports the real
kill-rate in the `mutation` field. ALWAYS scope — never the whole tree.

```bash
cd handsontable
npm run build:styles   # once per clone: generates src/styles/handsontableStyles.js, which some unit tests import
# score a test AND measure how many injected bugs in the source it kills:
node ../evals/score.mjs src/helpers/__tests__/errors.unit.js --mutate src/helpers/errors.ts
# → mutation: { available: true, score: 100, killed: 3, survived: 0, timeout: 0, noCoverage: 0, total: 3 }

# the underlying raw invocation (what --mutate runs for you):
HOT_MUTATION_TEST_FILES=src/helpers/__tests__/errors.unit.js BABEL_ENV=commonjs npx env-cmd -f ../hot.config.js npx stryker run --mutate src/helpers/errors.ts --reporters json
```

`parseMutationReport`/`runMutation` in `score.mjs` compute the standard
`detected / valid` score (killed+timeout over killed+timeout+survived+
no-coverage) — a survived or never-covered mutant means the test missed it.
When a run fails, `mutation.reason` quotes Stryker's own `ERROR` log lines
(for example `Initial test run timed out!`, or the name of a test that failed
in the initial run), or the shell's message when Stryker never started, with
the exit code. It used to keep only the first line of the error, which is the
command itself.

### What a run executes

The scored test, and nothing else. `jest.stryker.config.js` runs only the unit
tests named in `HOT_MUTATION_TEST_FILES` (comma-separated, relative to
`handsontable/`), in the initial test run and in every mutant run, and refuses
to start without them. The scorer sets the variable to the file it scores, so
the kill rate is that test's, not the suite's. A file outside `handsontable/`
(an evals fixture, a Playwright spec) gets a `mutation.reason` instead, and
Stryker does not start.

Measured on 2026-10-01 with `src/helpers/errors.ts`:

- **Unscoped, the run never finished.** Stryker's initial test run asks Jest for
  `--findRelatedTests <mutated file>` and runs the result in one process. For
  this helper that is 333 of the 461 unit suites, and the run hit Stryker's
  five-minute `dryRunTimeoutMinutes` (`Initial test run timed out!`, 5 min 14 s
  of wall time). Run in one process without Stryker, that set took 13 min 52 s
  (4420 tests). Each mutant run repeats it, so a raised timeout would buy a run
  of about half an hour for this helper's 3 mutants: one pass for the initial
  run, then one per mutant.
- **Stryker's own `--testFiles` gives a false score.** It scopes the initial run
  only. Under `coverageAnalysis: "all"` every covered mutant counts as static,
  and the jest runner passes such a mutant the test *file paths* as a test-name
  filter, which matches no test. Each mutant run then loaded every related
  suite until it timed out, and a timeout counts as detected: 3 of 3
  `Timeout`, a score of 100, with no test run against any mutant.
- **Scoped through `HOT_MUTATION_TEST_FILES`, it takes about 6 s:** 3 mutants,
  3 killed, from the scorer's start to its output.

`incremental` mode is off. It carries results from one run into the next: a
run scored against `src/helpers/feature.ts` reported the mutants of
`src/helpers/errors.ts` from the run before it, and `parseMutationReport` sums
every file in the report.

### What a run leaves behind

- `handsontable/reports/mutation/mutation.json`, the JSON report. The next run
  overwrites it.
- Nothing else after a run that finished. In place, Stryker backs up each file
  it rewrites to `handsontable/.stryker-tmp/backup-*/` and moves the backups
  back on exit. With `disableTypeChecks` off it rewrites only the mutated
  files. Stryker's default prepended `// @ts-nocheck` to every JS and TS file
  under `handsontable/` (2668 of them) for the length of the run. The jest
  runner strips types with Babel without checking them, so that comment never
  changed a result.
- An empty `handsontable/.stryker-tmp/` after a run that failed: Stryker keeps
  its temp directory for debugging.
- After a run that was killed outright (`SIGKILL`, a crash), the mutated files
  still hold Stryker's instrumented code, and their originals sit in
  `handsontable/.stryker-tmp/backup-*/`. Run `git restore` on the sources, or
  move the backups back. `SIGINT` (Ctrl+C), `SIGTERM`, `SIGHUP`, and
  `SIGABRT` are safe: Stryker restores the files before it exits.
- A new modification time on each mutated file, and its default mode: the
  restore moves the backup, a new file, over the original. While Stryker's
  default rewrote every file, that is how ten executable plugin sources came
  back from every run with a mode-only diff. No tracked file under
  `handsontable/src` is executable any more, and
  `scripts/__tests__/source-file-modes.test.mjs` keeps it that way.

Pilot result (2026-07-14): `src/helpers/errors.ts` → 4 mutants, 4 killed,
0 survived — mutation score 100, in 43s. Rerun on 2026-10-01, scoped to the
scored test: 3 mutants (the file has changed since), 3 killed, in about 6 s.
