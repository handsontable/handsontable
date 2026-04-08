---
name: visual-testing
description: Use when writing Playwright visual regression tests or creating visual test examples for Handsontable - covers the custom tablePage fixture, screenshot workflow, Argos CI integration, and example creation in examples/next/docs/
---

# Visual Regression Testing with Playwright

## Overview

Visual tests live in `visual-tests/` and use Playwright with TypeScript. Screenshots are compared against baselines by Argos CI to detect visual regressions. There are two workflows: (a) add visual tests for existing examples, and (b) create a new example in `examples/next/docs/` and write visual tests for it.

## Custom Fixture: `tablePage`

Import the custom test runner instead of the default Playwright `test`:

```typescript
import { test } from '../../../src/test-runner';
```

The `tablePage` fixture (defined in `visual-tests/src/test-runner.ts`) automatically:

1. Navigates to the demo page.
2. Waits for the page to load and the table to appear.
3. Disables CSS animations and transitions for consistent screenshots.

The fixture provides a standard Playwright `Page` object, so all Playwright APIs work as expected.

## Test Naming

Use `__filename` as the first argument to `test()`. The runner auto-generates the test title from the file path. File names should be kebab-case and describe what is being tested (e.g., `apply-active-class-name-nested-header.spec.ts`).

## Screenshot Workflow

Every test follows this pattern: perform setup/actions, then capture a screenshot. You can take multiple screenshots per test.

```typescript
import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

test(__filename, async({ tablePage }) => {
  const cell = await selectCell(0, 2);
  await cell.click();
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
```

Always use `helpers.screenshotPath()` for the `path` argument. It auto-generates unique, deterministic file names based on the test file path, browser, framework, and screenshot index. Using any other naming approach will break Argos CI comparison.

## Test Organization

- `visual-tests/tests/js-only/` -- Tests that run only against the vanilla JS examples.
- `visual-tests/tests/multi-frameworks/` -- Tests that run against JS, React, Angular, and Vue examples.
- `visual-tests/tests/cross-browser/` -- Tests that verify cross-browser rendering consistency.

Use `test.skip(helpers.hotWrapper !== 'js', '...')` to restrict a test to a specific framework.

## Navigating to Custom Pages

For tests targeting a specific example (not the default demo), use the `goto` fixture:

```typescript
test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers.setBaseUrl('/my-custom-demo').getFullUrl()
  );
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
```

## Available Helpers

- **`visual-tests/src/helpers.ts`** -- `screenshotPath()`, `selectors` (CSS selectors for table parts), `findCell()`, `cssPath()`.
- **`visual-tests/src/page-helpers.ts`** -- `selectCell()`, `openEditor()`, `openContextMenu()`, `createSelection()`, `openHeaderDropdownMenu()`, `filterByValue()`, `filterByCondition()`, `scrollTableToTheBottom()`, `takeScreenshot()`, and more.

## Running Tests

Check `visual-tests/package.json` for available scripts. Configuration files:

- `visual-tests/playwright.config.ts` -- Default config.
- `visual-tests/playwright-cross-browser.config.ts` -- Cross-browser config.

## Example Structure

When creating a new example at `examples/next/docs/js/demo/`, include:

- `index.html` -- HTML entry point.
- `package.json` -- Dependencies (Handsontable, Vite).
- `vite.config.js` -- Vite configuration.
- `src/` -- Source files for the example.
- `spec/` -- Spec metadata for the example.

## Common Mistakes

- Not using `helpers.screenshotPath()` -- breaks Argos CI screenshot matching.
- Forgetting to wait for animations or async rendering before taking a screenshot.
- Placing JS-only tests in `multi-frameworks/` or vice versa.
- Not disabling animations -- the `tablePage` fixture handles this, but if you use `goto` to navigate to a different page, animations are still disabled automatically by the fixture.
- Taking screenshots before the table is fully rendered -- `tablePage` waits for the table, but dynamic content (menus, dropdowns) may need explicit waits.
