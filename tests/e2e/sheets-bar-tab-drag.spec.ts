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

  test('the dragged tab paints over the chevron of the tab it covers', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    const first = (await bar.tab(0).boundingBox())!;
    const y = first.y + (first.height / 2);
    const glyphCenter = await bar.tab(1).locator('.ht-sheets-bar__tab-chevron .ht-icon').evaluate((glyph) => {
      const rect = glyph.getBoundingClientRect();

      return rect.left + (rect.width / 2);
    });

    await page.mouse.move(first.x + (first.width / 2), y);
    await page.mouse.down();
    await page.mouse.move(first.x + (first.width / 2) + 10, y);
    await page.mouse.move(first.x + (first.width / 2) + (glyphCenter - (first.x + first.width)) + 4, y);

    const topmost = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll<HTMLElement>('.ht-sheets-bar__tab'));
      const dragged = tabs.find(tab => tab.classList.contains('ht-sheets-bar__tab--dragging'))!;
      const covered = tabs[tabs.indexOf(dragged) + 1];
      const glyph = covered.querySelector('.ht-sheets-bar__tab-chevron .ht-icon')!.getBoundingClientRect();
      const draggedRect = dragged.getBoundingClientRect();
      const x = glyph.left + (glyph.width / 2);
      const pointY = glyph.top + (glyph.height / 2);

      const hitTestable = document.createElement('style');

      hitTestable.textContent = '* { pointer-events: auto !important; }';
      document.head.appendChild(hitTestable);

      const hit = document.elementFromPoint(x, pointY);

      hitTestable.remove();

      return {
        order: tabs.map(tab => tab.querySelector('.ht-sheets-bar__tab-label')?.textContent),
        coversGlyph: draggedRect.left <= x && draggedRect.right >= x,
        hitsDraggedTab: dragged.contains(hit),
      };
    });

    await page.mouse.up();

    expect(topmost).toEqual({ order: ['Alpha', 'Beta', 'Gamma'], coversGlyph: true, hitsDraggedTab: true });
  });

  test('Escape abandons a drag from the bar when a host listener on the document stops the key', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();
    await bar.clickTab(1);
    await bar.expectActiveTab(1);

    expect(await page.evaluate(() => (window as unknown as { hot: any }).hot
      .getShortcutManager().getActiveContextName())).toBe('plugin:sheetsBar');

    await page.evaluate(() => {
      const state = window as unknown as { hostEscapes: number };

      state.hostEscapes = 0;
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          state.hostEscapes += 1;
          event.stopImmediatePropagation();
        }
      });
    });

    const second = (await bar.tab(1).boundingBox())!;
    const third = (await bar.tab(2).boundingBox())!;
    const y = second.y + (second.height / 2);

    await page.mouse.move(second.x + (second.width / 2), y);
    await page.mouse.down();
    await page.mouse.move(second.x + (second.width / 2) + 10, y);
    await page.mouse.move(third.x + (third.width / 2) + 5, y);

    await expect(page.locator('.ht-sheets-bar')).toHaveClass(/ht-sheets-bar-dragging/);

    await page.keyboard.press('Escape');

    expect(await page.evaluate(() => (window as unknown as { hostEscapes: number }).hostEscapes)).toBe(1);
    await expect(page.locator('.ht-sheets-bar')).not.toHaveClass(/ht-sheets-bar-dragging/);

    await page.mouse.up();

    expect(await tabNames(page)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });
});
