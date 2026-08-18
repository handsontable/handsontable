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

## Bug fixes: write the failing test first

1. Reproduce the bug as a test and **watch it fail — for the right reason** (the missing behavior, not a typo or a bad selector).
2. Then apply the fix and watch the same test pass.
3. A regression test that was never red proves nothing. On a bugfix PR, name the spec that fails without the fix.

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
