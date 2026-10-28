import { devices } from '@playwright/test';
import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SheetsBarUiPage } from '../fixtures/pages/SheetsBarUiPage';

test.use({ ...devices['iPhone 13'], browserName: 'chromium' });

test.describe('menus and the sheets bar on a touch screen', { tag: THEMES_TAG }, () => {
  test('Rename from the tab menu keeps the field open for typing', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto();
    await fixture.chevron(0).tap();
    await fixture.menuItem('Rename').tap();
    await expect(fixture.renameInput).toBeFocused();
    await page.keyboard.type('Z');
    await page.keyboard.press('Enter');

    await expect(fixture.tab(0)).toHaveText('Z');
  });

  test('a context menu item tapped on a cell still runs', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({ menus: true });

    const before = await page.evaluate(() => (window as any).hot.countRows());

    await page.evaluate(() => {
      const hot = (window as any).hot;
      const cell = hot.getCell(1, 1).getBoundingClientRect();

      hot.selectCell(1, 1);
      hot.getPlugin('contextMenu').open({ top: cell.bottom, left: cell.left });
    });
    await page.locator('.htContextMenu td', { hasText: 'Insert row above' }).tap();

    await expect.poll(() => page.evaluate(() => (window as any).hot.countRows())).toBe(before + 1);
    await expect(page.locator('.htContextMenu:visible')).toHaveCount(0);
  });

  test('a dropdown menu item tapped on a column header still runs', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({ menus: true });

    const before = await page.evaluate(() => (window as any).hot.countCols());

    await page.locator('.ht_clone_top .changeType').first().tap();
    await page.locator('.htDropdownMenu td', { hasText: 'Insert column left' }).tap();

    await expect.poll(() => page.evaluate(() => (window as any).hot.countCols())).toBe(before + 1);
  });
});
