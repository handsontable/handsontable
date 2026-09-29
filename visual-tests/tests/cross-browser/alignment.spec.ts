import { visualTest, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import { setCellAlignment, selectCell } from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

const urls = [
  '/custom-style-demo',
  '/merged-cells-demo',
  '/nested-headers-demo',
  '/nested-rows-demo',
];

urls.forEach((url) => {
  /**
   * Checks that aligning a cell to the right through the context menu renders its text flush right on this
   * demo route. One capture per route in `urls`, in each browser. Owned by DEV-2981.
   */
  visualTest(`Test alignment for: ${url}`, {
    themes: [CLASSIC],
    browsers: CROSS_BROWSERS,
    wrappers: [],
  }, async({ goto, tablePage }) => {
    await goto(url);

    const cell = await selectCell(2, 2);

    await setCellAlignment('Right', cell);

    await tablePage.screenshot({ path: helpers.screenshotPath() });
  });
});
