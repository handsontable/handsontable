import { visualTest, test, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

/**
 * Checks the manual row resize on the complex demo: the first capture shows the resize handle on a row
 * header's bottom edge under the pointer, the second the guide line while the button is held down. Owned by
 * DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/complex-demo')
      .getFullUrl()
  );
  const table = await tablePage.locator(helpers.selectors.mainTable);

  // get third row header position and size
  const cell = await selectCell(2, 0, table, 'th');
  const THboundingBox = await cell.boundingBox();

  // hover over third row header bottom line
  await tablePage.mouse.move(
    THboundingBox!.x + (THboundingBox!.width / 2),
    THboundingBox!.y + THboundingBox!.height - 3
  );

  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted mouse.move(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  // click third row header bottom line
  await tablePage.mouse.down();

  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted mouse.down(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
