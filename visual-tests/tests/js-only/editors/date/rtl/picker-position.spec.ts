import { visualTest, JS_VARIANTS } from '../../../../../src/test-runner';
import { helpers } from '../../../../../src/helpers';
import {
  doubleClickRelativeToViewport,
} from '../../../../../src/page-helpers';

/**
 * Checks that, in RTL, the date editor's picker opens inside the viewport from a cell near each corner of
 * the grid. One capture per corner. Owned by DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/date-cell-type-demo')
      .setPageParams({ direction: 'rtl' })
      .getFullUrl()
  );

  await doubleClickRelativeToViewport(80, 80, 'left'); // top-left
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape', { delay: 100 }); // closes the editor

  await doubleClickRelativeToViewport(-80, 80, 'left'); // top-right
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape', { delay: 100 }); // closes the editor

  await doubleClickRelativeToViewport(80, -80, 'left'); // bottom-left
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape', { delay: 100 }); // closes the editor

  await doubleClickRelativeToViewport(-80, -80, 'left'); // bottom-right
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
