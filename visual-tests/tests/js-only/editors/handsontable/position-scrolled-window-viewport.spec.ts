import { visualTest, JS_VARIANTS } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import {
  clickRelativeToViewport,
  scrollWindowTo,
} from '../../../../src/page-helpers';

/**
 * Checks that the handsontable editor's grid opens inside the viewport from a cell near each corner when
 * the window, not the grid, is what is scrolled. One capture per corner. Owned by DEV-2981.
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
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape'); // closes the editor

  await clickRelativeToViewport(-150, 60); // top-right
  await tablePage.keyboard.press('Enter');
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape'); // closes the editor

  await clickRelativeToViewport(120, -165); // bottom-left
  await tablePage.keyboard.press('Enter');
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape'); // closes the editor

  await clickRelativeToViewport(-150, -165); // bottom-right
  await tablePage.keyboard.press('Enter');
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
