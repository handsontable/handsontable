import { visualTest, test, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  openEditor,
  selectCell,
} from '../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

/**
 * Checks how the City dropdown's list looks on the complex demo after "to" is typed into the editor:
 * the matching part of Toronto and Tokyo bolded and Toronto, the first match, highlighted, over the
 * unfiltered list. That the list stays unfiltered, which options bold the match and which one is
 * highlighted are asserted in `tests/e2e/complex-demo-states.spec.ts` on every theme and bundle; the
 * bold and highlight styling is theme tokens, so this capture stays. Owned by DEV-3285.
 */
visualTest(__filename, {
  themes: ['main', 'main-dark'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/complex-demo')
      .getFullUrl()
  );

  const cell = await selectCell(4, 7);

  await openEditor(cell);

  const cellEditor = tablePage.locator(helpers.findCellEditor());
  const options = tablePage.locator('.autocompleteEditor .ht_master tbody td');

  await cellEditor.waitFor();
  await cellEditor.clear();
  await cellEditor.type('to');

  // The list re-renders after each key; the capture waits for the state the last one produces.
  await expect(cellEditor).toHaveValue('to');
  await expect(options.locator('strong')).toHaveText(['To', 'To']);
  await expect(options.filter({ hasText: /^Toronto$/ })).toHaveClass(/\bcurrent\b/);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
