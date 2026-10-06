import { visualTest, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

/**
 * Checks how a `moveCells` drag looks while the button is held: the dashed source border and the
 * `.wtMoveGhost` preview rectangle over the cell the pointer is on. The demo pre-selects rows 2–4, cols
 * 2–4 with `moveCells: true`, so the four `.wtMoveZone` edge bands are on the selection border; the drag
 * starts on the first visible band in DOM order and moves over (7, 6), outside the source range, and the
 * ghost is asserted visible before the capture. The move affordances hiding during the drag, the ghost's
 * count and its position beyond the viewport are asserted in `tests/e2e/move-zone.spec.ts`; the ghost's
 * colors are what only pixels prove, and `main` and `main-dark` cover them. Added in #13076; owned by
 * DEV-3285.
 */
visualTest(__filename, {
  themes: ['main', 'main-dark'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
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
    // eslint-disable-next-line no-restricted-globals
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
    zoneBounds!.x + (zoneBounds!.width / 2),
    zoneBounds!.y + (zoneBounds!.height / 2)
  );
  await tablePage.mouse.down();

  // Move the mouse to a target cell well away from the source range (row 7, col 6).
  // The cell's coordinates are read via getBoundingClientRect so the position is
  // viewport-relative — matching the clientX/clientY the browser fires on mousemove.
  const targetBounds = await tablePage.evaluate(() => {
    // Row 7, col 6: tbody tr:nth-child(8) td:nth-child(7) (1-indexed; no row-header offset
    // because querySelector counts all td elements — use nth-of-type instead).
    // eslint-disable-next-line no-restricted-globals
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
    targetBounds!.x + (targetBounds!.width / 2),
    targetBounds!.y + (targetBounds!.height / 2)
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
