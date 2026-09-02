import { test, expect } from '../fixtures/test';
import { GridPage } from '../fixtures/pages/GridPage';

test.describe('add row', () => {
  test('renders one more row after the click, and the new last row is empty', async({ page, theme, bundle }) => {
    const grid = new GridPage(page, theme, bundle);

    await grid.goto();

    const before = await grid.rowCount();

    await grid.addRowButton.click();

    // Anchored to the observed count — not to a literal that matches the fixture today.
    await expect(grid.rowLocator()).toHaveCount(before + 1);
    await grid.expectCell(before, 0, '');
  });
});
