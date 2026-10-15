import { visualTest, expect } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import { forPaginationClickLastPageButton } from '../../../../src/page-helpers';

/**
 * Checks how the pager looks mirrored in an RTL grid, in Arabic, on its last page: the page-size section
 * on the right, the buttons running right to left, Next and Last disabled and the focus on Previous. That
 * the pager mirrors and keeps the same logic in RTL is asserted from DOM rects in
 * `tests/e2e/pagination-pager-states.spec.ts` on every theme and bundle, so this is a look check on
 * `main` only; the LTR `../navigation.spec.ts` photographs the pager on `main` and `main-dark`. The demo's
 * RTL data repeats every ten rows, so its second and last page shows the first page's cells. Owned by
 * DEV-3285.
 */
visualTest(__filename, {
  themes: ['main'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/pagination-demo')
      .setPageParams({ direction: 'rtl' })
      .getFullUrl()
  );

  const pager = tablePage.locator('.ht-pagination');

  await forPaginationClickLastPageButton();
  await expect(pager.locator('.ht-page-counter-section')).toHaveText(/^11 - 20 /);
  await expect(pager.locator('.ht-page-next')).toBeDisabled();
  await expect(pager.locator('.ht-page-last')).toBeDisabled();
  await expect(pager.locator('.ht-page-prev')).toBeFocused();

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
