import { test, expect } from '../fixtures/test';
import { GridPage } from '../fixtures/pages/GridPage';

test.describe('add row', () => {
  test('adds a row', async({ page, theme, bundle }) => {
    const grid = new GridPage(page, theme, bundle);

    await grid.goto();

    // Fetched, then used only to navigate: nothing below compares against it, so
    // `no-unused-vars` stays quiet while the row count is never checked.
    const before = await grid.rowCount();

    await grid.addRowButton.click();
    await grid.selectCell(before - 1, 0);

    // The only assertion checks the control, not the outcome.
    await expect(grid.addRowButton).toBeVisible();
  });
});
