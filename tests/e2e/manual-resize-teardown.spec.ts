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
 * Attachment is asserted with `toHaveCount`, never with a visibility matcher. Both matchers are
 * blind here: the guide is already `display: none`, and the handle has a real box at
 * `opacity: 0`, which Playwright reports as VISIBLE - so neither can tell attached-but-inert from
 * detached, and a spec built on either would be green on the unfixed code. `toBeHidden()` appears
 * once, on the guide, and there it states the inertness rather than the teardown.
 *
 * Six of the eleven tests are red on unfixed code: the four detach cases, the swallowed click, and
 * the plugin-level destroy. The other five are pins, and each says so where it could otherwise be
 * mistaken for coverage it does not provide.
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

    // Both counts are the test's PREMISE, not a repeated wait: `dragResizeHandle` waits for the
    // handle and never for the guide, so without this a drag that failed to reach `#onMouseDown`
    // on some leg of the matrix would leave the guide assertion below passing on nothing.
    await expect(grid.rowHandle).toHaveCount(1);
    await expect(grid.rowGuide).toHaveCount(1);

    await grid.parkPointer();
    await grid.setResizeOption('manualRowResize', false);

    await expect(grid.rowHandle).toHaveCount(0);
    await expect(grid.rowGuide).toHaveCount(0);
  });

  test('detaches both column elements when the plugin is turned off after a drag', async () => {
    await grid.dragColumnHandle(2, 40);

    await expect(grid.columnHandle).toHaveCount(1);
    await expect(grid.columnGuide).toHaveCount(1);

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

    // Biased to the top of the 10px band, not its centre. The handle is positioned at
    // `headerTop - 6 + headerHeight`, so its centre lands one pixel inside the header and a
    // theme's header height or a fractional device pixel ratio can round that onto the NEXT row,
    // which would select row 3 and fail for a reason that has nothing to do with the fix. The
    // whole band is the orphan's box, so any point in it is equally a hit on the orphan.
    await page.mouse.click(box!.x + (box!.width / 2), box!.y + 2);

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

    const boxBefore = await grid.rowHandle.boundingBox();

    expect(boxBefore).not.toBeNull();

    // `setupHandlePosition()` early-returns on the second "mouseup" of a double-click
    // (`shouldSkipResizeHandlePositioning` rejects a click count above one), so a teardown wired
    // into `hideHandleAndGuide()` would leave the handle detached until the 500ms autoresize
    // timeout put it back. It must stay attached the whole time.
    await grid.rowHandle.dblclick();

    await expect(grid.rowHandle).toHaveCount(1);

    // ...and still be attached once the 500ms `afterMouseDownTimeout` has run. Reaching that
    // boundary needs an observable that CANNOT be true before it: the timeout resets the click
    // count, and until it does, `shouldSkipResizeHandlePositioning()` makes every `mouseover`
    // early-return, so the handle cannot move off row 2. Polling the count alone would resolve on
    // its first evaluation and observe nothing. The autoresize is no use either - it sets the row
    // to `max(startHeight, renderedHeight)`, which single-line content leaves unchanged.
    await expect.poll(async () => {
      await grid.parkPointer();
      await grid.rowHeader(4).hover();

      const box = await grid.rowHandle.boundingBox();

      return box !== null && Math.abs(box.y - boxBefore!.y) > 2;
    }, { timeout: 5000 }).toBe(true);

    await expect(grid.rowHandle).toHaveCount(1);
  });

  test('detaches the handle when the plugin itself is destroyed', async () => {
    await grid.hoverRowHeader(2);
    await expect(grid.rowHandle).toHaveCount(1);

    await grid.parkPointer();
    // The plugin alone, with the grid left alive. A grid-level `destroy()` cannot observe the
    // plugin's `destroy()` at all - see the next test - so this is the only assertion that holds
    // the override to anything. Nothing may touch the grid after this call.
    await grid.destroyResizePlugin('manualRowResize');

    await expect(grid.rowHandle).toHaveCount(0);
  });

  test('leaves nothing in the container after the grid is destroyed', async () => {
    await grid.hoverRowHeader(2);
    await expect(grid.rowHandle).toHaveCount(1);

    await grid.parkPointer();
    await grid.destroyGrid();

    // A PIN, not a red-to-green case: `Core#destroy()` runs `empty(rootContainer)` BEFORE it
    // iterates the plugins, and the handle lives inside that container, so this passes with the
    // plugins' own `destroy()` override reverted. What it guards is that ordering - if the
    // container emptying ever moved after the plugin loop, the override would be the only thing
    // keeping the container clean, and this test would be the one to notice.
    await expect(grid.rowHandle).toHaveCount(0);
    await expect(grid.grid.locator('*')).toHaveCount(0);
  });
});
