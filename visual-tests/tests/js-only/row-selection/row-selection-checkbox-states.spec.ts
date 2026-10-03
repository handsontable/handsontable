import { visualTest, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

/**
 * Checks how the row selection checkboxes and the selected-row tint render in every layout: the
 * "select all" checkbox mixed (with a dash icon), unchecked, and checked; a disabled row checkbox; the
 * `firstColumn` location in an empty first column; and a checkbox column's `headerCheckbox` in the
 * mixed state. The pixels judged are theme tokens (`--ht-row-selection-background-color` and the
 * indeterminate icon), so the horizon theme renders too. The states themselves are asserted in
 * `tests/e2e/row-selection.spec.ts` and `tests/e2e/checkbox-header.spec.ts`. Owned by PRO-87.
 */
visualTest(__filename, {
  themes: ['main', 'main-dark', 'horizon'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/row-selection-demo')
      .getFullUrl()
  );

  // Each grid's header checkbox state, its disabled row checkboxes, and its tinted rows, read from the DOM.
  const readStates = () => tablePage.evaluate(() => {
    const describe = (gridId: string, headerSelector: string) => {
      // The callback runs in the page, where `document` is the demo's own.
      // eslint-disable-next-line no-restricted-globals
      const grid = document.getElementById(gridId);

      if (!grid || !grid.querySelector('.ht_master tbody tr')) {
        return null;
      }

      const headers = Array.from(grid.querySelectorAll<HTMLInputElement>(`.ht_master thead ${headerSelector}`));
      const header = headers[0];
      let headerState = 'missing';

      if (header) {
        headerState = header.indeterminate ? 'mixed' : String(header.checked);
      }

      return {
        header: headerState,
        disabledRows: grid.querySelectorAll('.ht_master tbody .htRowSelectionCheckbox:disabled').length,
        tintedRows: Array.from(grid.querySelectorAll('.ht_master tbody tr'))
          .filter(tr => tr.querySelector('.htRowSelected')).length,
      };
    };

    return {
      mixed: describe('rowSelectionMixed', '.htRowSelectionCheckbox'),
      unchecked: describe('rowSelectionUnchecked', '.htRowSelectionCheckbox'),
      firstColumn: describe('rowSelectionFirstColumn', '.htRowSelectionCheckbox'),
      checkboxHeader: describe('checkboxHeaderMixed', '.htCheckboxHeaderInput'),
    };
  });

  await expect.poll(readStates).toEqual({
    mixed: { header: 'mixed', disabledRows: 1, tintedRows: 2 },
    unchecked: { header: 'false', disabledRows: 0, tintedRows: 0 },
    firstColumn: { header: 'true', disabledRows: 0, tintedRows: 5 },
    checkboxHeader: { header: 'mixed', disabledRows: 0, tintedRows: 0 },
  });

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
