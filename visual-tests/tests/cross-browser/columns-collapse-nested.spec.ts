import { visualTest, expect, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import { collapseNestedColumn, scrollTableToTheInlineEnd } from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

/**
 * Checks that collapsing two nested-header groups ("Category" and "System") after a scroll to the inline
 * end renders the collapsed headers and the narrower grid in Chromium, Firefox and WebKit: the header
 * re-render after a horizontal scroll. One capture in each browser, after asserting both groups'
 * indicators read collapsed. The collapse itself, after a scroll too, is asserted by the Jasmine
 * collapsible-columns suite. Owned by DEV-3257.
 */
visualTest('Test collapsing nested headers', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto('/nested-headers-demo');

  const table = tablePage.locator(helpers.selectors.mainTable);

  await table.waitFor();

  await scrollTableToTheInlineEnd();

  await collapseNestedColumn('Category');
  await collapseNestedColumn('System');

  await expect(table.locator('.ht_clone_top .collapsibleIndicator.collapsed')).toHaveCount(2);
  await expect(table.locator('.ht_clone_top th:has(.collapsibleIndicator.collapsed)'))
    .toHaveText([/^Category/, /^System/]);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
