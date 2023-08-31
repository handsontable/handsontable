import { test } from '../src/test-runner';
import { helpers } from '../src/helpers';

test(__filename, async({ page }) => {
  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();

  await page.evaluate('document.body.style = "transform: scale(0.75);"');
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.evaluate('document.body.style = "transform: scale(0.5);"');
  await page.screenshot({ path: helpers.screenshotPath() });
});
