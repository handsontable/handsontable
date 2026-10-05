import { test, expect } from '../fixtures/test';
import { FixedColumnsEndPage } from '../fixtures/pages/FixedColumnsEndPage';

/**
 * How the plugins that work on columns treat the frozen end columns: ManualColumnMove (the end band is a band of
 * its own), ManualColumnResize (the end header keeps its inline-end edge), CustomBorders (the borders of cells the
 * main table does not render) and UndoRedo (the count that removing end columns lowered).
 *
 * Grid of the fixture: 40 rows x 30 columns, 72 px wide columns, 500 x 300 px viewport, row and column headers.
 */
const TOLERANCE = 3;
const COLS = 30;
const COLUMN_WIDTH = 72;

for (const direction of ['ltr', 'rtl'] as const) {
  const rtl = direction === 'rtl';

  test.describe(`fixedColumnsEnd and ManualColumnMove (${direction})`, { tag: '@core' }, () => {
    let grid: FixedColumnsEndPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndPage(page, theme, bundle);
      await grid.goto({ rtl, fixedColumnsEnd: 2, manualColumnMove: true });
    });

    test('moves a scrolling column among the scrolling columns', async () => {
      // The control of the blocked moves below: the same drag gesture does move a column when it is allowed.
      await grid.dragColumnHeader(2, 4, rtl);

      expect((await grid.firstRow()).slice(0, 5)).toEqual(['R1C1', 'R1C2', 'R1C4', 'R1C3', 'R1C5']);
    });

    test('does not move a scrolling column into the end columns', async () => {
      const before = await grid.firstRow();

      // Released over the first half of the last column: the drop is right before it, inside the end columns.
      await grid.dragColumnHeader(2, COLS - 1, rtl);

      expect(await grid.firstRow()).toEqual(before);
    });

    test('does not move an end column out of the end columns', async () => {
      const before = await grid.firstRow();

      await grid.dragColumnHeader(COLS - 1, 3, rtl);

      expect(await grid.firstRow()).toEqual(before);
    });

    test('moves an end column inside the end columns, with the guideline on the edge it drops at', async () => {
      // The master is scrolled away from its end, so the end columns are not where the scrolled content has them.
      await grid.scrollTo({ left: 200 });
      await grid.pressColumnHeader(COLS - 1);
      await grid.moveOverColumnHeader(COLS - 2, 0.2, rtl);

      const guideline = await grid.guidelineBox();
      const target = await grid.headerBox(COLS - 2);

      // The drop edge is the inline-start edge of the column the pointer is over.
      expect(Math.abs(rtl ? guideline.right - target.right : guideline.left - target.left), 'guideline edge')
        .toBeLessThanOrEqual(TOLERANCE);

      await grid.releaseMouse();

      expect((await grid.firstRow()).slice(-2)).toEqual(['R1C30', 'R1C29']);
    });
  });

  test.describe(`fixedColumnsEnd and ManualColumnMove, window scroll (${direction})`, { tag: '@core' }, () => {
    test('puts the guideline on the drop edge when the page scrolls and the grid has an offset in it', async ({
      page, theme, bundle,
    }) => {
      // The fixture's body has a margin, so the grid's root is not at the page's edge: the viewport edge the end
      // columns stand on is not the edge of the scrolled content.
      const grid = new FixedColumnsEndPage(page, theme, bundle);

      await grid.goto({ rtl, windowScroll: true, fixedColumnsEnd: 2, manualColumnMove: true });
      await grid.scrollWindow({ x: 300, y: 0 });
      await grid.pressColumnHeader(COLS - 1);
      await grid.moveOverColumnHeader(COLS - 2, 0.2, rtl);

      const guideline = await grid.guidelineBox();
      const target = await grid.headerBox(COLS - 2);

      expect(Math.abs(rtl ? guideline.right - target.right : guideline.left - target.left), 'guideline edge')
        .toBeLessThanOrEqual(TOLERANCE);

      await grid.releaseMouse();

      expect((await grid.firstRow()).slice(-2)).toEqual(['R1C30', 'R1C29']);
    });
  });

  test.describe(`fixedColumnsEnd and ManualColumnResize (${direction})`, { tag: '@core' }, () => {
    let grid: FixedColumnsEndPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndPage(page, theme, bundle);
      await grid.goto({ rtl, fixedColumnsEnd: 2, manualColumnResize: true });
    });

    test('resizes a scrolling column by the distance the handle travels', async () => {
      // The control of the end-column test below: the handle sits on the inline-end edge of a scrolling header.
      await grid.hoverColumnHeader(2);

      const header = await grid.headerBox(2);
      const handle = await grid.resizeHandleBox();
      const handleCenter = (handle.left + handle.right) / 2;

      expect(Math.abs(handleCenter - (rtl ? header.left : header.right)), 'handle edge').toBeLessThanOrEqual(8);

      await grid.dragResizeHandle(rtl ? -20 : 20);

      expect(await grid.colWidth(2)).toBe(COLUMN_WIDTH + 20);
    });

    test('puts the handle of an end column on its inline-start edge and widens it by dragging towards the start', async () => {
      await grid.hoverColumnHeader(COLS - 1);

      const header = await grid.headerBox(COLS - 1);
      const handle = await grid.resizeHandleBox();
      const handleCenter = (handle.left + handle.right) / 2;

      // The inline-end edge of the last column is the grid's edge and cannot move, the inline-start one can.
      expect(Math.abs(handleCenter - (rtl ? header.right : header.left)), 'handle edge').toBeLessThanOrEqual(8);

      await grid.dragResizeHandle(rtl ? 30 : -30);

      expect(await grid.colWidth(COLS - 1)).toBe(COLUMN_WIDTH + 30);

      const resized = await grid.headerBox(COLS - 1);

      expect(resized.right - resized.left).toBeCloseTo(COLUMN_WIDTH + 30, 0);
      // The edge at the grid's end stays where it was.
      expect(Math.abs((rtl ? resized.left - header.left : resized.right - header.right)), 'inline-end edge')
        .toBeLessThanOrEqual(TOLERANCE);
    });

    test('narrows an end column by dragging towards the end', async () => {
      await grid.hoverColumnHeader(COLS - 2);
      await grid.dragResizeHandle(rtl ? -20 : 20);

      expect(await grid.colWidth(COLS - 2)).toBe(COLUMN_WIDTH - 20);
    });
  });

  test.describe(`fixedColumnsEnd and CustomBorders (${direction})`, { tag: '@core' }, () => {
    let grid: FixedColumnsEndPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndPage(page, theme, bundle);
      await grid.goto({ rtl, fixedColumnsEnd: 2, customBorders: true });
    });

    test('draws the border of an end column although the main table renders no column near it', async () => {
      const border = { width: 2, color: 'red' };

      await grid.updateSettings({
        customBorders: [
          { row: 3, col: COLS - 1, top: border, bottom: border, start: border, end: border },
          // A scrolling column far from the viewport: the working set must still leave it out.
          { row: 3, col: 15, top: border, bottom: border, start: border, end: border },
        ],
      });

      await expect.poll(() => grid.hasRenderedCustomBorder(3, COLS - 1)).toBe(true);
      expect(await grid.hasRenderedCustomBorder(3, 15)).toBe(false);
      await expect.poll(() => grid.visibleBordersInEndOverlay()).toBeGreaterThan(0);
    });

    test('keeps the border of an end column while the grid scrolls', async () => {
      const border = { width: 2, color: 'red' };

      await grid.updateSettings({
        customBorders: [{ row: 3, col: COLS - 1, top: border, bottom: border, start: border, end: border }],
      });
      await grid.scrollTo({ left: 400 });

      await expect.poll(() => grid.hasRenderedCustomBorder(3, COLS - 1)).toBe(true);
      await expect.poll(() => grid.visibleBordersInEndOverlay()).toBeGreaterThan(0);
    });
  });

  test.describe(`fixedColumnsEnd and UndoRedo (${direction})`, { tag: '@core' }, () => {
    let grid: FixedColumnsEndPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndPage(page, theme, bundle);
      await grid.goto({ rtl, fixedColumnsEnd: 3 });
    });

    test('gives the end columns back when it undoes the removal of some of them', async () => {
      await grid.removeColumns(COLS - 2, 2);

      expect(await grid.countCols()).toBe(COLS - 2);
      expect(await grid.fixedColumnsEnd()).toBe(1);

      await grid.undo();

      expect(await grid.countCols()).toBe(COLS);
      expect(await grid.fixedColumnsEnd()).toBe(3);
      expect(await grid.overlayOf(5, COLS - 1)).toBe('inline_end');
      expect(await grid.overlayOf(5, COLS - 3)).toBe('inline_end');
      expect(await grid.overlayOf(5, COLS - 4)).not.toBe('inline_end');
    });
  });
}
