import { visualTest, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

/**
 * Checks the sheets bar through six states: at rest, with an inactive tab hovered, with the active tab
 * switched, with a tab's menu open, overflowing with its paging arrows shown, and paged back. Added in #13409
 * (PRO-370); owned by DEV-2981.
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

  await bar.scrollIntoViewIfNeeded();
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  // hover over an inactive tab
  await bar.locator('.ht-sheets-bar__tab').nth(1).hover();
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted hover(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  // switch the active tab
  await bar.locator('.ht-sheets-bar__tab-label').nth(1).click();
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted click(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  // open a tab's menu — the chevron answers on the active tab only, which is now the second one
  await bar.locator('.ht-sheets-bar__tab-chevron').nth(1).click();
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted click(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape');

  // add enough sheets to overflow the tab strip and reveal the paging arrows
  const addButton = bar.locator('.ht-sheets-bar__add');

  await [...Array(10)].reduce(previous => previous.then(() => addButton.click()), Promise.resolve());

  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted click(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  // adding a sheet activates it, which scrolls the strip to its far end — so the arrow with
  // room to move is the previous one, and the next arrow renders in its disabled state
  await bar.locator('.ht-sheets-bar__page-prev').click();
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted click(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
