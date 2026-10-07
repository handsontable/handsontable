import { test, expect } from '../fixtures/test';
import { FreezeBarPage } from '../fixtures/pages/FreezeBarPage';

test.use({ hasTouch: true });

/**
 * The freeze bar on a touch device: a finger drag changes the count, and the grid does not scroll under it.
 */
test.describe('freezeBar with a finger', () => {
  test('dragging the column bar changes the count and does not scroll the grid', async({ page, theme, bundle }) => {
    const grid = new FreezeBarPage(page, theme, bundle);

    await grid.goto();

    const { before, after } = await grid.touchDrag('start', 4);

    expect(await grid.count('start')).toBe(4);
    expect(after).toEqual(before);
    expect(grid.pageErrors).toEqual([]);
  });

  test('dragging the row bar changes the count and does not scroll the grid', async({ page, theme, bundle }) => {
    const grid = new FreezeBarPage(page, theme, bundle);

    await grid.goto();

    const { before, after } = await grid.touchDrag('top', 4);

    expect(await grid.count('top')).toBe(4);
    expect(after).toEqual(before);
    expect(grid.pageErrors).toEqual([]);
  });
});
