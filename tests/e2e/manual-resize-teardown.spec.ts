import { test, expect } from '../fixtures/test';
import { ManualResizeTeardownPage } from '../fixtures/pages/ManualResizeTeardownPage';

/**
 * DEV-2719. `ManualRowResize` and `ManualColumnResize` append their handle and their guide to the
 * root element lazily - the handle on `mouseover` over a header, the guide on `mousedown` over the
 * handle - and nothing detached them again except the context-menu handler.
 * `hideHandleAndGuide()` only stripped the `active` class, `disablePlugin()` detached nothing, and
 * `destroy()` only called `super.destroy()`. So turning a plugin off with `updateSettings()` left
 * its elements inside the application's own container.
 *
 * The handle is the harmful half. It is `opacity: 0` at rest, so nothing looks wrong, but it keeps
 * `z-index: 210`, `pointer-events: auto`, `cursor: row-resize` and `opacity: 1` on `:hover`, so it
 * lights up for a feature that is off AND it swallows the click on the header underneath it,
 * because the core resolves the cell from `event.target`. The guide is inert by comparison
 * (`display: none` without `active`), so only its attachment is observable.
 *
 * Every teardown assertion here is `toHaveCount(0)` or a behavioral read, never a visibility
 * matcher: the guide is already `display: none` and the handle has a real box at `opacity: 0`,
 * which Playwright reports as visible, so neither matcher can tell attached-but-inert from
 * detached and both would be green on the unfixed code. `toBeHidden()` appears once, on the
 * guide, and there it states the inertness rather than the teardown.
 */
test.describe('Manual resize handle and guide teardown', () => {
  let grid: ManualResizeTeardownPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ManualResizeTeardownPage(page, theme, bundle);
    await grid.goto();
  });

  test('detaches the row handle when the plugin is turned off', async () => {
    await grid.hoverRowHeader(2);
    await expect(grid.rowHandle).toHaveCount(1);

    // The pointer is parked before the option changes, so the browser cannot send a fresh
    // "mouseover" that re-reveals the handle from under the cursor.
    await grid.parkPointer();
    await grid.setResizeOption('manualRowResize', false);

    await expect(grid.rowHandle).toHaveCount(0);
  });

  test('detaches the column handle when the plugin is turned off', async () => {
    await grid.hoverColumnHeader(2);
    await expect(grid.columnHandle).toHaveCount(1);

    await grid.parkPointer();
    await grid.setResizeOption('manualColumnResize', false);

    await expect(grid.columnHandle).toHaveCount(0);
  });

  test('detaches both row elements when the plugin is turned off after a drag', async () => {
    // A drag is what attaches the guide, so this is the only way to reach a teardown that has both
    // elements to detach.
    await grid.dragRowHandle(2, 30);
    await expect(grid.rowHandle).toHaveCount(1);

    await grid.parkPointer();
    await grid.setResizeOption('manualRowResize', false);

    await expect(grid.rowHandle).toHaveCount(0);
    await expect(grid.rowGuide).toHaveCount(0);
  });

  test('detaches both column elements when the plugin is turned off after a drag', async () => {
    await grid.dragColumnHandle(2, 40);
    await expect(grid.columnHandle).toHaveCount(1);

    await grid.parkPointer();
    await grid.setResizeOption('manualColumnResize', false);

    await expect(grid.columnHandle).toHaveCount(0);
    await expect(grid.columnGuide).toHaveCount(0);
  });

  test('stops the orphaned row handle from swallowing the header click', async ({ page }) => {
    await grid.hoverRowHeader(2);

    // The handle's own box, read while it still exists. Clicking the header's centre instead would
    // miss it - the handle is a 10px band on the header's bottom edge, and the header's height is
    // theme-dependent - so the test would be green on the unfixed code.
    const box = await grid.rowHandle.boundingBox();

    expect(box).not.toBeNull();

    await grid.parkPointer();
    await grid.setResizeOption('manualRowResize', false);

    await page.mouse.click(box!.x + (box!.width / 2), box!.y + (box!.height / 2));

    // Row 2 selected through its header. On the unfixed code the orphan is the click's target, the
    // core resolves no cell from it, and nothing is selected at all.
    await expect.poll(() => grid.selectedRange()).toEqual([[2, -1, 2, 4]]);
  });

  test('keeps both row elements attached while the plugin stays on', async () => {
    await grid.dragRowHandle(2, 30);

    // Deliberately unchanged by this fix. A completed drag is not a teardown: the handle is
    // re-positioned on the header the pointer is still over, and the guide is inert once its
    // `active` class is gone (`display: none`), so detaching either at "mouseup" would only cost -
    // `setupHandlePosition()` early-returns on the second "mouseup" of a double-click, which would
    // flicker the handle out for the 500ms until `afterMouseDownTimeout()` restores it. The
    // teardown tests above are what prove neither element outlives the plugin.
    await expect(grid.rowHandle).toHaveCount(1);
    await expect(grid.rowGuide).toHaveCount(1);
    await expect(grid.rowGuide).toBeHidden();
  });

  test('keeps both column elements attached while the plugin stays on', async () => {
    await grid.dragColumnHandle(2, 40);

    await expect(grid.columnHandle).toHaveCount(1);
    await expect(grid.columnGuide).toHaveCount(1);
    await expect(grid.columnGuide).toBeHidden();
  });

  test('keeps resizing after the plugin is turned off and on again', async () => {
    const startHeight = await grid.renderedRowHeight(2);

    await grid.parkPointer();
    await grid.setResizeOption('manualRowResize', false);
    await expect(grid.rowHandle).toHaveCount(0);

    await grid.setResizeOption('manualRowResize', true);

    // The handle is gone until the next "mouseover", which is what `hoverRowHeader` produces. If the
    // teardown detached something the re-initialization cannot restore, it never comes back.
    await grid.dragRowHandle(2, 30);

    await expect.poll(() => grid.renderedRowHeight(2)).toBeGreaterThan(startHeight + 20);
  });

  test('keeps the row handle attached through a double-click autoresize', async () => {
    await grid.hoverRowHeader(2);

    const box = await grid.rowHandle.boundingBox();

    expect(box).not.toBeNull();

    // `setupHandlePosition()` early-returns on the second "mouseup" of a double-click
    // (`shouldSkipResizeHandlePositioning` rejects a click count above one), so a teardown wired
    // into `hideHandleAndGuide()` would leave the handle detached until the 500ms autoresize
    // timeout put it back. It must stay attached the whole time.
    await grid.rowHandle.dblclick();

    await expect(grid.rowHandle).toHaveCount(1);
    // Past the 500ms `afterMouseDownTimeout`, which re-runs the positioning.
    await expect.poll(
      () => grid.rowHandle.count(), { timeout: 3000 }
    ).toBe(1);
  });

  test('leaves nothing of its own in the container after destroy', async () => {
    await grid.hoverRowHeader(2);
    await expect(grid.rowHandle).toHaveCount(1);

    await grid.parkPointer();
    await grid.destroyGrid();

    await expect(grid.rowHandle).toHaveCount(0);
    await expect(grid.columnHandle).toHaveCount(0);
    await expect(grid.grid.locator('*')).toHaveCount(0);
  });
});
