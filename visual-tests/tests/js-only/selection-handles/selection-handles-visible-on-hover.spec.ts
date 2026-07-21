import { test, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

/**
 * Verifies that four edge-adjustment handles are visible when hovering over a
 * cell inside the pre-selected range with `selectionHandles: true`.
 */
test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/selection-handles-demo')
      .getFullUrl()
  );

  // The demo pre-selects rows 2-5, cols 2-4. Hover cell (3, 3) – an interior
  // cell – to trigger the mouseover that reveals the four edge handles.
  const cell = await selectCell(3, 3);

  // Wait for the cell to be visible before hovering to ensure Walkontable is
  // fully rendered and its event listeners are in place.
  await cell.waitFor({ state: 'visible' });

  // Use explicit mouse.move() with cell coordinates to guarantee the browser
  // fires a native mouseover event that Walkontable's TABLE-level listener
  // can intercept.
  const cellBox = await cell.boundingBox();

  await tablePage.mouse.move(
    cellBox!.x + (cellBox!.width / 2),
    cellBox!.y + (cellBox!.height / 2)
  );

  // The four edge-adjustment handles are rendered only on the master overlay (.ht_master).
  // Clone overlays (top, inline_start, etc.) also instantiate Border objects but call
  // disappear() early because their viewport clips the selection to zero visible cells.
  // Exactly one handle per edge type has display:block at any given time — the one
  // owned by the master Border that ran positionAdjustHandles(). Exclude the
  // display:none siblings with :not([style*="display: none"]) to avoid strict-mode
  // failures from the multiple-match set.
  const masterSelector = '.ht_master';

  // Self-verifying assertion: the adjustment handles must be visible in the DOM
  // before the screenshot is taken. If the feature is absent (e.g. a stale build
  // or wrong package version is served), this fails loudly instead of silently
  // baselining a plain selection without handles.
  await expect(tablePage.locator(
    `${masterSelector} .wtSelectionHandle.wtSelectionHandle--top:not([style*="display: none"])`
  )).toBeVisible();
  await expect(tablePage.locator(
    `${masterSelector} .wtSelectionHandle.wtSelectionHandle--bottom:not([style*="display: none"])`
  )).toBeVisible();
  await expect(tablePage.locator(
    `${masterSelector} .wtSelectionHandle.wtSelectionHandle--start:not([style*="display: none"])`
  )).toBeVisible();
  await expect(tablePage.locator(
    `${masterSelector} .wtSelectionHandle.wtSelectionHandle--end:not([style*="display: none"])`
  )).toBeVisible();

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
