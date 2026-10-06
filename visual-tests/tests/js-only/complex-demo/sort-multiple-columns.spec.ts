import { visualTest, test, expect, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  setColumnSorting,
  setAdditionalColumnSorting,
  SortDirection,
} from '../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

/**
 * Checks how a two-column sort looks on the complex demo: Age descending, then Interest ascending, each
 * header with its sort indicator and its order number. The sort keys, the headers' `aria-sort` and the
 * indicators' classes and order numbers are asserted in `tests/e2e/complex-demo-states.spec.ts` on every
 * theme and bundle; the indicator icons are theme tokens, so this capture stays. It renders on every js
 * variant because `horizon` ships its own `arrowNarrowDown` icon, the descending indicator, and no other
 * every-variant capture sorts a column; the bare run comes with the declaration. Owned by DEV-3285.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/complex-demo')
      .getFullUrl()
  );
  await setColumnSorting('Age', SortDirection.Descending);
  await setAdditionalColumnSorting('Interest', SortDirection.Ascending);

  const header = (label: string) => tablePage.locator('.ht_clone_top thead th').filter({
    has: tablePage.locator('span.colHeader').getByText(label, { exact: true }),
  });

  await expect(header('Age').locator('.columnSorting')).toHaveClass(/\bdescending\b.*\bsort-1\b/);
  await expect(header('Interest').locator('.columnSorting')).toHaveClass(/\bascending\b.*\bsort-2\b/);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
