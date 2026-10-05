import { visualTest, expect, JS_VARIANTS } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';

/**
 * Checks that, in RTL, the start panel docks on the right and the end panel on the left across the full
 * wrapper height, beside the pagination bar, with squared corners and a single border at each seam.
 * Owned by PRO-1329.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/side-layout-slots-demo')
      .setPageParams({ direction: 'rtl' })
      .getFullUrl()
  );

  const wrapper = tablePage.locator('.ht-root-wrapper');

  await expect(wrapper).toHaveClass(/ht-slot-start-filled/);
  await expect(wrapper).toHaveClass(/ht-slot-end-filled/);
  await expect(tablePage.locator('.ht-slot-start > .side-panel-start')).toBeVisible();
  await expect(tablePage.locator('.ht-slot-end > .side-panel-end')).toBeVisible();
  await expect(tablePage.locator('.ht-slot-bottom > .ht-slot-element').first()).toBeVisible();
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
