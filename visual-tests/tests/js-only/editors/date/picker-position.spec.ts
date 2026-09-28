import { visualTest, expect } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import {
  doubleClickRelativeToViewport,
} from '../../../../src/page-helpers';

/**
 * The date editor open on a cell near the grid's top-left corner, with the browser's native date
 * picker showing: the one capture of it that proves `showPicker()` fires on open and that the theme's
 * color scheme reaches the native control, which is why it renders on `main` and `main-dark`. Where
 * the picker opens is the browser's, not the grid's, and the editor's input over the cell is asserted
 * in `handsontable/src/editors/dateEditor/__tests__/positioning.spec.js`. Owned by DEV-3139.
 */
visualTest(__filename, {
  themes: ['main', 'main-dark'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/date-cell-type-demo')
      .getFullUrl()
  );

  await doubleClickRelativeToViewport(80, 80, 'left'); // top-left
  await expect(tablePage.locator('.handsontableInput')).toBeFocused();

  // the date editor open, with the native picker below it
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
