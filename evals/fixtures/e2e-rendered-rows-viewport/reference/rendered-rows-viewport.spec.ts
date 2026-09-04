import { test, expect } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

const TALL_DATA = Array.from({ length: 200 }, (_, row) => [`R${row + 1}C1`, `R${row + 1}C2`, `R${row + 1}C3`]);

test.describe('virtual rendering window', () => {
  let grid: SelectionFeaturesPage;

  test.beforeEach(async ({ page, theme }) => {
    grid = new SelectionFeaturesPage(page, theme);
    await grid.goto();
    // A pinned viewport: the rendered-row count is now a function of this height
    // and the theme's row height — not of whatever size the page layout gives the grid.
    await grid.initGrid({ data: TALL_DATA, width: 400, height: 200 });
  });

  test('renders only the rows that fit the pinned viewport plus the offset, not the whole dataset', async ({ page }) => {
    const renderedRows = page.locator('.ht_master .htCore tbody tr:visible');

    // 200 data rows behind a 200px viewport: even the tallest theme fits fewer than a dozen, and
    // the rendering offset adds a handful per side. The bound holds on every theme leg.
    await expect(renderedRows).not.toHaveCount(TALL_DATA.length);
    expect(await renderedRows.count()).toBeLessThan(40);
  });

  test('keeps the rendered window the same size after scrolling deep into the data', async ({ page }) => {
    const renderedRows = page.locator('.ht_master .htCore tbody tr:visible');
    const before = await renderedRows.count();

    await page.locator('.ht_master .wtHolder').hover();
    await page.mouse.wheel(0, 3000);

    // The window moved, it did not grow: the same count, now starting deep in the data.
    await expect(renderedRows).toHaveCount(before);
    await expect(page.getByText('R1C1', { exact: true })).toHaveCount(0);
  });
});
