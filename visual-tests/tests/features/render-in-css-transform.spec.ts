import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';

test(__filename, async({ tablePage }) => {
  await tablePage.evaluate('document.body.style = "transform: scale(0.75);"');
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.evaluate('document.body.style = "transform: scale(0.5);"');
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
