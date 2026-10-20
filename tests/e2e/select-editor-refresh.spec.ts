import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { SelectEditorRefreshPage } from '../fixtures/pages/SelectEditorRefreshPage';

/**
 * Refreshing an open select editor re-reads the edited record from the source data. The editor
 * holds a visual row, and the source data is addressed by a physical one, so after a sort or a
 * filter the refresh has to translate the row first. Otherwise the editor shows another record.
 */
test.describe('Select editor refresh', { tag: BUNDLES_TAG }, () => {
  test('shows the edited record after a sort', async({ page, theme, bundle }) => {
    const grid = new SelectEditorRefreshPage(page, theme, bundle);

    await grid.goto();
    await grid.sortByName();
    await expect(grid.cell(0, 0)).toHaveText('Alice');

    await grid.openEditor(0, 1);
    await grid.setSourceData(1, 1, 'yellow');

    await expect.poll(() => grid.editorState()).toEqual({ opened: true, value: 'yellow' });
    expect(await grid.sourceData()).toEqual([['Charlie', 'red'], ['Alice', 'yellow'], ['Bob', 'blue']]);
  });

  test('shows the edited record after a filter', async({ page, theme, bundle }) => {
    const grid = new SelectEditorRefreshPage(page, theme, bundle);

    await grid.goto();
    await grid.filterNames(['Alice', 'Bob']);
    await expect(grid.cell(0, 0)).toHaveText('Alice');

    await grid.openEditor(0, 1);
    await grid.setSourceData(1, 1, 'yellow');

    await expect.poll(() => grid.editorState()).toEqual({ opened: true, value: 'yellow' });
    expect(await grid.sourceData()).toEqual([['Charlie', 'red'], ['Alice', 'yellow'], ['Bob', 'blue']]);
  });
});
