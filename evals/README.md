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
   kill rate of the new test. **Status: pending team sign-off.** StrykerJS is a
   new dependency, and the minimal-dependency policy requires a team discussion
   first. Until `@stryker-mutator/core` resolves, every score reports
   `mutation: { available: false, reason: "stryker pending team sign-off" }`.
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
assertion/skip-focus regexes from `.github/scripts/lib/test-weakening.mjs` — one
source of truth with the CI weakening detector.

| Field | Signal |
|---|---|
| `tests`, `assertions` | Block and assertion counts — the count matters (fewer tests for the same quality is better). |
| `hollowTests` | `it()`/`test()` blocks with no `expect`/`assert`/`verify` call — a test that only executes code. |
| `gamingSignals` | `.only`/`.skip`/`xit`/`fit`, `it.flaky`, `fixme`/`todo`, and failure-swallowing `try/catch`. |
| `determinismSmells` | `sleep(`, `waitForTimeout(`, `networkidle`, a global `setTimeout(` (bare, `window.`, or `globalThis.`) with a non-zero numeric-literal delay, `waitForNextAnimationFrames(` with anything but a literal `0` — timing-based instead of condition-based waits. Mirrors the lint bans in `tests/.eslintrc.cjs` and `handsontable/no-fixed-sleep-in-spec`, exemptions included: `test.setTimeout(ms)` is a budget, `setTimeout(fn, 0)` and `waitForNextAnimationFrames(0)` are zero-duration hand-offs, and a computed delay cannot be judged statically. And `theme-sensitive-viewport`: a rendered-count read (the legacy helpers by exact name — `countVisibleRows()`/`countVisibleCols()`, `countRenderedRows()`/`countRenderedCols()`, `getRenderedRowsCount()` — a look-alike such as `countVisibleCustomBorders()` does not read; or a `:visible` selector that something counts — `toHaveCount(` or `.count()` on the selector or on the locator it is captured into; a `:visible` click or `.first()` counts nothing) inside a describe whose grid setup hands no top-level `width`/`height` to an options object (`handsontable({ … })`, `grid.initGrid({ … })`, `new Handsontable(host, { … })`, or a local passed to one whole or spread) and never calls `scrollViewportTo`. A nested `width` (`border: { width: 2 }`, `columns: [{ width: 100 }]`) is not the grid's size, and an expected value (`toEqual({ width: 2, … })`) is not a setup. Row height differs per theme, so that count is a different number on each leg of the theme matrix. |
| `structureSmells` | `unasserted-capture`: a `const x = await …` in a test body whose value never reaches an assertion — neither `x` nor a local derived from it in one step (`const tokens = String(x).split(' ')`) lands inside `expect(…)`/`assert…(…)`, its matcher chain, or as the receiver of an `x.expect…(` helper. A value fetched and dropped is code run without being checked. **Warning-only** until its precision is measured: over the 69 shipped Playwright specs it flags 4 captures in 3 files, each a value fetched to drive an action (a bounding box for a pointer move, a count for a keyboard loop) whose outcome the test asserts by other means. |
| `relevance` | With `--diff`: does the test reference any changed symbol? Warning-only (E2E tests assert behavior, not symbols). |
| `mutation` | The dependency-gated ceiling; stubbed until StrykerJS is approved. |
| `verdict` | `meaningful` when there is at least one test block, no hollow test, no gaming signal, and no determinism smell; otherwise `suspect` with `problems`. A structure smell is a warning while its precision is measured, so it never flips the verdict. |

The signals are heuristic and text-based, like the weakening detector they
build on: strong signals to surface, not proof. A reviewer or the mutation
layer still judges intent.


## Mutation layer (live)

StrykerJS is installed (root devDependencies: `@stryker-mutator/core` +
`@stryker-mutator/jest-runner`); the scorer's `mutation.available` flips to true
automatically. Config: `handsontable/stryker.config.json` (jest runner via
`handsontable/jest.stryker.config.js`, which pins the Babel transform +
`envName: 'commonjs'` — Stryker's worker cwd breaks cwd-relative Babel
discovery). `inPlace` mode is used because the sandbox breaks pnpm workspace
links — do not run it while editing files in the same clone.

Per-change run — wired into the scorer via `--mutate` (DEV-2061). Pass the
changed source file(s); the scorer runs scoped Stryker and reports the real
kill-rate in the `mutation` field. ALWAYS scope — never the whole tree.

```bash
cd handsontable
npm run build:styles   # once per clone — two unit contract tests read styles/
# score a test AND measure how many injected bugs in the source it kills:
node ../evals/score.mjs src/helpers/__tests__/errors.unit.js --mutate src/helpers/errors.ts
# → mutation: { available: true, score: 100, killed: 4, survived: 0, total: 4 }

# the underlying raw invocation (what --mutate runs for you):
BABEL_ENV=commonjs npx env-cmd -f ../hot.config.js npx stryker run --mutate src/helpers/errors.ts --reporters json
```

`parseMutationReport`/`runMutation` in `score.mjs` compute the standard
`detected / valid` score (killed+timeout over killed+timeout+survived+
no-coverage) — a survived or never-covered mutant means the test missed it.

Pilot result (2026-07-14): `src/helpers/errors.ts` → 4 mutants, 4 killed,
0 survived — mutation score 100, in 43s.
