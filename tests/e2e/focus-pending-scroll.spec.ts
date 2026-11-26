import { test, expect } from '../fixtures/test';
import { FocusPendingScrollPage } from '../fixtures/pages/FocusPendingScrollPage';

/**
 * A selection on a cell that is not rendered makes the focus manager wait for the next scroll
 * before it moves the browser focus. When the selection moves on, a late callback must not pull
 * the focus back from an input outside the grid. The first two tests end with a selection that
 * does move the focus, so their wait for the scroll is not a no-op. The last two tests prove that
 * the wait itself still works when the selection stays on the cell.
 */
test.describe('deferred focus after a scroll', () => {
  test('imeFastEdit: a stale pending focus does not take the focus from an outside input', async({
    page,
    theme,
    bundle,
  }) => {
    const grid = new FocusPendingScrollPage(page, theme, bundle);

    await grid.goto({ imeFastEdit: true });

    // Row 50 is not rendered, so the refocus waits for a scroll. The selection then moves on.
    await grid.selectWithoutScrolling(50, 0);
    await expect(grid.cell(50, 0)).toHaveCount(0);
    await grid.select(0, 0);
    await grid.externalInput.focus();
    await expect(grid.externalInput).toBeFocused();

    await grid.scrollHolderAndSettle();

    await expect(grid.cell(50, 0)).toBeVisible();
    await expect(grid.externalInput).toBeFocused();

    await grid.select(1, 0);

    await expect(grid.editorTextarea).toBeFocused();
  });

  test('default focus mode: a stale pending focus does not take the focus from an outside input', async({
    page,
    theme,
    bundle,
  }) => {
    const grid = new FocusPendingScrollPage(page, theme, bundle);

    await grid.goto();

    await grid.selectWithoutScrolling(50, 0);
    await expect(grid.cell(50, 0)).toHaveCount(0);
    await grid.select(0, 0);
    await grid.externalInput.focus();
    await expect(grid.externalInput).toBeFocused();

    await grid.scrollHolderAndSettle();

    await expect(grid.cell(50, 0)).toBeVisible();
    await expect(grid.externalInput).toBeFocused();

    await grid.select(1, 0);

    await expect(grid.cell(1, 0)).toBeFocused();
  });

  test('a selection that stays on the not rendered cell still gets its focus once the scroll renders it', async({
    page,
    theme,
    bundle,
  }) => {
    const grid = new FocusPendingScrollPage(page, theme, bundle);

    await grid.goto();

    await grid.selectWithoutScrolling(50, 0);
    await expect(grid.cell(50, 0)).toHaveCount(0);
    await grid.scrollHolderAndSettle();

    await expect(grid.cell(50, 0)).toBeFocused();
  });

  test('imeFastEdit: a selection that stays on the not rendered cell still refocuses the editor once the scroll renders it', async({
    page,
    theme,
    bundle,
  }) => {
    const grid = new FocusPendingScrollPage(page, theme, bundle);

    await grid.goto({ imeFastEdit: true });

    // The editor's textarea exists only after a rendered cell was selected, so select one first.
    await grid.select(0, 0);
    await expect(grid.editorTextarea).toBeFocused();
    await grid.selectWithoutScrolling(50, 0);
    await expect(grid.cell(50, 0)).toHaveCount(0);
    await grid.blurActiveElement();
    await expect(grid.editorTextarea).not.toBeFocused();

    await grid.scrollHolderAndSettle();

    await expect(grid.cell(50, 0)).toBeVisible();
    await expect(grid.editorTextarea).toBeFocused();
  });

  test('Ctrl+End moves the focus to the last cell once the scroll renders it', async({ page, theme, bundle }) => {
    const grid = new FocusPendingScrollPage(page, theme, bundle);

    await grid.goto();

    await grid.select(0, 0);
    await expect(grid.cell(0, 0)).toBeFocused();
    await expect(grid.cell(99, 4)).toHaveCount(0);

    await page.keyboard.press('ControlOrMeta+End');

    await expect(grid.cell(99, 4)).toBeFocused();
  });

  test('Shift+Tab out of the grid keeps the focus outside through a later scroll', async({ page, theme, bundle }) => {
    const grid = new FocusPendingScrollPage(page, theme, bundle);

    await grid.goto();

    await grid.selectWithoutScrolling(50, 0);
    await expect(grid.cell(50, 0)).toHaveCount(0);
    await grid.select(0, 0);
    await expect(grid.cell(0, 0)).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(grid.externalInput).toBeFocused();

    await grid.scrollHolderAndSettle();

    await expect(grid.cell(50, 0)).toBeVisible();
    await expect(grid.externalInput).toBeFocused();
  });

  test('a deselect with a pending cell keeps the focus on an outside input through a later scroll', async({
    page,
    theme,
    bundle,
  }) => {
    const grid = new FocusPendingScrollPage(page, theme, bundle);

    await grid.goto();

    // No selection moves after the cell is left pending, so only the deselect can drop it.
    await grid.selectWithoutScrolling(50, 0);
    await expect(grid.cell(50, 0)).toHaveCount(0);
    await grid.externalInput.focus();
    await expect(grid.externalInput).toBeFocused();
    await grid.deselect();

    await grid.scrollHolderAndSettle();

    await expect(grid.cell(50, 0)).toBeVisible();
    await expect(grid.externalInput).toBeFocused();

    await grid.select(1, 0);

    await expect(grid.cell(1, 0)).toBeFocused();
  });
});
