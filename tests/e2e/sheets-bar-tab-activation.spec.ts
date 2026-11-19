import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { SheetsBarUiPage } from '../fixtures/pages/SheetsBarUiPage';

test.describe('sheets bar tab activation from the keyboard', { tag: [CROSS_BROWSER_TAG] }, () => {
  for (const key of ['Enter', 'Space']) {
    test(`${key} on the active tab opens its menu and runs no item`, async({ page, theme, bundle }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto();

      for (let opening = 1; opening <= 2; opening++) {
        await fixture.activeTab.focus();
        await page.keyboard.press(key);

        await expect(fixture.openMenu, `opening ${opening}`).toBeVisible();
        await expect(fixture.activeTab, `opening ${opening}`).toHaveAttribute('aria-expanded', 'true');
        await expect(fixture.renameInput, `opening ${opening}`).toHaveCount(0);
        await expect(fixture.activeTab.locator('.ht-sheets-bar__tab-label')).toHaveText('Sheet 1');

        await page.keyboard.press('Escape');
        await expect(fixture.openMenu).toHaveCount(0);
      }
    });
  }
});
