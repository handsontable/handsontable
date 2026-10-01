import { test, expect } from '../fixtures/test';
import { SheetsBarPage } from '../fixtures/pages/SheetsBarPage';

/**
 * The sheets bar tab strip must stay scrollbar-free under a page-wide scrollbar rule.
 *
 * The strip scrolls horizontally through the paging arrows and hides its scrollbar with
 * `scrollbar-width: none !important`. Its selector compiles to `.handsontable.ht-sheets-bar
 * .ht-sheets-bar__tabs`, so a host rule loses to it on specificity unless the host rule carries
 * `!important` (`* { scrollbar-width: thin !important }`) or ties the selector and loads later. Both
 * painted a bar into the strip while the declaration was a plain `scrollbar-width: none`.
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
  const cases = [
    { rule: '* { scrollbar-width: thin !important; }', holderFollowsRule: true },
    { rule: '.ht-sheets-bar__tabs { scrollbar-width: thin !important; }', holderFollowsRule: false },
    // Ties the strip's compiled selector and loads after the grid's stylesheet.
    { rule: '.handsontable.ht-sheets-bar .ht-sheets-bar__tabs { scrollbar-width: thin; }', holderFollowsRule: false },
  ];

  for (const { rule, holderFollowsRule } of cases) {
    test(`keeps no scrollbar under \`${rule}\``, async({ page, theme, bundle }) => {
      const sheetsBar = new SheetsBarPage(page, theme, bundle);

      await sheetsBar.goto();

      // Add sheets until the strip overflows: a strip with nothing to scroll draws no bar even
      // when the host rule wins, so the gutter checks below would pass vacuously.
      for (let i = 0; i < 10; i += 1) {
        await sheetsBar.addButton.click();
      }

      await expect(sheetsBar.pagingSection).toBeVisible();

      await page.addStyleTag({ content: rule });

      const metrics = await page.evaluate(() => {
        const strip = document.querySelector('.ht-sheets-bar__tabs') as HTMLElement;
        const holder = document.querySelector('.ht_master .wtHolder') as HTMLElement;

        return {
          overflows: strip.scrollWidth > strip.clientWidth,
          holderScrollbarWidth: getComputedStyle(holder).scrollbarWidth,
          scrollbarWidth: getComputedStyle(strip).scrollbarWidth,
          gutterX: strip.offsetWidth - strip.clientWidth,
          gutterY: strip.offsetHeight - strip.clientHeight,
        };
      });

      expect(metrics.overflows, 'the strip overflows, so a visible bar would take space').toBe(true);

      if (holderFollowsRule) {
        // Positive control: the injected rule is live, and it takes effect on the grid's own holder.
        expect(metrics.holderScrollbarWidth, 'grid holder scrollbar-width').toBe('thin');
      }

      expect(metrics.scrollbarWidth, 'tab strip scrollbar-width').toBe('none');
      expect(metrics.gutterX, 'tab strip vertical scrollbar space').toBe(0);
      expect(metrics.gutterY, 'tab strip horizontal scrollbar space').toBe(0);
    });
  }
});
