import { test, expect } from '../fixtures/test';
import { FixedColumnsEndPage, type Box } from '../fixtures/pages/FixedColumnsEndPage';

/**
 * Review follow-ups for `fixedColumnsEnd` in the core: the strict editor rectangle in the inline-end clones,
 * `minSpareCols` next to frozen end columns, and End / Home on a grid whose main table is only partly drawn.
 *
 * Grid of the fixture: 40 rows x 30 columns, 72 px wide columns, 500 x 300 px viewport, row and column headers.
 */
const COLS = 30;
const ROWS = 40;
const PIXEL = 1;

/**
 * Asserts the open editor sits exactly on the cell it edits: the same inline-start edge and the same top edge
 * (1 px), and at least the cell's width and height.
 *
 * @param {Box} editor The editor's box.
 * @param {Box} cell The edited cell's box.
 * @param {boolean} rtl Whether the layout runs right to left, so the inline start is the right edge.
 * @param {string} label What is being measured, for the failure message.
 */
function expectEditorOnCell(editor: Box, cell: Box, rtl: boolean, label: string) {
  expect(Math.abs(rtl ? editor.right - cell.right : editor.left - cell.left), `${label}: inline-start edge`)
    .toBeLessThanOrEqual(PIXEL);
  expect(Math.abs(editor.top - cell.top), `${label}: top edge`).toBeLessThanOrEqual(PIXEL);
  expect((editor.right - editor.left) - (cell.right - cell.left), `${label}: width`)
    .toBeGreaterThanOrEqual(-PIXEL);
  expect((editor.bottom - editor.top) - (cell.bottom - cell.top), `${label}: height`)
    .toBeGreaterThanOrEqual(-PIXEL);
}

for (const direction of ['ltr', 'rtl'] as const) {
  const rtl = direction === 'rtl';

  test.describe(`fixedColumnsEnd editor rectangle (${direction})`, { tag: '@core' }, () => {
    let grid: FixedColumnsEndPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndPage(page, theme, bundle);
    });

    /**
     * Opens the editor on a cell and asserts it covers that cell to the pixel.
     *
     * @param {number} row Visual row.
     * @param {number} col Visual column.
     * @param {string} overlay The clone the cell is expected to be rendered in.
     */
    const expectEditorRectOnCell = async (row: number, col: number, overlay: string) => {
      await grid.selectCell(row, col);
      await grid.press('Enter');
      await expect.poll(() => grid.isEditorOpened()).toBe(true);
      expect(await grid.overlayOf(row, col), `overlay of ${row},${col}`).toBe(overlay);
      expectEditorOnCell(await grid.editorBox(), await grid.cellBox(row, col), rtl, `${overlay} ${row},${col}`);
      await grid.press('Escape');
      await expect.poll(() => grid.isEditorOpened()).toBe(false);
    };

    test('puts the editor on the cell in the end column, the top corner and the bottom corner', async () => {
      await grid.goto({ rtl, fixedColumnsEnd: 2, fixedRowsTop: 2, fixedRowsBottom: 2 });

      await expectEditorRectOnCell(5, COLS - 1, 'inline_end');
      await expectEditorRectOnCell(0, COLS - 1, 'top_inline_end_corner');
      await expectEditorRectOnCell(1, COLS - 2, 'top_inline_end_corner');
      await expectEditorRectOnCell(ROWS - 1, COLS - 1, 'bottom_inline_end_corner');
      await expectEditorRectOnCell(ROWS - 2, COLS - 2, 'bottom_inline_end_corner');
    });

    test('puts the editor on the cell in the end clones when the grid is scrolled both ways', async () => {
      await grid.goto({ rtl, fixedColumnsEnd: 2, fixedRowsTop: 2, fixedRowsBottom: 2 });
      await grid.scrollTo({ top: 400, left: await grid.maxScrollLeft() / 2 });
      await expect.poll(() => grid.scrollLeft()).toBeGreaterThan(0);
      await expect.poll(() => grid.firstVisibleRow()).toBeGreaterThan(2);

      const topRow = await grid.firstVisibleRow();

      await expectEditorRectOnCell(topRow + 3, COLS - 1, 'inline_end');
      await expectEditorRectOnCell(0, COLS - 1, 'top_inline_end_corner');
      await expectEditorRectOnCell(ROWS - 1, COLS - 1, 'bottom_inline_end_corner');
    });

    test('puts the editor on the cell in the end clones when the window scrolls the grid both ways', async () => {
      await grid.goto({ rtl, windowScroll: true, fixedColumnsEnd: 2, fixedRowsTop: 2, fixedRowsBottom: 2, rows: 60 });
      await grid.scrollWindow({ x: 150, y: 200 });
      await expect.poll(() => grid.firstVisibleRow()).toBeGreaterThan(2);

      const topRow = await grid.firstVisibleRow();

      await expectEditorRectOnCell(topRow + 3, COLS - 1, 'inline_end');
      await expectEditorRectOnCell(0, COLS - 1, 'top_inline_end_corner');
      await expectEditorRectOnCell(59, COLS - 1, 'bottom_inline_end_corner');
    });
  });

  test.describe(`fixedColumnsEnd with minSpareCols (${direction})`, { tag: '@core' }, () => {
    let grid: FixedColumnsEndPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndPage(page, theme, bundle);
    });

    /**
     * Types a value into a cell and commits it.
     *
     * @param {number} row Visual row.
     * @param {number} col Visual column.
     */
    const typeInto = async (row: number, col: number) => {
      await grid.selectCell(row, col);
      await grid.press('Enter');
      await expect.poll(() => grid.isEditorOpened()).toBe(true);
      await grid.page.keyboard.type('x');
      await grid.press('Enter');
      await expect.poll(() => grid.isEditorOpened()).toBe(false);
    };

    test('keeps the typed-in end column frozen and appends no column', async () => {
      // Control: without end columns the spare column exists from the start and typing into it appends the next.
      await grid.goto({ rtl, minSpareCols: 1, cols: 4 });

      const columnsBefore = await grid.countCols();

      expect(columnsBefore).toBe(5);
      await typeInto(2, columnsBefore - 1);
      await expect.poll(() => grid.countCols()).toBe(columnsBefore + 1);

      await grid.goto({ rtl, minSpareCols: 1, fixedColumnsEnd: 2, cols: 4 });
      expect(await grid.countCols()).toBe(4);
      await typeInto(2, 3);
      // The spare column, when added, is added after the commit: read after the frames that would have drawn it.
      await grid.settleFrames(5);
      expect(await grid.countCols()).toBe(4);
      expect(await grid.fixedColumnsEnd()).toBe(2);
      expect(await grid.overlayOf(2, 3)).toBe('inline_end');
    });
  });
}

test.describe('fixedColumnsEnd End and Home on a partly drawn main table', { tag: '@core' }, () => {
  let grid: FixedColumnsEndPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new FixedColumnsEndPage(page, theme, bundle);
  });

  for (const direction of ['ltr', 'rtl'] as const) {
    const rtl = direction === 'rtl';

    test(`moves with End and Home from both ends of a narrow grid (${direction})`, async () => {
      await grid.page.setViewportSize({ width: 360, height: 600 });
      await grid.goto({ rtl, windowScroll: true, fixedColumnsEnd: 3, rows: 10 });

      // Scrolled to the start: the end columns are not drawn by the main table yet.
      await grid.selectCell(2, 4);
      await grid.press('End');
      expect(await grid.selectedRange()).toEqual([2, COLS - 4, 2, COLS - 4]);

      // Scrolled to the end: the end columns are drawn under the clone.
      await grid.press('Home');
      expect(await grid.selectedRange()).toEqual([2, 0, 2, 0]);
      await grid.press('End');
      expect(await grid.selectedRange()).toEqual([2, COLS - 4, 2, COLS - 4]);
      await grid.press('Home');
      expect(await grid.selectedRange()).toEqual([2, 0, 2, 0]);
    });

    test(`reaches the last scrolling column from the scrolled end and goes back (${direction})`, async () => {
      await grid.goto({ rtl, fixedColumnsEnd: 3 });
      await grid.scrollTo({ left: await grid.maxScrollLeft() });
      await expect.poll(() => grid.scrollLeft()).toBeGreaterThan(0);

      await grid.selectCell(5, COLS - 5);
      await grid.press('End');
      expect(await grid.selectedRange()).toEqual([5, COLS - 4, 5, COLS - 4]);

      await grid.press('Home');
      expect(await grid.selectedRange()).toEqual([5, 0, 5, 0]);
      await expect.poll(() => grid.scrollLeft()).toBe(0);

      await grid.press('End');
      expect(await grid.selectedRange()).toEqual([5, COLS - 4, 5, COLS - 4]);
      await expect.poll(() => grid.scrollLeft()).toBeGreaterThan(0);
    });
  }
});
