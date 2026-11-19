import { test, expect } from '../fixtures/test';
import { AutoColumnSizeSyncBudgetPage, type SyncBudgetGrid } from '../fixtures/pages/AutoColumnSizeSyncBudgetPage';

/**
 * AutoColumnSize measured the first `syncLimit + 1` columns over every row before the first paint, with no
 * bound on the cells: 5M cells and about 2.2 s on a 100k × 50 grid. When that synchronous part exceeds
 * `AutoColumnSize.SYNC_CELLS_BUDGET` and the application set no `syncLimit`, the constructor measures the
 * columns on screen and leaves the others to the idle-task sweep. The fixture lowers the budget, so a
 * 1000-row grid takes the path a tall grid takes by default.
 *
 * Every case compares widths with a grid of the same data measured the exact way (`syncLimit` covering
 * every column), built in the same theme, so the text widths never come from a literal.
 */
const GRID: SyncBudgetGrid = { rows: 1000, cols: 30 };
const BUDGET = 5000;
const EXACT = { autoColumnSize: { syncLimit: GRID.cols } };

test.describe('AutoColumnSize sync cell budget', () => {
  let grid: AutoColumnSizeSyncBudgetPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new AutoColumnSizeSyncBudgetPage(page, theme, bundle);
    await grid.goto();
  });

  test('measures only the columns on screen before the constructor returns', async() => {
    const reference = await grid.build({ ...GRID, settings: EXACT });
    const { constructorColumns, widths } = await grid.build(GRID, BUDGET);
    const onScreen = await grid.onScreenColumns();

    expect(onScreen.length).toBeGreaterThan(2);
    expect(onScreen.length).toBeLessThan(GRID.cols);
    expect(constructorColumns).toEqual(expect.arrayContaining(onScreen));
    expect(constructorColumns.length).toBeLessThanOrEqual(onScreen.length + 1);
    expect(onScreen.map(column => widths[column])).toEqual(onScreen.map(column => reference.widths[column]));
  });

  test('ends the idle sweep with the widths the exact path measures', async() => {
    const shaped: SyncBudgetGrid = {
      ...GRID,
      numericColumns: [22],
      settings: {
        fixedColumnsStart: 1,
        fixedColumnsEnd: 1,
        hiddenColumns: { columns: [12] },
        mergeCells: [{ row: 3, col: 20, rowspan: 1, colspan: 3 }],
      },
    };
    const reference = await grid.build({ ...shaped, settings: { ...shaped.settings, ...EXACT } });
    const { constructorColumns } = await grid.build(shaped, BUDGET);

    // The frozen end column is on screen, so the constructor measures it with the start of the grid. The
    // columns between are off screen, so the idle sweep measures them. (MergeCells reads the meta of the
    // merge's first cell itself, so column 20 is no sign of a measure.)
    expect(constructorColumns).toContain(GRID.cols - 1);
    expect(constructorColumns).not.toContain(10);

    await grid.waitForSweepEnd();

    expect(await grid.widths()).toEqual(reference.widths);
  });

  test('widens the scroll range to every measured column once the sweep ends', async() => {
    await grid.build({ ...GRID, settings: EXACT });

    const referenceScrollWidth = await grid.scrollWidth();

    await grid.build(GRID, BUDGET);
    await grid.waitForSweepEnd();

    // Nothing here renders the grid: the sweep draws once at its end, or the scroll range keeps the
    // fallback widths of the columns it measured from idle tasks.
    await expect.poll(() => grid.scrollWidth()).toBe(referenceScrollWidth);
  });

  test('measures the columns on screen of a scrolled grid on loadData()', async() => {
    await grid.build({ ...GRID, settings: EXACT });
    await grid.scrollColumnToStart(15);

    const reference = await grid.loadLongerData(GRID);

    await grid.build(GRID, BUDGET);
    await grid.waitForSweepEnd();
    await grid.scrollColumnToStart(15);

    const onScreen = await grid.onScreenColumns();
    const loaded = await grid.loadLongerData(GRID);

    expect(onScreen[0]).toBeGreaterThan(5);
    // The columns before the viewport are left to idle tasks.
    expect(loaded.readColumns).not.toContain(5);
    expect(onScreen.map(column => loaded.widths[column])).toEqual(onScreen.map(column => reference.widths[column]));

    await grid.waitForSweepEnd();

    expect(await grid.widths()).toEqual(reference.widths);
  });

  test('draws every rendered column at the width it holds once the sweep ends', async() => {
    await grid.build(GRID, BUDGET);
    await grid.waitForSweepEnd();

    // The first paint draws the rendered columns past the viewport's edge at the fallback width. Nothing
    // renders here, so only the sweep's own draw can redraw them.
    await expect.poll(() => grid.staleDrawnColumns()).toEqual([]);
  });

  test('measures the columns a merge on screen spans before the constructor returns', async() => {
    const merged: SyncBudgetGrid = {
      ...GRID,
      values: [{ row: 1, col: 1, value: 'x'.repeat(200) }],
      settings: { mergeCells: [{ row: 1, col: 1, rowspan: 1, colspan: 12 }] },
    };
    const reference = await grid.build({ ...merged, settings: { ...merged.settings, ...EXACT } });
    const { constructorColumns, widths } = await grid.build(merged, BUDGET);
    const onScreen = await grid.onScreenColumns();

    // The merge's first column needs the text's width less the other spanned columns, so they are measured
    // with the columns on screen, and the width drawn first is the final one.
    expect(constructorColumns).toEqual(expect.arrayContaining([...Array(12).keys()].map(index => index + 1)));
    expect(onScreen.map(column => widths[column])).toEqual(onScreen.map(column => reference.widths[column]));

    await grid.waitForSweepEnd();

    expect(await grid.widths()).toEqual(reference.widths);
    await expect.poll(() => grid.staleDrawnColumns()).toEqual([]);
  });

  test('measures the rows again once the columns off screen are measured', async() => {
    // A long text in a column off screen and a row below the fold: measured against the column's fallback
    // width it wraps onto several lines, and no render measures that row again.
    const tall: SyncBudgetGrid = {
      ...GRID,
      values: [{ row: 300, col: 15, value: 'a sentence long enough to wrap in a narrow column' }],
      settings: { autoRowSize: true },
    };

    await grid.build({ ...tall, settings: { ...tall.settings, ...EXACT } });
    await grid.waitForRowSweepEnd();

    const reference = await grid.rowHeights([300]);

    await grid.build(tall, BUDGET);
    await grid.waitForSweepEnd();
    await grid.waitForRowSweepEnd();

    await expect.poll(() => grid.rowHeights([300])).toEqual(reference);
  });

  test('keeps every column of an explicit syncLimit synchronous', async() => {
    const { constructorColumns } = await grid.build({ ...GRID, settings: { autoColumnSize: { syncLimit: 29 } } }, BUDGET);

    expect(constructorColumns).toHaveLength(GRID.cols);
  });

  test('measures every column synchronously while the grid is under the budget', async() => {
    const { constructorColumns } = await grid.build(GRID);

    expect(constructorColumns).toHaveLength(GRID.cols);
  });
});
