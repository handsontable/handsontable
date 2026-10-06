import { test, expect } from '../fixtures/test';
import { ManualColumnFreezeBoundaryPage } from '../fixtures/pages/ManualColumnFreezeBoundaryPage';

/**
 * Moving columns across the freeze line that ManualColumnFreeze sets, and putting an unfrozen
 * column back where it came from.
 *
 * Freezing is positional, the way plain `fixedColumnsStart` and spreadsheet applications treat
 * it: the first N columns are frozen, whichever columns they are. ManualColumnFreeze used to veto
 * every move that crossed the freeze line once a column had been frozen through it, so the same
 * drag worked on a `fixedColumnsStart` grid and was silently refused after a freeze.
 *
 * `manualColumnFreeze: { restoreColumnPosition: true }` sends an unfrozen column back among the
 * scrollable columns in data order, instead of leaving it at the freeze line.
 */
test.describe('ManualColumnFreeze: the freeze line', () => {
  let grid: ManualColumnFreezeBoundaryPage;

  const { DEFAULT, RESTORE, RESTORE_END, IDENTITY, FREEZE_LABEL, UNFREEZE_LABEL } = ManualColumnFreezeBoundaryPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ManualColumnFreezeBoundaryPage(page, theme, bundle);
    await grid.goto();
  });

  test.describe('moving columns across it', () => {
    test('drops a column before a frozen one, which takes the frozen slot', async () => {
      await grid.pickFromHeaderContextMenu(DEFAULT, 'col1', FREEZE_LABEL);

      expect(await grid.renderedFrozenHeaders(DEFAULT)).toEqual(['col1']);

      await grid.dragColumn(DEFAULT, 'col2', 'col1', 'before');

      await expect.poll(() => grid.columnOrder(DEFAULT))
        .toEqual(['col2', 'col1', 'col3', 'col4', 'col5', 'col6', 'col7', 'col8']);
      // The freeze line stays where it was: the dropped column is frozen now, and the column it
      // pushed past the line scrolls.
      expect(await grid.fixedColumnsStart(DEFAULT)).toBe(1);
      await expect.poll(() => grid.renderedFrozenHeaders(DEFAULT)).toEqual(['col2']);
    });

    test('drags a frozen column out of the frozen area', async () => {
      await grid.freezeColumnByApi(DEFAULT, 0);
      await grid.freezeColumnByApi(DEFAULT, 1);

      await grid.dragColumn(DEFAULT, 'col1', 'col4', 'after');

      await expect.poll(() => grid.columnOrder(DEFAULT))
        .toEqual(['col2', 'col3', 'col4', 'col1', 'col5', 'col6', 'col7', 'col8']);
      expect(await grid.fixedColumnsStart(DEFAULT)).toBe(2);
      await expect.poll(() => grid.renderedFrozenHeaders(DEFAULT)).toEqual(['col2', 'col3']);
    });

    test('reorders columns inside the frozen area', async () => {
      await grid.freezeColumnByApi(DEFAULT, 0);
      await grid.freezeColumnByApi(DEFAULT, 1);

      await grid.dragColumn(DEFAULT, 'col2', 'col1', 'before');

      await expect.poll(() => grid.renderedFrozenHeaders(DEFAULT)).toEqual(['col2', 'col1']);
      expect(await grid.columnOrder(DEFAULT)).toEqual(['col2', 'col1', 'col3', 'col4', 'col5', 'col6', 'col7', 'col8']);
      expect(await grid.fixedColumnsStart(DEFAULT)).toBe(2);
    });
  });

  test.describe('unfreezing', () => {
    test('leaves the column at the freeze line by default', async () => {
      await grid.pickFromHeaderContextMenu(DEFAULT, 'col6', FREEZE_LABEL);
      await grid.pickFromHeaderContextMenu(DEFAULT, 'col6', UNFREEZE_LABEL);

      await expect.poll(() => grid.columnOrder(DEFAULT))
        .toEqual(['col6', 'col1', 'col2', 'col3', 'col4', 'col5', 'col7', 'col8']);
      expect(await grid.fixedColumnsStart(DEFAULT)).toBe(0);
    });

    test('puts the column back before its data-order neighbor with restoreColumnPosition', async () => {
      await grid.pickFromHeaderContextMenu(RESTORE, 'col6', FREEZE_LABEL);

      await expect.poll(() => grid.renderedFrozenHeaders(RESTORE)).toEqual(['col6']);

      await grid.pickFromHeaderContextMenu(RESTORE, 'col6', UNFREEZE_LABEL);

      await expect.poll(() => grid.columnOrder(RESTORE)).toEqual(IDENTITY);
      expect(await grid.fixedColumnsStart(RESTORE)).toBe(0);
      await expect.poll(() => grid.renderedFrozenHeaders(RESTORE)).toEqual([]);
    });

    test('restores two frozen columns unfrozen in freeze order', async () => {
      await grid.freezeColumnByApi(RESTORE, 5);
      await grid.freezeColumnByApi(RESTORE, 3);

      expect(await grid.columnOrder(RESTORE))
        .toEqual(['col6', 'col3', 'col1', 'col2', 'col4', 'col5', 'col7', 'col8']);

      await grid.unfreezeColumnByApi(RESTORE, 0);
      await grid.unfreezeColumnByApi(RESTORE, 0);

      expect(await grid.columnOrder(RESTORE)).toEqual(IDENTITY);
      expect(await grid.fixedColumnsStart(RESTORE)).toBe(0);
    });

    test('restores two frozen columns unfrozen in reverse order', async () => {
      await grid.freezeColumnByApi(RESTORE, 5);
      await grid.freezeColumnByApi(RESTORE, 3);

      await grid.unfreezeColumnByApi(RESTORE, 1);

      expect(await grid.columnOrder(RESTORE))
        .toEqual(['col6', 'col1', 'col2', 'col3', 'col4', 'col5', 'col7', 'col8']);

      await grid.unfreezeColumnByApi(RESTORE, 0);

      expect(await grid.columnOrder(RESTORE)).toEqual(IDENTITY);
    });

    test('keeps the restored column out of the fixedColumnsEnd band', async () => {
      await grid.freezeColumnByApi(RESTORE_END, 6);
      await grid.unfreezeColumnByApi(RESTORE_END, 0);

      expect(await grid.columnOrder(RESTORE_END)).toEqual(IDENTITY);
      await expect(grid.grid(RESTORE_END).locator('.ht_clone_top_inline_end_corner [data-testid="header-col8"]')).toBeVisible();
    });

    test('undoes a restore in one step', async () => {
      await grid.pickFromHeaderContextMenu(RESTORE, 'col6', FREEZE_LABEL);
      await grid.pickFromHeaderContextMenu(RESTORE, 'col6', UNFREEZE_LABEL);

      await expect.poll(() => grid.columnOrder(RESTORE)).toEqual(IDENTITY);

      await grid.undo(RESTORE);

      expect(await grid.columnOrder(RESTORE))
        .toEqual(['col6', 'col1', 'col2', 'col3', 'col4', 'col5', 'col7', 'col8']);
      expect(await grid.fixedColumnsStart(RESTORE)).toBe(1);

      await grid.undo(RESTORE);

      expect(await grid.columnOrder(RESTORE)).toEqual(IDENTITY);
      expect(await grid.fixedColumnsStart(RESTORE)).toBe(0);
    });
  });
});
