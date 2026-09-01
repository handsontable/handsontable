import { test, expect } from '../fixtures/test';
import { ManualResizeContextMenuPage } from '../fixtures/pages/ManualResizeContextMenuPage';

/**
 * DEV-2708 (Sentry DEMOS-2W / DEMOS-19). `ManualRowResize` and `ManualColumnResize` detach both
 * their handle and their guide from the root element when a "contextmenu" lands on the handle, but
 * the two elements are attached at different moments: the handle on `mouseover` over a header, the
 * guide only once a `mousedown` over the handle reaches the plugin's own root-element listener.
 * A context menu opened over a handle that was merely hovered therefore detached a guide that had
 * never been attached, and `removeChild` threw
 * "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node"
 * out of the handler.
 *
 * A plain desktop right-click never hit it, because its own `mousedown` attaches the guide first -
 * which is exactly what the legacy spec simulates. Two paths do reach the handler with no
 * `mousedown` handled: host-page code that stops `mousedown` from reaching the grid (an overlay, a
 * drag library, a sandboxed editor), and a synthetic event. Both are covered here, for both
 * plugins.
 *
 * The assertion is the absence of an UNCAUGHT page error, and it has to be: an exception raised
 * inside a listener never reaches whoever dispatched the event, so a `not.toThrow()` around the
 * event would be green on the unfixed code.
 */
test.describe('Manual resize handle and the context menu', () => {
  let grid: ManualResizeContextMenuPage;
  let pageErrors: string[];

  test.beforeEach(async ({ page, theme, bundle }) => {
    pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    grid = new ManualResizeContextMenuPage(page, theme, bundle);
    await grid.goto();
  });

  // Checked after the whole body rather than inline, so the tail of every test is covered too - the
  // re-hover the first two tests end on, and the 500 ms autoresize timeout the drag tests leave
  // armed.
  test.afterEach(async () => {
    expect(pageErrors).toEqual([]);
  });

  test('survives a synthetic context menu over a hovered row handle', async () => {
    await grid.hoverRowHeader(2);

    // The premise of the defect: the guide the handler also detaches is not in the DOM at all.
    await expect(grid.rowGuide).toHaveCount(0);

    // Whether the hovered header's center clears the handle is theme-dependent geometry, so the
    // pointer is parked rather than measured - the assertions below must not rest on it.
    await grid.parkPointer();
    await grid.dispatchContextMenu(grid.rowHandle);

    // The handler detaches the handle, so its disappearance is the observable end of the gesture.
    await expect(grid.rowHandle).toHaveCount(0);

    // The handler suppresses the "mouseover" that a context menu triggers right after it, and clears
    // that flag in a microtask. A later hover must therefore bring the handle back.
    await grid.hoverRowHeader(2);
    await expect(grid.rowHandle).toHaveCount(1);
  });

  test('survives a synthetic context menu over a hovered column handle', async () => {
    await grid.hoverColumnHeader(2);

    await expect(grid.columnGuide).toHaveCount(0);

    await grid.parkPointer();
    await grid.dispatchContextMenu(grid.columnHandle);

    await expect(grid.columnHandle).toHaveCount(0);

    await grid.hoverColumnHeader(2);
    await expect(grid.columnHandle).toHaveCount(1);
  });

  test('survives a right-click on a row handle when the host page swallows mousedown', async () => {
    await grid.swallowMousedown();
    await grid.hoverRowHeader(2);

    await grid.rightClick(grid.rowHandle);

    // With the `mousedown` swallowed the guide was never attached, which is what used to throw.
    // Whether the handle stays detached afterwards is not asserted: the right-click leaves the
    // pointer ON the handle, so detaching it changes the element under the cursor and the browser
    // sends a fresh "mouseover" that re-reveals it. Whether that lands before or after the
    // suppression microtask is up to the browser, and no native menu covers the grid here.
    await expect(grid.rowGuide).toHaveCount(0);
    // The absence of an error is the only discriminator on this path, so the gesture has to be shown
    // to have produced a "contextmenu" at all. Without this the test could stay green covering
    // nothing.
    await expect.poll(() => grid.contextMenuEventCount()).toBeGreaterThan(0);
  });

  test('survives a right-click on a column handle when the host page swallows mousedown', async () => {
    await grid.swallowMousedown();
    await grid.hoverColumnHeader(2);

    await grid.rightClick(grid.columnHandle);

    await expect(grid.columnGuide).toHaveCount(0);
    await expect.poll(() => grid.contextMenuEventCount()).toBeGreaterThan(0);
  });

  test('keeps removing both row elements after a real resize drag has attached the guide', async () => {
    // A real drag, so the guide is attached the way the working path attaches it. The fix must not
    // stop the handler from detaching it. The drag helper waits for the handle, never for the guide,
    // so the count below is the test's premise rather than a repeated wait.
    await grid.dragRowHandle(2, 40);

    await expect(grid.rowGuide).toHaveCount(1);

    // The drag leaves the pointer on the handle, so park it before asserting the handle stays gone.
    await grid.parkPointer();
    await grid.dispatchContextMenu(grid.rowHandle);

    await expect(grid.rowHandle).toHaveCount(0);
    await expect(grid.rowGuide).toHaveCount(0);
  });

  test('keeps removing both column elements after a real resize drag has attached the guide', async () => {
    await grid.dragColumnHandle(2, 40);

    await expect(grid.columnGuide).toHaveCount(1);

    await grid.parkPointer();
    await grid.dispatchContextMenu(grid.columnHandle);

    await expect(grid.columnHandle).toHaveCount(0);
    await expect(grid.columnGuide).toHaveCount(0);
  });
});
