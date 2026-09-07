import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

test(__filename, async({ goto, tablePage }) => {
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
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  // switch the active tab
  await bar.locator('.ht-sheets-bar__tab-label').nth(1).click();
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  // open a tab's menu
  await bar.locator('.ht-sheets-bar__tab-chevron').first().click();
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape');

  // add enough sheets to overflow the tab strip and reveal the paging arrows
  const addButton = bar.locator('.ht-sheets-bar__add');

  await [...Array(10)].reduce(previous => previous.then(() => addButton.click()), Promise.resolve());

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  // adding a sheet activates it, which scrolls the strip to its far end — so the arrow with
  // room to move is the previous one, and the next arrow renders in its disabled state
  await bar.locator('.ht-sheets-bar__page-prev').click();
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
