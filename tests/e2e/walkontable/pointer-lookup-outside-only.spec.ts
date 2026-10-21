import { test, expect, THEMES_TAG } from '../../fixtures/test';
import { MergeCellsDragOutsidePage } from '../../fixtures/pages/MergeCellsDragOutsidePage';

/**
 * A held drag runs the table's mouse handler on every pointer move, inside the grid too. The cell lookup walks
 * the rendered cells, so it must run only for a pointer that has left the grid: inside, the handler decides
 * from the bounds alone. The count is of the lookups themselves, with a pointer outside as the positive
 * control, so a lookup that stops being counted cannot leave the test green.
 */
test.describe('the pointer lookup of a held drag', { tag: THEMES_TAG }, () => {
  let grid: MergeCellsDragOutsidePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new MergeCellsDragOutsidePage(page, theme, bundle);
    await grid.goto('vertical');
  });

  test.afterEach(async() => {
    await grid?.release();
  });

  test('runs only while the pointer is outside the grid', async() => {
    await grid.dragWithin({ row: 9, col: 1 }, { row: 8, col: 2 });
    await grid.countLookups();

    await grid.moveTo({ row: 6, col: 3 });
    // The handler ran for the inside move: the selection follows the pointer to the cell under it.
    await expect.poll(() => grid.selected()).toEqual([9, 1, 6, 3]);
    expect(await grid.lookups()).toBe(0);

    await grid.moveOutRight(5);
    expect(await grid.lookups()).toBeGreaterThan(0);
  });
});
