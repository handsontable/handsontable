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
 * scrollable columns by its data source order, instead of leaving it at the freeze line.
 */
test.describe('ManualColumnFreeze: the freeze line', () => {
  let grid: ManualColumnFreezeBoundaryPage;

  const { DEFAULT, RESTORE, RESTORE_END, WINDOW, IDENTITY, FREEZE_LABEL, UNFREEZE_LABEL } = ManualColumnFreezeBoundaryPage;

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

  test.describe('the drop guideline', () => {
    test.beforeEach(async () => {
      await grid.freezeColumnByApi(DEFAULT, 0);
      await grid.freezeColumnByApi(DEFAULT, 1);
    });

    test('is drawn above the frozen columns when the drop is between two of them', async () => {
      const guideline = await grid.holdDragAndProbeGuideline(DEFAULT, 'col5', 'col2', 'before');

      expect(guideline.visible).toBe(true);
      expect(Math.abs(guideline.left - guideline.edge)).toBeLessThanOrEqual(2);
    });

    test('is drawn above the frozen columns when the drop is in front of the first one', async () => {
      const guideline = await grid.holdDragAndProbeGuideline(DEFAULT, 'col5', 'col1', 'before');

      expect(guideline.visible).toBe(true);
      expect(Math.abs(guideline.left - guideline.edge)).toBeLessThanOrEqual(2);
    });

    test('is drawn when the drop is at the freeze line', async () => {
      const guideline = await grid.holdDragAndProbeGuideline(DEFAULT, 'col5', 'col2', 'after');

      expect(guideline.visible).toBe(true);
      expect(Math.abs(guideline.left - guideline.edge)).toBeLessThanOrEqual(2);
    });

    test('is drawn at the drop spot in a grid the page scrolls, away from the page edge', async () => {
      await grid.freezeColumnByApi(WINDOW, 0);
      await grid.freezeColumnByApi(WINDOW, 1);
      await grid.scrollPageSideways(300);

      const between = await grid.holdDragAndProbeGuideline(WINDOW, 'col4', 'col2', 'before');

      expect(between.visible).toBe(true);
      expect(Math.abs(between.left - between.edge)).toBeLessThanOrEqual(2);

      const front = await grid.holdDragAndProbeGuideline(WINDOW, 'col5', 'col1', 'before');

      expect(front.visible).toBe(true);
      expect(Math.abs(front.left - front.edge)).toBeLessThanOrEqual(2);
    });

    test('is drawn on the next drag too, after one that ended over the frozen columns', async () => {
      const first = await grid.holdDragAndProbeGuideline(DEFAULT, 'col5', 'col2', 'before');

      expect(first.visible).toBe(true);
      expect(Math.abs(first.left - first.edge)).toBeLessThanOrEqual(2);

      // The first drag moved col5 to the freeze line. A second one, over the scrollable columns, has to find
      // the guideline and the backlight back in the master table.
      const second = await grid.holdDragAndProbeGuideline(DEFAULT, 'col7', 'col6', 'before');

      expect(second.visible).toBe(true);
      expect(Math.abs(second.left - second.edge)).toBeLessThanOrEqual(2);
      expect(second.backlightCount).toBe(1);
    });

    test('is drawn between scrollable columns, the control', async () => {
      const guideline = await grid.holdDragAndProbeGuideline(DEFAULT, 'col5', 'col4', 'before');

      expect(guideline.visible).toBe(true);
      expect(Math.abs(guideline.left - guideline.edge)).toBeLessThanOrEqual(2);
    });
  });

  test.describe('the selection after a menu action', () => {
    test('stays on the column that was frozen', async () => {
      await grid.pickFromHeaderContextMenu(DEFAULT, 'col6', FREEZE_LABEL);

      expect(await grid.selectedColumnNames(DEFAULT)).toEqual(['col6']);
    });

    test('stays on the column that was unfrozen, at the freeze line', async () => {
      await grid.pickFromHeaderContextMenu(DEFAULT, 'col6', FREEZE_LABEL);
      await grid.freezeColumnByApi(DEFAULT, 3);
      await grid.pickFromHeaderContextMenu(DEFAULT, 'col6', UNFREEZE_LABEL);

      expect(await grid.selectedColumnNames(DEFAULT)).toEqual(['col6']);
    });

    test('follows the unfrozen column to its restored position', async () => {
      await grid.pickFromHeaderContextMenu(RESTORE, 'col6', FREEZE_LABEL);
      await grid.pickFromHeaderContextMenu(RESTORE, 'col6', UNFREEZE_LABEL);

      expect(await grid.columnOrder(RESTORE)).toEqual(IDENTITY);
      expect(await grid.selectedColumnNames(RESTORE)).toEqual(['col6']);
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

    test('puts the column back at its place in data order with restoreColumnPosition', async () => {
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

    test('never lands the restored column in the fixedColumnsEnd band', async () => {
      // The band holds col1, which comes before col8 in data order. The restored column must still stop
      // before the band.
      expect(await grid.columnOrder(RESTORE_END))
        .toEqual(['col2', 'col3', 'col4', 'col5', 'col6', 'col7', 'col8', 'col1']);

      await grid.pickFromHeaderContextMenu(RESTORE_END, 'col8', FREEZE_LABEL);
      await grid.pickFromHeaderContextMenu(RESTORE_END, 'col8', UNFREEZE_LABEL);

      await expect.poll(() => grid.columnOrder(RESTORE_END))
        .toEqual(['col2', 'col3', 'col4', 'col5', 'col6', 'col7', 'col8', 'col1']);
      await expect(grid.grid(RESTORE_END).locator('.ht_clone_top_inline_end_corner [data-testid="header-col1"]'))
        .toBeVisible();
    });

    test('undoes and redoes a restore in one step', async () => {
      await grid.pickFromHeaderContextMenu(RESTORE, 'col6', FREEZE_LABEL);
      await grid.pickFromHeaderContextMenu(RESTORE, 'col6', UNFREEZE_LABEL);

      await expect.poll(() => grid.columnOrder(RESTORE)).toEqual(IDENTITY);

      await grid.undo(RESTORE);

      expect(await grid.columnOrder(RESTORE))
        .toEqual(['col6', 'col1', 'col2', 'col3', 'col4', 'col5', 'col7', 'col8']);
      expect(await grid.fixedColumnsStart(RESTORE)).toBe(1);

      await grid.redo(RESTORE);

      expect(await grid.columnOrder(RESTORE)).toEqual(IDENTITY);
      expect(await grid.fixedColumnsStart(RESTORE)).toBe(0);
    });
  });
});
