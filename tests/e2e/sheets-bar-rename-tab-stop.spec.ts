import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { SheetsBarUiPage } from '../fixtures/pages/SheetsBarUiPage';

/**
 * A sheet tab being renamed drops its `button` role, because a button's children are presentational
 * and would take the name field out of the accessibility tree. The tab kept its Tab stop, so the focus
 * order held a `div` with no role beside the name field, and a Shift+Tab from the field landed on it.
 * The strip rewrites every tab's stop on each repaint, so the stop has to be withheld where the stop is
 * decided, not once when the rename starts.
 */
test.describe('the tab stop of a sheet tab being renamed', { tag: CROSS_BROWSER_TAG }, () => {
  let fixture: SheetsBarUiPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto();
    await fixture.label(0).dblclick();
    await expect(fixture.renameInput).toBeFocused();
  });

  test('holds no Tab stop while the name field is open', async() => {
    await expect(fixture.tab(0)).toHaveClass(/ht-sheets-bar__tab--renaming/);
    await expect(fixture.tab(0)).toHaveAttribute('tabindex', '-1');
    await expect(fixture.tab(0)).not.toHaveAttribute('role', /./);
  });

  test('keeps no Tab stop when a repaint lands in the middle of the rename', async({ page }) => {
    // Renaming another sheet through the API repaints the whole strip and updates every tab in place.
    await page.evaluate(() => {
      const plugin = (window as any).hot.getPlugin('sheetsBar');

      plugin.renameSheet(plugin.getSheets()[1].id, 'Other');
    });

    await expect(fixture.label(1)).toHaveText('Other');
    await expect(fixture.renameInput).toBeFocused();
    await expect(fixture.tab(0)).toHaveAttribute('tabindex', '-1');
  });

  test('gives the Tab stop back to the active tab when the rename ends', async({ page }) => {
    await page.keyboard.press('Escape');

    await expect(fixture.renameInput).toBeHidden();
    await expect(fixture.tab(0)).toHaveAttribute('role', 'button');
    await expect(fixture.tab(0)).toHaveAttribute('tabindex', '0');
  });

  test('gives the Tab stop back when Enter ends the rename', async({ page }) => {
    await page.keyboard.press('Enter');

    await expect(fixture.renameInput).toBeHidden();
    await expect(fixture.tab(0)).toHaveAttribute('role', 'button');
    await expect(fixture.tab(0)).toHaveAttribute('tabindex', '0');
  });

  test('gives the Tab stop back when the field loses the focus', async({ page }) => {
    await fixture.addButton.focus();

    await expect(fixture.renameInput).toBeHidden();
    await expect(fixture.tab(0)).toHaveAttribute('role', 'button');
    await expect(fixture.tab(0)).toHaveAttribute('tabindex', '0');
  });

  test('Shift+Tab from the name field does not put the focus on the tab around it', async({ page }) => {
    await page.keyboard.press('Shift+Tab');

    await expect(fixture.renameInput).toBeHidden();
    expect(await page.evaluate(() => document.activeElement?.closest('.ht-sheets-bar__tab--renaming') ?? null)).toBeNull();
  });
});
