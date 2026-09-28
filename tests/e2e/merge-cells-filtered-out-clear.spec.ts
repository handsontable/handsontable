import { test, expect } from '../fixtures/test';
import { MergeCellsFilteredOutClearPage } from '../fixtures/pages/MergeCellsFilteredOutClearPage';

/**
 * DEV-3135, a regression in 18.1.0: a grid merges the first two rows of its first column. The user
 * opens that column's filter menu, clears every value in the "Filter by value" list and confirms,
 * so no row is left on screen. When the application then drops the merges with
 * `updateSettings({ mergeCells: [] })`, the call threw `Assertion failed: Expecting an unsigned
 * number.` - the plugin reset the merged cells through the row they had occupied before the filter,
 * a row that no longer existed. The throw aborted the update halfway, so the merge also survived it.
 *
 * The meta-level outcome (every merge key removed from both cells, the `mergeCells: false` variant,
 * a partially filtered merge) is pinned by the plugin's `trimmedMergeMetaReset.unit.js`. This spec
 * covers the flow a user drives through the dropdown menu.
 */
test.describe('`mergeCells` is cleared while the filters hide every merged row', () => {
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
      await expect(grid.cell(1, 0)).toBeHidden();

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
});
