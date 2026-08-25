import { test, expect } from '../fixtures/test';
import { LayoutSlotFocusPage } from '../fixtures/pages/LayoutSlotFocusPage';

for (const outsideClickDeselects of [true, false]) {
  test.describe(`layout-slot focus (outsideClickDeselects: ${outsideClickDeselects})`, () => {
    let grid: LayoutSlotFocusPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new LayoutSlotFocusPage(page, theme, bundle, outsideClickDeselects);
      await grid.goto();
    });

    test('keeps the editor, selection, and listener when a pagination control is clicked', async () => {
      const editor = await grid.openEditor(0, 0);

      await grid.pageSizeSelect.click();

      await expect(editor).toBeVisible();
      await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);
      expect(await grid.isListening()).toBe(true);
    });
  });
}
