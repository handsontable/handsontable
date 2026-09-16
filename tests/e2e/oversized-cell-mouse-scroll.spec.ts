import { test, expect } from '../fixtures/test';
import { OversizedCellMouseScrollPage } from '../fixtures/pages/OversizedCellMouseScrollPage';

/**
 * DEV-1159: mouse-selecting a cell larger than the viewport must start-snap
 * the same way as API selection. Overlay `scrollTo` already start-snaps;
 * native `scrollIntoView` then runs and can leave a header-sized remainder,
 * so the spec compares mouse scroll to API scroll rather than requiring 0.
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

  test('mouse-selecting an oversized column start-snaps like the API', async () => {
    await grid.scrollUntilCellStartClipped(200, 0, 0, 0);

    const clippedLeft = (await grid.holderScroll()).left;

    await grid.selectCellByApi(0, 0);
    await expect.poll(async () => (await grid.holderScroll()).left).toBeLessThan(clippedLeft);

    const apiLeft = (await grid.holderScroll()).left;

    await grid.goto();
    await grid.scrollUntilCellStartClipped(200, 0, 0, 0);
    await grid.clickVisiblePart(0, 0);

    await expect.poll(async () => (await grid.holderScroll()).left).toBe(apiLeft);
  });

  test('mouse-selecting an oversized row start-snaps like the API', async () => {
    await grid.scrollUntilCellStartClipped(0, 150, 0, 0);

    const clippedTop = (await grid.holderScroll()).top;

    await grid.selectCellByApi(0, 0);
    await expect.poll(async () => (await grid.holderScroll()).top).toBeLessThan(clippedTop);

    const apiTop = (await grid.holderScroll()).top;

    await grid.goto();
    await grid.scrollUntilCellStartClipped(0, 150, 0, 0);
    await grid.clickVisiblePart(0, 0);

    await expect.poll(async () => (await grid.holderScroll()).top).toBe(apiTop);
  });
});
