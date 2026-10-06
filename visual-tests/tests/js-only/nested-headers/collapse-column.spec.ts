import { visualTest, test, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

/**
 * Checks how a collapsed nested-header group with a long label looks: "Product with long text test"
 * collapsed to one column from the keyboard, its label cut with an ellipsis before the collapse icon,
 * the header focused. The keyboard path, the collapse, and the label stopping short of the icon in both
 * states are asserted from DOM rects in `tests/e2e/nested-headers-long-label.spec.ts` on every theme and
 * bundle; the collapsed header's look (the icon, the ellipsis, the focus ring) is what only pixels show,
 * and the suite's other collapsed-group capture, `cross-browser/columns-collapse-nested`, renders the
 * bare theme only. Owned by DEV-3285.
 */
visualTest(__filename, {
  themes: ['main', 'main-dark'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/nested-headers-demo')
      .setPageParams({ longNestedHeaders: 'true' })
      .getFullUrl()
  );

  const longGroup = tablePage.locator('.ht_clone_top thead tr:first-child th').filter({
    has: tablePage.locator('span.colHeader').getByText('Product with long text test', { exact: true }),
  });
  const cell = await selectCell(0, 0);

  await cell.click();
  await expect(cell).toHaveClass(/\bcurrent\b/);

  // Back through the row header, the column headers right to left, the corner, and the group level
  // right to left: the long group is the seventeenth stop.
  for (let press = 0; press < 17; press++) {
    // eslint-disable-next-line no-await-in-loop
    await tablePage.keyboard.press('Shift+Tab');
  }

  await expect(longGroup).toHaveClass(/\bcurrent\b/);
  await tablePage.keyboard.press('Enter');
  await expect(longGroup.locator('.collapsibleIndicator')).toHaveClass(/\bcollapsed\b/);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
