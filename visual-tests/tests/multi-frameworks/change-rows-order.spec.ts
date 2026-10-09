import { visualTest, expect, JS_VARIANTS } from '../../src/test-runner';
import { helpers } from '../../src/helpers';

/**
 * A row selected by a click on its header, on the shared `/` grid: the active row header
 * (`--ht-header-row-active-*`), the row drawn as one selected range, and the column headers highlighted.
 * `horizon` defines the active row header's colors its own way (a dark header with light text, against
 * the accent `main` uses), and no other every-variant capture selects a row by its header, so this one
 * renders on every js variant; the active column header is the canary's,
 * `mergeCells/column-selection`. It renders under no wrapper, because the canary is this grid's wrapper
 * check. The click, and the move a drag of the header makes, are asserted on every theme in
 * `tests/e2e/manual-row-move-drag.spec.ts`. Trimmed to this one capture by DEV-3351, which owns it.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ tablePage }) => {
  const table = tablePage.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const rowHeader = table.locator(helpers.selectors.cloneInlineStartTable)
    .locator(helpers.findCell({ row: 3, column: 0, cellType: 'th' }));

  // A click in the header's corner, off the checkbox the demo draws in the middle of every row header
  // (a click on the checkbox toggles the row's flag instead of selecting the row).
  await rowHeader.click({ position: { x: 1, y: 1 } });
  await expect(rowHeader).toHaveClass(/\bht__active_highlight\b/);
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
