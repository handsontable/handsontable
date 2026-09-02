# Tests dimension

Review the tests a change ships — and the tests it should have shipped — with the same weight as the code. Run `git diff` (or `git diff --staged`) to collect the changes, then check each item below. Each item names a defect that reached develop behind a green run during the flake investigation.

## Checklist

1. **Every new interaction path has a named exercising test.**
   - For each new branch that handles one operation landing inside another — `flush`, `drain`, `cancel`, `pending`, `suspend` methods and depth counters are the tell — name the test that drives X *during* Y. A test that runs them in sequence does not count.
   - For each documented form of a new option, name the test that executes it. The guide's lead form is the one most often left untested.
   - If you cannot name the test, the finding is **High**: the path shipped unexercised.

2. **Run scoped mutation when unit tests changed.**
   - This is the one run a review makes. From `handsontable/`: `node ../evals/score.mjs <test.unit.js> --mutate <src.ts>` (`evals/README.md` has the setup). Always scope to the changed source — never the whole tree.
   - A survived mutant is a behavior the new test executes without asserting. Report it with the mutant's location.

3. **Flag near-duplicate DOM helpers for extraction.**
   - Two page objects or two specs measuring the same thing with their own `evaluate()` — a first-rendered-row read, a holder height, a hook-log tail — drift apart on the next fix. Ask for one helper in the shared page object or under `tests/fixtures/`.

4. **Check timing-semantics JSDoc against the primitive.**
   - "When the task ends", "after the render", "before the next input" — each is a claim about a primitive. Open it: `setTimeout(0)` is the *next macrotask*, not end-of-task; a microtask runs before the render; a hook fires where the core calls it, not where the reader assumes. A comment that contradicted its primitive shipped a data-corruption bug (#13332) — treat the mismatch as **High**.

5. **A weakened or deleted assertion carries its ticket.**
   - An assertion loosened, widened, or removed with a race as the reason ("held 15/15 locally", "flakes on classic") needs a filed ticket in the same PR, named beside the change. "Still open, no ticket" blocks the review. The weakening detector flags the change; you confirm the ticket.

## References

- The `test-writing-discipline` skill — the rules these items enforce at review time.
- `.claude/skills/handsontable-playwright-e2e/references/determinism.md` — the page-object wait rules.
- `evals/README.md` — the scorer and the `--mutate` run.
