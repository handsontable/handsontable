import { test, expect } from '../fixtures/test';
import { ManualResizeTeardownPage } from '../fixtures/pages/ManualResizeTeardownPage';

/**
 * DEV-1038. A second mousedown on a resize handle shows the guide and increments the
 * double-click count. Autosize runs 500ms later from `afterMouseDownTimeout()`, not from
 * mouseup, so a hold after that second press used to leave the guide `active` (`display:
 * block`) until the button came up. Hide it when autosize runs. Do not detach it: that is
 * the DEV-2719 flicker (`hideHandleAndGuide()` only strips `active`).
 *
 * The clock is what makes the 500ms boundary an assertion rather than a sleep: with it
 * installed, `toBeHidden()` cannot resolve early, and `runFor` is what delivers the timeout.
 * Advance 1500ms, past the boundary, matching the pending-autoresize describe in
 * `manual-resize-teardown.spec.ts`. Both axes share `ResizeGesture`, so each test is the
 * same press on a different handle.
 */
test.describe('Manual resize guide after a held double-click autosize', () => {
  let grid: ManualResizeTeardownPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    await page.clock.install();

    grid = new ManualResizeTeardownPage(page, theme, bundle);
    await grid.goto();
  });

  test('hides the row guide while the button is still down', async ({ page }) => {
    await grid.dblclickHoldRowHandle(2);

    // Premise: the second press attached the guide and left it active. Without this a
    // gesture that never reached `#onMouseDown` would make the hide assertion pass on
    // nothing.
    await expect(grid.rowGuide).toHaveCount(1);
    await expect(grid.rowGuide).toHaveClass(/active/);

    await page.clock.runFor(1500);

    await expect(grid.rowGuide).toHaveCount(1);
    await expect(grid.rowGuide).not.toHaveClass(/active/);
    await expect(grid.rowGuide).toBeHidden();
    await expect(grid.rowHandle).toHaveCount(1);
  });

  test('hides the column guide while the button is still down', async ({ page }) => {
    await grid.dblclickHoldColumnHandle(2);

    await expect(grid.columnGuide).toHaveCount(1);
    await expect(grid.columnGuide).toHaveClass(/active/);

    await page.clock.runFor(1500);

    await expect(grid.columnGuide).toHaveCount(1);
    await expect(grid.columnGuide).not.toHaveClass(/active/);
    await expect(grid.columnGuide).toBeHidden();
    await expect(grid.columnHandle).toHaveCount(1);
  });
});
