import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { TwoGridsPage } from '../fixtures/pages/TwoGridsPage';

/**
 * Tab and Shift+Tab move through a page that holds two grids, each below an input, in the page's
 * own order: into a grid at its first cell, from cell to cell, out of it at the end of a row (the
 * grids leave `autoWrapRow` off), and back out to the input above. A grid the focus leaves drops
 * its selection and stops listening to the keyboard.
 *
 * These are real key presses, which is the point: the Jasmine tab-navigation suite drives the
 * shortcut with simulated key events, so the browser's own Tab order between the inputs and the
 * grids never runs there. `shadow-dom.spec.ts` presses Tab into one grid and out of it; the walk
 * from one grid through the next input into a second grid, and the exit at the end of a row, were
 * until DEV-3257 checked only by three screenshots of `/basic-two-tables-demo` in the cross-browser
 * visual suite (`focus.spec.ts`), each taken after a run of key presses and a 50 ms sleep per press,
 * asserting nothing. The presses here are the same three runs, in the same order on one page, so the
 * second run re-enters a grid the first run left (the grid restores the cell it last held, through
 * the focus scope's recent coordinates), and each run ends on the state the matching screenshot
 * showed.
 */
test.describe('Tab order through two grids', { tag: CROSS_BROWSER_TAG }, () => {
  let page: TwoGridsPage;

  test.beforeEach(async({ page: browserPage, theme, bundle }) => {
    page = new TwoGridsPage(browserPage, theme, bundle);
    await page.goto();
  });

  test('walks into, through and out of both grids, re-entering the grid it left', async() => {
    // The first run: Tab, Tab, Shift+Tab.
    await page.press('Tab');

    expect(await page.focusOwner()).toBe('input-top');

    await page.press('Tab');

    expect(await page.focusOwner()).toBe('grid-top');
    expect(await page.gridState('top')).toEqual({ selected: [[0, 0, 0, 0]], listening: true });

    // The first screenshot: the first input focused, and no grid selected.
    await page.press('Shift+Tab');

    expect(await page.focusOwner()).toBe('input-top');
    expect(await page.gridState('top')).toEqual({ selected: undefined, listening: false });
    expect(await page.gridState('bottom')).toEqual({ selected: undefined, listening: false });

    // The second run, seven Tabs. The first re-enters the grid the first run left, at its first
    // cell, where the focus last was.
    await page.press('Tab');

    expect(await page.focusOwner()).toBe('grid-top');
    expect(await page.gridState('top')).toEqual({ selected: [[0, 0, 0, 0]], listening: true });

    // Four presses walk the first row to its last cell.
    await page.press('Tab', 4);

    expect(await page.gridState('top')).toEqual({ selected: [[0, 4, 0, 4]], listening: true });

    // The sixth press leaves the grid at the end of the row, for the next input on the page.
    await page.press('Tab');

    expect(await page.focusOwner()).toBe('input-bottom');
    expect(await page.gridState('top')).toEqual({ selected: undefined, listening: false });

    // The second screenshot: the bottom grid's first cell selected, the top grid released.
    await page.press('Tab');

    expect(await page.focusOwner()).toBe('grid-bottom');
    expect(await page.gridState('bottom')).toEqual({ selected: [[0, 0, 0, 0]], listening: true });
    expect(await page.gridState('top')).toEqual({ selected: undefined, listening: false });

    // The third run, and screenshot: Shift+Tab from the first cell returns to the input above the
    // grid.
    await page.press('Shift+Tab');

    expect(await page.focusOwner()).toBe('input-bottom');
    expect(await page.gridState('bottom')).toEqual({ selected: undefined, listening: false });
  });
});
