import { devices } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import { DragToScrollPage } from '../fixtures/pages/mobile/DragToScrollPage';

/**
 * Regression spec for issue #11658: on a phone, dragging a selection handle to the edge of the grid
 * did not scroll the viewport, so the selection stopped growing at the last cell on screen.
 *
 * DragToScroll bound `mousemove` only. A browser fires no `mousemove` while a finger is down, so the
 * auto-scroller never received a position on mobile. The mobile selection handles, the only drag
 * path a phone has, also never told DragToScroll that a drag had started.
 *
 * The whole spec runs with iPhone emulation (touch + mobile user agent) because Handsontable creates
 * the mobile handles only when it detects a mobile browser at grid construction time.
 *
 * The assertions are about progress made while the finger rests past the edge, never about a single
 * offset being non-zero: extending a selection onto a partially visible row or column scrolls it
 * into view all on its own, so `scrollTop > 0` can be satisfied with the auto-scroller dead. Only a
 * running timer keeps moving the viewport after the finger stops.
 */
test.use({
  ...devices['iPhone 13'],
  browserName: 'chromium',
});

test.describe('mobile drag to scroll', () => {
  let mobileGrid: DragToScrollPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    mobileGrid = new DragToScrollPage(page, theme, bundle);
    await mobileGrid.goto();
    await mobileGrid.tapCell(2, 1);
  });

  test.afterEach(async () => {
    await mobileGrid.endDrag();
  });

  test('scrolls down while a selection handle rests past the bottom edge', async () => {
    expect(await mobileGrid.scrollOffsets()).toEqual({ top: 0, left: 0 });

    await mobileGrid.dragHandlePastEdge('bottom');

    // Before the fix this never moved off zero, however long the finger stayed there.
    await expect.poll(async () => (await mobileGrid.scrollOffsets()).top).toBeGreaterThan(0);

    const settled = (await mobileGrid.scrollOffsets()).top;
    const [row] = await mobileGrid.selectionEnd();

    // The viewport keeps travelling, and the selection keeps up with it.
    await expect.poll(async () => (await mobileGrid.scrollOffsets()).top).toBeGreaterThan(settled);
    await expect.poll(async () => (await mobileGrid.selectionEnd())[0]).toBeGreaterThan(row);
  });

  test('scrolls right while a selection handle rests past the right edge', async () => {
    await mobileGrid.dragHandlePastEdge('right');

    const settled = (await mobileGrid.scrollOffsets()).left;
    const [, col] = await mobileGrid.selectionEnd();

    await expect.poll(async () => (await mobileGrid.scrollOffsets()).left).toBeGreaterThan(settled);
    await expect.poll(async () => (await mobileGrid.selectionEnd())[1]).toBeGreaterThan(col);
  });

  test('arms the auto-scroller only for a drag that starts on a handle', async ({ page }) => {
    const isListening = () => page.evaluate(() => window.hot.getPlugin('dragToScroll').isListening());
    const isDragged = () =>
      page.evaluate(() => window.hot.getPlugin('multipleSelectionHandles').isDragged());

    // Tapping a cell, as `beforeEach` did, grabs no handle - so the mobile drag path is not engaged.
    // (`isListening()` is not the check here: tapping a cell arms the plugin through Walkontable's
    // deferred mousedown, which belongs to the mouse path and ends on `mouseup`.)
    expect(await isDragged()).toBe(false);

    await mobileGrid.dragHandlePastEdge('bottom');

    expect(await isDragged()).toBe(true);
    expect(await isListening()).toBe(true);

    await mobileGrid.endDrag();

    // Lifting the finger must stop the timers; otherwise the grid would keep scrolling on its own.
    expect(await isDragged()).toBe(false);
    expect(await isListening()).toBe(false);
  });

  test('comes to a stop instead of running away when dragToScroll is off', async () => {
    await mobileGrid.rebuildWith({ dragToScroll: false });
    await mobileGrid.tapCell(2, 1);

    await mobileGrid.dragHandlePastEdge('bottom');
    await mobileGrid.waitForSelectionToSettle();

    const settled = await mobileGrid.scrollOffsets();

    // Extending the selection scrolls its target into view even with auto-scroll off, so the
    // viewport can move by about a row. What must never happen is that feeding back through
    // `afterScroll` and marching the grid to the end of the data: the target is resolved against the
    // current viewport and de-duplicated on coordinates, so it reaches a fixed point. Hold the
    // finger longer and nothing more may move.
    await mobileGrid.waitForSelectionToSettle();

    expect(await mobileGrid.scrollOffsets()).toEqual(settled);
    expect(settled.top).toBeLessThan(await mobileGrid.maxScrollTop() / 10);
  });

  test('does not scroll when the handle is dragged to a cell that is already on screen', async () => {
    await mobileGrid.dragHandleToCell(6, 2);

    // The selection still follows the finger - the drag itself works.
    expect(await mobileGrid.selectionEnd()).toEqual([6, 2]);

    // And nothing scrolled. The first scroll tick fires synchronously from the `touchmove` that
    // starts the timer, so a wrongly armed auto-scroller would already have moved the viewport by
    // the time the drag call returns - this needs no waiting to be a real check.
    expect(await mobileGrid.scrollOffsets()).toEqual({ top: 0, left: 0 });
  });
});
