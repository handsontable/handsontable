import { visualTest, expect } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import {
  clickRelativeToViewport,
  scrollTableToTheInlineEnd,
  scrollTableToTheBottom,
} from '../../../../src/page-helpers';

/**
 * The look of the handsontable editor's list opened from a cell near each corner of a grid scrolled to
 * its bottom and inline end, one capture per corner: the four combinations of opening below or above
 * the cell and extending right or left. Where the list opens is asserted from DOM rects in
 * `tests/e2e/handsontable-editor-list-position.spec.ts`, in a sized grid like this one and on a page
 * the window scrolls, on all six theme and bundle legs; these captures are a check of how it looks.
 * `main` only: the placement is asserted on every theme, and the list is the same `.listbox` grid the
 * dropdown editor opens, which `editors/dropdown/focus-cell` photographs on all five js variants.
 * Owned by DEV-3139.
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

  await tablePage.keyboard.press('Escape'); // closes the editor
  await expect(list).toBeHidden();

  await clickRelativeToViewport(-300, 80); // top-right
  await tablePage.keyboard.press('Enter');
  await expect(list).toBeVisible();

  // the list below the cell, flipped to extend left
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape'); // closes the editor
  await expect(list).toBeHidden();

  await clickRelativeToViewport(80, -195); // bottom-left
  await tablePage.keyboard.press('Enter');
  await expect(list).toBeVisible();

  // the list flipped above the cell, extending right
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape'); // closes the editor
  await expect(list).toBeHidden();

  await clickRelativeToViewport(-300, -195); // bottom-right
  await tablePage.keyboard.press('Enter');
  await expect(list).toBeVisible();

  // the list flipped above the cell and to extend left
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
