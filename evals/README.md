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
# Score every fixture reference (the harness self-test) — exits non-zero
# when a reference fails its own meaningfulness bar:
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
  case.md        # the change brief an agent receives, plus rubric notes
  change.diff    # optional — the source diff, feeds the relevance signal
  reference/     # hand-written example(s) of a meaningful test for the case
```

The three cases cover the representative change kinds from the eval design: a
**bug fix** (`bug-fix-number-helper`, a numeric-helper edge case), a **feature**
(`feature-percent-helper`, a small new helper API), and a **granular
interaction** (`e2e-escape-cancels-edit`, keyboard-driven editor behavior on
the Playwright tier).

Reference tests are written exactly as they would land in their real tier
(`handsontable/src/helpers/__tests__/`, `tests/e2e/`), so their imports resolve
there — the harness scores them statically, it does not execute them. To add a
case, create the folder with `case.md` and at least one reference test;
`run-eval.mjs` picks it up automatically and fails if the reference does not
score clean.

## What the scorer measures

`evals/score.mjs` emits one JSON object per file. It imports the shared
assertion/skip-focus regexes from `.github/scripts/lib/test-weakening.mjs` — one
source of truth with the CI weakening detector.

| Field | Signal |
|---|---|
| `tests`, `assertions` | Block and assertion counts — the count matters (fewer tests for the same quality is better). |
| `hollowTests` | `it()`/`test()` blocks with no `expect`/`assert`/`verify` call — a test that only executes code. |
| `gamingSignals` | `.only`/`.skip`/`xit`/`fit`, `it.flaky`, `fixme`/`todo`, and failure-swallowing `try/catch`. |
| `determinismSmells` | `sleep(`, `waitForTimeout`, `networkidle` — timing-based instead of condition-based waits. |
| `relevance` | With `--diff`: does the test reference any changed symbol? Warning-only (E2E tests assert behavior, not symbols). |
| `mutation` | The dependency-gated ceiling; stubbed until StrykerJS is approved. |
| `verdict` | `meaningful` when there is at least one test block, no hollow test, no gaming signal, and no determinism smell; otherwise `suspect` with `problems`. |

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
