import { visualTest, expect } from '../../../../../src/test-runner';
import { helpers } from '../../../../../src/helpers';
import {
  clickRelativeToViewport,
  scrollTableToTheInlineEnd,
  scrollTableToTheBottom,
} from '../../../../../src/page-helpers';

/**
 * The look of the RTL handsontable editor's list, in a grid scrolled to its bottom and inline end,
 * from the top-left corner (below the cell) and the bottom-right corner (flipped above it), which
 * between them show both horizontal and both vertical branches mirrored. Where the list opens is
 * asserted from DOM rects in `tests/e2e/handsontable-editor-list-position.spec.ts` for a sized RTL
 * grid, on all six theme and bundle legs; these captures are a check of how the mirrored list looks.
 * `main` only, for the reason `../position-scrolled-viewport.spec.ts` gives. Owned by DEV-3139.
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
        cellType: 'handsontable',
        hasDefinedSize: '1',
      })
      .getFullUrl()
  );

  const list = tablePage.locator('.handsontableEditor');

  await scrollTableToTheInlineEnd();
  await scrollTableToTheBottom();

  await clickRelativeToViewport(250, 80); // top-left
  await tablePage.keyboard.press('Enter');
  await expect(list).toBeVisible();

  // the mirrored list below the cell
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape'); // closes the editor
  await expect(list).toBeHidden();

  await clickRelativeToViewport(-120, -195); // bottom-right
  await tablePage.keyboard.press('Enter');
  await expect(list).toBeVisible();

  // the mirrored list flipped above the cell
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
