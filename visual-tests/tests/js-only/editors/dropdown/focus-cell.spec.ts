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
        cellType: 'dropdown',
        hasDefinedSize: '1',
      })
      .getFullUrl()
  );

  await scrollTableToTheInlineEnd();
  await scrollTableToTheBottom();

  await clickRelativeToViewport(80, 80); // top-left
  await tablePage.keyboard.press('Enter');
  await tablePage.keyboard.press('a');
  // hover over third element
  await tablePage.mouse.move(
    80,
    180
  );
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
