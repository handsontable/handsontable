import { test, expect } from '../fixtures/test';
import { LayoutSlotFocusPage } from '../fixtures/pages/LayoutSlotFocusPage';

/**
 * Clicking layout-slot UI is an outside click, and stays one. These cases pin that down so the
 * editor fix above cannot quietly change what `outsideClickDeselects` governs.
 */
for (const outsideClickDeselects of [true, false]) {
  test.describe(`layout-slot click (outsideClickDeselects: ${outsideClickDeselects})`, () => {
    let grid: LayoutSlotFocusPage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new LayoutSlotFocusPage(page, theme, bundle, outsideClickDeselects);
      await grid.goto();
    });

    test(`${outsideClickDeselects ? 'clears' : 'keeps'} the selection when the page-size control is clicked`, async() => {
      await grid.cell(0, 0).click();

      await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);

      await grid.pageSizeSelect.click();

      if (outsideClickDeselects) {
        await expect.poll(() => grid.selected()).toBeUndefined();
      } else {
        await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);
      }
    });

    test('keeps the grid listening to the keyboard', async() => {
      await grid.cell(0, 0).click();

      await grid.nextPageButton.click();

      await expect.poll(() => grid.isListening()).toBe(true);
    });
  });
}
