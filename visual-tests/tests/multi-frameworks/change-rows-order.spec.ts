import { visualTest, expect, JS_VARIANTS } from '../../src/test-runner';
import { helpers } from '../../src/helpers';

/**
 * A row selected by a click on its header, on the shared `/` grid: the active row header's background and
 * the `--ht-header-active-border-color` accents on its seams, the row drawn as one selected range, and the
 * column headers highlighted. `horizon` colors the active row header from its own palette (`palette.950` in
 * light, `primary.200` in dark) where `main` uses the accent, and no other every-variant capture selects a
 * row by its header, so this one renders on every js variant; the active column header is the canary's,
 * `mergeCells/column-selection`. The demo's row header holds a checkbox rather than a label, so the active
 * header's foreground token is not painted here. The bare run comes with the every-variant declaration, as
 * in the UI-state families; on this grid it matches `main` byte for byte, and the canary covers the bare
 * delivery path for the wrappers. It renders under no wrapper, because the canary is this grid's wrapper
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
