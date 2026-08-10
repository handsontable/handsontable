import { test, expect } from '../fixtures/test';

/**
 * Functional coverage for the CustomBorders viewport working set. The border
 * DOM (`.wtBorder` divs) is created per overlay by the selection manager, so
 * the assertions target the overlay containers directly. Visible border
 * edges carry inline sizes; hidden ones are `display: none`, which the
 * `:visible` filter excludes.
 */
test.describe('CustomBorders with frozen rows and columns', () => {
  test.beforeEach(async ({ page, theme }) => {
    await page.goto(`/tests/fixtures/demo/custom-borders.html?theme=${theme}`);
    await expect(page.getByTestId('cell-0-2')).toBeVisible();
  });

  test('renders borders located in the frozen areas', async ({ page }) => {
    // (0,0) lives in every frozen overlay; (10,0) in inline-start; (0,10) in top.
    await expect(page.locator('.ht_clone_top_inline_start_corner .wtBorder:visible').first()).toBeVisible();
    await expect(page.locator('.ht_clone_inline_start .wtBorder:visible').first()).toBeVisible();
    await expect(page.locator('.ht_clone_top .wtBorder:visible').first()).toBeVisible();
    // (10,10) is in the master viewport.
    await expect(page.locator('.ht_master .wtBorder:visible').first()).toBeVisible();
  });

  test('keeps the frozen column border rendered after scrolling far right', async ({ page }) => {
    // Scrolling only the column axis leaves the master row window unchanged, so (10, 0)'s row
    // stays rendered - isolating whether the frozen-start column keeps its border once the
    // master column range moves past col 0.
    await page.evaluate(() => (window as any).hot.scrollViewportTo({ col: 60 }));
    // The frozen column keeps its border even though the master range excludes col 0.
    await expect(page.locator('.ht_clone_inline_start .wtBorder:visible').first()).toBeVisible();
    // The unfrozen borders scrolled out of both ranges - their selections must be culled
    // (virtualization intact).
    const selections = await page.evaluate(() =>
      (window as any).hot.selection.highlight.customSelections.length);
    expect(selections).toBeLessThan(4);
  });

  test('keeps the frozen row border rendered after scrolling far down', async ({ page }) => {
    // Scrolling only the row axis leaves the master column window unchanged, so (0, 10)'s column
    // stays rendered - isolating whether the frozen-top row keeps its border once the master row
    // range moves past row 0.
    await page.evaluate(() => (window as any).hot.scrollViewportTo({ row: 40 }));
    // The frozen row keeps its border even though the master range excludes row 0.
    await expect(page.locator('.ht_clone_top .wtBorder:visible').first()).toBeVisible();
    // The unfrozen borders scrolled out of both ranges - their selections must be culled
    // (virtualization intact).
    const selections = await page.evaluate(() =>
      (window as any).hot.selection.highlight.customSelections.length);
    expect(selections).toBeLessThan(4);
  });
});
