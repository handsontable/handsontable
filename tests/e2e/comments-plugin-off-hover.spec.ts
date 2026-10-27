import { test, expect } from '../fixtures/test';
import { CommentsPluginOffHoverPage } from '../fixtures/pages/CommentsPluginOffHoverPage';

/**
 * Resting the pointer on a commented cell arms a show that runs after the display delay. Turning the
 * Comments plugin off inside that delay, through `updateSettings()` or by switching to a sheet that
 * declares `comments: false`, left the show armed: the editor appeared over a grid with the plugin off,
 * and neither Escape nor a click outside could close it.
 */
test.describe('Comments turned off while a hover waits for its delay', () => {
  let grid: CommentsPluginOffHoverPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    await page.clock.install();
    grid = new CommentsPluginOffHoverPage(page, theme, bundle);
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test('shows the comment after the delay while the plugin stays on', async({ page }) => {
    await grid.goto('plain');

    await grid.hoverCommentedCell();
    await page.clock.runFor(600);

    await expect(grid.editor).toBeVisible();
  });

  test('does not show the comment once `updateSettings()` turned the plugin off', async({ page }) => {
    await grid.goto('plain');

    await grid.hoverCommentedCell();
    await page.clock.runFor(50);
    await grid.turnCommentsOff();
    await grid.outside.hover();
    await page.clock.runFor(600);

    expect(await grid.isCommentsEnabled()).toBe(false);
    await expect(grid.editor).toBeHidden();
  });

  test('does not show the comment on a sheet with the plugin off reached during the delay', async({ page }) => {
    await grid.goto('sheets');

    await grid.hoverCommentedCell();
    await page.clock.runFor(50);
    await grid.openSheet('Beta');
    await grid.outside.hover();
    await page.clock.runFor(600);

    expect(await grid.isCommentsEnabled()).toBe(false);
    await expect(grid.editor).toBeHidden();
  });
});
