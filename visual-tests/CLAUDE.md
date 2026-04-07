# Visual Regression Tests

Playwright-based visual regression testing with Argos CI for screenshot comparison.

## Framework

- Playwright with TypeScript
- Custom `tablePage` fixture from `src/test-runner.ts` (auto-navigates to demo, disables animations, waits for table)
- Config: `playwright.config.ts`, `playwright-cross-browser.config.ts`

## Test Pattern

```typescript
import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

test(__filename, async({ tablePage }) => {
  // Setup
  const cell = await tablePage.locator('.ht_master td').first();
  await cell.click();

  // Capture state
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  // Action + another screenshot
  await tablePage.keyboard.press('Escape');
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
```

## Key Rules

- Test naming: `__filename` auto-generates title from file path
- Screenshots: Always use `helpers.screenshotPath()` for consistent naming
- Organization: `tests/js-only/`, `tests/multi-frameworks/`, `tests/cross-browser/`
- Examples for testing live in `examples/next/docs/`

## Helpers

- `src/helpers.ts`: screenshotPath, DOM selectors, platform detection
- `src/page-helpers.ts`: selectCell, menu navigation, high-level interactions

## Run

See `package.json` scripts for build, test, and upload commands.

For detailed guidance: use skills `visual-testing`, `creating-visual-test-examples`
