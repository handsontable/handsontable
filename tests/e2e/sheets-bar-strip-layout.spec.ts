import type { Page } from '@playwright/test';
import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SheetsBarPage } from '../fixtures/pages/SheetsBarPage';

/**
 * Reads where the strip sits against the bar's other parts, in one evaluation.
 *
 * @param {Page} page The page under test.
 * @returns {Promise<object>} The gaps on both sides of the strip and the overflow state.
 */
function stripLayout(page: Page) {
  return page.evaluate(() => {
    const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
    const inner = document.querySelector<HTMLElement>('.ht-sheets-bar__inner')!;
    const strip = document.querySelector<HTMLElement>('.ht-sheets-bar__tabs')!;
    const paging = document.querySelector<HTMLElement>('.ht-sheets-bar__paging')!;
    const pagingShown = getComputedStyle(paging).display !== 'none';
    const end = pagingShown ? box('.ht-sheets-bar__paging').left :
      box('.ht-sheets-bar__inner').right - parseFloat(getComputedStyle(inner).paddingRight);

    return {
      startGap: Math.round(strip.getBoundingClientRect().left - box('.ht-sheets-bar__controls').right),
      endGap: Math.round(end - strip.getBoundingClientRect().right),
      stripOverflows: strip.scrollWidth > strip.clientWidth,
      pagingShown,
      barOverflows: inner.scrollWidth > inner.clientWidth,
    };
  });
}

test.describe('sheets bar strip layout', { tag: THEMES_TAG }, () => {
  test('the strip fills the row between the controls and the end of the bar', async({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto({ productionStrip: true });

    await expect.poll(() => stripLayout(page)).toEqual({
      startGap: 0,
      endGap: 0,
      stripOverflows: false,
      pagingShown: false,
      barOverflows: false,
    });
  });

  test('the strip shrinks to the room left and pages its tabs when they do not fit', async({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto({ productionStrip: true });
    await page.evaluate(() => {
      const sheetsBar = (window as unknown as { hot: any }).hot.getPlugin('sheetsBar');

      for (let index = 0; index < 30; index += 1) {
        sheetsBar.addSheet(`Quarterly report ${index}`);
      }
    });

    await expect.poll(() => stripLayout(page)).toEqual({
      startGap: 0,
      endGap: 0,
      stripOverflows: true,
      pagingShown: true,
      barOverflows: false,
    });
  });
});
