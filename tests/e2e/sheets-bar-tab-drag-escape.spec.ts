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
 * Reads whether the bar wears the class it keeps for the length of a drag.
 *
 * @param {Page} page The page under test.
 * @returns {Promise<boolean>} `true` mid-drag.
 */
function isDragging(page: Page) {
  return page.evaluate(() => document.querySelector('.ht-sheets-bar-dragging') !== null);
}

/**
 * Presses on one tab and drags it over another without releasing it.
 *
 * @param {Page} page The page under test.
 * @param {SheetsBarPage} bar The sheets bar page object.
 * @param {number} from The index of the dragged tab.
 * @param {number} to The index of the tab it is held over.
 */
async function holdTabOver(page: Page, bar: SheetsBarPage, from: number, to: number) {
  const source = (await bar.tab(from).boundingBox())!;
  const target = (await bar.tab(to).boundingBox())!;
  const direction = to > from ? 1 : -1;
  const y = source.y + (source.height / 2);

  await page.mouse.move(source.x + (source.width / 2), y);
  await page.mouse.down();
  await page.mouse.move(source.x + (source.width / 2) + (direction * 10), y);
  await page.mouse.move(target.x + (target.width / 2) + (direction * 5), target.y + (target.height / 2));
}

test.describe('sheets bar tab drag and Escape', { tag: [THEMES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('Escape cancels a drag started with a fresh press when the page stops the key on document', async({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();
    await page.evaluate(() => {
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          event.stopImmediatePropagation();
        }
      });
    });

    await holdTabOver(page, bar, 0, 2);

    await expect.poll(() => tabNames(page)).toEqual(['Beta', 'Gamma', 'Alpha']);
    expect(await isDragging(page)).toBe(true);

    await page.keyboard.press('Escape');

    expect(await isDragging(page)).toBe(false);
    expect(await tabNames(page)).toEqual(['Alpha', 'Beta', 'Gamma']);

    await page.mouse.up();

    expect(await tabNames(page)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });
});
