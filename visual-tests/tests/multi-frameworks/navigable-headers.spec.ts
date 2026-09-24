import { visualTest, JS_VARIANTS, WRAPPERS, WRAPPERS_REASON_UNAUDITED } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { selectCell } from '../../src/page-helpers';

visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: WRAPPERS,
  wrappersReason: WRAPPERS_REASON_UNAUDITED,
}, async({ tablePage }) => {
  const cell = await selectCell(0, 0);

  // move the focus to the corner
  await cell.click();
  await tablePage.locator('html').press('ArrowLeft');
  await tablePage.locator('html').press('ArrowUp');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
