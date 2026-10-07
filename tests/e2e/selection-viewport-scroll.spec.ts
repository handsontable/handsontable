import { test, expect } from '../fixtures/test';
import { SelectionViewportScrollPage } from '../fixtures/pages/SelectionViewportScrollPage';

/**
 * The viewport scroll a selection makes, and the scroll of the browser window to the selected cell that it
 * queues for the next `afterScroll`. That window scroll goes through `scrollIntoView()`, which moves every
 * scrollable ancestor of the cell, the grid's own holders included. It must not run after a scroll made
 * since the selection's own, or it pulls the grid back to the selected cell.
 */
test.describe('viewport scroll of a selection', () => {
  let grid: SelectionViewportScrollPage;

  // 40 columns of 60px in a 500px-wide grid: column 10 is off screen at first, so selecting it scrolls.
  const WIDE_DATA = Array.from({ length: 10 }, (_, row) =>
    Array.from({ length: 40 }, (_, col) => `R${row + 1}C${col + 1}`));

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SelectionViewportScrollPage(page, theme, bundle);
    await grid.goto();
  });

  for (const layoutDirection of ['ltr', 'rtl'] as const) {
    test(`keeps a scroll made in the same task as the selection (${layoutDirection})`, async() => {
      await grid.initGrid({ data: WIDE_DATA, colWidths: 60, layoutDirection });
      await grid.countAfterScroll();

      const offsets = await grid.selectCellThenScrollToColumn(3, 10, 2);

      // The selection scrolled, and the second scroll moved the viewport somewhere else; otherwise the
      // window scroll the selection queued would have nothing to pull back.
      expect(offsets.afterSelection).not.toBe(offsets.before);
      expect(offsets.afterScroll).not.toBe(offsets.afterSelection);

      await grid.waitForAfterScroll();

      expect(await grid.masterScrollLeft()).toBe(offsets.afterScroll);
      await expect.poll(() => grid.firstFullyVisibleColumn()).toBe(2);
    });
  }

  test('keeps a scroll made in the same task as selecting a cell in a frozen row', async() => {
    // The cell is drawn by the top overlay, whose holder is a scroll container of its own. A clone holder
    // moved off the offset the engine wrote is read as a user scroll and replayed onto the master.
    await grid.initGrid({ data: WIDE_DATA, colWidths: 60, fixedRowsTop: 1 });
    await grid.countAfterScroll();

    const offsets = await grid.selectCellThenScrollToColumn(0, 10, 2);

    expect(offsets.afterSelection).not.toBe(offsets.before);
    expect(offsets.afterScroll).not.toBe(offsets.afterSelection);

    await grid.waitForAfterScroll();

    expect(await grid.masterScrollLeft()).toBe(offsets.afterScroll);
    await expect.poll(() => grid.firstFullyVisibleColumn()).toBe(2);
  });

  // The positive controls for the cases above: dropping the window scroll after a later scroll must not drop
  // it when nothing else moved the viewport.
  test('still scrolls the browser window to a selected cell below the fold', async() => {
    // The cell is already inside the grid's viewport, so only the window has to move.
    await grid.initGrid({ data: WIDE_DATA, colWidths: 60 });
    await grid.pushGridBelowTheFold();

    expect(await grid.isCellInWindow(5, 2)).toBe(false);

    await grid.selectCells(5, 2, 5, 2);

    await expect.poll(() => grid.isCellInWindow(5, 2)).toBe(true);
    expect(await grid.masterScrollLeft()).toBe(0);
  });

  test('still scrolls the browser window after a selection that scrolls the viewport', async() => {
    // Column 10 is off screen, so the selection scrolls the viewport first, and the window scroll waits for
    // that scroll's `afterScroll` - the path a later scroll used to hijack.
    await grid.initGrid({ data: WIDE_DATA, colWidths: 60 });
    await grid.pushGridBelowTheFold();
    await grid.countAfterScroll();

    expect(await grid.isCellInWindow(5, 10)).toBe(false);

    await grid.selectCells(5, 10, 5, 10);
    await grid.waitForAfterScroll();

    await expect.poll(() => grid.isCellInWindow(5, 10)).toBe(true);
    expect(await grid.masterScrollLeft()).toBeGreaterThan(0);
  });
});
