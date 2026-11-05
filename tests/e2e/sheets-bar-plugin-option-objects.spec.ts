import { test, expect } from '../fixtures/test';
import { PluginUiTeardownPage } from '../fixtures/pages/PluginUiTeardownPage';

/**
 * A plugin option a sheet sets as an object is that sheet's own: the keys it leaves out take the
 * grid-level value and the plugin's defaults. The plugins merge a new object into the previous one, so a
 * key one sheet set stayed on every sheet opened after it, over the grid-level value too.
 */
test.describe('SheetsBar plugin options set as objects', () => {
  let grid: PluginUiTeardownPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new PluginUiTeardownPage(page, theme, bundle);
    await grid.goto();
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test('gives a sheet the grid-level autoLink target it leaves out, after a sheet that set another', async() => {
    await grid.build({
      autoLink: { target: '_blank' },
      sheetsBar: {
        sheets: [
          { name: 'X', data: [['https://handsontable.com']], settings: { autoLink: { target: '_self' } } },
          { name: 'Y', data: [['https://handsontable.com']], settings: { autoLink: { className: 'my-link' } } },
        ],
      },
    });

    const link = grid.firstCell().locator('a');

    await expect(link).toHaveAttribute('target', '_self');
    expect(await grid.setActiveSheet('Y')).toBe(true);

    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveClass(/my-link/);
  });

  test('gives a sheet the default search result class it leaves out, after a sheet that set another', async({ page }) => {
    await grid.build({
      search: true,
      sheetsBar: {
        sheets: [
          { name: 'X', data: [['apple']], settings: { search: { searchResultClass: 'x-hit' } } },
          { name: 'Y', data: [['apple']], settings: { search: { callback: null } } },
        ],
      },
    });

    expect(await grid.setActiveSheet('Y')).toBe(true);

    await page.evaluate(() => {
      const { hot } = window as unknown as { hot: { getPlugin(name: string): { query(text: string): unknown }, render(): void } };

      hot.getPlugin('search').query('apple');
      hot.render();
    });

    await expect(grid.firstCell()).toHaveClass(/htSearchResult/);
    await expect(grid.firstCell()).not.toHaveClass(/x-hit/);
  });
});
