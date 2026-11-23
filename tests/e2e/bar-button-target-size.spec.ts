import { test, expect, THEMES_TAG } from '../fixtures/test';
import { PaginationPagerPage, type PagerButton } from '../fixtures/pages/PaginationPagerPage';
import { SheetsBarPage } from '../fixtures/pages/SheetsBarPage';

/**
 * WCAG 2.2 2.5.8 (Target Size, Minimum): a pointer target is at least 24 by 24 CSS pixels. The classic
 * theme draws a 12 px icon, so the pager and sheets bar buttons built from the icon, the padding and
 * the border came out at 22 by 22 px. The buttons reserve a 24 px floor now, on every theme.
 */
const MIN_TARGET_PX = 24;

/**
 * Asserts that a button's box is at least 24 by 24 CSS pixels.
 *
 * @param {import('@playwright/test').Locator} button The button.
 * @param {string} name What to call the button in a failure message.
 */
async function expectMinimumTarget(button: import('@playwright/test').Locator, name: string) {
  const box = await button.boundingBox();

  expect(box, `${name} has a box`).not.toBeNull();
  expect(box!.width, `${name} width`).toBeGreaterThanOrEqual(MIN_TARGET_PX);
  expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(MIN_TARGET_PX);
}

test.describe('pager and sheets bar button target size', { tag: THEMES_TAG }, () => {
  for (const dir of ['ltr', 'rtl'] as const) {
    test(`the four pager buttons are at least 24 by 24 px, ${dir}`, async({ page, theme, bundle }) => {
      const pagerPage = new PaginationPagerPage(page, theme, bundle);

      await pagerPage.goto({ dir });
      // On the first page First and Previous are disabled, which axe skips. Page 2 enables all four.
      await pagerPage.go('next', 2);
      await pagerPage.expectDisabled([]);

      for (const name of ['first', 'prev', 'next', 'last'] as PagerButton[]) {
        await expectMinimumTarget(pagerPage.button(name), `the ${name} button`);
      }
    });

    test(`the pager icon stays centered in its button, ${dir}`, async({ page, theme, bundle }) => {
      const pagerPage = new PaginationPagerPage(page, theme, bundle);

      await pagerPage.goto({ dir });
      await pagerPage.go('next', 2);

      for (const name of ['first', 'prev', 'next', 'last'] as PagerButton[]) {
        const button = pagerPage.button(name);
        const buttonBox = await button.boundingBox();
        const iconBox = await button.locator('.ht-icon').boundingBox();

        expect(buttonBox, `the ${name} button has a box`).not.toBeNull();
        expect(iconBox, `the ${name} icon has a box`).not.toBeNull();

        const buttonCenterX = buttonBox!.x + buttonBox!.width / 2;
        const iconCenterX = iconBox!.x + iconBox!.width / 2;
        const buttonCenterY = buttonBox!.y + buttonBox!.height / 2;
        const iconCenterY = iconBox!.y + iconBox!.height / 2;

        expect(Math.abs(iconCenterX - buttonCenterX), `the ${name} icon, horizontal offset`).toBeLessThanOrEqual(0.5);
        expect(Math.abs(iconCenterY - buttonCenterY), `the ${name} icon, vertical offset`).toBeLessThanOrEqual(0.5);
      }
    });

    test(`the Add sheet and All sheets buttons are at least 24 by 24 px, ${dir}`, async({ page, theme, bundle }) => {
      const sheetsBar = new SheetsBarPage(page, theme, bundle);

      await sheetsBar.goto({ rtl: dir === 'rtl' });

      await expectMinimumTarget(sheetsBar.addButton, 'the Add sheet button');
      await expectMinimumTarget(sheetsBar.allButton, 'the All sheets button');
    });
  }
});
