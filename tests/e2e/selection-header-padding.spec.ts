import { test, expect } from '../fixtures/test';
import { SelectionHeaderPaddingPage } from '../fixtures/pages/SelectionHeaderPaddingPage';

/**
 * DEV-1176. A full-row (or full-column) selection highlight must stay aligned with the header
 * when that header has custom padding or a wrapping label. `getDimensionsFromHeader` used
 * `columnHeaders.length - headerIndex` for both axes. That level is out of range for a real
 * header coordinate (`-1` becomes `count + 1`) and for a clamped body index of `0` (`count - 0`
 * is `count`), so the method returned `false` and the highlight was measured from the first data
 * cell instead.
 *
 * The unit spec that fails without the level fix is `resolveHeaderLevel` in
 * `walkontable/test/unit/selection/border/utils.unit.ts`. These cases pin the user-visible
 * alignment that that lookup is for.
 */
test.describe('Selection highlight with custom header padding', () => {
  let grid: SelectionHeaderPaddingPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new SelectionHeaderPaddingPage(page, theme, bundle);
    await grid.goto();
  });

  test('finds the row header when a full row is selected on padded headers', async () => {
    await grid.selectRow('padded', 0);

    // The old level formula returned false here, so this is the spec that fails without the fix.
    await expect.poll(() => grid.rowHeaderDimensions('padded', 0)).toEqual({ found: true, tagName: 'TH' });
  });

  test('aligns the full-row highlight with a padded row header', async () => {
    await grid.selectRow('padded', 0);

    // First body row under a column header: the edge sits on the cell's own top boundary.
    await expect.poll(() => grid.selectionTopOffsetFromRowHeader('padded', 0)).toBe(0);
  });

  test('aligns a later full-row highlight with a padded row header', async () => {
    await grid.selectRow('padded', 2);

    // A cell whose neighbour is another cell straddles the shared gridline.
    await expect.poll(() => grid.selectionTopOffsetFromRowHeader('padded', 2)).toBe(-1);
  });

  test('aligns the full-row highlight when column headers wrap onto a second line', async () => {
    await grid.selectRow('lineBreak', 0);

    await expect.poll(() => grid.selectionTopOffsetFromRowHeader('line-break', 0)).toBe(0);
  });

  test('aligns the full-row highlight when more than one row-header level is rendered', async () => {
    await grid.selectRow('nested', 0);

    await expect.poll(() => grid.selectionTopOffsetFromRowHeader('nested', 0)).toBe(0);
  });

  test('aligns the full-column highlight with a padded column header', async () => {
    await grid.selectColumn('padded', 0);

    await expect.poll(() => grid.selectionStartOffsetFromColumnHeader('padded', 0)).toBe(0);
  });
});
