import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { SelectEditorRefreshPage } from '../fixtures/pages/SelectEditorRefreshPage';

/**
 * Refreshing an open select editor re-reads the edited record from the source data. The editor
 * holds a visual row and column, and the source data is addressed by a physical row, so after a
 * sort, a filter, or a move the refresh has to translate the row and must not translate the
 * column twice. Otherwise the editor shows another record, or another column.
 *
 * Every case refreshes the edited record to `yellow`, then picks `red` and confirms. `red` is the
 * value of another record (or column) that the broken read returned, so a baseline taken from the
 * wrong cell makes the confirm a no-op, and the record keeps `yellow`.
 */
test.describe('Select editor refresh', { tag: BUNDLES_TAG }, () => {
  const ALICE_RED = [['Charlie', 'red'], ['Alice', 'red'], ['Bob', 'blue']];

  test('shows and writes the edited record after a sort', async({ page, theme, bundle }) => {
    const grid = new SelectEditorRefreshPage(page, theme, bundle);

    await grid.goto();
    await grid.sortByName();
    await expect(grid.cell(0, 0)).toHaveText('Alice');

    await grid.openEditor(0, 1);
    await grid.setSourceData(1, 1, 'yellow');

    await expect.poll(() => grid.editorState()).toEqual({ opened: true, value: 'yellow' });

    await grid.chooseAndConfirm('red');

    expect(await grid.sourceData()).toEqual(ALICE_RED);
  });

  test('shows and writes the edited record after a filter', async({ page, theme, bundle }) => {
    const grid = new SelectEditorRefreshPage(page, theme, bundle);

    await grid.goto();
    await grid.filterNames(['Alice', 'Bob']);
    await expect(grid.cell(0, 0)).toHaveText('Alice');

    await grid.openEditor(0, 1);
    await grid.setSourceData(1, 1, 'yellow');

    await expect.poll(() => grid.editorState()).toEqual({ opened: true, value: 'yellow' });

    await grid.chooseAndConfirm('red');

    expect(await grid.sourceData()).toEqual(ALICE_RED);
  });

  test('shows and writes the edited record after a row move', async({ page, theme, bundle }) => {
    const grid = new SelectEditorRefreshPage(page, theme, bundle);

    await grid.goto();
    await grid.moveRow(1, 0);
    await expect(grid.cell(0, 0)).toHaveText('Alice');

    await grid.openEditor(0, 1);
    await grid.setSourceData(1, 1, 'yellow');

    await expect.poll(() => grid.editorState()).toEqual({ opened: true, value: 'yellow' });

    await grid.chooseAndConfirm('red');

    expect(await grid.sourceData()).toEqual(ALICE_RED);
  });

  test('shows and writes the edited column after a column move', async({ page, theme, bundle }) => {
    const grid = new SelectEditorRefreshPage(page, theme, bundle);

    await grid.goto();
    await grid.moveColumn(1, 0);
    await expect(grid.cell(0, 0)).toHaveText('red');

    await grid.openEditor(1, 0);
    await grid.setSourceData(1, 1, 'yellow');

    await expect.poll(() => grid.editorState()).toEqual({ opened: true, value: 'yellow' });

    await grid.chooseAndConfirm('blue');

    expect(await grid.sourceData()).toEqual([['Charlie', 'red'], ['Alice', 'blue'], ['Bob', 'blue']]);
  });
});
