import { test, expect, THEMES_TAG } from '../fixtures/test';
import { PluginUiTeardownPage } from '../fixtures/pages/PluginUiTeardownPage';

/**
 * Pagination in a custom `uiContainer` sits outside the grid's root wrapper. The theme engine writes a grid's
 * `colorScheme` and `density` under the theme class doubled with the grid's scope class, so a pager with the
 * theme class alone stayed light under a dark grid. It carries the scope class too, also after the grid
 * switches to another theme.
 */
test.describe('Pagination in a uiContainer with the theme engine', { tag: THEMES_TAG }, () => {
  test('follows the grid\'s dark color scheme, also after a theme switch', async({ page, theme, bundle }) => {
    const grid = new PluginUiTeardownPage(page, theme, bundle);
    const read = () => page.evaluate(() => {
      const pager = document.querySelector('[data-testid="pager"] .ht-pagination') as HTMLElement;
      const hot = (window as any).hot;

      return {
        colorScheme: getComputedStyle(pager).colorScheme,
        hasScopeClass: pager.classList.contains(hot.themeManager.scopeClassName),
      };
    });

    await grid.goto();
    await page.evaluate((themeName) => {
      const w = window as any;
      const pager = document.createElement('div');
      const container = document.querySelector('[data-testid="grid"]') as HTMLElement;

      pager.dataset.testid = 'pager';
      document.body.appendChild(pager);
      container.className = '';
      w.hot = new w.Handsontable(container, {
        data: Array.from({ length: 30 }, (_, row) => [row]),
        theme: w.Handsontable.themes.getTheme(themeName),
        colorScheme: 'dark',
        pagination: { uiContainer: pager },
        licenseKey: w.htTestLicenseKey,
      });
    }, theme);

    expect(await read()).toEqual({ colorScheme: 'dark', hasScopeClass: true });

    await page.evaluate((themeName) => {
      const w = window as any;

      w.hot.updateSettings({ theme: w.Handsontable.themes.getTheme(themeName === 'main' ? 'horizon' : 'main') });
    }, theme);

    expect(await read()).toEqual({ colorScheme: 'dark', hasScopeClass: true });
  });

  test('keeps the sheets bar in a uiContainer on the grid\'s dark color scheme after a theme switch', async({
    page, theme, bundle,
  }) => {
    const grid = new PluginUiTeardownPage(page, theme, bundle);
    const read = () => page.evaluate(() => {
      const bar = document.querySelector('[data-testid="bar-host"] .ht-sheets-bar') as HTMLElement;
      const hot = (window as any).hot;

      return {
        colorScheme: getComputedStyle(bar).colorScheme,
        hasScopeClass: bar.classList.contains(hot.themeManager.scopeClassName),
      };
    });

    await grid.goto();
    await page.evaluate((themeName) => {
      const w = window as any;
      const host = document.createElement('div');
      const container = document.querySelector('[data-testid="grid"]') as HTMLElement;

      host.dataset.testid = 'bar-host';
      document.body.appendChild(host);
      container.className = '';
      w.hot = new w.Handsontable(container, {
        data: [[1]],
        theme: w.Handsontable.themes.getTheme(themeName),
        colorScheme: 'dark',
        sheetsBar: { uiContainer: host },
        licenseKey: w.htTestLicenseKey,
      });
    }, theme);

    expect(await read()).toEqual({ colorScheme: 'dark', hasScopeClass: true });

    await page.evaluate((themeName) => {
      const w = window as any;

      w.hot.updateSettings({ theme: w.Handsontable.themes.getTheme(themeName === 'main' ? 'horizon' : 'main') });
    }, theme);

    expect(await read()).toEqual({ colorScheme: 'dark', hasScopeClass: true });
  });
});
