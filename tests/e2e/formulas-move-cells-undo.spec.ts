import { test, expect } from '../fixtures/test';
import { FormulasMoveCellsPage } from '../fixtures/pages/FormulasMoveCellsPage';

/**
 * Formulas + moveCells undo/redo integration (migrated from the frozen Jasmine
 * suite). Undoing a move must restore both the HyperFormula sheet and HOT's
 * raw source data; redo must re-apply the move without duplicating the engine
 * operation.
 */
test.describe('Formulas: moveCells undo/redo integration', () => {
  let grid: FormulasMoveCellsPage;

  test.beforeEach(async ({ page, theme }) => {
    grid = new FormulasMoveCellsPage(page, theme);
    await grid.goto();
    // B1 = '=A1+10' → computed as 11 (A1=1) — the dataset every case starts from.
    await grid.initGrid([[1, '=A1+10'], [null, null], [null, null]]);
  });

  test('undo restores a moved formula cell: source recomputes and target is cleared', async () => {
    await grid.expectCell(0, 1, '11');

    await grid.moveRange([0, 1, 0, 1], [2, 1]);

    // After the move: B1 cleared, B3 holds the formula computing 11.
    expect(await grid.cellValue(0, 1)).toBe(null);
    await grid.expectCell(2, 1, '11');

    await grid.undo();

    // After undo: B3 cleared, B1 restored with a formula that recomputes to 11.
    await grid.expectCell(0, 1, '11');
    expect(await grid.cellValue(2, 1)).toBe(null);
  });

  test('redo re-applies the move after undo', async () => {
    await grid.moveRange([0, 1, 0, 1], [2, 1]);
    await grid.undo();

    // Confirm the undone state first.
    await grid.expectCell(0, 1, '11');
    expect(await grid.cellValue(2, 1)).toBe(null);

    await grid.redo();

    // After redo: the move is re-applied — B3 holds the formula, B1 is cleared.
    await grid.expectCell(2, 1, '11');
    expect(await grid.cellValue(0, 1)).toBe(null);
  });

  test('moves formulas normally after a redo', async () => {
    await grid.moveRange([0, 1, 0, 1], [2, 1]);
    await grid.undo();
    await grid.redo();

    await expect(grid.moveRange([2, 1, 2, 1], [1, 1])).resolves.toBe(true);
    await grid.expectCell(1, 1, '11');
    expect(await grid.cellValue(2, 1)).toBe(null);
  });

  test('keeps formulas synchronized when a redo move is vetoed', async () => {
    await grid.moveRange([0, 1, 0, 1], [2, 1]);
    await grid.undo();
    await grid.vetoNextMove();
    await grid.redo();

    await grid.expectCell(0, 1, '11');
    expect(await grid.cellValue(2, 1)).toBe(null);

    await expect(grid.moveRange([0, 1, 0, 1], [1, 1])).resolves.toBe(true);
    await grid.expectCell(1, 1, '11');
    expect(await grid.cellValue(0, 1)).toBe(null);
  });

  test('clears the redo state after a non-moveCells redo', async () => {
    // Regression for a pre-existing bug this PR fixes: the plugin registered its redo-state reset
    // on `afterUndo` (twice) instead of `afterRedo`, so `setPerformRedo(false)` never ran after a
    // redo and the flag leaked until the next undo — for EVERY action type, not just move_cells.
    await grid.setCellValue(2, 0, 5);
    await grid.undo();
    await grid.redo();

    expect(await grid.isFormulasSyncerInUndoRedo()).toBe(false);
  });

  test('moves a formula cell correctly right after a non-moveCells redo', async () => {
    // The behavioral consequence of the leaked redo flag: `commitPendingMoveCells` treats
    // `isPerformingUndoRedo()` as "undo/redo replay — skip the engine operation", so the next
    // user-initiated move would silently skip `engine.moveCells` and desync the engine from
    // the grid.
    await grid.setCellValue(2, 0, 5);
    await grid.undo();
    await grid.redo();

    await expect(grid.moveRange([0, 1, 0, 1], [2, 1])).resolves.toBe(true);

    // The engine op ran: B3 computes the relocated formula, B1 is cleared.
    await grid.expectCell(2, 1, '11');
    expect(await grid.cellValue(0, 1)).toBe(null);
  });

  test('cancels the redo without desyncing when a global listener returns a truthy non-action', async ({ page }) => {
    // `Hooks.run` threads a listener's truthy return into the next listener's first argument.
    // Without a trustworthy `actionType` the Formulas plugin cannot pick the engine step
    // (`engine.redo()` vs the move_cells replay path), so it cancels the redo — no crash,
    // no HyperFormula advance, and no leaked redo flag.
    await grid.moveRange([0, 1, 0, 1], [2, 1]);
    await grid.undo();

    await page.evaluate(() => {
      window.Handsontable.hooks.add('beforeRedo', () => 'garbage');
    });

    await grid.redo();

    // The redo was cancelled: the grid still shows the undone state, consistently in both
    // the data and the engine.
    await grid.expectCell(0, 1, '11');
    expect(await grid.cellValue(2, 1)).toBe(null);
    expect(await grid.isFormulasSyncerInUndoRedo()).toBe(false);
  });

  test('undo of a copy keeps the source and restores the overwritten target', async () => {
    await grid.expectCell(0, 1, '11');

    await grid.moveRange([0, 1, 0, 1], [2, 1], true);

    // After the copy: B1 still computes; B3 got a relative-shifted copy
    // ('=A3+10'; A3=null → 10).
    await grid.expectCell(0, 1, '11');
    await grid.expectCell(2, 1, '10');

    await grid.undo();

    // After undo: B3 restored to null; B1 keeps its formula.
    await grid.expectCell(0, 1, '11');
    expect(await grid.cellValue(2, 1)).toBe(null);
  });

  test('preserves the source formula string in source data after undo', async () => {
    await grid.moveRange([0, 1, 0, 1], [2, 1]);
    await grid.undo();

    // The formula STRING (not just the computed value) is restored at the
    // source, and the target's source data is cleared.
    expect(await grid.sourceCellValue(0, 1)).toBe('=A1+10');
    expect(await grid.sourceCellValue(2, 1)).toBe(null);
  });
});
