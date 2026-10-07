# Tests dimension

Review the tests a change ships, and the ones it should have shipped, with the same weight as the code. Each item names a defect that reached develop behind a green run during the flake investigation.

## Checklist

1. **Every new interaction path has a named exercising test.**
   - For each new branch that handles one operation landing inside another (`flush`, `drain`, `cancel`, `pending`, `suspend` methods and depth counters are the tell), name the test that drives X *during* Y. Running them in sequence does not count.
   - For each documented form of a new option, name the test that executes it. The guide's lead form is the one most often left untested.
   - If you cannot name the test, the finding is **High**: the path shipped unexercised.

2. **Run scoped mutation when unit tests changed.**
   - From `handsontable/`: `node ../evals/score.mjs <test.unit.js> --mutate <src.ts>` (`evals/README.md` has the setup). Scope to the changed source; only that test file runs against the mutants, so the kill rate is its own.
   - In a `.claude/worktrees/` checkout the run dies with `env-cmd: command not found` (exit 127): the root `node_modules` is a symlink, so the package-local `.bin` is missing. `score.mjs` exits 0 and reports `mutation.reason: 'stryker run failed (exit 127): … env-cmd: command not found'`. That is the environment, not a verdict on the tests: run `node scripts/claude/setup-worktree.mjs` once, then rerun.
   - A survived mutant is a behavior the new test executes without asserting. Report it with the mutant's location.

3. **Near-duplicate DOM helpers get extracted.**
   - Two page objects or specs measuring the same thing with their own `evaluate()` (a first-rendered-row read, a holder height, a hook-log tail) drift apart on the next fix. Ask for one helper in the shared page object or under `tests/fixtures/`.

4. **Timing-semantics JSDoc matches the primitive.**
   - "When the task ends", "after the render", "before the next input" are claims about a primitive. Open it: `setTimeout(0)` is the *next macrotask*, not end-of-task; a microtask runs before the render; a hook fires where the core calls it. A comment that contradicted its primitive shipped a data-corruption bug (#13332): treat the mismatch as **High**.

5. **A weakened or deleted assertion carries its ticket.**
   - An assertion loosened, widened, or removed with a race as the reason ("held 15/15 locally", "flakes on classic") needs a filed ticket in the same PR, named beside the change. "Still open, no ticket" blocks the review. The weakening detector flags the change; you confirm the ticket.

6. **A visual spec is in addition to, never instead of.**
   - If the diff adds or changes `visual-tests/tests/**/*.spec.ts`, name the `tests/e2e` assertion that proves the same state by DOM or API (focus, selection, data, "the menu opened"). A screenshot proves pixels only, and the presence gate counts a visual spec as coverage, so you hold this.
   - **Medium:** a capture that stands alone for a state a probe can express; a capture duplicating one already recorded for the same visual state; a capture on the line after an action with nothing asserted in between; a new feature wired into the shared `/` demo instead of its own route.
   - Rule: `visual-tests/AGENTS.md` → Decision rule.

## References

- The `test-writing-discipline` skill: the rules these items enforce at review time.
- `.claude/skills/handsontable-playwright-e2e/references/determinism.md`: the page-object wait rules.
- `evals/README.md`: the scorer and the `--mutate` run.
