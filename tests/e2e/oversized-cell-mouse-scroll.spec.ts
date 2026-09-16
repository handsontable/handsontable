import { test, expect } from '../fixtures/test';
import { OversizedCellMouseScrollPage } from '../fixtures/pages/OversizedCellMouseScrollPage';

/**
 * DEV-1159: mouse-selecting a cell larger than the viewport must start-snap
 * so the start of the cell is visible, matching keyboard and API selection.
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

    expect((await grid.cellClip(0, 0)).startClippedInline).toBe(true);

    await grid.clickVisiblePart(0, 0);

    await expect.poll(async () => (await grid.cellClip(0, 0)).startClippedInline).toBe(false);
  });

  test('mouse-selecting an oversized row start-snaps the clipped start into view', async () => {
    await grid.scrollUntilCellStartClipped(0, 150, 0, 0);

    expect((await grid.cellClip(0, 0)).startClippedBlock).toBe(true);

    await grid.clickVisiblePart(0, 0);

    await expect.poll(async () => (await grid.cellClip(0, 0)).startClippedBlock).toBe(false);
  });
});
