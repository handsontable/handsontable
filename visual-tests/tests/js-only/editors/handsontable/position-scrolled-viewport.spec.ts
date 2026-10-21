import { visualTest, expect, JS_VARIANTS } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import {
  clickRelativeToViewport,
  scrollTableToTheInlineEnd,
  scrollTableToTheBottom,
} from '../../../../src/page-helpers';

/**
 * The look of the handsontable editor's list, opened from a cell near the top-left corner of a grid
 * scrolled to its bottom and inline end: its three columns, its own header row, and the column borders,
 * on every js variant, because nothing else photographs that list (the dropdown editor's is one column
 * with no headers). Where the list opens is asserted from DOM rects in
 * `tests/e2e/handsontable-editor-list-position.spec.ts`, from seven points, in a sized grid like this one
 * and on a page the window scrolls, on all six theme and bundle legs, so the other three corners are no
 * longer photographed. Owned by DEV-3139.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/editors-demo')
      .setPageParams({
        cellType: 'handsontable',
        hasDefinedSize: '1',
      })
      .getFullUrl()
  );

  const list = tablePage.locator('.handsontableEditor');

  await scrollTableToTheInlineEnd();
  await scrollTableToTheBottom();

  await clickRelativeToViewport(80, 80); // top-left
  await tablePage.keyboard.press('Enter');
  await expect(list).toBeVisible();

  // the list below the cell, extending right
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
