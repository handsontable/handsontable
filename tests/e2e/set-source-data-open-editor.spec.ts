import { test, expect } from '../fixtures/test';
import { SourceDataEditorPage } from '../fixtures/pages/SourceDataEditorPage';

/**
 * `setSourceDataAtCell()` while the user types: a write to another cell keeps the typed text, and a write
 * to the edited cell itself refreshes the editor, as before.
 */
test.describe('setSourceDataAtCell() with an open editor', () => {
  test('a write to another cell keeps what the user is typing', async({ page, theme, bundle }) => {
    const gridPage = new SourceDataEditorPage(page, theme, bundle);

    await gridPage.goto();
    await gridPage.typeInto(0, 1, 'typed');
    await gridPage.setSourceData(3, 1, 'from server');

    await expect(gridPage.cell(3, 1)).toHaveText('from server');
    expect(await gridPage.editorState()).toEqual({ opened: true, value: 'typed' });

    await page.keyboard.press('Enter');

    await expect(gridPage.cell(0, 1)).toHaveText('typed');
  });

  test('a write to the edited cell refreshes the editor', async({ page, theme, bundle }) => {
    const gridPage = new SourceDataEditorPage(page, theme, bundle);

    await gridPage.goto();
    await gridPage.typeInto(0, 1, 'typed');
    await gridPage.setSourceData(0, 1, 'from server');

    await expect.poll(() => gridPage.editorState()).toEqual({ opened: true, value: 'from server' });
  });
});
