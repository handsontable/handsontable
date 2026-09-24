import { visualTest, JS_VARIANTS, WRAPPERS, WRAPPERS_REASON_UNAUDITED } from '../../src/test-runner';
import { helpers } from '../../src/helpers';

visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: WRAPPERS,
  wrappersReason: WRAPPERS_REASON_UNAUDITED,
}, async({ tablePage }) => {
  await tablePage.evaluate('document.body.style = "transform: scale(0.75);"');
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.evaluate('document.body.style = "transform: scale(0.5);"');
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
