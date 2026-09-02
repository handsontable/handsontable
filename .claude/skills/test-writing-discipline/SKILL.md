---
name: test-writing-discipline
description: Use when writing, fixing, or reviewing tests for any Handsontable change (unit, E2E, or wrapper), and whenever a test is red during feature work. Enforces that tests prove intended behavior — not just execute code, and never "green for the sake of green". Covers intent-first (write the test from the requirement, ideally before the code), deciding whether the code or the test is wrong when red (default: the code), the banned ways of faking green, write-the-failing-test-first, verify-with-a-real-run, no hollow assertions, not mocking the unit under test, and migrating broken legacy tests.
---

# Test-writing discipline

**Green is not the goal — correct behavior is.** A test that passes but asserts nothing, or asserts the *buggy* output, is worse than no test: it certifies the bug and reads as coverage. Never make a red test pass by weakening it. These rules keep agent-written tests meaningful. They apply on top of the framework guides (`handsontable-playwright-e2e`, `handsontable-e2e-testing`, `handsontable-unit-testing`).

## The test encodes intent, not the implementation

Write the test from the **requirement** — the behavior the user or the API is supposed to have — not from what the code currently does. Where feasible, **write it first** (or independently of the implementation) so it is an oracle you cannot accidentally fit to a bug. For E2E, state the user-observable expectation (what the grid should show or do) *before* you wire a single selector.

## When a test is red, decide what is actually wrong — don't just chase green

At the feature stage the **code is the prime suspect, not the test.** Before you touch the test, ask: does its expectation match the *intended* behavior?

- **Expectation correct, code wrong → fix the code.** This is the common case. Leave the test alone.
- **Expectation genuinely mis-encoded the intent → fix the test by tightening it toward the real behavior** — never by loosening it to match the current (possibly wrong) output.

If you cannot tell which is wrong, that is a signal to re-read the requirement, not to relax the test.

### Banned ways of faking green

Never reach green by any of these — they defeat the point of the test:

- Deleting or loosening an assertion, or widening a tolerance, to match what the code emits.
- `.skip` / `xit` / `xdescribe`, or focusing with `.only` / `test.only` / `describe.only` / `fit` / `fdescribe` (focusing silently drops the rest of the suite).
- Wrapping the body in try/catch to swallow a failure.
- Asserting whatever the code happened to produce (a "snapshot of the bug").
- `it.flaky` / retries to paper over a real intermittent failure.

The Stop hook and pre-push run the test you touched and block on red — that forces you to *reconcile* red, it does **not** authorize you to make it green by weakening it. Reconcile by fixing the right thing.

### Weakening over an admitted race needs a ticket in the same PR

An assertion weakened or deleted with a race as the reason — "held 15/15 locally", "flakes on classic", "racy on develop" — descopes a product defect; it does not fix a test. It ships only with a filed ticket in the **same** PR, named beside the change. "Still open, no ticket" is a review blocker. The strand-window fix (#13332) descoped two racy shapes that way, and the tickets are the only thing that keeps them from vanishing into a green run.

### "Passes on retry" and "passes in isolation" are not determinism evidence

- A test that passed on its second attempt, or alone after failing inside the suite, has shown you the flake — not its absence. Before you call it deterministic, hammer it focused across every leg: `cd tests && npx playwright test e2e/<spec>.spec.ts --repeat-each 20` (no `--project` filter, so all six theme × bundle legs run). The hidden-init migration needed ~700 such runs to expose three rAF-starvation timeouts that any single green run hid.
- A test that fails about half the time under that load on **unchanged** develop is reporting a product race. File a product ticket and keep the assertion — softening it to green certifies the race.

## Bug fixes: write the failing test first

1. Reproduce the bug as a test and **watch it fail — for the right reason** (the missing behavior, not a typo or a bad selector).
2. Then apply the fix and watch the same test pass.
3. A regression test that was never red proves nothing. On a bugfix PR, name the spec that fails without the fix.

## Cover what the change actually adds

- **A timing-semantics claim is verified against the primitive that implements it.** A JSDoc that says "closes when the task ends" above a `setTimeout(0)` is wrong: `setTimeout(0)` is the *next macrotask*, not end-of-task, so a synchronous caller in the same task runs inside the window the comment calls closed. That mismatch shipped a data-corruption bug — an editor stranded by `alter()` committed through stale coordinates and appended records (#13332). Read the primitive (`setTimeout`, `queueMicrotask`, `requestAnimationFrame`, a hook's call site) and write the test from what it does, not from what the comment says.
- **A dedicated X-during-Y path requires a test that drives X during Y.** `flush`, `drain`, `cancel`, `pending`, `suspend`, a depth counter — those names are the tell that the code handles one operation landing inside another. A test that runs X and Y in sequence never enters that path. Fire X from inside Y: a hook callback, a nested `alter()`, an edit inside a batch.
- **Every documented form of a new option executes at least once** — the guide's lead form especially. The shorthand a guide opens with is the form users try first, and the one most often left untested.

## Verify before you say "done"

- Run the exact test command fresh, read the **full output and the exit code**, then state the result *with that evidence*.
- Banned phrasings: "should work", "this fixes it" without a run, "tested manually, looks fine". If you did not run it, say so.
- After editing source, run the impacted test — not the whole suite, the impacted one — and confirm green before finishing.

## No hollow assertions

- Assert the **behavior**, not that the code ran. `expect(getDataAtCell(0, 0)).toBe('x')`, not `expect(true).toBe(true)` and not an `it()` with no `expect` at all.
- One meaningful assertion beats five that restate the setup.
- Coverage-on-new-code can be satisfied by a test that executes a line without checking its result — do not rely on it to judge quality; the assertion is what matters.

## Don't mock the unit under test

- Never mock the thing you are testing. Mock at the real boundary (network, timers, ResizeObserver — see the mocks in `test/__mocks__/`).
- When you must build a mock, mock the **complete** real data shape; an incomplete mock gives a false pass. In this repo the default is to favor an E2E test over a unit test that would need to mock a module.

## Fix broken legacy tests by migrating them

- The Jasmine suite is frozen. If a legacy `*.spec.js` is broken or flaky, **do not patch it in place and do not add a `sleep()`** — rewrite it as a Playwright test in `tests/e2e/` and delete the Jasmine one. The tests that hurt most migrate first; the suite shrinks by attrition.
- Routine, low-risk edits to an existing Jasmine spec are still fine.
