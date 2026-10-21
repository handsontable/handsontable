import { test, expect } from '../fixtures/test';
import { PaginationPasteFragmentSelectionPage } from '../fixtures/pages/PaginationPasteFragmentSelectionPage';

// Unique rows: identical values would hide which part of the clipboard survived the truncation.
const CLIPBOARD = ['Summit', 'Zenith', 'Eclipse', 'Horizon', 'Pulsar'];

const UNTOUCHED = Array.from({ length: 15 }, (_, row) => `R${row + 1}`);

// The paste starts on row 7 of a ten-row page, so only three clipboard rows fit.
const EXPECTED = UNTOUCHED.slice();

EXPECTED.splice(7, 3, 'Summit', 'Zenith', 'Eclipse');

/**
 * DEV-2935: the paste truncation has to follow the paste destination. With `fragmentSelection: true`
 * the CopyPaste plugin does not refresh its copy-source ranges when the selection moves, so clamping
 * from them let a paste near the end of the page spill onto the next one.
 */
test.describe('pagination paste with fragmentSelection', () => {
  // The `false` leg is a control: the plugin refreshes its ranges there, so it passes with or without the
  // fix. Only the `true` leg fails on the stale copy-source ranges.
  for (const fragmentSelection of [true, false]) {
    test(`keeps the paste inside the page when the selection moved after the copy ` +
      `(fragmentSelection: ${fragmentSelection})`, async({ page, theme, bundle }) => {
      const grid = new PaginationPasteFragmentSelectionPage(page, theme, bundle, { fragmentSelection });

      await grid.goto();
      // The copy source starts on row 0, the paste destination is row 7 - three rows before the page end.
      await grid.copyRows(0, 4);
      // The premise: the copy reached the plugin. Empty ranges would test the next case, not this one.
      expect(await grid.copyableRowRanges()).toEqual([[0, 4]]);

      await grid.pasteAt(7, CLIPBOARD.join('\n'));

      expect(await grid.columnValues()).toEqual(EXPECTED);
    });
  }

  // Without a copy inside the grid (the clipboard comes from another app) `fragmentSelection: true` leaves
  // the ranges empty, and a clamp that iterated over them did nothing at all.
  test('keeps a paste from outside the grid inside the page (fragmentSelection: true)',
    async({ page, theme, bundle }) => {
      const grid = new PaginationPasteFragmentSelectionPage(page, theme, bundle, { fragmentSelection: true });

      await grid.goto();
      expect(await grid.copyableRowRanges()).toEqual([]);

      await grid.pasteAt(7, CLIPBOARD.join('\n'));

      expect(await grid.columnValues()).toEqual(EXPECTED);
    });
});
