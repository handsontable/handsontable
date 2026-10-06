import { visualTest, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { forPaginationClickLastPageButton } from '../../../src/page-helpers';

/**
 * Checks how the pager looks on the last page: the first and previous buttons enabled, the next and last
 * buttons in their disabled state, the focus ring on Previous (where the focus goes when the button it
 * was on turns disabled), the page-size select and the counter. Which page each button moves to, the
 * counter, the disabled buttons and the focus hand-off are asserted from the DOM in
 * `tests/e2e/pagination-pager-states.spec.ts` on every theme and bundle, together with a page size
 * changed on a filtered, sorted grid and the auto page size filling every page of a sized grid and of a
 * grid the window scrolls; those states differ here only in the rows and the counter, so this is the
 * family's one capture of the pager. Owned by DEV-3285.
 */
visualTest(__filename, {
  themes: ['main', 'main-dark'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/pagination-demo')
      .getFullUrl()
  );

  const pager = tablePage.locator('.ht-pagination');

  await forPaginationClickLastPageButton();
  await expect(pager.locator('.ht-page-counter-section')).toHaveText('91 - 100 of 100');
  await expect(pager.locator('.ht-page-next')).toBeDisabled();
  await expect(pager.locator('.ht-page-last')).toBeDisabled();
  await expect(pager.locator('.ht-page-prev')).toBeFocused();

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
