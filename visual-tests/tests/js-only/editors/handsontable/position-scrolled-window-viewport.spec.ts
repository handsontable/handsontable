import { test } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import {
  clickRelativeToViewport,
  scrollWindowTo,
} from '../../../../src/page-helpers';

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/editors-demo')
      .setPageParams({
        cellType: 'handsontable',
      })
      .getFullUrl()
  );

  const [scrollWidth, scrollHeight] = await tablePage.evaluate(async() => {
    // eslint-disable-next-line no-restricted-globals
    return [document.body.scrollWidth, document.body.scrollHeight];
  });

  await scrollWindowTo(scrollWidth, scrollHeight);

  await clickRelativeToViewport(120, 60); // top-left
  await tablePage.keyboard.press('Enter');
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape'); // closes the editor

  await clickRelativeToViewport(-150, 60); // top-right
  await tablePage.keyboard.press('Enter');
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape'); // closes the editor

  await clickRelativeToViewport(120, -165); // bottom-left
  await tablePage.keyboard.press('Enter');
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape'); // closes the editor

  await clickRelativeToViewport(-150, -165); // bottom-right
  await tablePage.keyboard.press('Enter');
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
