import { visualTest, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import {
  selectColumnHeaderByNameAndOpenMenu,
  selectFromContextMenu,
} from '../../src/page-helpers';

/**
 * Checks that a column frozen through the context menu stays pinned while the grid scrolls horizontally.
 * Owned by DEV-2981.
 */
visualTest('Test freezing', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto('/cell-types-demo');
  await selectColumnHeaderByNameAndOpenMenu('Cost');
  await selectFromContextMenu('Freeze column');

  await tablePage.mouse.wheel(500, 0);
  // eslint-disable-next-line no-restricted-syntax -- DEV-2797: fixed delay inherited from the 2024 import; replace with the asserted state (toBeVisible / toBeFocused / a settled helper) when this family is consolidated
  await tablePage.waitForTimeout(500);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
