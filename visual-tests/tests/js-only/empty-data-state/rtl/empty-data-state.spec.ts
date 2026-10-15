import { visualTest, expect } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';

/**
 * Checks how the empty-data-state panel looks mirrored in an RTL grid with no rows, in Arabic. That the
 * panel sits under the column headers from the root's right edge, and every other panel shape and state,
 * is asserted from DOM rects in `tests/e2e/empty-data-state-layout.spec.ts` on every theme and bundle, so
 * this is a look check on `main` only, of the loaded panel; `../empty-data-state.spec.ts` photographs the
 * panel and its no-results state on `main` and `main-dark`. Owned by DEV-3285.
 */
visualTest(__filename, {
  themes: ['main'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/empty-data-state-demo')
      .setPageParams({ direction: 'rtl' })
      .getFullUrl()
  );

  await expect(tablePage.locator('.ht-empty-data-state__title')).toHaveText('لا توجد بيانات متاحة');
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
