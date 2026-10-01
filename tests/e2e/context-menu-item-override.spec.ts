import { test, expect } from '../fixtures/test';
import { ContextMenuItemOverridePage } from '../fixtures/pages/ContextMenuItemOverridePage';

/**
 * DEV-3140. A user override of `disabled()` on `commentsAddEdit` - the item the Comments plugin adds
 * to the context menu - was never called, while `hidden()` on the same item worked. The plugin's own
 * `disabled` replaced the user's, because the plugin defines one and does not define `hidden`.
 */
test.describe('overriding the Comments plugin item in the context menu', () => {
  let grid: ContextMenuItemOverridePage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ContextMenuItemOverridePage(page, theme, bundle);
    await grid.goto();
  });

  test('disables the item when the user disabled() returns true', async () => {
    await grid.openContextMenuOnCell(0, 0);

    await expect(grid.addCommentItem()).toBeVisible();
    await expect(grid.addCommentItem()).toHaveClass(/htDisabled/);
    expect((await grid.overrideCalls()).disabled).toBeGreaterThan(0);
  });

  test('leaves the item enabled when the user disabled() returns false', async () => {
    // The control for the test above: without it, an item disabled for every row would pass.
    await grid.openContextMenuOnCell(1, 0);

    await expect(grid.addCommentItem()).toBeVisible();
    await expect(grid.addCommentItem()).not.toHaveClass(/htDisabled/);
  });

  test('still hides the item when the user hidden() returns true', async () => {
    await grid.openContextMenuOnCell(2, 0);

    await expect(grid.addCommentItem()).toHaveCount(0);
    expect((await grid.overrideCalls()).hidden).toBeGreaterThan(0);
  });

  test('re-evaluates the override on every open of the menu', async () => {
    await grid.openContextMenuOnCell(0, 0);
    await expect(grid.addCommentItem()).toHaveClass(/htDisabled/);
    await grid.closeMenu();
    await grid.openContextMenuOnCell(1, 0);

    await expect(grid.addCommentItem()).not.toHaveClass(/htDisabled/);
  });
});
