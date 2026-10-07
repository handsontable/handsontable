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

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new FormulasMoveCellsPage(page, theme, bundle);
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

  test('redoes the move when a global listener returns a truthy non-action', async ({ page }) => {
    // `Hooks.run` threads a listener's truthy return into the next listener's first argument. The
    // Formulas plugin no longer reads the step from `beforeRedo` - it follows the restored grid - so
    // a garbage argument there changes nothing, and the redo lands in both the data and the engine.
    await grid.moveRange([0, 1, 0, 1], [2, 1]);
    await grid.undo();

    await page.evaluate(() => {
      window.Handsontable.hooks.add('beforeRedo', () => 'garbage');
    });

    await grid.redo();

    await grid.expectCell(2, 1, '11');
    expect(await grid.cellValue(0, 1)).toBe(null);
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

  test('restores a dependent formula in the passed data array after undo', async () => {
    // C1 points at A1:A3. Moving that range makes HyperFormula rewrite C1, and the rewrite is
    // written into the array the developer owns. Undo has to put the original back there too: the
    // rewrite is part of the move's own undo step.
    await grid.initGrid([
      [1, null, '=SUM(A1:A3)'],
      [2, null, null],
      [3, null, null],
    ]);

    await grid.moveRange([0, 0, 2, 0], [0, 1]);

    expect((await grid.rawData())[0][2]).toBe('=SUM(B1:B3)');

    await grid.undo();

    expect((await grid.rawData())[0][2]).toBe('=SUM(A1:A3)');
    expect(await grid.sourceCellValue(0, 2)).toBe('=SUM(A1:A3)');
  });
});
