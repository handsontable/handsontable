import { test, expect } from '../fixtures/test';
import { OversizedCellMouseScrollPage } from '../fixtures/pages/OversizedCellMouseScrollPage';

/**
 * DEV-1159: mouse-selecting a cell larger than the viewport must start-snap
 * so the clipped start moves into view. Overlay `scrollTo` already start-snaps
 * for keyboard/API; this spec is the mouse path. Native `scrollIntoView` can
 * leave a header-sized remainder, so the assertion is "scrolled well toward
 * the start", not an exact 0.
 *
 * Playwright's locator click would scroll the cell into view first and hide
 * the bug, so the page object clicks the already-visible intersection.
 */
test.describe('oversized cell mouse scroll', () => {
  let grid: OversizedCellMouseScrollPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new OversizedCellMouseScrollPage(page, theme, bundle);
    await grid.goto();
  });

  test('mouse-selecting an oversized column start-snaps the clipped start into view', async () => {
    await grid.scrollUntilCellStartClipped(200, 0, 0, 0);

    const clippedLeft = (await grid.holderScroll()).left;

    expect(clippedLeft).toBeGreaterThan(0);

    await grid.clickVisiblePart(0, 0);

    await expect.poll(async () => (await grid.holderScroll()).left).toBeLessThan(clippedLeft / 2);
  });

  test('mouse-selecting an oversized row start-snaps the clipped start into view', async () => {
    await grid.scrollUntilCellStartClipped(0, 150, 0, 0);

    const clippedTop = (await grid.holderScroll()).top;

    expect(clippedTop).toBeGreaterThan(0);

    await grid.clickVisiblePart(0, 0);

    await expect.poll(async () => (await grid.holderScroll()).top).toBeLessThan(clippedTop / 2);
  });

  test('last-partial row skip stays when only the column is oversized', async () => {
    await grid.goto('oversized-col');
    await grid.scrollUntilCellStartClipped(200, 0, 0, 0);

    const lastPartialRow = await grid.lastPartiallyVisibleRow();
    const before = await grid.holderScroll();

    expect(lastPartialRow).toBeGreaterThan(0);
    expect(before.left).toBeGreaterThan(0);

    await grid.clickVisiblePart(lastPartialRow, 0);

    await expect.poll(async () => (await grid.holderScroll()).left).toBeLessThan(before.left / 2);
    await expect.poll(async () => (await grid.holderScroll()).top).toBe(before.top);
  });

  test('last-partial column skip stays when only the row is oversized', async () => {
    await grid.goto('oversized-row');
    await grid.scrollUntilCellStartClipped(0, 150, 0, 0);

    const lastPartialCol = await grid.lastPartiallyVisibleColumn();
    const before = await grid.holderScroll();

    expect(lastPartialCol).toBeGreaterThan(0);
    expect(before.top).toBeGreaterThan(0);

    await grid.clickVisiblePart(0, lastPartialCol);

    await expect.poll(async () => (await grid.holderScroll()).top).toBeLessThan(before.top / 2);
    await expect.poll(async () => (await grid.holderScroll()).left).toBe(before.left);
  });

  test('mouse-selecting a content-tall row without rowHeights start-snaps the clipped start', async () => {
    await grid.goto('content-tall');

    expect(await grid.settingsRowHeight(0)).toBeUndefined();

    await grid.scrollUntilCellStartClipped(0, 150, 0, 0);

    const clippedTop = (await grid.holderScroll()).top;

    expect(clippedTop).toBeGreaterThan(0);

    await grid.clickVisiblePart(0, 0);

    await expect.poll(async () => (await grid.holderScroll()).top).toBeLessThan(clippedTop / 2);
  });
});
