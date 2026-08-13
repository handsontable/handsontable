import { test, expect } from '../fixtures/test';
import { GridPage } from '../fixtures/pages/GridPage';

/**
 * Reference functional E2E spec. Demonstrates the conventions the authoring
 * skill teaches: a page object holds the selectors and interactions, cells are
 * addressed by stable test id, and every wait is a web-first assertion — no
 * fixed sleeps. Runs under every theme via the per-theme projects.
 */
test.describe('grid demo', () => {
  let grid: GridPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new GridPage(page, theme, bundle);
    await grid.goto();
  });

  test('renders the seeded data', async () => {
    await grid.expectCell(0, 0, 'A1');
    await grid.expectCell(1, 1, 'B2');
    await grid.expectCell(4, 2, 'C5');
  });

  test('edits a cell through the editor', async () => {
    await grid.editCell(0, 0, 'edited');
    await grid.expectCell(0, 0, 'edited');
  });

  test('adds a row', async () => {
    const before = await grid.rowCount();
    await grid.addRowButton.click();
    await expect(grid.rowLocator()).toHaveCount(before + 1);
  });
});
