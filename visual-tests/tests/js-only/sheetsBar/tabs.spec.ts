import { visualTest, expect, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

/**
 * Checks how the sheets bar looks in two states: a tab's menu open from its chevron, and the strip
 * overflowing with its paging arrows shown, the previous arrow enabled and the next one disabled at the
 * far end. Switching tabs, the hover surface of an inactive tab, the menu and its commands, and the
 * paging arrows appearing, scrolling the strip and disabling at each end are asserted from the DOM in
 * `tests/e2e/sheets-bar.spec.ts` on every theme and bundle, the hovered tab's surface by its dragged-tab
 * case. The strip at rest, the switched tab and the strip paged back repeat the tokens these two captures
 * show, and so does the hovered tab: every theme defines its hover tokens as its active-tab tokens, which
 * both captures paint (the hovered tab was 32 px from the strip at rest on `main`, 152 px on `main-dark`,
 * 0 px on `horizon`), so they are gone. It renders on every js variant because `horizon` defines the
 * tab's padding and active surface its own way (`--ht-sheets-bar-tab-horizontal-padding`,
 * `--ht-sheets-bar-tab-active-foreground-color`, `--ht-sheets-bar-tab-active-background-color`) and
 * nothing else paints them; the bare run comes with the declaration. Added in #13409 (PRO-370); owned by
 * DEV-3285.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/sheets-bar-demo')
      .getFullUrl()
  );

  const bar = tablePage.locator('.ht-sheets-bar');
  const tabs = bar.locator('.ht-sheets-bar__tab');
  const menu = tablePage.locator('.htMenu:visible');

  await bar.scrollIntoViewIfNeeded();

  // Switch to the second tab, then open its menu: the chevron answers on the active tab only.
  await tabs.nth(1).locator('.ht-sheets-bar__tab-label').click();
  await expect(tabs.nth(1)).toHaveAttribute('aria-current', 'true');
  await tabs.nth(1).locator('.ht-sheets-bar__tab-chevron').click();
  await expect(menu).toHaveCount(1);
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);

  // Ten more sheets overflow the strip. Adding a sheet activates it, which scrolls the strip to its far
  // end, so the previous arrow has room to move and the next one is disabled.
  const addButton = bar.locator('.ht-sheets-bar__add');

  await [...Array(10)].reduce(previous => previous.then(() => addButton.click()), Promise.resolve());
  await expect(tabs).toHaveCount(13);
  await expect(bar.locator('.ht-sheets-bar__page-prev')).toBeEnabled();
  await expect(bar.locator('.ht-sheets-bar__page-next')).toBeDisabled();
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
