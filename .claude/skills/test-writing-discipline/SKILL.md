---
name: test-writing-discipline
description: Use when writing, fixing, or reviewing tests for any Handsontable change (unit, E2E, or wrapper), and whenever a test is red during feature work. Enforces that tests prove intended behavior – not just execute code, and never "green for the sake of green". Covers intent-first (write the test from the requirement, ideally before the code), deciding whether the code or the test is wrong when red (default: the code), the banned ways of faking green, write-the-failing-test-first, verify-with-a-real-run, no hollow assertions, not mocking the unit under test, and migrating broken legacy tests.
---

# Test-writing discipline

Correct behavior is the goal, not green. A test that asserts nothing, or asserts the buggy output, certifies the bug. Fix a red test by correcting the code or tightening the test. These rules apply on top of `handsontable-playwright-e2e`, `handsontable-e2e-testing`, `handsontable-unit-testing`.

## Intent, not implementation

Write the test from the requirement (what the user or API is supposed to get), ideally before the implementation. For E2E, state the user-observable expectation before wiring a selector.

## When a test is red

The code is the prime suspect. Check whether the expectation matches the intended behavior:

- Expectation correct, code wrong: fix the code, leave the test.
- Expectation mis-encoded the intent: tighten the test toward the real behavior.
- Cannot tell: re-read the requirement.

### Banned ways of faking green

Reach green only by fixing code or tightening the test. Reject:

- Deleting or loosening an assertion, or widening a tolerance, to match the output.
- `.skip` / `xit` / `xdescribe`, or `.only` / `test.only` / `describe.only` / `fit` / `fdescribe` (focusing silently drops the rest of the suite).
- try/catch swallowing a failure.
- Asserting whatever the code produced (a "snapshot of the bug").
- `it.flaky` / retries over a real intermittent failure.

The Stop hook and pre-push run the test you touched and block on red; that forces reconciliation, it does not authorize weakening.

### Weakening over an admitted race needs a ticket in the same PR

An assertion weakened or deleted with a race as the reason ("held 15/15 locally", "flakes on classic", "racy on develop") ships only with a filed ticket in the same PR, named beside the change. "Still open, no ticket" is a review blocker (#13332).

### "Passes on retry" and "passes in isolation" are not determinism evidence

- Before calling a test deterministic, run it focused across every leg: `cd tests && npx playwright test e2e/<spec>.spec.ts --repeat-each 20` (no `--project` filter, so all six theme × bundle legs run). For a test tagged `@cross-browser`, repeat it on the engine legs too: `npx playwright test --config playwright-engines.config.ts e2e/<spec>.spec.ts --repeat-each 20`. The hidden-init migration needed ~700 such runs to expose three rAF-starvation timeouts.
- A test failing about half the time under that load on unchanged develop reports a product race: file a product ticket and keep the assertion.

## Bug fixes: failing test first

1. Reproduce the bug as a test and watch it fail for the right reason (the missing behavior, not a typo or bad selector).
2. Apply the fix and watch the same test pass.
3. On a bugfix PR, name the spec that fails without the fix.

## Cover what the change adds

- **Verify a timing-semantics claim against the primitive.** `setTimeout(0)` is the next macrotask, not end-of-task, so a JSDoc saying "closes when the task ends" above it is wrong; that mismatch shipped a data-corruption bug (an editor stranded by `alter()` committed through stale coordinates, #13332). Read the primitive (`setTimeout`, `queueMicrotask`, `requestAnimationFrame`, a hook's call site) and test what it does.
- **A dedicated X-during-Y path needs a test that drives X during Y.** `flush`, `drain`, `cancel`, `pending`, `suspend`, a depth counter are the tell. Fire X from inside Y: a hook callback, a nested `alter()`, an edit inside a batch.
- **Execute every documented form of a new option at least once**, the guide's lead form first.

## Before saying "done"

- Run the exact test command fresh, read the full output and exit code, state the result with that evidence. Say so when you did not run it.
- Banned phrasings: "should work", "this fixes it" without a run, "tested manually, looks fine".
- After editing source, run the impacted test and confirm green.

## No hollow assertions

- Assert the behavior: `expect(getDataAtCell(0, 0)).toBe('x')`, not `expect(true).toBe(true)` and not an `it()` with no `expect` at all.
- Coverage-on-new-code can be satisfied by a line executed without a checked result, so judge quality by the assertion.

## Mocking

- Mock at the real boundary (network, timers, ResizeObserver; see `test/__mocks__/`), never the unit under test, and mock the complete real data shape.
- Where a unit test would need to mock a module, write an E2E test.

## Broken legacy tests

The Jasmine suite is frozen. Rewrite a broken or flaky legacy `*.spec.js` as a Playwright test in `tests/e2e/` and delete the Jasmine one (no `sleep()` patches). Routine, low-risk edits to an existing Jasmine spec are fine.
