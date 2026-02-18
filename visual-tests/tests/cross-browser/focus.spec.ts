import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';

test('Test focus on Shift+Tab navigation', async({ goto, tablePage }) => {
  await goto('/basic-two-tables-demo');

  const tableTop = tablePage.locator('#tableTop .ht-root-wrapper > .ht-grid > .handsontable');
  const tableBottom = tablePage.locator('#tableBottom .ht-root-wrapper > .ht-grid > .handsontable');

  await tableTop.waitFor();
  await tableBottom.waitFor();

  await tablePage.keyboard.press('Tab');
  await tablePage.waitForTimeout(50);
  await tablePage.keyboard.press('Tab');
  await tablePage.waitForTimeout(50);
  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.waitForTimeout(50);
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await tablePage.waitForTimeout(50);
  await tablePage.keyboard.press('Tab');
  await tablePage.waitForTimeout(50);
  await tablePage.keyboard.press('Tab');
  await tablePage.waitForTimeout(50);
  await tablePage.keyboard.press('Tab');
  await tablePage.waitForTimeout(50);
  await tablePage.keyboard.press('Tab');
  await tablePage.waitForTimeout(50);
  await tablePage.keyboard.press('Tab');
  await tablePage.waitForTimeout(50);
  await tablePage.keyboard.press('Tab');
  await tablePage.waitForTimeout(50);
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.waitForTimeout(50);
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
