import { test, expect } from '../fixtures/test';
import { FixedColumnsEndPage, type Box } from '../fixtures/pages/FixedColumnsEndPage';

/**
 * The core behaviors of `fixedColumnsEnd` that sit above the rendering engine: where the cell editor opens,
 * where the navigation shortcuts land, and how the mouse selects across the start, master and end bands.
 * The engine's own geometry is covered by `walkontable/inline-end-overlay.spec.ts`.
 *
 * Grid of the fixture: 40 rows x 30 columns, 72 px wide columns, 500 x 300 px viewport, row and column headers.
 * Assertions read coordinates and the selection API. The one paint check is "the open editor is the topmost
 * element at its own center", which needs the end clones' stacking rules (styles phase).
 */
const TOLERANCE = 2;
const COLS = 30;
const ROWS = 40;

/**
 * Asserts that the open editor starts where the cell it edits starts, and is at least as tall as that cell. The
 * width is left out on purpose: the textarea grows to fit its text, so it differs from the cell's by the content.
 *
 * @param {Box} editor The editor's box.
 * @param {Box} cell The edited cell's box.
 * @param {boolean} rtl Whether the layout runs right to left, so the inline start is the right edge.
 */
function expectEditorOnCell(editor: Box, cell: Box, rtl: boolean) {
  expect(Math.abs(rtl ? editor.right - cell.right : editor.left - cell.left), 'editor inline-start edge')
    .toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(editor.top - cell.top), 'editor top edge').toBeLessThanOrEqual(TOLERANCE);
  // At least as tall as the cell: a theme with wider padding wraps the text of a cell that sits at the grid's
  // edge, and the textarea grows by a line.
  expect((editor.bottom - editor.top) - (cell.bottom - cell.top), 'editor height')
    .toBeGreaterThanOrEqual(-(TOLERANCE + 1));
}

for (const direction of ['ltr', 'rtl'] as const) {
  const rtl = direction === 'rtl';
  // The key that moves the selection towards the inline end (physical right in LTR, left in RTL).
  const towardEnd = rtl ? 'ArrowLeft' : 'ArrowRight';
  const towardStart = rtl ? 'ArrowRight' : 'ArrowLeft';

  test.describe(`fixedColumnsEnd editor position (${direction})`, { tag: '@core' }, () => {
    let grid: FixedColumnsEndPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndPage(page, theme, bundle);
    });

    /**
     * Opens the editor on a cell and asserts it covers that cell.
     *
     * @param {number} row Visual row.
     * @param {number} col Visual column.
     * @param {string} [overlay] The clone the cell is expected to be rendered in.
     */
    const expectEditorAligned = async (row: number, col: number, overlay?: string) => {
      await grid.selectCell(row, col);
      await grid.press('Enter');
      await expect.poll(() => grid.isEditorOpened()).toBe(true);

      if (overlay) {
        expect(await grid.overlayOf(row, col), `overlay of ${row},${col}`).toBe(overlay);
      }

      expectEditorOnCell(await grid.editorBox(), await grid.cellBox(row, col), rtl);
      // Painted, not only positioned: the editor is the topmost thing at its own center, so no clone covers it.
      expect(await grid.isEditorOnTop(), 'editor is painted above the overlays').toBe(true);
      await grid.press('Escape');
      await expect.poll(() => grid.isEditorOpened()).toBe(false);
    };

    test('opens the editor over a cell of the end columns', async () => {
      await grid.goto({ rtl, fixedColumnsEnd: 3 });

      await expectEditorAligned(5, COLS - 1, 'inline_end');
      await expectEditorAligned(5, COLS - 3, 'inline_end');
    });

    test('opens the editor over an end-column cell while the grid is scrolled both ways', async () => {
      await grid.goto({ rtl, fixedColumnsEnd: 3 });
      await grid.scrollTo({ top: 400, left: await grid.maxScrollLeft() / 2 });

      await expect.poll(() => grid.scrollLeft()).toBeGreaterThan(0);

      // The grid redraws after the scroll, so wait for the first rendered row to move before picking from it.
      await expect.poll(() => grid.firstVisibleRow()).toBeGreaterThan(0);

      const topRow = await grid.firstVisibleRow();

      await expectEditorAligned(topRow + 2, COLS - 1);
    });

    test('opens the editor over a cell next to the end columns when the grid is scrolled to its end', async () => {
      await grid.goto({ rtl, fixedColumnsEnd: 3 });
      await grid.scrollTo({ left: await grid.maxScrollLeft() });
      await expect.poll(() => grid.scrollLeft()).toBeGreaterThan(0);

      await expectEditorAligned(5, COLS - 4);
    });

    test('opens the editor over the cells of the end corners', async () => {
      await grid.goto({ rtl, fixedColumnsEnd: 2, fixedRowsTop: 2, fixedRowsBottom: 2 });

      await expectEditorAligned(0, COLS - 1, 'top_inline_end_corner');
      await expectEditorAligned(1, COLS - 2, 'top_inline_end_corner');
      await expectEditorAligned(ROWS - 1, COLS - 1, 'bottom_inline_end_corner');
      await expectEditorAligned(ROWS - 2, COLS - 2, 'bottom_inline_end_corner');
    });

    test('opens the editor over the cells of every band when the start and end columns are frozen together', async () => {
      await grid.goto({ rtl, fixedColumnsStart: 2, fixedColumnsEnd: 2, fixedRowsTop: 2, fixedRowsBottom: 2 });

      const cells: Array<[number, number, string]> = [
        [0, 0, 'top_inline_start_corner'],
        [0, 1, 'top_inline_start_corner'],
        [0, COLS - 1, 'top_inline_end_corner'],
        [ROWS - 1, 0, 'bottom_inline_start_corner'],
        [ROWS - 1, COLS - 1, 'bottom_inline_end_corner'],
        [4, 1, 'inline_start'],
        [4, COLS - 2, 'inline_end'],
        [0, 15, 'top'],
        [ROWS - 1, 15, 'bottom'],
        [4, 15, 'master'],
      ];

      for (const [row, col, overlay] of cells) {
        await expectEditorAligned(row, col, overlay);
      }
    });

    test('keeps the editor of an end column inside the grid while a long text is typed', async () => {
      await grid.goto({ rtl, fixedColumnsEnd: 2 });
      await grid.selectCell(5, COLS - 1);
      await grid.press('Enter');
      await expect.poll(() => grid.isEditorOpened()).toBe(true);
      await grid.page.keyboard.type('x'.repeat(80));

      const editor = await grid.editorBox();
      const holder = await grid.holderClientBox();

      // The text outgrows the 72 px column, so the editor stretches to the grid's inline-end edge and stops.
      expect(editor.right - editor.left).toBeGreaterThan(72);
      expect(rtl ? editor.left - holder.left : holder.right - editor.right).toBeGreaterThanOrEqual(-TOLERANCE);
      expect(await grid.isEditorOnTop()).toBe(true);
    });

    test('opens the editor over an end-column cell when the window scrolls the grid', async () => {
      await grid.goto({ rtl, windowScroll: true, fixedColumnsEnd: 3, rows: 20 });

      await expectEditorAligned(5, COLS - 1);
    });

    test('opens the editor over the end cells when the window is scrolled both ways', async () => {
      await grid.goto({ rtl, windowScroll: true, fixedColumnsEnd: 3, fixedRowsTop: 1, rows: 60 });
      await grid.scrollWindow({ x: 150, y: 200 });

      // The grid redraws after the scroll, so wait for the first rendered row to move before picking from it.
      await expect.poll(() => grid.firstVisibleRow()).toBeGreaterThan(0);

      const topRow = await grid.firstVisibleRow();

      await expectEditorAligned(topRow + 3, COLS - 1, 'inline_end');
    });

    test('opens the editor over a cell of the end corner when the window is scrolled both ways', async () => {
      await grid.goto({ rtl, windowScroll: true, fixedColumnsEnd: 3, fixedRowsTop: 1, rows: 60 });
      await grid.scrollWindow({ x: 150, y: 200 });

      await expectEditorAligned(0, COLS - 1, 'top_inline_end_corner');
    });
  });

  test.describe(`fixedColumnsEnd keyboard navigation (${direction})`, { tag: '@core' }, () => {
    let grid: FixedColumnsEndPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndPage(page, theme, bundle);
    });

    test('moves the selection from the master into the end columns and back', async () => {
      await grid.goto({ rtl, fixedColumnsEnd: 3 });
      await grid.selectCell(5, COLS - 4);

      await grid.press(towardEnd);
      expect(await grid.selectedRange()).toEqual([5, COLS - 3, 5, COLS - 3]);

      await grid.press(towardEnd);
      await grid.press(towardEnd);
      expect(await grid.selectedRange()).toEqual([5, COLS - 1, 5, COLS - 1]);

      await grid.press(towardStart);
      await grid.press(towardStart);
      await grid.press(towardStart);
      expect(await grid.selectedRange()).toEqual([5, COLS - 4, 5, COLS - 4]);
    });

    test('moves the selection across the start, master and end bands in order', async () => {
      await grid.goto({ rtl, fixedColumnsStart: 2, fixedColumnsEnd: 2, cols: 6 });
      await grid.selectCell(3, 0);

      const visited: number[] = [];

      for (let step = 0; step < 5; step += 1) {
        await grid.press(towardEnd);
        visited.push((await grid.selectedRange())![1]);
      }

      expect(visited).toEqual([1, 2, 3, 4, 5]);
    });

    test('moves the selection down through the end corners', async () => {
      await grid.goto({ rtl, fixedColumnsEnd: 2, fixedRowsTop: 2, fixedRowsBottom: 2 });
      await grid.selectCell(0, COLS - 1);

      await grid.press('ArrowDown');
      await grid.press('ArrowDown');
      expect(await grid.selectedRange()).toEqual([2, COLS - 1, 2, COLS - 1]);

      await grid.selectCell(ROWS - 3, COLS - 1);
      await grid.press('ArrowDown');
      await grid.press('ArrowDown');
      expect(await grid.selectedRange()).toEqual([ROWS - 1, COLS - 1, ROWS - 1, COLS - 1]);
    });

    test('keeps the cell reached with the arrow key visible beside the end columns', async () => {
      await grid.goto({ rtl, fixedColumnsEnd: 3 });
      await grid.selectCell(5, 0);

      for (let step = 0; step < COLS - 4; step += 1) {
        await grid.press(towardEnd);
      }

      expect(await grid.selectedRange()).toEqual([5, COLS - 4, 5, COLS - 4]);

      const cell = await grid.cellBox(5, COLS - 4);
      const overlay = await grid.page.locator('.ht_clone_inline_end').first().evaluate((el) => {
        const { left, right } = el.getBoundingClientRect();

        return { left, right };
      });

      // The scrolled-to cell ends where the end columns begin: not under them.
      const overlap = rtl ? overlay.right - cell.left : cell.right - overlay.left;

      expect(overlap).toBeLessThanOrEqual(TOLERANCE);
    });

    test('End goes to the last column that scrolls, and Home goes back to the first one', async () => {
      await grid.goto({ rtl, fixedColumnsStart: 2, fixedColumnsEnd: 3 });
      await grid.selectCell(5, 4);

      await grid.press('End');
      expect(await grid.selectedRange()).toEqual([5, COLS - 4, 5, COLS - 4]);
      await expect.poll(() => grid.scrollLeft()).toBeGreaterThan(0);

      await grid.press('Home');
      expect(await grid.selectedRange()).toEqual([5, 2, 5, 2]);
      await expect.poll(() => grid.scrollLeft()).toBe(0);
    });

    test('Ctrl+End goes to the last scrolling cell, and Ctrl+Home goes back to the first one', async () => {
      await grid.goto({ rtl, fixedColumnsStart: 2, fixedColumnsEnd: 3, fixedRowsTop: 1, fixedRowsBottom: 1 });
      await grid.selectCell(5, 4);

      await grid.press('ControlOrMeta+End');
      expect(await grid.selectedRange()).toEqual([ROWS - 2, COLS - 4, ROWS - 2, COLS - 4]);

      await grid.press('ControlOrMeta+Home');
      expect(await grid.selectedRange()).toEqual([1, 2, 1, 2]);
    });

    test('Shift+End extends the selection up to the last column that scrolls', async () => {
      await grid.goto({ rtl, fixedColumnsEnd: 3 });
      await grid.selectCell(5, 4);

      await grid.press('Shift+End');
      expect(await grid.selectedRange()).toEqual([5, 4, 5, COLS - 4]);
    });

    test('leaves End and Home alone when the start and end columns cover every column', async () => {
      await grid.goto({ rtl, fixedColumnsStart: 2, fixedColumnsEnd: 3, cols: 5 });
      await grid.selectCell(2, 3);

      await grid.press('End');
      expect(await grid.selectedRange()).toEqual([2, 3, 2, 3]);

      await grid.press('Home');
      expect(await grid.selectedRange()).toEqual([2, 3, 2, 3]);
    });

    test('keeps Shift+End extending to the last column when only start columns cover the grid', async () => {
      await grid.goto({ rtl, fixedColumnsStart: 3, cols: 3 });
      await grid.selectCell(2, 0);

      await grid.press('Shift+End');
      expect(await grid.selectedRange()).toEqual([2, 0, 2, 2]);
    });

    test('leaves Shift+End alone when the start and end columns cover every column', async () => {
      await grid.goto({ rtl, fixedColumnsStart: 2, fixedColumnsEnd: 3, cols: 5 });
      await grid.selectCell(2, 3);

      await grid.press('Shift+End');
      expect(await grid.selectedRange()).toEqual([2, 3, 2, 3]);
    });

    test('adds no column when Enter leaves the last column and the end columns are frozen', async () => {
      const enterRight = { enterMoves: { row: 0, col: 1 } };

      // Control: without frozen end columns the same Enter appends a spare column.
      await grid.goto({ rtl, minSpareCols: 1, cols: 4 });
      await grid.updateSettings(enterRight);

      const columnsBefore = await grid.countCols();

      await grid.selectCell(2, columnsBefore - 1);
      await grid.press('Enter');
      await expect.poll(() => grid.isEditorOpened()).toBe(true);
      await grid.press('Enter');
      await expect.poll(() => grid.countCols()).toBe(columnsBefore + 1);

      await grid.goto({ rtl, minSpareCols: 1, fixedColumnsEnd: 1, cols: 4 });
      await grid.updateSettings(enterRight);

      // No spare column is created next to frozen end columns, so the grid keeps its own columns.
      const frozenColumns = await grid.countCols();

      await grid.selectCell(2, frozenColumns - 1);
      await grid.press('Enter');
      await expect.poll(() => grid.isEditorOpened()).toBe(true);
      await grid.press('Enter');
      await expect.poll(() => grid.isEditorOpened()).toBe(false);
      // The spare column, when added, is added on the Enter that closes the editor: read after the frames that
      // would have drawn it (the control above shows the column is observable on this path).
      await grid.settleFrames(5);
      expect(await grid.countCols()).toBe(frozenColumns);
    });

    test('moves to the very last column with Ctrl and the arrow key, end columns included', async () => {
      await grid.goto({ rtl, fixedColumnsEnd: 3 });
      await grid.selectCell(5, 4);

      await grid.press(`ControlOrMeta+${towardEnd}`);
      expect(await grid.selectedRange()).toEqual([5, COLS - 1, 5, COLS - 1]);
    });
  });

  test.describe(`fixedColumnsEnd mouse selection (${direction})`, { tag: '@core' }, () => {
    let grid: FixedColumnsEndPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndPage(page, theme, bundle);
    });

    test('selects the clicked cell of the end columns', async () => {
      await grid.goto({ rtl, fixedColumnsEnd: 3 });
      await grid.clickCell(4, COLS - 2);

      expect(await grid.selectedRange()).toEqual([4, COLS - 2, 4, COLS - 2]);
    });

    test('keeps the horizontal scroll when an end-column cell is clicked', async () => {
      await grid.goto({ rtl, fixedColumnsEnd: 3 });
      await grid.scrollTo({ left: 200 });
      await expect.poll(() => grid.scrollLeft()).toBe(200);
      await grid.clickCell(4, COLS - 1);

      expect(await grid.selectedRange()).toEqual([4, COLS - 1, 4, COLS - 1]);
      // Every frame after the click, not the first matching sample: the scroll must not jump and come back.
      expect(await grid.scrollLeftOverFrames(10)).toEqual(Array(10).fill(200));
    });

    test('selects a range by dragging from the master into the end columns', async () => {
      await grid.goto({ rtl, fixedColumnsEnd: 3 });
      await grid.dragFromTo([4, 2], [6, COLS - 2]);

      expect(await grid.selectedRange()).toEqual([4, 2, 6, COLS - 2]);
    });

    test('selects a range by dragging from the end columns into the master', async () => {
      await grid.goto({ rtl, fixedColumnsEnd: 3 });
      await grid.dragFromTo([6, COLS - 1], [4, 2]);

      expect(await grid.selectedRange()).toEqual([6, COLS - 1, 4, 2]);
    });

    test('selects a range by dragging across all bands when the start and end columns are frozen together', async () => {
      await grid.goto({ rtl, fixedColumnsStart: 2, fixedColumnsEnd: 2, fixedRowsTop: 2, fixedRowsBottom: 2 });
      await grid.dragFromTo([0, 0], [ROWS - 1, COLS - 2]);

      expect(await grid.selectedRange()).toEqual([0, 0, ROWS - 1, COLS - 2]);
    });

    test('selects a range by dragging onto the last end column', async () => {
      // In RTL the row headers sit on the right, so the drag auto-scroller must not reserve their width on the
      // left, where the end columns are. Otherwise a pointer over the last end column counts as past the edge.
      await grid.goto({ rtl, fixedColumnsEnd: 2 });
      await grid.dragFromTo([3, 1], [5, COLS - 1]);

      expect(await grid.selectedRange()).toEqual([3, 1, 5, COLS - 1]);
    });
  });
}

test.describe('fixedColumnsEnd settings changes', { tag: '@core' }, () => {
  let grid: FixedColumnsEndPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new FixedColumnsEndPage(page, theme, bundle);
  });

  test('moves the editor along when the end columns are frozen with updateSettings', async () => {
    await grid.goto();
    await grid.updateSettings({ fixedColumnsEnd: 2 });
    await expect(grid.endOverlay).toBeVisible();

    await grid.selectCell(5, COLS - 1);
    await grid.press('Enter');
    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    expectEditorOnCell(await grid.editorBox(), await grid.cellBox(5, COLS - 1), false);
  });
});
