import type { Page } from '@playwright/test';
import { test, expect, THEMES_TAG, CROSS_BROWSER_TAG } from '../fixtures/test';
import { SheetsBarPage } from '../fixtures/pages/SheetsBarPage';

/**
 * Reads the sheet names in the workbook's order, from the plugin rather than the strip.
 *
 * @param {Page} page The page under test.
 * @returns {Promise<string[]>} The sheet names.
 */
function sheetOrder(page: Page) {
  return page.evaluate(() => (window as never as { hot: any }).hot.getPlugin('sheetsBar')
    .getSheets().map((sheet: { name: string }) => sheet.name));
}

/**
 * Reads whether the bar wears the class it keeps for the length of a drag.
 *
 * @param {Page} page The page under test.
 * @returns {Promise<boolean>} `true` mid-drag.
 */
function isDragging(page: Page) {
  return page.evaluate(() => document.querySelector('.ht-sheets-bar-dragging') !== null);
}

/**
 * Adds a host `keydown` listener on the document that records whether each Escape reached it with
 * its default prevented, and optionally stops it there.
 *
 * @param {Page} page The page under test.
 * @param {boolean} stopsEscape Whether the listener calls `stopImmediatePropagation()` on Escape.
 */
function listenForEscape(page: Page, stopsEscape: boolean) {
  return page.evaluate((stops) => {
    const records: boolean[] = [];

    (window as never as { escapeDefaultPrevented: boolean[] }).escapeDefaultPrevented = records;
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      records.push(event.defaultPrevented);

      if (stops) {
        event.stopImmediatePropagation();
      }
    });
  }, stopsEscape);
}

/**
 * Reads what the host listener recorded for each Escape.
 *
 * @param {Page} page The page under test.
 * @returns {Promise<boolean[]>} One `defaultPrevented` value per Escape.
 */
function escapeDefaultPrevented(page: Page) {
  return page.evaluate(() => (window as never as { escapeDefaultPrevented: boolean[] }).escapeDefaultPrevented);
}

test.describe('sheets bar tab drag and Escape', { tag: [THEMES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('Escape cancels a drag started with a fresh press when the page stops the key on document', async({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();
    await listenForEscape(page, true);

    await bar.dragTabPast('Alpha', 'Gamma');

    await expect.poll(() => bar.tabNames()).toEqual(['Beta', 'Gamma', 'Alpha']);
    expect(await isDragging(page)).toBe(true);

    await page.keyboard.press('Escape');

    expect(await isDragging(page)).toBe(false);
    expect(await bar.tabNames()).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(await escapeDefaultPrevented(page)).toEqual([true]);

    await page.mouse.up();

    expect(await sheetOrder(page)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  test('Escape cancels a drag started after a click on a tab and prevents the key\'s default', async({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();
    await bar.clickTab(1);
    await bar.expectActiveTab(1);
    await listenForEscape(page, false);

    await bar.dragTabPast('Alpha', 'Gamma');

    await expect.poll(() => bar.tabNames()).toEqual(['Beta', 'Gamma', 'Alpha']);
    expect(await isDragging(page)).toBe(true);

    await page.keyboard.press('Escape');

    expect(await isDragging(page)).toBe(false);
    expect(await escapeDefaultPrevented(page)).toEqual([true]);

    await page.mouse.up();

    expect(await sheetOrder(page)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });
});
