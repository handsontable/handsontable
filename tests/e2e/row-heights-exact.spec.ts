import { test, expect, THEMES_TAG } from '../fixtures/test';
import { RowHeightsExactPage } from '../fixtures/pages/RowHeightsExactPage';

/**
 * Issue #4021. `rowHeights` used to be a floor: a value below the theme's default row height was
 * raised to the default by `Core#_getRowHeightFromSettings`, and content taller than the row grew
 * it. `rowHeights` now states the exact height of a row and clips what does not fit, which is what
 * Excel does. `minRowHeights` keeps the floor.
 *
 * Every height below is under the default row height of every theme (26 / 29 / 37), so a fallback to
 * the default can never be mistaken for a hit.
 */
test.describe('exact row heights', { tag: THEMES_TAG }, () => {
  const THIN = 10;
  const ROWS = 6;

  let grid: RowHeightsExactPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new RowHeightsExactPage(page, theme, bundle);
  });

  test('renders every row of a numeric rowHeights below the default at exactly that height', async() => {
    await grid.goto({ rowHeights: THIN });

    await grid.expectMasterRowHeights(new Array(ROWS).fill(THIN));
    expect(await grid.getRowHeights([0, 1, 5])).toEqual([THIN, THIN, THIN]);
  });

  test('renders the row headers at the same height as their rows', async() => {
    await grid.goto({ rowHeights: THIN });

    await expect.poll(() => grid.rowHeaderHeights()).toEqual(new Array(ROWS).fill(THIN));
  });

  test('accepts the string form', async() => {
    await grid.goto({ rowHeights: `${THIN}px` });

    await grid.expectMasterRowHeights(new Array(ROWS).fill(THIN));
  });

  test('accepts the array form, with rows left out keeping the default', async() => {
    await grid.goto({ rowHeights: [THIN, 14, THIN] });

    await expect.poll(async() => (await grid.masterRowHeights()).slice(0, 3)).toEqual([THIN, 14, THIN]);

    const [, , , fourth] = await grid.masterRowHeights();

    expect(fourth).toBe(await grid.defaultRowHeight());
  });

  test('accepts the function form', async() => {
    await grid.goto({ rowHeightsFromArray: [THIN, 14, 18, 12, 16, 20] });

    await grid.expectMasterRowHeights([THIN, 14, 18, 12, 16, 20]);
    await expect.poll(() => grid.rowHeaderHeights()).toEqual([THIN, 14, 18, 12, 16, 20]);
  });

  test('clips the content instead of growing the row', async() => {
    await grid.goto({ rowHeights: THIN });

    await expect(grid.masterRow(0)).toHaveClass(/htExactRow/);
    expect(await grid.isCellClipped(0, 0)).toBe(true);
  });

  test('keeps a value above the default exact as well', async() => {
    await grid.goto({ rowHeights: 80 });

    await grid.expectMasterRowHeights(new Array(ROWS).fill(80));
  });

  test('treats `0` as no height, so the row keeps the default height', async() => {
    await grid.goto({ rowHeights: [0, THIN] });

    const heights = await grid.masterRowHeights();

    expect(heights[0]).toBe(await grid.defaultRowHeight());
    expect(heights[1]).toBe(THIN);
  });

  test('keeps the old behavior for `minRowHeights`: a value below the default is a floor', async() => {
    await grid.goto({ minRowHeights: THIN });

    expect(await grid.masterRowHeights()).toEqual(new Array(ROWS).fill(await grid.defaultRowHeight()));
    expect(await grid.clipWrapperCount()).toBe(0);
  });

  test('keeps a `minRowHeights` value above the default as a floor', async() => {
    await grid.goto({ minRowHeights: 80 });

    await grid.expectMasterRowHeights(new Array(ROWS).fill(80));
    expect(await grid.clipWrapperCount()).toBe(0);
  });

  test('lets `rowHeights` win when both options are set', async() => {
    await grid.goto({ rowHeights: THIN, minRowHeights: 80 });

    await grid.expectMasterRowHeights(new Array(ROWS).fill(THIN));
  });

  test('applies `minRowHeights` to the rows `rowHeights` gives no height', async() => {
    await grid.goto({ rowHeights: [8, undefined, 0, 8], minRowHeights: 50 });

    await grid.expectMasterRowHeights([8, 50, 50, 8, 50, 50]);
  });

  test('keeps `rowHeights` a minimum when the AutoRowSize plugin is enabled', async() => {
    await grid.goto({ rowHeights: THIN, autoRowSize: true });

    expect((await grid.masterRowHeights())[0]).toBe(await grid.defaultRowHeight());
    expect(await grid.clipWrapperCount()).toBe(0);
  });

  test('switches a grid from exact to floor and back through updateSettings', async() => {
    await grid.goto({ rowHeights: THIN });
    await grid.expectMasterRowHeights(new Array(ROWS).fill(THIN));

    await grid.update({ rowHeights: undefined, minRowHeights: THIN });

    await expect.poll(async() => (await grid.masterRowHeights())[0]).toBe(await grid.defaultRowHeight());
    await expect.poll(() => grid.clipWrapperCount()).toBe(0);

    await grid.update({ rowHeights: THIN, minRowHeights: undefined });

    await grid.expectMasterRowHeights(new Array(ROWS).fill(THIN));
    expect(await grid.isCellClipped(0, 0)).toBe(true);
  });

  test('keeps the rows and the row headers aligned with frozen rows and columns', async() => {
    await grid.goto({ rowHeights: THIN, fixedRowsTop: 1, fixedColumnsStart: 1 });

    await grid.expectMasterRowHeights(new Array(ROWS).fill(THIN));
    await expect.poll(() => grid.rowHeaderHeights()).toEqual(new Array(ROWS).fill(THIN));
  });

  test('keeps a merged block in the first column as tall as its rows, without row headers', async() => {
    await grid.goto({
      rowHeaders: false,
      rowHeights: 50,
      mergeCells: [{ row: 0, col: 0, rowspan: 6, colspan: 1 }],
    });

    await grid.expectMasterRowHeights(new Array(ROWS).fill(50));
    await expect.poll(() => grid.cellHeight(0, 0)).toBe(50 * ROWS);
  });

  test('puts each height of an array on its own row when a row is hidden', async() => {
    await grid.goto({ rowHeights: [THIN, 50, 14, 12, 16, 20], hiddenRows: { rows: [0] } });

    // Visual row 0 is hidden and not rendered, so the master draws visual rows 1 to 5.
    await grid.expectMasterRowHeights([50, 14, 12, 16, 20]);
    await expect.poll(() => grid.rowHeaderHeights()).toEqual([50, 14, 12, 16, 20]);
    await expect(grid.masterRow(0)).toHaveClass(/htExactRow/);
  });

  test('puts each height of a function on its own row when a row is hidden', async() => {
    await grid.goto({ rowHeightsFromArray: [THIN, 50, 14, 12, 16, 20], hiddenRows: { rows: [2] } });

    await grid.expectMasterRowHeights([THIN, 50, 12, 16, 20]);
  });

  test('keeps the rows exact when the ManualRowResize plugin is enabled', async() => {
    await grid.goto({ rowHeights: THIN, manualRowResize: true });

    await grid.expectMasterRowHeights(new Array(ROWS).fill(THIN));
    await expect(grid.masterRow(0)).toHaveClass(/htExactRow/);
  });

  test('switches a row between exact and floor when an array update changes which rows have a height', async() => {
    await grid.goto({ rowHeights: [THIN, THIN, THIN] });
    await grid.expectMasterRowHeights([THIN, THIN, THIN, await grid.defaultRowHeight(), await grid.defaultRowHeight(),
      await grid.defaultRowHeight()]);

    await grid.update({ rowHeights: [THIN, undefined, THIN] });

    const defaultHeight = await grid.defaultRowHeight();

    await grid.expectMasterRowHeights([THIN, defaultHeight, THIN, defaultHeight, defaultHeight, defaultHeight]);
  });

  test('turns the exact rows into floor rows when the AutoRowSize plugin is enabled at runtime', async() => {
    await grid.goto({ rowHeights: THIN });
    await grid.expectMasterRowHeights(new Array(ROWS).fill(THIN));

    await grid.update({ autoRowSize: true });

    await expect.poll(async() => (await grid.masterRowHeights())[0]).toBe(await grid.defaultRowHeight());
    expect(await grid.clipWrapperCount()).toBe(0);
  });

  test('paints a scroll draw with the new row height mode while rendering is suspended', async() => {
    const LAST_ROW = 199;

    await grid.goto({ minRowHeights: THIN, rowCount: LAST_ROW + 1, height: 120 });

    const heights = await grid.rowHeightsOfScrollDrawWhileSuspended({ rowHeights: THIN }, LAST_ROW);

    // The rows the scroll brought into view were drawn while rendering was suspended.
    expect(heights.length).toBeGreaterThan(0);
    expect(heights.every(height => height === THIN)).toBe(true);
    await expect.poll(() => grid.lastFullyVisibleRow()).toBe(LAST_ROW);
  });

  test('scrolls a grid of thin rows to its last row', async() => {
    const LAST_ROW = 199;

    await grid.goto({ rowHeights: THIN, rowCount: LAST_ROW + 1, height: 120 });

    await grid.scrollToRow(LAST_ROW);

    await expect.poll(() => grid.lastFullyVisibleRow()).toBe(LAST_ROW);
    await expect.poll(async() => (await grid.masterRowHeights()).every(height => height === THIN)).toBe(true);
  });

  test('keeps navigating by keyboard and opening the editor on a clipped cell', async({ page }) => {
    await grid.goto({ rowHeights: THIN });

    await grid.cell(0, 0).click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => page.evaluate(() => (window as any).hot.getSelectedLast())).toEqual([1, 1, 1, 1]);

    await page.keyboard.press('Enter');
    await expect(page.locator('.handsontableInput')).toBeFocused();
  });
});
