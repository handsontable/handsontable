import { expect, test } from '../fixtures/test';
import { DataProviderOvertakenEditPage } from '../fixtures/pages/DataProviderOvertakenEditPage';

/**
 * A user confirms a second edit while the refetch after the first save is still on its way, in a column whose
 * validator answers later. The refetch loads first and puts the records one row lower, which drops the waiting
 * edit and closes its editor. When the validator then rejects the value under `allowInvalid: false`, the editor
 * opens again on the record the user edited, with the text they typed, as it stays open when no load intervenes.
 */
test.describe('an edit the refetch after a save overtook while its validator ran', () => {
  let grid: DataProviderOvertakenEditPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new DataProviderOvertakenEditPage(page, theme, bundle);
    await grid.goto();
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test('opens the editor on the record again with the typed text when the validator rejects it', async() => {
    await grid.typeAndConfirm(0, 1, 'Ana Garcia');
    await expect.poll(() => grid.pendingFetchCount()).toBe(1);

    await grid.gate('Wei Li');
    await grid.typeAndConfirm(1, 1, 'Wei Li');
    await expect.poll(() => grid.editorState()).toMatchObject({ opened: true, waiting: true });

    await grid.prependRecord();
    await grid.releaseFetches();

    await expect(grid.cell(2, 1)).toHaveText('Li Wei');
    await expect.poll(() => grid.editorState()).toMatchObject({ opened: false, waiting: false });

    await grid.answer('Wei Li', false);

    await expect.poll(() => grid.editorState()).toEqual({
      opened: true, waiting: false, row: 2, col: 1, value: 'Wei Li',
    });
    await expect(grid.editorInput()).toBeFocused();
    await expect(grid.cell(2, 1)).toHaveText('Li Wei');
    expect(await grid.saves()).toEqual([['EMP-104', 'Ana Garcia']]);
  });

  test('saves the typed value into its record when the validator accepts it', async() => {
    await grid.typeAndConfirm(0, 1, 'Ana Garcia');
    await expect.poll(() => grid.pendingFetchCount()).toBe(1);

    await grid.gate('Wei Li');
    await grid.typeAndConfirm(1, 1, 'Wei Li');
    await expect.poll(() => grid.editorState()).toMatchObject({ opened: true, waiting: true });

    await grid.prependRecord();
    await grid.releaseFetches();
    await grid.answer('Wei Li', true);

    await expect.poll(() => grid.saves()).toEqual([['EMP-104', 'Ana Garcia'], ['EMP-221', 'Wei Li']]);
    await expect.poll(() => grid.editorState()).toMatchObject({ opened: false });
    await expect(grid.cell(2, 1)).toHaveText('Wei Li');
  });
});
