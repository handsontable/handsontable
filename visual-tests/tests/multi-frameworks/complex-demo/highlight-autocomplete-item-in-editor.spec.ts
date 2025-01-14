import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  openEditor,
  selectCell,
} from '../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/complex-demo')
      .getFullUrl()
  );

  const cell = await selectCell(4, 7);

  await openEditor(cell);

  const cellEditor = tablePage.locator(helpers.findCellEditor());

  await cellEditor.waitFor();
  await cellEditor.clear();
  await cellEditor.type('to');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
