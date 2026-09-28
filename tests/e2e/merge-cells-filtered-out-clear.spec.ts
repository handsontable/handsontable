import { test, expect } from '../fixtures/test';
import { MergeCellsFilteredOutClearPage } from '../fixtures/pages/MergeCellsFilteredOutClearPage';

/**
 * DEV-3135, a regression in 18.1.0: a grid merges the first two rows of its first column. The user
 * opens that column's filter menu, clears every value in the "Filter by value" list and confirms,
 * so no row is left on screen. When the application then called `updateSettings({ mergeCells })`,
 * the call threw `Assertion failed: Expecting an unsigned number.` – the plugin reset the merged
 * cells through the row they had occupied before the filter, a row that no longer existed. That
 * happened both when the application dropped the merges and when it sent the same merges again,
 * which the React and Angular wrappers do on every commit.
 *
 * The meta-level outcome (every merge key removed, the `mergeCells: false` variant, partly filtered
 * and sorted grids, unmerging) is pinned by the plugin's `trimmedMergeMetaReset.unit.js`. This spec
 * covers the flows a user drives through the dropdown menu.
 */
test.describe('`mergeCells` is updated while the filters hide every merged row', () => {
  test('dropping the merges does not throw, and the filter menu still works afterwards',
    async({ page, theme, bundle }) => {
      const grid = new MergeCellsFilteredOutClearPage(page, theme, bundle);

      await grid.goto();
      await grid.filterOutEveryValue('Region');

      await expect.poll(() => grid.visibleRowCount()).toBe(0);

      // A throw inside the call rejects it, which fails the test with the error's own message.
      await grid.clearMerges();
      expect(grid.pageErrors).toEqual([]);

      // The grid is still usable: the user brings every row back through the same menu.
      await grid.restoreEveryValue('Region');

      await expect.poll(() => grid.visibleRowCount()).toBe(5);
      await expect(grid.cell(4, 0)).toHaveText('Central');
      expect(grid.pageErrors).toEqual([]);
    });

  test('the formerly merged cells render as two separate cells once the filter is cleared',
    async({ page, theme, bundle }) => {
      const grid = new MergeCellsFilteredOutClearPage(page, theme, bundle);

      await grid.goto();

      // Precondition: the merge is in place, so the assertions below can tell it was removed.
      await expect(grid.cell(0, 0)).toHaveAttribute('rowspan', '2');
      await grid.expectCoveredByMerge(1, 0);

      await grid.filterOutEveryValue('Region');

      await expect.poll(() => grid.visibleRowCount()).toBe(0);

      await grid.clearMerges();
      await grid.clearFilters();

      await expect.poll(() => grid.visibleRowCount()).toBe(5);
      await expect(grid.cell(0, 0)).not.toHaveAttribute('rowspan');
      await expect(grid.cell(0, 0)).toHaveText('North');
      // The cell the merge covered is drawn on its own again, in its own row. It is empty because
      // the merge cleared the value it covered.
      await expect(grid.cell(1, 0)).toBeVisible();
      await expect(grid.cell(1, 0)).not.toHaveAttribute('rowspan');
      await expect(grid.cell(1, 0)).toHaveText('');
      await expect(grid.cell(1, 1)).toHaveText('Beta');
      expect(grid.pageErrors).toEqual([]);
    });

  test('sending the same merges again keeps the merge for when the rows come back',
    async({ page, theme, bundle }) => {
      const grid = new MergeCellsFilteredOutClearPage(page, theme, bundle);

      await grid.goto();
      await grid.filterOutEveryValue('Region');

      await expect.poll(() => grid.visibleRowCount()).toBe(0);

      await grid.resendMerges();
      await grid.restoreEveryValue('Region');

      await expect.poll(() => grid.visibleRowCount()).toBe(5);
      await expect(grid.cell(0, 0)).toHaveAttribute('rowspan', '2');
      await expect(grid.cell(0, 0)).toHaveText('North');
      await grid.expectCoveredByMerge(1, 0);
      await expect(grid.cell(1, 1)).toHaveText('Beta');
      expect(grid.pageErrors).toEqual([]);
    });
});
