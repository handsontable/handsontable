import { visualTest, JS_VARIANTS } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import {
  clickRelativeToViewport,
  scrollTableToTheInlineEnd,
  scrollTableToTheBottom,
} from '../../../../src/page-helpers';

/**
 * Checks that, in a grid scrolled to its bottom and inline end, the dropdown editor keeps its full list
 * when a letter is typed (the dropdown type sets `filter: false`): it bolds the typed "a" in each option,
 * highlights the first match, and shows the hover state of the third option under the pointer. Owned by
 * DEV-2981.
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
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted mouse.move(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
