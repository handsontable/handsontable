---
name: test-writing-discipline
description: Use when writing or reviewing tests for any Handsontable change (unit, E2E, or wrapper) to make the test actually prove the behavior — not just execute the code. Covers write-the-failing-test-first for bug fixes, verifying with a real run before claiming done, avoiding hollow assertions, not mocking the unit under test, and migrating broken legacy tests instead of patching them.
---

# Test-writing discipline

A test that passes but asserts nothing is worse than no test — it reads as coverage. These rules make a test prove behavior. They apply on top of the framework guides (`handsontable-playwright-e2e`, `handsontable-e2e-testing`, `handsontable-unit-testing`).

## Bug fixes: write the failing test first

1. Reproduce the bug as a test and **watch it fail — for the right reason** (the missing behavior, not a typo or a bad selector).
2. Then apply the fix and watch the same test pass.
3. A regression test that was never red proves nothing. On a bugfix PR, name the spec that fails without the fix.

## Verify before you say "done"

- Run the exact test command fresh, read the **full output and the exit code**, then state the result *with that evidence*.
- Banned phrasings: "should work", "this fixes it" without a run, "tested manually, looks fine". If you did not run it, say so.
- After editing source, run the impacted test — not the whole suite, the impacted one — and confirm green before finishing.

## No hollow assertions

- Assert the **behavior**, not that the code ran. `expect(getDataAtCell(0, 0)).toBe('x')`, not `expect(true).toBe(true)`.
- One meaningful assertion beats five that restate the setup.
- Coverage-on-new-code can be satisfied by a test that executes a line without checking its result — do not rely on it to judge quality; the assertion is what matters.

## Don't mock the unit under test

- Never mock the thing you are testing. Mock at the real boundary (network, timers, ResizeObserver — see the mocks in `test/__mocks__/`).
- When you must build a mock, mock the **complete** real data shape; an incomplete mock gives a false pass. In this repo the default is to favor an E2E test over a unit test that would need to mock a module.

## Fix broken legacy tests by migrating them

- The Jasmine suite is frozen. If a legacy `*.spec.js` is broken or flaky, **do not patch it in place and do not add a `sleep()`** — rewrite it as a Playwright test in `tests/e2e/` and delete the Jasmine one. The tests that hurt most migrate first; the suite shrinks by attrition.
- Routine, low-risk edits to an existing Jasmine spec are still fine.
