import { test, expect, THEMES_TAG } from '../fixtures/test';
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

test.describe('AutoColumnSize sync cell budget', { tag: THEMES_TAG }, () => {
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
    // The columns before the viewport set its offset, so they are measured with the columns on screen: the
    // viewport stays on the same columns through the load and the sweep. The columns after it wait.
    expect(loaded.readColumns).toEqual(expect.arrayContaining([5, ...onScreen]));
    expect(loaded.readColumns).not.toContain(GRID.cols - 2);
    expect(onScreen.map(column => loaded.widths[column])).toEqual(onScreen.map(column => reference.widths[column]));
    expect(loaded.firstVisibleColumn).toBe(reference.firstVisibleColumn);

    await grid.waitForSweepEnd();

    expect(await grid.widths()).toEqual(reference.widths);
    expect((await grid.fullyVisibleColumns())[0]).toBe(reference.firstVisibleColumn);
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

  test('keeps every column synchronous while AutoRowSize measures the rows', async() => {
    // A long text in a column off screen, in a row in view: measured against the column's fallback width it
    // wraps onto several lines, and the row would shrink once the sweep ended.
    const tall: SyncBudgetGrid = {
      ...GRID,
      values: [{ row: 3, col: 15, value: 'a sentence long enough to wrap in a narrow column' }],
      settings: { autoRowSize: true },
    };
    const reference = await grid.build({ ...tall, settings: { ...tall.settings, ...EXACT } });
    const built = await grid.build(tall, BUDGET);

    expect(built.widths).toEqual(reference.widths);
    expect(built.rowHeights).toEqual(reference.rowHeights);
  });

  test('keeps every column of an explicit syncLimit synchronous', async() => {
    const { constructorColumns } = await grid.build({ ...GRID, settings: { autoColumnSize: { syncLimit: 29 } } }, BUDGET);

    expect(constructorColumns).toHaveLength(GRID.cols);
  });

  test('measures every column synchronously while the grid is under the budget', async() => {
    const { constructorColumns } = await grid.build(GRID);

    expect(constructorColumns).toHaveLength(GRID.cols);
  });
  test('measures no more columns for a merge than the path without a budget', async() => {
    // A title row merged across the whole grid spans every column: measuring them all would make the budget
    // useless, so the merge's columns stop at the `syncLimit` columns (51 with the default setting).
    const titled: SyncBudgetGrid = {
      ...GRID,
      cols: 80,
      values: [{ row: 0, col: 0, value: 'A title merged across every column of the grid' }],
      settings: { mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 80 }] },
    };
    const reference = await grid.build({ ...titled, settings: { ...titled.settings, autoColumnSize: { syncLimit: 80 } } });
    const { widths } = await grid.build(titled, BUDGET);

    // MergeCells reads the meta of every merged cell itself, so the widths, not the columns read, show
    // what was measured.
    expect(widths.filter(width => typeof width === 'number').length).toBeLessThanOrEqual(51);

    await grid.waitForSweepEnd();

    expect(await grid.widths()).toEqual(reference.widths);
  });

  test('measures the columns of a merge that overlaps a merge on screen', async() => {
    const overlapping: SyncBudgetGrid = {
      ...GRID,
      values: [
        { row: 1, col: 4, value: 'x'.repeat(60) },
        { row: 2, col: 8, value: 'y'.repeat(120) },
      ],
      settings: {
        mergeCells: [
          { row: 1, col: 4, rowspan: 1, colspan: 5 },
          { row: 2, col: 8, rowspan: 1, colspan: 6 },
        ],
      },
    };
    const reference = await grid.build({ ...overlapping, settings: { ...overlapping.settings, ...EXACT } });
    const { widths } = await grid.build(overlapping, BUDGET);
    const onScreen = await grid.onScreenColumns();

    // The second merge reaches the screen only through the first one's last column, which is off screen, and
    // every column of both merges has its width before the first paint. (MergeCells reads the meta of the
    // merged cells itself, so the columns read are no sign of a measure here.)
    expect(onScreen).not.toContain(8);
    expect(widths.slice(4, 14).filter(width => typeof width !== 'number')).toEqual([]);
    expect(onScreen.map(column => widths[column])).toEqual(onScreen.map(column => reference.widths[column]));
  });

  test('measures every column after the plugin is turned off and on during the sweep', async() => {
    const reference = await grid.build({ ...GRID, settings: EXACT });

    await grid.build(GRID, BUDGET, 'toggleAutoColumnSize');

    await expect.poll(() => grid.widths()).toEqual(reference.widths);
  });

  test('measures every column after the plugin is turned off and on during the sweep with no render', async() => {
    const reference = await grid.build({ ...GRID, settings: EXACT });
    const referenceScrollWidth = await grid.scrollWidth();

    await grid.build(GRID, BUDGET, 'toggleAutoColumnSizeWithoutRender');

    // Nothing here renders the grid, so the scroll range shows whether the plugin drew the widths it measured.
    await expect.poll(() => grid.widths()).toEqual(reference.widths);
    await expect.poll(() => grid.scrollWidth()).toBe(referenceScrollWidth);
  });

  test('measures the rows against exact widths when AutoRowSize is turned on during the sweep', async() => {
    // A long text in an off-screen column, in rows in view: measured against the column's fallback width it
    // wraps onto many lines.
    const wrapped: SyncBudgetGrid = {
      ...GRID,
      values: Array.from({ length: Math.ceil(GRID.rows / 7) }, (_, index) => ({
        row: index * 7,
        col: 25,
        value: 'word '.repeat(150),
      })),
    };

    await grid.build({ ...wrapped, settings: EXACT }, undefined, 'enableAutoRowSize');
    await grid.waitForSweepEnd();

    const reference = await grid.rowHeights(10);

    await grid.build(wrapped, BUDGET, 'enableAutoRowSize');
    await grid.waitForSweepEnd();

    expect(await grid.rowHeights(10)).toEqual(reference);
  });

  test('measures every column after columns are inserted during the sweep', async() => {
    await grid.build({ ...GRID, settings: EXACT }, undefined, 'insertTwoColumnsAtStart');

    const reference = await grid.widths();

    await grid.build(GRID, BUDGET, 'insertTwoColumnsAtStart');

    await expect.poll(() => grid.widths()).toEqual(reference);
  });

  test('does not sample the columns on screen again in a render resumed after the sweep', async() => {
    await grid.build(GRID, BUDGET, 'suspendRender');

    const probes = await grid.resumeRenderAfterSweep();

    // The render that ends the sweep only fills in missing widths. Overwriting them would sample every
    // column on screen over all 1000 rows.
    expect(probes).toBeLessThan(GRID.rows);
    await expect.poll(() => grid.staleDrawnColumns()).toEqual([]);
  });

  test('keeps recalculateAllColumnsWidth() synchronous for every column', async() => {
    await grid.build(GRID, BUDGET);
    await grid.waitForSweepEnd();

    // Only `init` and `loadData()` may leave columns to idle tasks; the public method measures them all.
    expect(await grid.recalculateAllColumnsWidth()).toHaveLength(GRID.cols);
  });

  for (const after of ['selectCell0x25', 'selectCell0x25InBatch', 'selectCell0x25WhileSuspended'] as const) {
    test(`keeps a cell selected right after the constructor in view through the sweep (${after})`, async() => {
      // The scroll offset is the sum of the widths of the columns before the cell, so they are measured before
      // the scroll, and the cell stays in view when the sweep measures the rest. A render held by `batch()` or
      // `suspendRender()` draws them only on resume, so the scroll runs again after that render.
      const reference = await grid.build({ ...GRID, settings: EXACT });

      await grid.build(GRID, BUDGET, after);

      const isInView = ([first, last]: Array<number | null>) => (
        first !== null && last !== null && first <= 25 && last >= 25
      );

      await expect.poll(async() => isInView(await grid.fullyVisibleColumns())).toBe(true);

      await grid.waitForSweepEnd();

      expect(isInView(await grid.fullyVisibleColumns())).toBe(true);
      expect(await grid.widths()).toEqual(reference.widths);
      await expect.poll(() => grid.staleDrawnColumns()).toEqual([]);
    });
  }

  test('keeps a cell selected after a sweep that ended while the rendering was held in view', async() => {
    // The sweep measured every column, but its closing render waits for `resumeRender()`, so the engine still
    // lays the columns out with the widths of the first paint when the cell is selected.
    await grid.build(GRID, BUDGET, 'suspendRender');
    await grid.waitForSweepEnd();
    await grid.selectCellAndResumeRender(0, 25);

    await expect.poll(async() => {
      const [first, last] = await grid.fullyVisibleColumns();

      return first !== null && last !== null && first <= 25 && last >= 25;
    }).toBe(true);
  });

  for (const settings of [{ stretchH: 'all' }, { layoutDirection: 'rtl' }]) {
    test(`ends the sweep with the exact widths with ${JSON.stringify(settings)}`, async() => {
      const reference = await grid.build({ ...GRID, settings: { ...settings, ...EXACT } });
      const { widths } = await grid.build({ ...GRID, settings }, BUDGET);
      const onScreen = await grid.onScreenColumns();

      expect(onScreen.map(column => widths[column])).toEqual(onScreen.map(column => reference.widths[column]));

      await grid.waitForSweepEnd();

      expect(await grid.widths()).toEqual(reference.widths);
    });
  }

  test('takes the budget path from 19,608 rows of 51 columns, with the real budget', async() => {
    // `(syncLimit + 1) × rows` over 1,000,000: 51 × 19,607 = 999,957 stays exact, 51 × 19,608 = 1,000,008 does not.
    const exact = await grid.build({ rows: 19607, cols: 51 });
    const budgeted = await grid.build({ rows: 19608, cols: 51 });

    expect(exact.constructorColumns).toHaveLength(51);
    expect(budgeted.constructorColumns.length).toBeLessThan(51);
  });
});

/**
 * A grid wider than the synchronous part (`syncLimit` + 1 columns, plus one chunk: about 102 columns) leaves
 * the other columns to idle tasks, whatever its height and whether AutoRowSize is on. The width map's
 * observer only drops the engine's cache, so without a draw when the sweep ends the scroll range keeps the
 * fallback widths of the columns the sweep measured late. These cases use the plugin's own budget, so the
 * grid takes the exact path with its columns past the synchronous part, and nothing here calls `render()`.
 */
const WIDE_GRID: SyncBudgetGrid = { rows: 50, cols: 160 };
const WIDE_EXACT = { autoColumnSize: { syncLimit: WIDE_GRID.cols } };
const LAST_COLUMN = WIDE_GRID.cols - 1;

test.describe('AutoColumnSize idle sweep on a grid wider than its synchronous part', { tag: THEMES_TAG }, () => {
  let grid: AutoColumnSizeSyncBudgetPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new AutoColumnSizeSyncBudgetPage(page, theme, bundle);
    await grid.goto();
    await grid.countRenders();
  });

  test('widens the scroll range to every measured column once the sweep ends', async() => {
    await grid.build({ ...WIDE_GRID, settings: WIDE_EXACT });

    const referenceScrollWidth = await grid.scrollWidth();

    await grid.build(WIDE_GRID);
    await grid.waitForSweepEnd();

    // The positive control: the columns past the synchronous part did get wide, so the first paint's scroll
    // range was far too short.
    expect(referenceScrollWidth).toBeGreaterThan(WIDE_GRID.cols * 50 * 2);
    await expect.poll(() => grid.scrollWidth()).toBe(referenceScrollWidth);
  });

  test('scrolls to the last column in one call made after the sweep ends', async() => {
    await grid.build(WIDE_GRID);
    await grid.waitForSweepEnd();
    await grid.scrollViewportToColumn(LAST_COLUMN);

    // A scroll computed from the first paint's scroll range lands short of the column, and a second call
    // would reach it. One call must.
    await expect.poll(() => grid.lastRenderedColumn()).toBe(LAST_COLUMN);
  });

  test('widens the scroll range to every measured column once the sweep after loadData() ends', async() => {
    await grid.build({ ...WIDE_GRID, settings: WIDE_EXACT });
    await grid.loadLongerData(WIDE_GRID);

    const referenceScrollWidth = await grid.scrollWidth();

    await grid.build(WIDE_GRID);
    await grid.waitForSweepEnd();
    await grid.loadLongerData(WIDE_GRID);
    await grid.waitForSweepEnd();

    await expect.poll(() => grid.scrollWidth()).toBe(referenceScrollWidth);
    await expect.poll(() => grid.staleDrawnColumns()).toEqual([]);
  });

  for (const after of ['selectCell0x159', 'scrollViewportToColumn159'] as const) {
    test(`keeps the last column in view after a call made before the sweep ends (${after})`, async() => {
      // The scroll offset is the sum of the widths of the columns before the target, so the hook measures the
      // ones the sweep has not reached and draws them before the scroll is computed.
      await grid.build({ ...WIDE_GRID, settings: WIDE_EXACT }, undefined, after);
      await expect.poll(() => grid.cellIsInView(0, LAST_COLUMN)).toBe(true);

      await grid.build(WIDE_GRID, undefined, after);
      await grid.waitForSweepEnd();

      await expect.poll(() => grid.cellIsInView(0, LAST_COLUMN)).toBe(true);
    });
  }

  test('keeps the last column in view without measuring up front when the grid sets an explicit syncLimit', async() => {
    const tall: SyncBudgetGrid = { rows: 1000, cols: WIDE_GRID.cols };

    // The control: on the budget path the same call measures every column before the target, one meta read
    // per column, so the counter sees a measure.
    await grid.build(tall, BUDGET, 'scrollViewportToColumn159CountingReads');

    expect(await grid.metaReadsDuringCall()).toBeGreaterThan(100);

    // An explicit syncLimit asks for less synchronous work: the call measures nothing, and the scroll runs
    // again once the sweep ends.
    await grid.build({ ...tall, settings: { autoColumnSize: { syncLimit: 10 } } }, undefined, 'scrollViewportToColumn159CountingReads');

    expect(await grid.metaReadsDuringCall()).toBeLessThan(20);

    await grid.waitForSweepEnd();
    await expect.poll(() => grid.cellIsInView(0, LAST_COLUMN)).toBe(true);
  });

  test('widens the scroll range once the sweep ends with an explicit syncLimit below the column count', async() => {
    const limited = { autoColumnSize: { syncLimit: 10 } };

    await grid.build({ ...WIDE_GRID, settings: WIDE_EXACT });

    const referenceScrollWidth = await grid.scrollWidth();

    await grid.build({ ...WIDE_GRID, settings: limited });
    await grid.waitForSweepEnd();

    await expect.poll(() => grid.scrollWidth()).toBe(referenceScrollWidth);
  });

  test('draws once when the sweep ends on a grid wider than its synchronous part, and not on one that fits it', async() => {
    // The control: 100 columns fit the synchronous part (`syncLimit` + 1 columns and one chunk of 51), so the
    // constructor ends the sweep and nothing follows it. Both counts start in the constructor's task.
    await grid.build({ ...WIDE_GRID, cols: 100 }, undefined, 'recordRenderCount');
    await grid.waitForSweepEnd();

    expect(await grid.rendersSinceBuild()).toBe(0);

    await grid.build(WIDE_GRID, undefined, 'recordRenderCount');
    await grid.waitForSweepEnd();

    expect(await grid.rendersSinceBuild()).toBe(1);
  });
});
