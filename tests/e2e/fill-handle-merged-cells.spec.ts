import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { GridLayoutsPage } from '../fixtures/pages/GridLayoutsPage';

/**
 * A double click on the fill handle does not fill down when the fill would cut through a merged area:
 * MergeCells hands the fill back its starting range, so only the starting cell holds the value and
 * the selection stays on it. With merging off, the same double click fills the whole column.
 *
 * The cross-browser visual suite photographed this on `/merged-cells-demo` (`auto-fill.spec.ts`)
 * until DEV-3257, where the column's merged areas sat below the fold and the capture showed one filled
 * cell. The Jasmine merge-cells autofill suite asserts the refusal for a drag of the handle; nothing
 * asserted it for the double click, which computes its own extent. The grid is the merged-cells
 * shape (`grid-layouts.html?layout=merged-sorted`): its merged areas cross column 2 at visual rows
 * 19-21 and 24-25.
 */
test.describe('fill-handle double click over merged cells', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: GridLayoutsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new GridLayoutsPage(page, theme, bundle);
    await grid.goto('merged-sorted');
  });

  test('refuses a fill-down that would cut a merged area', async() => {
    const { rows } = await grid.size();

    await grid.prepareFillFrom(2, 0, '1100');
    await grid.doubleClickFillHandle();

    // The handle's double click ran: the same gesture fills the column in the control below. Here it
    // is refused, so the column keeps the one value and the selection stays on its cell.
    await expect.poll(async() => grid.selected()).toEqual([[0, 2, 0, 2]]);

    const column = (await grid.data()).map(row => row[2]);

    expect(column).toEqual(['1100', ...Array(rows - 1).fill(null)]);
  });

  test('fills the whole column down when merging is off', async() => {
    const { rows } = await grid.size();

    await grid.updateSettings({ mergeCells: false });
    await grid.prepareFillFrom(2, 0, '1100');
    await grid.doubleClickFillHandle();

    await expect.poll(async() => grid.selected()).toEqual([[0, 2, rows - 1, 2]]);
    expect((await grid.data()).map(row => row[2])).toEqual(Array(rows).fill('1100'));
  });
});
