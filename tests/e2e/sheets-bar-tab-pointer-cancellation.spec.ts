import type { Page } from '@playwright/test';
import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SheetsBarPage } from '../fixtures/pages/SheetsBarPage';

/**
 * A sheet tab switches the sheet on the release that ends a click on it (WCAG 2.5.2 Pointer
 * Cancellation). A drag holds the pointer capture, so the browser sends the `click` of its release
 * to the tab wherever the pointer was let go: a release outside the bar has to cancel, a release
 * over the strip keeps reordering and activating.
 *
 * The fixture opens on Alpha, with the tabs Alpha, Beta, Gamma.
 */

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

test.describe('sheets bar tab pointer cancellation', { tag: THEMES_TAG }, () => {
  let bar: SheetsBarPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    bar = new SheetsBarPage(page, theme, bundle);
    await bar.goto();
    await bar.expectActiveTab(0);
  });

  test('a press on an inactive tab alone does not switch the sheet', async({ page }) => {
    const box = (await bar.tab(1).boundingBox())!;

    await page.mouse.move(box.x + (box.width / 2), box.y + (box.height / 2));
    await page.mouse.down();

    await bar.expectActiveTab(0);

    await page.mouse.up();

    await bar.expectActiveTab(1);
  });

  test('a drag released outside the bar does not switch the sheet', async({ page }) => {
    const box = (await bar.tab(1).boundingBox())!;
    const x = box.x + (box.width / 2);
    const y = box.y + (box.height / 2);

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 20, y, { steps: 4 });
    await page.mouse.move(x + 20, box.y - 60, { steps: 4 });
    await page.mouse.up();

    await bar.expectActiveTab(0);
    await expect.poll(() => tabNames(page)).toEqual(['Alpha', 'Beta', 'Gamma']);

    // The suppressed click is spent: the next plain click switches as usual.
    await bar.clickTab(2);
    await bar.expectActiveTab(2);
  });

  test('a drag released over the strip still reorders the tabs and switches the sheet', async({ page }) => {
    const source = (await bar.tab(1).boundingBox())!;
    const target = (await bar.tab(0).boundingBox())!;
    const y = source.y + (source.height / 2);

    await page.mouse.move(source.x + (source.width / 2), y);
    await page.mouse.down();
    await page.mouse.move(source.x + (source.width / 2) - 10, y);
    await page.mouse.move(target.x + (target.width / 2) - 5, target.y + (target.height / 2), { steps: 4 });
    await page.mouse.up();

    await expect.poll(() => tabNames(page)).toEqual(['Beta', 'Alpha', 'Gamma']);
    await bar.expectActiveTab(0);
    await expect(bar.tab(0).locator('.ht-sheets-bar__tab-label')).toHaveText('Beta');
  });

  test('a drag ended by a repaint and released outside the bar does not switch the sheet', async({ page }) => {
    const box = (await bar.tab(1).boundingBox())!;
    const x = box.x + (box.width / 2);
    const y = box.y + (box.height / 2);

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 20, y, { steps: 4 });
    await expect(page.locator('.ht-sheets-bar__tab--dragging')).toHaveCount(1);

    // A rename repaints the strip, which ends the drag while the button is still down.
    await page.evaluate(() => {
      const hot = (window as unknown as { hot: any }).hot;
      const plugin = hot.getPlugin('sheetsBar');

      plugin.renameSheet(plugin.getSheets()[2].id, 'Zeta');
    });
    await expect(page.locator('.ht-sheets-bar__tab--dragging')).toHaveCount(0);

    await page.mouse.move(x + 20, box.y - 60, { steps: 4 });
    await page.mouse.up();

    await bar.expectActiveTab(0);
    await expect.poll(() => tabNames(page)).toEqual(['Alpha', 'Beta', 'Zeta']);
  });

  test('a click on an inactive tab switches the sheet', async() => {
    await bar.clickTab(1);

    await bar.expectActiveTab(1);
  });

  test('Enter on a focused inactive tab switches the sheet', async({ page }) => {
    await bar.tab(2).focus();
    await page.keyboard.press('Enter');

    await bar.expectActiveTab(2);
  });

  test.describe('touch', () => {
    test.use({ hasTouch: true });

    test('a tap on an inactive tab switches the sheet', async({ page }) => {
      const box = (await bar.tab(1).boundingBox())!;

      await page.touchscreen.tap(box.x + (box.width / 2), box.y + (box.height / 2));

      await bar.expectActiveTab(1);
    });
  });
});
