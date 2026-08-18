import { test, expect } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * moveCells undo/redo without the Formulas plugin (migrated from the frozen Jasmine suite). The
 * formulas-backed equivalents live in `formulas-move-cells-undo.spec.ts`, which runs a different
 * engine path — HyperFormula relocates the cells there, so both need covering.
 *
 * The fixture's data is `R<row+1>C<col+1>`, so cell (2, 2) reads `R3C3`.
 */
test.describe('moveCells undo/redo', () => {
  let grid: SelectionFeaturesPage;

  test.beforeEach(async ({ page, theme }) => {
    grid = new SelectionFeaturesPage(page, theme);
    await grid.goto();
    await grid.initGrid({ undo: true });
  });

  test('undo restores the source and the overwritten target; redo re-applies the move', async () => {
    await grid.moveCellRange([2, 2, 3, 3], [5, 5]);

    expect(await grid.cellValue(5, 5)).toBe('R3C3');
    expect(await grid.cellValue(2, 2)).toBe(null);

    await grid.undo();

    expect(await grid.cellValue(2, 2)).toBe('R3C3');
    // The value the move overwrote must come back too, not just the source.
    expect(await grid.cellValue(5, 5)).toBe('R6C6');

    await grid.redo();

    expect(await grid.cellValue(5, 5)).toBe('R3C3');
    expect(await grid.cellValue(2, 2)).toBe(null);
  });

  test('undo of a copy clears the target and leaves the source alone', async () => {
    await grid.moveCellRange([2, 2, 3, 3], [5, 5], true);

    expect(await grid.cellValue(2, 2)).toBe('R3C3');
    expect(await grid.cellValue(5, 5)).toBe('R3C3');

    await grid.undo();

    // The source was never modified by a copy, so undo must not touch it.
    expect(await grid.cellValue(2, 2)).toBe('R3C3');
    expect(await grid.cellValue(5, 5)).toBe('R6C6');
  });

  test('undo and redo a multi-cell range move', async () => {
    await grid.moveCellRange([0, 0, 1, 1], [5, 5]);

    expect(await grid.cellValue(5, 5)).toBe('R1C1');
    expect(await grid.cellValue(6, 6)).toBe('R2C2');
    expect(await grid.cellValue(0, 0)).toBe(null);
    expect(await grid.cellValue(1, 1)).toBe(null);

    await grid.undo();

    expect(await grid.cellValue(0, 0)).toBe('R1C1');
    expect(await grid.cellValue(1, 1)).toBe('R2C2');
    expect(await grid.cellValue(5, 5)).toBe('R6C6');
    expect(await grid.cellValue(6, 6)).toBe('R7C7');

    await grid.redo();

    expect(await grid.cellValue(5, 5)).toBe('R1C1');
    expect(await grid.cellValue(6, 6)).toBe('R2C2');
    expect(await grid.cellValue(0, 0)).toBe(null);
    expect(await grid.cellValue(1, 1)).toBe(null);
  });

  test('undo restores the className meta at both ends', async () => {
    await grid.initGrid({
      undo: true,
      cell: [
        { row: 2, col: 2, className: 'my-cell' },
        { row: 5, col: 5, className: 'target-cell' },
      ],
    });

    await grid.moveCellRange([2, 2, 2, 2], [5, 5]);

    expect(await grid.cellClassName(5, 5)).toBe('my-cell');
    expect(await grid.cellClassName(2, 2)).not.toBe('my-cell');

    await grid.undo();

    expect(await grid.cellClassName(2, 2)).toBe('my-cell');
    // The target's own meta must be restored, not merely cleared.
    expect(await grid.cellClassName(5, 5)).toBe('target-cell');
  });

  test('redo after undo ends in the moved state', async () => {
    await grid.moveCellRange([2, 2, 3, 3], [5, 5]);
    await grid.undo();
    await grid.redo();

    expect(await grid.cellValue(5, 5)).toBe('R3C3');
    expect(await grid.cellValue(2, 2)).toBe(null);
  });

  test('keeps the move available for redo when the redo is vetoed', async () => {
    await grid.moveCellRange([2, 2, 3, 3], [5, 5]);
    await grid.undo();

    await grid.setBeforeMoveCellsVeto(true);
    await grid.redo();

    // A rejected redo must put the action back on the undone stack, not swallow it.
    expect(await grid.isRedoAvailable()).toBe(true);
    expect(await grid.isUndoAvailable()).toBe(false);
    expect(await grid.cellValue(2, 2)).toBe('R3C3');
    expect(await grid.cellValue(5, 5)).not.toBe('R3C3');

    await grid.setBeforeMoveCellsVeto(false);
    await grid.redo();

    expect(await grid.doneActionsCount()).toBe(1);
    expect(await grid.cellValue(2, 2)).toBe(null);
    expect(await grid.cellValue(5, 5)).toBe('R3C3');
  });

  test('does not register a second undo action when the redo re-runs the move', async () => {
    await grid.moveCellRange([2, 2, 3, 3], [5, 5]);

    expect(await grid.doneActionsCount()).toBe(1);

    await grid.undo();
    await grid.redo();

    // The redo calls `moveCellRange` again; its `afterMoveCells` must not record a fresh action.
    expect(await grid.doneActionsCount()).toBe(1);
  });
});
