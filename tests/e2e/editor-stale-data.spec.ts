import { test, expect } from '../fixtures/test';
import { EditorStaleDataPage } from '../fixtures/pages/EditorStaleDataPage';

/**
 * Replacing the dataset skips `prepareEditor`, and the selection stays put.
 * `updateData` leaves Enter editing the value from before the replace.
 * `loadData` leaves a typed character able to open a cell that is now read-only.
 */
test.describe('editor after updateData', () => {
  test('Enter does not open a cell updateData made read-only, and the selection moves', async({ page, theme, bundle }) => {
    const grid = new EditorStaleDataPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell(0, 1);
    await grid.updateData([
      ['a', 'locked'],
      ['c', 'd'],
    ]);
    await grid.expectCell(0, 1, 'locked');

    await page.keyboard.press('Enter');

    await grid.expectNoEditor();
    await grid.expectSelection(1, 1);
    await grid.expectCell(0, 1, 'locked');
  });

  test('typing does not open a cell loadData made read-only', async({ page, theme, bundle }) => {
    const grid = new EditorStaleDataPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell(0, 1);
    await grid.loadData([
      ['a', 'locked'],
      ['c', 'd'],
    ]);
    await grid.expectCell(0, 1, 'locked');

    await page.keyboard.press('x');

    await grid.expectNoEditor();
    await grid.expectCell(0, 1, 'locked');
  });

  test('Enter opens the editor on the value updateData wrote', async({ page, theme, bundle }) => {
    const grid = new EditorStaleDataPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell(0, 0);
    await grid.updateData([
      ['next', 'open'],
      ['c', 'd'],
    ]);
    await grid.expectCell(0, 0, 'next');

    await page.keyboard.press('Enter');

    await grid.expectEditorOpen();
    await expect.poll(() => grid.editorValue()).toBe('next');
  });
});
