import { test } from '../../src/test-runner';
import { setCellAlignment, selectCell } from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

const urls = [
  '/custom-style-demo',
  '/merged-cells-demo',
  '/nested-headers-demo',
  '/nested-rows-demo',
];

urls.forEach((url) => {
  test(`Test alignment for: ${url}`, async({ goto, tablePage }) => {
    await goto(url);

    const cell = await selectCell(2, 2);

    await setCellAlignment('Right', cell);

    await tablePage.screenshot({ path: helpers.screenshotPath() });
  });
});
