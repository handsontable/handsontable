import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { RowRecyclingFocusPage } from '../fixtures/pages/RowRecyclingFocusPage';

/**
 * A selection jump far down the grid (Ctrl+ArrowDown to the last row) moves the rendered band so far
 * that no row survives, so the rows are drawn again into the same TR elements. Without a new element
 * the grid would focus the TD that already holds the focus, now showing the last row: no focus event
 * fires, and Chromium keeps the accessibility object of that TD, so NVDA and VoiceOver say nothing.
 * The rows renderer gives the focused row a new TR on such a draw, so the focus moves to a new TD.
 * A plain scroll moves no focus and keeps the element.
 */
test.describe('a selection jump focuses a new cell element', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: RowRecyclingFocusPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new RowRecyclingFocusPage(page, theme, bundle);
  });

  test('Ctrl+ArrowDown to the last row moves the focus to a new TD', async({ browserName }) => {
    await grid.goto();

    expect(await grid.selectCellAndKeepFocused(0, 0)).toBe('TD');

    await grid.pressAndWaitForRow('PageDown', 3);
    await grid.pressAndWaitForRow('PageDown', 6);

    const nodeBefore = browserName === 'chromium' ? await grid.focusedAccessibilityNode() : null;

    await grid.pressAndWaitForRow('ControlOrMeta+ArrowDown', 199);

    expect(await grid.focusedCellAfterKey()).toEqual({
      sameElementFocused: false,
      tag: 'TD',
      text: 'A200',
      ariaRowIndex: '201',
      focusinOnFocusedCell: 1,
    });

    if (browserName === 'chromium') {
      const nodeAfter = await grid.focusedAccessibilityNode();

      expect(nodeBefore).not.toBeNull();
      expect(nodeAfter?.id).not.toBe(nodeBefore?.id);
      expect(nodeAfter?.name).toContain('A200');
    }
  });

  test('a scroll to the end keeps the focused element and fires no focus event', async() => {
    await grid.goto();

    expect(await grid.selectCellAndKeepFocused(0, 0)).toBe('TD');

    await grid.takeFocusEvents();
    await grid.scrollToEnd();

    const state = await grid.focusedCellState();

    expect(state.sameElementFocused).toBe(true);
    expect(state.row).not.toBe(0);
    expect(await grid.takeFocusEvents()).toEqual([]);
  });
});
