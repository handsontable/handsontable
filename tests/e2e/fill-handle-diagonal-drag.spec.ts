import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { FillHandleDragPage } from '../fixtures/pages/FillHandleDragPage';

/**
 * DEV-140: the fill handle ignored some pointer positions.
 *
 * The fill handle sits on the selection's bottom-end CORNER, so a pointer that moves diagonally
 * leaves the selection on both axes with its very first sample. The drag direction was resolved
 * only when exactly one axis had changed, so such a drag drew no preview and filled nothing,
 * however slowly it moved (a regression from 18.0.0). The `direction` option did not help either:
 * a change on the forbidden axis still blocked the allowed one.
 *
 * The auto-inserted rows had their own defects: the preview did not follow a row inserted under a
 * resting pointer (the row stayed empty), an insertion still landed after the button was released,
 * and a pointer a few pixels past the inline-end edge inserted nothing.
 *
 * Every gesture uses the real pointer. A dispatched event skips the browser's own
 * `mouseover`/`mousemove` sequencing, which is exactly what decides these cases.
 */
/**
 * How far below the table a pointer rests while a row is inserted. Far enough that the inserted
 * row never ends up under the pointer on any theme (rows are 37px tall on horizon): a pointer over
 * the new last row makes the browser fire `mouseover` there, and the plugin then adds one more
 * spare row below it, which would make the row counts theme-dependent.
 */
const BELOW_INSERTED_ROW = 80;

/**
 * Where the fake clock of the auto-insert tests starts. Any fixed date works.
 */
const CLOCK_START = new Date('2026-01-01T00:00:00Z');

// Theme-sensitive: row heights decide whether an inserted row lands under the resting pointer (see
// BELOW_INSERTED_ROW), and the long and short fixed-height grids render a theme-dependent band.
test.describe('fill handle drag direction (DEV-140)', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: FillHandleDragPage;

  test.beforeEach(({ page, theme, bundle }) => {
    grid = new FillHandleDragPage(page, theme, bundle);
  });

  test.describe('a drag that leaves the selection on both axes', () => {
    test.beforeEach(async() => {
      await grid.goto();
      await grid.initGrid();
    });

    test('fills down along the dominant axis after a single diagonal jump', async() => {
      await grid.selectCells(1, 1);
      await grid.pressFillHandle();
      await grid.movePointerToCell(5, 2);

      await expect.poll(() => grid.fillPreviewCorners()).toEqual([1, 1, 5, 1]);

      await grid.releasePointer();

      expect(await grid.columnValues(1)).toEqual(['B1', 'B2', 'B2', 'B2', 'B2', 'B2', 'B7', 'B8', 'B9', 'B10']);
      expect(await grid.columnValues(2)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10']);
    });

    test('fills down after a slow diagonal drag', async() => {
      await grid.selectCells(1, 1);
      await grid.pressFillHandle();
      await grid.movePointerToCell(5, 2, 10);
      await grid.releasePointer();

      expect(await grid.columnValues(1)).toEqual(['B1', 'B2', 'B2', 'B2', 'B2', 'B2', 'B7', 'B8', 'B9', 'B10']);
    });

    test('fills down when the pointer is as many rows below as columns beside the selection', async() => {
      await grid.selectCells(1, 1);
      await grid.pressFillHandle();
      await grid.movePointerToCell(2, 2);
      await grid.releasePointer();

      expect(await grid.cellValue(2, 1)).toBe('B2');
      expect(await grid.cellValue(1, 2)).toBe('C2');
    });

    test('fills sideways when the pointer is more columns beside than rows below the selection', async() => {
      await grid.selectCells(1, 1);
      await grid.pressFillHandle();
      await grid.movePointerToCell(2, 4);
      await grid.releasePointer();

      expect(await grid.rowValues(1)).toEqual(['A2', 'B2', 'B2', 'B2', 'B2', 'F2']);
      expect(await grid.cellValue(2, 1)).toBe('B3');
    });

    test('fills up after a diagonal jump up and to the inline start', async() => {
      await grid.selectCells(4, 2);
      await grid.pressFillHandle();
      await grid.movePointerToCell(1, 1);
      await grid.releasePointer();

      expect(await grid.columnValues(2)).toEqual(['C1', 'C5', 'C5', 'C5', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10']);
      expect(await grid.columnValues(1)).toEqual(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10']);
    });

    test('fills up after a diagonal jump up and to the inline end', async() => {
      await grid.selectCells(4, 2);
      await grid.pressFillHandle();
      await grid.movePointerToCell(2, 3);
      await grid.releasePointer();

      expect(await grid.columnValues(2)).toEqual(['C1', 'C2', 'C5', 'C5', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10']);
      expect(await grid.cellValue(4, 3)).toBe('D5');
    });

    test('ignores the forbidden axis when `direction` is `vertical`', async() => {
      await grid.initGrid({ fillHandle: 'vertical' });
      await grid.selectCells(1, 1);
      await grid.pressFillHandle();
      // One row down and four columns sideways: the forbidden axis is the dominant one, so with
      // both axes allowed this would be a horizontal fill.
      await grid.movePointerToCell(2, 5);
      await grid.releasePointer();

      expect(await grid.columnValues(1)).toEqual(['B1', 'B2', 'B2', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10']);
      expect(await grid.rowValues(1)).toEqual(['A2', 'B2', 'C2', 'D2', 'E2', 'F2']);
    });

    test('ignores the forbidden axis when `direction` is `horizontal`', async() => {
      await grid.initGrid({ fillHandle: 'horizontal' });
      await grid.selectCells(1, 1);
      await grid.pressFillHandle();
      // Five rows down and two columns sideways: the forbidden axis is the dominant one.
      await grid.movePointerToCell(6, 3);
      await grid.releasePointer();

      expect(await grid.rowValues(1)).toEqual(['A2', 'B2', 'B2', 'B2', 'E2', 'F2']);
      expect(await grid.cellValue(2, 1)).toBe('B3');
    });

    test('counts the rows of a diagonal drag across a hidden row', async() => {
      await grid.initGrid({ hiddenRows: { rows: [3] } });
      await grid.selectCells(1, 1);
      await grid.pressFillHandle();
      await grid.movePointerToCell(5, 2);
      await grid.releasePointer();

      expect(await grid.cellValue(2, 1)).toBe('B2');
      expect(await grid.cellValue(4, 1)).toBe('B2');
      expect(await grid.cellValue(5, 1)).toBe('B2');
      expect(await grid.cellValue(6, 1)).toBe('B7');
      expect(await grid.columnValues(2)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10']);
    });
  });

  test.describe('auto-inserted rows', () => {
    // The ticket's own configuration: two rows, vertical only, rows inserted past the last one.
    const VERTICAL_AUTO_INSERT = { fillHandle: { direction: 'vertical', autoInsertRow: true } };

    // The row insertion runs on a 200 ms timer. A paused fake clock lets each test decide whether the
    // timer runs before or after the release, instead of racing it. `install()` alone is not enough:
    // the installed clock keeps advancing in real time until it is paused.
    test.beforeEach(async({ page }) => {
      await page.clock.install({ time: CLOCK_START });
      await grid.goto();
      await page.clock.pauseAt(CLOCK_START.getTime() + 60_000);
    });

    test('fills the row inserted under a pointer that rests below the grid', async() => {
      await grid.initLabelledGrid(2, 2, VERTICAL_AUTO_INSERT);
      await grid.selectCells(1, 1);

      const start = await grid.pressFillHandle();

      await grid.movePointerBelowGrid(start, BELOW_INSERTED_ROW, 'handle');
      await grid.runRowInsertionTimer();

      expect(await grid.countRows()).toBe(3);
      // The pointer does not move after the insertion, so only the plugin itself can extend the
      // preview onto the new row.
      expect(await grid.fillPreviewCorners()).toEqual([1, 1, 2, 1]);

      await grid.releasePointer();

      expect(await grid.columnValues(1)).toEqual(['B1', 'B2', 'B2']);
      expect(await grid.columnValues(0)).toEqual(['A1', 'A2', null]);
    });

    test('fills the inserted row after a drag down and to the inline start (ticket case 2)', async() => {
      await grid.initLabelledGrid(2, 2, VERTICAL_AUTO_INSERT);
      await grid.selectCells(1, 1);

      const start = await grid.pressFillHandle();

      // Over the first column, below the grid: the pointer has left the selection on both axes.
      await grid.movePointerBelowGrid(start, BELOW_INSERTED_ROW, 'start', -20);
      await grid.runRowInsertionTimer();

      expect(await grid.countRows()).toBe(3);
      expect(await grid.fillPreviewCorners()).toEqual([1, 1, 2, 1]);

      await grid.releasePointer();

      expect(await grid.columnValues(1)).toEqual(['B1', 'B2', 'B2']);
      expect(await grid.columnValues(0)).toEqual(['A1', 'A2', null]);
    });

    test('inserts and fills a row when the pointer drifts past the inline-end edge (ticket case 1)', async() => {
      await grid.initLabelledGrid(2, 2, VERTICAL_AUTO_INSERT);
      await grid.selectCells(1, 1);

      const start = await grid.pressFillHandle();

      await grid.movePointerBelowGrid(start, BELOW_INSERTED_ROW, 'end', 15);
      await grid.runRowInsertionTimer();

      expect(await grid.countRows()).toBe(3);
      expect(await grid.fillPreviewCorners()).toEqual([1, 1, 2, 1]);

      await grid.releasePointer();

      expect(await grid.columnValues(1)).toEqual(['B1', 'B2', 'B2']);
    });

    test('inserts a row when both axes are allowed and the pointer is further below than beside the grid', async() => {
      await grid.initLabelledGrid(2, 2, { fillHandle: { autoInsertRow: true } });
      await grid.selectCells(1, 1);

      const start = await grid.pressFillHandle();

      await grid.movePointerBelowGrid(start, BELOW_INSERTED_ROW, 'end', 15);
      await grid.runRowInsertionTimer();

      expect(await grid.countRows()).toBe(3);
      expect(await grid.fillPreviewCorners()).toEqual([1, 1, 2, 1]);

      await grid.releasePointer();

      expect(await grid.columnValues(1)).toEqual(['B1', 'B2', 'B2']);
    });

    test('inserts no row for a mostly sideways drag past the inline-end edge of an RTL grid', async() => {
      await grid.initLabelledGrid(2, 2, { layoutDirection: 'rtl', fillHandle: { autoInsertRow: true } });
      await grid.selectCells(1, 1);

      const start = await grid.pressFillHandle();

      // Mostly past the inline-end edge (the left one in RTL), barely below the grid.
      await grid.movePointerBelowGrid(start, 5, 'end', 60);
      await grid.runRowInsertionTimer();

      expect(await grid.countRows()).toBe(2);

      // Positive control: the same gesture continued straight down does insert a row.
      await grid.movePointerBelowGrid(start, BELOW_INSERTED_ROW, 'handle');
      await grid.runRowInsertionTimer();

      expect(await grid.countRows()).toBe(3);
      expect(await grid.fillPreviewCorners()).toEqual([1, 1, 2, 1]);

      await grid.releasePointer();

      expect(await grid.createdRowCount()).toBe(1);
    });

    // The pointer rests below the grid, within its width, so it maps onto the last row - the
    // selection's own row - in the next column. Counting only cells, the pointer is one column to the
    // side and zero rows down; the distance below the table has to count too.
    test('fills down into a new row when the pointer rests below the last row, one column to the side', async() => {
      await grid.initLabelledGrid(5, 6, { fillHandle: { autoInsertRow: true } });
      await grid.selectCells(4, 2);
      await grid.pressFillHandle();
      await grid.movePointerBelowColumn(3, BELOW_INSERTED_ROW);
      await grid.runRowInsertionTimer();

      expect(await grid.countRows()).toBe(6);
      expect(await grid.fillPreviewCorners()).toEqual([4, 2, 5, 2]);

      await grid.releasePointer();

      expect(await grid.columnValues(2)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C5']);
      expect(await grid.rowValues(4)).toEqual(['A5', 'B5', 'C5', 'D5', 'E5', 'F5']);
    });

    test('inserts a row for a drag locked vertically, however far past the inline-end edge it goes', async() => {
      await grid.initLabelledGrid(8, 3, { fillHandle: { autoInsertRow: true } });
      await grid.selectCells(0, 0, 2, 0);

      const start = await grid.pressFillHandle();

      // Down onto row 5 first, which locks the drag to the vertical axis, then below the grid and
      // further past its inline-end edge than below it.
      await grid.movePointerToCell(4, 0, 5);
      await grid.movePointerBelowGrid(start, BELOW_INSERTED_ROW, 'end', 2 * BELOW_INSERTED_ROW);
      await grid.runRowInsertionTimer();

      expect(await grid.countRows()).toBe(9);
      expect(await grid.fillPreviewCorners()).toEqual([0, 0, 8, 0]);

      await grid.releasePointer();

      expect(await grid.columnValues(0)).toEqual(['A1', 'A2', 'A3', 'A1', 'A2', 'A3', 'A1', 'A2', 'A3']);
    });

    test('inserts no row, and fills nothing, when only the page scrolls under a resting pointer', async() => {
      await grid.initLabelledGrid(3, 3, { fillHandle: { autoInsertRow: true } });
      await grid.selectCells(2, 1);

      const start = await grid.pressFillHandle();

      // A jitter on the fill handle itself records a pointer position, so a scroll has one to
      // replay. Then the page scrolls, and the grid moves up past the resting pointer. (Entering
      // another cell would not be a jitter: every cell the pointer enters counts as a drag step.)
      await grid.jitterPointer(start);
      await grid.scrollPageWithWheel(150);
      await grid.runRowInsertionTimer();
      await grid.releasePointer();

      expect(await grid.countRows()).toBe(3);
      expect(await grid.createdRowCount()).toBe(0);
      expect(await grid.gridValues()).toEqual([['A1', 'B1', 'C1'], ['A2', 'B2', 'C2'], ['A3', 'B3', 'C3']]);

      // Positive control: a real drag below the grid from the same cell inserts, and fills, a row.
      await grid.scrollPageToTop();
      await grid.selectCells(2, 1);

      const controlStart = await grid.pressFillHandle();

      await grid.movePointerBelowGrid(controlStart, BELOW_INSERTED_ROW, 'handle');
      await grid.runRowInsertionTimer();
      await grid.releasePointer();

      expect(await grid.createdRowCount()).toBe(1);
      expect(await grid.columnValues(1)).toEqual(['B1', 'B2', 'B3', 'B3']);
    });

    // A fixed-height grid scrolled to its end: the row the drag inserts lands below the visible
    // area, where no cell is under the pointer. The pointer is below the whole table, so it points
    // past the last row, whichever row that is now.
    test('fills the row it inserts below the visible part of a fixed-height grid', async() => {
      await grid.initLabelledGrid(8, 3, { height: 130, dragToScroll: false, fillHandle: { autoInsertRow: true } });
      await grid.scrollGridToLastRow();
      await grid.selectCells(7, 0);

      const start = await grid.pressFillHandle();

      await grid.movePointerBelowGridRoot(start, 40);
      await grid.runRowInsertionTimer();

      expect(await grid.countRows()).toBe(9);
      expect(await grid.fillPreviewCorners()).toEqual([7, 0, 8, 0]);

      await grid.releasePointer();

      expect(await grid.cellValue(8, 0)).toBe('A8');
    });

    // A long grid with a fixed height renders a few rows past its viewport, so the table element ends
    // there, not at the end of the data. A pointer below that edge is not below the last row: the fill
    // must stop at the rendered rows, not run on to the end of the data.
    test('stops the fill at the rendered rows of a long fixed-height grid', async() => {
      await grid.initLabelledGrid(1000, 5, { height: 300, dragToScroll: false, fillHandle: { autoInsertRow: true } });
      await grid.selectCells(2, 2);

      const start = await grid.pressFillHandle();
      const lastRenderedRow = await grid.lastRenderedRow();

      await grid.movePointerBelowGridRoot(start, 120);

      expect(lastRenderedRow).toBeLessThan(30);
      expect((await grid.fillPreviewCorners())?.[2]).toBeLessThanOrEqual(lastRenderedRow as number);

      await grid.releasePointer();

      const column = await grid.columnValues(2);

      expect(column.filter(value => value === 'C3').length).toBeLessThanOrEqual(lastRenderedRow as number);
      expect(column[999]).toBe('C1000');
      expect(await grid.countRows()).toBe(1000);
    });

    test('inserts no row at the end of a long fixed-height grid while its last row is not rendered', async() => {
      await grid.initLabelledGrid(1000, 5, { height: 300, dragToScroll: false, fillHandle: { autoInsertRow: true } });
      await grid.selectCells(2, 2);

      const start = await grid.pressFillHandle();

      await grid.movePointerBelowGridRoot(start, 120);
      await grid.runRowInsertionTimer();

      expect(await grid.createdRowCount()).toBe(0);
      expect(await grid.countRows()).toBe(1000);

      await grid.releasePointer();
    });

    // Not a regression test for the ticket: it passes before the fix too, which never inserted a row
    // past the inline-end edge. It pins that the per-axis "outside" rule did not widen the insertion
    // to a drag already locked sideways, whose sticky direction would leave the new row empty.
    test('inserts no row while the drag extends the selection sideways', async() => {
      await grid.initLabelledGrid(3, 3, { fillHandle: { autoInsertRow: true } });
      await grid.selectCells(2, 0);

      const start = await grid.pressFillHandle();

      // Lock the drag to the horizontal axis, then go below the grid and past its inline-end edge,
      // further below than beside it.
      await grid.movePointerToCell(2, 2);
      await grid.movePointerBelowGrid(start, BELOW_INSERTED_ROW, 'end', 30);
      await grid.runRowInsertionTimer();

      expect(await grid.countRows()).toBe(3);

      await grid.releasePointer();

      expect(await grid.rowValues(2)).toEqual(['A3', 'A3', 'A3']);
      expect(await grid.createdRowCount()).toBe(0);
    });

    test('inserts no row once the button is released before the insertion is due', async() => {
      await grid.initLabelledGrid(2, 2, VERTICAL_AUTO_INSERT);
      await grid.selectCells(1, 1);

      const flickStart = await grid.pressFillHandle();

      await grid.movePointerBelowGrid(flickStart, BELOW_INSERTED_ROW, 'handle');
      await grid.releasePointer();
      await grid.runRowInsertionTimer();

      expect(await grid.countRows()).toBe(2);
      expect(await grid.createdRowCount()).toBe(0);

      // Positive control: the same gesture held past the timer does insert, and fill, a row.
      await grid.selectCells(1, 1);

      const controlStart = await grid.pressFillHandle();

      await grid.movePointerBelowGrid(controlStart, BELOW_INSERTED_ROW, 'handle');
      await grid.runRowInsertionTimer();
      await grid.releasePointer();

      expect(await grid.createdRowCount()).toBe(1);
      expect(await grid.columnValues(1)).toEqual(['B1', 'B2', 'B2']);
    });

    test('inserts no row once the button is released after a drag onto the last row', async() => {
      await grid.initGrid({ fillHandle: { autoInsertRow: true } });
      await grid.selectCells(7, 1);
      await grid.pressFillHandle();
      // Reaching the last row schedules an insertion too, without leaving the grid. One jump, so the
      // `mouseover` on the last row arrives before any preview exists and draws it right there.
      await grid.movePointerToCell(9, 1);
      await grid.releasePointer();
      await grid.runRowInsertionTimer();

      expect(await grid.columnValues(1)).toEqual(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8', 'B8']);
      expect(await grid.createdRowCount()).toBe(0);

      // Positive control: the same hover held past the timer does insert a row.
      await grid.selectCells(7, 2);
      await grid.pressFillHandle();
      await grid.movePointerToCell(9, 2);
      await grid.runRowInsertionTimer();
      await grid.releasePointer();

      expect(await grid.createdRowCount()).toBe(1);
      expect(await grid.countRows()).toBe(11);
    });

    test('undoes the fill of an inserted row and then the insertion', async() => {
      await grid.initLabelledGrid(2, 2, VERTICAL_AUTO_INSERT);
      await grid.selectCells(1, 1);

      const start = await grid.pressFillHandle();

      await grid.movePointerBelowGrid(start, BELOW_INSERTED_ROW, 'handle');
      await grid.runRowInsertionTimer();
      await grid.releasePointer();

      expect(await grid.columnValues(1)).toEqual(['B1', 'B2', 'B2']);

      await grid.undo();

      expect(await grid.columnValues(1)).toEqual(['B1', 'B2', null]);

      await grid.undo();

      expect(await grid.countRows()).toBe(2);
    });

    // A guard, not a DEV-140 regression test: it passes before the fix. It pins that the preview
    // update following an insertion copes with an insertion `maxRows` refused.
    test('keeps the preview on the selection when `maxRows` refuses the insertion', async({ page }) => {
      const pageErrors: string[] = [];

      page.on('pageerror', error => pageErrors.push(error.message));

      await grid.initLabelledGrid(2, 2, { ...VERTICAL_AUTO_INSERT, maxRows: 2 });
      await grid.selectCells(1, 1);

      const start = await grid.pressFillHandle();

      await grid.movePointerBelowGrid(start, BELOW_INSERTED_ROW, 'handle');

      // Positive control for the negative assertions below: the insertion was scheduled.
      expect(await grid.isRowInsertPending()).toBe(true);

      await grid.runRowInsertionTimer();

      expect(await grid.isRowInsertPending()).toBe(false);
      expect(await grid.fillPreviewCorners()).toEqual([1, 1, 1, 1]);

      await grid.releasePointer();

      expect(await grid.countRows()).toBe(2);
      expect(await grid.columnValues(1)).toEqual(['B1', 'B2']);
      expect(pageErrors).toEqual([]);
    });
  });
});
