import type { Page } from '@playwright/test';
import { test, expect, THEMES_TAG, CROSS_BROWSER_TAG } from '../fixtures/test';
import { SheetsBarPage } from '../fixtures/pages/SheetsBarPage';

/**
 * Reads the tab labels in strip order.
 *
 * @param {Page} page The page under test.
 * @returns {Promise<Array<string | null>>} The labels.
 */
function tabNames(page: Page) {
  return page.evaluate(() => Array.from(
    document.querySelectorAll('.ht-sheets-bar__tab-label'),
  ).map(label => label.textContent));
}

/**
 * Presses on one tab, passes the drag threshold, and releases over another tab.
 *
 * @param {Page} page The page under test.
 * @param {SheetsBarPage} bar The sheets bar page object.
 * @param {number} from The index of the dragged tab.
 * @param {number} to The index of the tab it is released over.
 */
async function dragTab(page: Page, bar: SheetsBarPage, from: number, to: number) {
  const source = (await bar.tab(from).boundingBox())!;
  const target = (await bar.tab(to).boundingBox())!;
  const direction = to > from ? 1 : -1;
  const y = source.y + (source.height / 2);

  await page.mouse.move(source.x + (source.width / 2), y);
  await page.mouse.down();
  await page.mouse.move(source.x + (source.width / 2) + (direction * 10), y);
  await page.mouse.move(target.x + (target.width / 2) + (direction * 5), target.y + (target.height / 2));
  await page.mouse.up();
}

test.describe('sheets bar tab drag', { tag: [THEMES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('dragging a tab past its neighbour reorders the strip', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);
    let crashed = false;

    page.on('crash', () => {
      crashed = true;
    });
    await bar.goto();

    expect(await tabNames(page)).toEqual(['Alpha', 'Beta', 'Gamma']);

    await dragTab(page, bar, 0, 2);

    await expect.poll(() => tabNames(page)).toEqual(['Beta', 'Gamma', 'Alpha']);
    expect(crashed).toBe(false);
  });

  test('dragging a tab back past its neighbour reorders the strip', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);
    let crashed = false;

    page.on('crash', () => {
      crashed = true;
    });
    await bar.goto();

    await dragTab(page, bar, 2, 0);

    await expect.poll(() => tabNames(page)).toEqual(['Gamma', 'Alpha', 'Beta']);
    expect(crashed).toBe(false);
  });
});
