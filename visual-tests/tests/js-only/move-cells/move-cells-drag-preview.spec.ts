import { test, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

/**
 * Verifies that a dashed source border and a `.wtMoveGhost` preview rectangle
 * are rendered during a `moveCells` drag (mouse button held down mid-drag).
 *
 * The demo pre-selects rows 2–4, cols 2–4 with `moveCells: true`, making the
 * four `.wtMoveZone` edge bands immediately visible on the selection border.
 * The test initiates a drag by pressing down on the top-edge zone band, moves
 * the mouse over an interior target cell while the button is held, asserts the
 * ghost is visible, takes a screenshot, then releases the button.
 */
test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/move-cells-demo')
      .getFullUrl()
  );

  // Find a visible move zone element on the master overlay.
  // Each selected range produces four `.wtMoveZone` bands (top/bottom/start/end).
  // Only the master overlay's bands have a non-none display — clone overlays
  // hide their bands because the viewport clips the selection to zero cells.
  const masterContainer = tablePage.locator('.ht_master');
  const moveZones = masterContainer.locator('.wtMoveZone');

  // Wait until at least one zone is visible (rendered after selectCells resolves).
  await expect(moveZones.first()).toBeAttached();

  // Locate the first visible move zone band to grab its bounding box.
  // We use page.evaluate() to find the first non-hidden element since Playwright
  // locator.all() may include display:none siblings from clone overlays.
  const zoneBounds = await tablePage.evaluate(() => {
    const all = document.querySelectorAll<HTMLElement>('.ht_master .wtMoveZone');
    const visible = Array.from(all).find(el => el.style.display !== 'none');

    if (!visible) {
      return null;
    }

    const rect = visible.getBoundingClientRect();

    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });

  expect(zoneBounds).not.toBeNull();

  // Press the mouse down on the centre of the move zone to start the drag.
  await tablePage.mouse.move(
    zoneBounds!.x + zoneBounds!.width / 2,
    zoneBounds!.y + zoneBounds!.height / 2
  );
  await tablePage.mouse.down();

  // Move the mouse to a target cell well away from the source range (row 7, col 6).
  // The cell's coordinates are read via getBoundingClientRect so the position is
  // viewport-relative — matching the clientX/clientY the browser fires on mousemove.
  const targetBounds = await tablePage.evaluate(() => {
    // Row 7, col 6: tbody tr:nth-child(8) td:nth-child(7) (1-indexed; no row-header offset
    // because querySelector counts all td elements — use nth-of-type instead).
    const trs = document.querySelectorAll<HTMLTableRowElement>('.ht_master tbody tr');
    const tr = trs[6]; // 0-indexed → row 7
    const td = tr?.querySelectorAll<HTMLTableCellElement>('td')[5]; // col 6 (0-indexed)

    if (!td) {
      return null;
    }

    const rect = td.getBoundingClientRect();

    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });

  expect(targetBounds).not.toBeNull();

  await tablePage.mouse.move(
    targetBounds!.x + targetBounds!.width / 2,
    targetBounds!.y + targetBounds!.height / 2
  );

  // Self-verifying assertion: the ghost element must be present and visible
  // (display: block) while the mouse button is still held down. If the
  // moveCells feature is absent or the stale build is served this fails loudly
  // instead of silently baselining a plain selection without a ghost.
  const ghost = tablePage.locator('.wtMoveGhost');

  await expect(ghost).toBeAttached();
  await expect(ghost).toBeVisible();

  // Capture the mid-drag state: dashed source border + ghost preview rectangle.
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  // Release the mouse to end the drag.
  await tablePage.mouse.up();
});
