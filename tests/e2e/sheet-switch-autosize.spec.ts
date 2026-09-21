import { test, expect } from '../fixtures/test';
import { SheetSwitchAutosizePage } from '../fixtures/pages/SheetSwitchAutosizePage';

/**
 * DEV-2905: a sheet switch (`updateSettings()` + `loadData()`) ran AutoColumnSize's full sweep
 * before the Formulas plugin had fed the arriving sheet to the engine. The sweep measured the
 * previous sheet's results, and the engine's `valuesUpdated` batch then queued every changed
 * cell for a second synchronous full rescan on the resume render. One switch measured every
 * column three times: the full sweep, the visible-columns walk, and the rescan.
 */
test.describe('AutoColumnSize on a formula sheet switch', () => {
  let grid: SheetSwitchAutosizePage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new SheetSwitchAutosizePage(page, theme, bundle);
    await grid.goto();
  });

  test('a plain loadData measures each column twice: the load sweep and the visible walk', async () => {
    const columnCount = await grid.columnCount();

    await grid.resetMeasuredColumns();
    await grid.loadFreshBudget();
    await expect(grid.cell(1, 0)).toHaveText(/fresh/);

    // Every column is visible (1100px grid, 4 columns), so the render-time walk covers exactly
    // `countCols()` columns and the load sweep covers the same set once more. A third full pass
    // is the stale-engine rescan this spec guards against.
    await expect.poll(() => grid.measuredColumns()).toBe(columnCount * 2);
  });

  test('a switch to a data-holding sheet sweeps it once per loadData, plus the visible walk', async () => {
    const departingColumns = await grid.columnCount();

    await grid.resetMeasuredColumns();
    await grid.clickTab(1);
    await expect(grid.cell(0, 3)).toHaveText(/Big total$/);

    // The switch runs `loadData()` twice (the Formulas plugin's `switchSheet` and then the bar's
    // own load, see the fixture), and each sweeps every column of the arriving sheet. The resume
    // render's visible walk covers the viewport range, which the departing sheet's columns still
    // define at that point (all of them visible) - a rendering-engine change that resets the
    // rendered range on `loadData()` would legitimately turn that term into `arrivingColumns`.
    // Anything on top of the sum is the stale-engine rescan this spec guards against.
    const arrivingColumns = await grid.columnCount();

    await expect.poll(() => grid.measuredColumns()).toBe(arrivingColumns * 2 + departingColumns);
  });

  test('widths measured after a switch match the widths measured at init', async () => {
    const budgetWidths = await grid.columnWidths();

    await grid.clickTab(1);
    await expect(grid.cell(0, 3)).toHaveText(/Big total$/);
    await grid.clickTab(0);
    await expect(grid.cell(0, 0)).toHaveText(/Budget total$/);

    await expect.poll(() => grid.columnWidths()).toEqual(budgetWidths);
  });

  test('reads fall back to the source value once the bound sheet is removed from the engine', async () => {
    await expect(grid.cell(0, 0)).toHaveText(/Budget total$/);

    await grid.removeActiveSheetFromEngine();

    // The plugin caches "the engine holds my sheet"; the engine's own `sheetRemoved` event must
    // drop that cache, or this read would ask HyperFormula about a sheet that no longer exists.
    expect(await grid.dataAtCell(0, 0)).toMatch(/^=SUM\(/);
    expect(grid.pageErrors).toEqual([]);
  });
});
