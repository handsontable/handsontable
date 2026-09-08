import { test, expect } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

const TALL_DATA = Array.from({ length: 200 }, (_, row) => [`R${row + 1}C1`, `R${row + 1}C2`, `R${row + 1}C3`]);

test.describe('virtual rendering window', () => {
  let grid: SelectionFeaturesPage;

  test.beforeEach(async ({ page, theme }) => {
    grid = new SelectionFeaturesPage(page, theme);
    await grid.goto();
    // No width/height: the grid takes the page layout's size, and the rendered row count becomes
    // whatever this theme's row height happens to yield.
    await grid.initGrid({ data: TALL_DATA });
  });

  test('renders 27 rows', async ({ page }) => {
    // A literal observed on ONE theme — a different number on the other two legs of the matrix.
    await expect(page.locator('.ht_master .htCore tbody tr:visible')).toHaveCount(27);
  });
});
