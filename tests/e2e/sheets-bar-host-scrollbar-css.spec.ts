import { test, expect } from '../fixtures/test';
import { SheetsBarPage } from '../fixtures/pages/SheetsBarPage';

/**
 * The sheets bar tab strip must stay scrollbar-free under a page-wide `!important` scrollbar rule.
 *
 * The strip scrolls horizontally through the paging arrows and hides its scrollbar with
 * `scrollbar-width: none !important`. A host page that restyles every scroll container with an
 * `!important` rule (`* { scrollbar-width: thin !important }`) beat the plain declaration it used to
 * have and painted a bar into the strip. A low-specificity host rule without `!important` never won,
 * because the strip's selector is more specific, so only the `!important` forms are asserted.
 *
 * Only the computed style and the box geometry are asserted, never the stylesheet text.
 *
 * Playwright's headless Chromium is started with `--hide-scrollbars`, which forces every scrollbar to
 * zero width, so the gutter checks could never fail there. So this file, and only this file, drops
 * that flag (as `clone-holder-host-scrollbar-css.spec.ts` does). `launchOptions` cannot be set in a
 * `describe`, which is why this is its own file. On a machine whose OS floats its scrollbars the
 * gutter is 0 either way, and the `scrollbarWidth` check is the one that catches the defect.
 */
test.use({
  launchOptions: {
    ignoreDefaultArgs: ['--hide-scrollbars'],
  },
});

test.describe('Sheets bar tab strip under a page-wide scrollbar rule', () => {
  for (const rule of [
    '* { scrollbar-width: thin !important; }',
    '.ht-sheets-bar__tabs { scrollbar-width: thin !important; }',
  ]) {
    test(`keeps no scrollbar under \`${rule}\``, async({ page, theme, bundle }) => {
      const sheetsBar = new SheetsBarPage(page, theme, bundle);

      await sheetsBar.goto();
      // The grid's master holder is a control: the same page-wide rule must take effect there,
      // which proves the injected stylesheet is live and only the strip is shielded.
      await page.addStyleTag({ content: `${rule} .handsontable .wtHolder { scrollbar-width: thin !important; }` });

      const metrics = await page.evaluate(() => {
        const strip = document.querySelector('.ht-sheets-bar__tabs') as HTMLElement;
        const holder = document.querySelector('.ht_master .wtHolder') as HTMLElement;

        return {
          holderScrollbarWidth: getComputedStyle(holder).scrollbarWidth,
          scrollbarWidth: getComputedStyle(strip).scrollbarWidth,
          gutterX: strip.offsetWidth - strip.clientWidth,
          gutterY: strip.offsetHeight - strip.clientHeight,
        };
      });

      expect(metrics.holderScrollbarWidth, 'positive control: grid holder scrollbar-width').toBe('thin');
      expect(metrics.scrollbarWidth, 'tab strip scrollbar-width').toBe('none');
      expect(metrics.gutterX, 'tab strip vertical scrollbar space').toBe(0);
      expect(metrics.gutterY, 'tab strip horizontal scrollbar space').toBe(0);
    });
  }
});
