import { visualTest, expect, JS_VARIANTS } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import {
  clickRelativeToViewport,
  scrollTableToTheInlineEnd,
  scrollTableToTheBottom,
} from '../../../../src/page-helpers';

/**
 * Checks that, in a grid scrolled to its bottom and inline end, the dropdown editor keeps its full list
 * when a letter is typed (the dropdown type sets `filter: false`): it bolds the typed "a" in each option,
 * highlights the first match, and shows the hover state of the third option under the pointer, on
 * every js variant: the one-column list with its focus and hover tokens. The handsontable editor's
 * list, which has columns and a header row, has its own capture on every variant in
 * `editors/handsontable/position-scrolled-viewport`. Owned by DEV-3139.
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
  // "Electronics" has no "a", so the first match the list highlights is "Fashion".
  await expect(tablePage.locator('.handsontableEditor .ht_master .htCore td.current')).toHaveText('Fashion');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
