import { test } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import {
  clickRelativeToViewport,
  scrollTableToTheInlineEnd,
  scrollTableToTheBottom,
} from '../../../../src/page-helpers';

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/editors-demo')
      .setPageParams({
        cellType: 'handsontable',
        hasDefinedSize: '1',
      })
      .getFullUrl()
  );

  await scrollTableToTheInlineEnd();
  await scrollTableToTheBottom();

  await clickRelativeToViewport(80, 80); // top-left
  await tablePage.keyboard.press('Enter');
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape'); // closes the editor

  await clickRelativeToViewport(-300, 80); // top-right
  await tablePage.keyboard.press('Enter');
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape'); // closes the editor

  await clickRelativeToViewport(80, -195); // bottom-left
  await tablePage.keyboard.press('Enter');
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape'); // closes the editor

  await clickRelativeToViewport(-300, -195); // bottom-right
  await tablePage.keyboard.press('Enter');
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
