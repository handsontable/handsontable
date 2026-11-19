import { test, expect, THEMES_TAG } from '../fixtures/test';
import { ManualMoveTrimmedPage } from '../fixtures/pages/ManualMoveTrimmedPage';

/**
 * A drop that changes nothing must leave the order of the index mapper as it is. With a trimmed index next
 * to the moved one, the mapper used to put the moved row or column on the far side of the trimmed index, so
 * showing the trimmed index again revealed an order nobody asked for. The hooks still fire for such a drop.
 */
test.describe('a move that changes nothing, next to a trimmed index', { tag: THEMES_TAG }, () => {
  let grid: ManualMoveTrimmedPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ManualMoveTrimmedPage(page, theme, bundle);
    await grid.goto();
  });

  test('keeps the order of the rows when a grabbed row header is released in place', async () => {
    await grid.untrimRowsAfterRowMove();
    await grid.grabRowHeaderAndRelease(0);

    // The row hook untrims physical row 1 once the release has been handled.
    await expect.poll(() => grid.latestHookCall('afterRowMove')).toMatchObject({
      movePossible: true,
      orderChanged: false,
    });
    await expect(grid.firstColumnTexts()).toHaveText(['r0c0', 'r1c0', 'r2c0', 'r3c0', 'r4c0', 'r5c0']);
  });

  test('fires beforeRowMove for the release even though the order does not change', async () => {
    await grid.grabRowHeaderAndRelease(0);

    await expect.poll(() => grid.latestHookCall('beforeRowMove')).toMatchObject({ movePossible: true });
  });

  test('keeps the order of the columns when a grabbed column header is released in place', async () => {
    await grid.grabColumnHeaderAndRelease(0);

    await expect.poll(() => grid.latestHookCall('afterColumnMove')).toMatchObject({
      movePossible: true,
      orderChanged: false,
    });

    await grid.untrimColumns();

    await expect(grid.firstRowTexts()).toHaveText(['r0c0', 'r0c1', 'r0c2', 'r0c3', 'r0c4', 'r0c5']);
    expect(await grid.columnSequence()).toEqual([0, 1, 2, 3, 4, 5]);
  });
});
