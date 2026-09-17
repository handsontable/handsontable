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
 * Regression contract (fails without the product fix):
 * - `found: true` on a padded full-row / full-column selection (`resolveHeaderLevel`).
 * - Nested two-level row headers: `countRowHeaders() === 2` and the measured TH is `G1`
 *   (`resolveHeaderLevel(2, -1) === 1`; using the column-header count of 1 would measure
 *   the default `"1"` label at level 0).
 * - RTL full-column `found: true` plus inline-end alignment (`measureHeaderSelectionBox`).
 *
 * Same-`tr` TH-vs-TD pixel alignment is not the contract: body-cell math lands on the same
 * pixel as a same-row header, so those polls stay green without the lookup fix.
 */
test.describe('Selection highlight with custom header padding', () => {
  let grid: SelectionHeaderPaddingPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new SelectionHeaderPaddingPage(page, theme, bundle);
    await grid.goto();
  });

  test('finds the row header when a full row is selected on padded headers', async () => {
    await grid.selectRow('padded', 0);

    await expect.poll(() => grid.rowHeaderDimensions('padded', 0)).toEqual({
      found: true,
      tagName: 'TH',
      text: '1',
    });
  });

  test('finds the column header when a full column is selected on padded headers', async () => {
    await grid.selectColumn('padded', 0);

    await expect.poll(() => grid.columnHeaderDimensions('padded', 0)).toEqual({
      found: true,
      tagName: 'TH',
      text: 'A',
    });
  });

  test('finds the row header when column headers wrap onto a second line', async () => {
    await grid.selectRow('lineBreak', 0);

    await expect.poll(() => grid.rowHeaderDimensions('lineBreak', 0)).toEqual({
      found: true,
      tagName: 'TH',
      text: '1',
    });
  });

  test('finds the closest nested row header when two row-header levels are rendered', async () => {
    await grid.selectRow('nested', 0);

    await expect.poll(() => grid.countRowHeaders('nested')).toBe(2);
    await expect.poll(() => grid.rowHeaderDimensions('nested', 0)).toEqual({
      found: true,
      tagName: 'TH',
      text: 'G1',
    });
  });

  test('finds the row header for an RTL full-row selection', async () => {
    await grid.selectRow('paddedRtl', 0);

    await expect.poll(() => grid.rowHeaderDimensions('paddedRtl', 0)).toEqual({
      found: true,
      tagName: 'TH',
      text: '1',
    });
  });

  test('aligns the full-column highlight with a padded column header in RTL', async () => {
    await grid.selectColumn('paddedRtl', 0);

    // Left-edge math written to `style.right` places this highlight on the wrong side of the cell.
    await expect.poll(() => grid.columnHeaderDimensions('paddedRtl', 0)).toEqual({
      found: true,
      tagName: 'TH',
      text: 'A',
    });
    await expect.poll(() => grid.selectionStartOffsetFromColumnHeader('padded-rtl', 0)).toBe(0);
  });
});
