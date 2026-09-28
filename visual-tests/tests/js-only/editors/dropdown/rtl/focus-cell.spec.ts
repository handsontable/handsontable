import { visualTest, expect } from '../../../../../src/test-runner';
import { helpers } from '../../../../../src/helpers';
import {
  clickRelativeToViewport,
  scrollTableToTheInlineEnd,
  scrollTableToTheBottom,
} from '../../../../../src/page-helpers';

/**
 * Checks that, in RTL and in a grid scrolled to its bottom and inline end, the dropdown editor keeps its
 * full list when a letter is typed (the dropdown type sets `filter: false`): it bolds the typed "a" in each
 * option, highlights the first match, and shows the hover state of the option under the pointer. The
 * list's RTL placement goes through the handsontable editor's flip, which
 * `tests/e2e/handsontable-editor-list-position.spec.ts` asserts for a sized RTL grid on every theme.
 * What only this capture shows is the mirror: options aligned to the right and cut at their start.
 * `main` only: the mirror does not depend on the theme, and the focus and hover tokens are the LTR
 * `editors/dropdown/focus-cell`'s, on all five variants. Owned by DEV-3139.
 */
visualTest(__filename, {
  themes: ['main'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/editors-demo')
      .setPageParams({
        direction: 'rtl',
        cellType: 'dropdown',
        hasDefinedSize: '1',
      })
      .getFullUrl()
  );

  await scrollTableToTheInlineEnd();
  await scrollTableToTheBottom();

  await clickRelativeToViewport(250, 80); // top-left
  await tablePage.keyboard.press('Enter');
  await tablePage.keyboard.press('a');
  // hover over third element
  await tablePage.mouse.move(
    250,
    180
  );
  // "Electronics" has no "a", so the first match the list highlights is "Fashion".
  await expect(tablePage.locator('.handsontableEditor .ht_master .htCore td.current')).toHaveText('Fashion');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
