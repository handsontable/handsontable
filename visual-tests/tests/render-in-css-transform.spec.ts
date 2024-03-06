import { test } from '../src/test-runner';
import { helpers } from '../src/helpers';

test(__filename, async({ page }) => {
  await page.evaluate('document.body.style = "transform: scale(0.75);"');
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.evaluate('document.body.style = "transform: scale(0.5);"');
  await page.screenshot({ path: helpers.screenshotPath() });
});
