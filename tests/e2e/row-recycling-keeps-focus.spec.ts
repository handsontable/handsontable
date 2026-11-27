import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { RowRecyclingFocusPage } from '../fixtures/pages/RowRecyclingFocusPage';

const SCROLL_STEP = 29;
const SCROLL_STEPS = 10;

/**
 * A vertical scroll rotates the rendered rows: the TR of a row that leaves the band moves to its other
 * end. When a cell of that row holds the browser focus, the move must not detach it, or Firefox and
 * WebKit blur it and the grid focuses the same TD again while it shows a later row. A screen reader
 * reads that `focus` event as a focus move and jumps its reading cursor. With `Element#moveBefore()`
 * the row moves without a detach, so no focus event fires.
 *
 * Known limit: an engine without `moveBefore()` (WebKit) takes the fragment fallback, which detaches the
 * row, so the cell is blurred and focused again there. On such an engine the test asserts only that the
 * same cell ends with the focus.
 */
test.describe('row recycling keeps the browser focus', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: RowRecyclingFocusPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new RowRecyclingFocusPage(page, theme, bundle);
  });

  test('a scroll that moves the focused cell\'s row to the band\'s end fires no focus event', async() => {
    await grid.goto();

    const movesInPlace = await grid.supportsMoveBefore();

    expect(await grid.selectCellAndKeepFocused(0, 0)).toBe('TD');
    expect((await grid.takeFocusEvents()).map(event => event.type)).toContain('focusin');

    for (let step = 0; step < SCROLL_STEPS; step++) {
      await grid.scrollDownBy(SCROLL_STEP);
    }

    const state = await grid.focusedCellState();

    expect(state.row).not.toBe(0);
    expect(state.sameElementFocused).toBe(true);

    if (movesInPlace) {
      expect(await grid.takeFocusEvents()).toEqual([]);
    }
  });
});
