import { test, expect } from '../fixtures/test';
import { FormulasMoveCellsPage } from '../fixtures/pages/FormulasMoveCellsPage';

/**
 * Formulas + moveCells integration (migrated from the frozen Jasmine suite).
 *
 * The grid runs with a real HyperFormula engine; `moveCellRange` must relocate
 * values and formulas through the engine so references adjust Excel-style, and
 * the post-move data sync must leave HOT's raw data consistent with the
 * engine's state — including when the target range overlaps the source.
 */
test.describe('Formulas: moveCells integration', () => {
  let grid: FormulasMoveCellsPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new FormulasMoveCellsPage(page, theme, bundle);
    await grid.goto();
  });

  test('moves a formula cell and keeps it computing with adjusted references', async () => {
    // B1 = '=A1+10' → computed as 11 (A1=1).
    await grid.initGrid([[1, '=A1+10'], [null, null], [null, null]]);

    await grid.expectCell(0, 1, '11');

    await grid.moveRange([0, 1, 0, 1], [2, 1]);

    // B1 source is cleared; B3 holds the moved formula — A1 was not moved, so it still computes 11.
    expect(await grid.cellValue(0, 1)).toBe(null);
    await grid.expectCell(2, 1, '11');
  });

  test('updates a dependent formula when the referenced cell is moved', async () => {
    // A1=1, B1='=A1'. Move A1 to A3 — HyperFormula adjusts B1's reference to follow A1 (→ '=A3').
    await grid.initGrid([[1, '=A1'], [null, null], [null, null]]);

    await grid.expectCell(0, 1, '1');

    await grid.moveRange([0, 0, 0, 0], [2, 0]);

    expect(await grid.cellValue(0, 0)).toBe(null);
    await grid.expectCell(2, 0, '1');
    // B1's formula was rewritten to =A3 and still computes 1.
    await grid.expectCell(0, 1, '1');
  });

  test('copies a formula cell with adjusted relative references', async () => {
    // Copy B1 ('=A1+10') to B3: relative refs shift by +2 rows → '=A3+10'; A3=null → 10.
    await grid.initGrid([[1, '=A1+10'], [null, null], [null, null]]);

    await grid.expectCell(0, 1, '11');

    await grid.moveRange([0, 1, 0, 1], [2, 1], true);

    // The source is kept (copy) and the target computes with shifted references.
    await grid.expectCell(0, 1, '11');
    await grid.expectCell(2, 1, '10');
  });

  test('moves a multi-cell range of formulas keeping references intact', async () => {
    // A1=5, A2=10, B1='=A1*2', B2='=A2*2'. Move the 2x2 block [A1:B2] to [A3:B4].
    await grid.initGrid([[5, '=A1*2'], [10, '=A2*2'], [null, null], [null, null]]);

    await grid.expectCell(0, 1, '10');
    await grid.expectCell(1, 1, '20');

    await grid.moveRange([0, 0, 1, 1], [2, 0]);

    // Source cleared.
    expect(await grid.cellValue(0, 0)).toBe(null);
    expect(await grid.cellValue(0, 1)).toBe(null);
    expect(await grid.cellValue(1, 0)).toBe(null);
    expect(await grid.cellValue(1, 1)).toBe(null);

    // Target has the moved data; the formulas compute against the moved values (A3=5, A4=10).
    await grid.expectCell(2, 0, '5');
    await grid.expectCell(3, 0, '10');
    await grid.expectCell(2, 1, '10');
    await grid.expectCell(3, 1, '20');
  });

  test('vetoes the HF move when the source holds an array formula', async () => {
    // C1 holds an array formula spilling into C1:D2 via TRANSPOSE. HyperFormula's
    // isItPossibleToMoveCells returns false for it, so the Formulas plugin vetoes
    // the move in its beforeMoveCells listener.
    await grid.initGrid([[1, 2, null, null, null], [3, 4, null, null, null]]);

    await grid.setCellValue(0, 2, '=TRANSPOSE(A1:B2)');

    await expect.poll(() => grid.formulaCellType(0, 2)).toBe('ARRAYFORMULA');

    const before = await grid.cellValue(0, 2);
    const result = await grid.moveRange([0, 2, 0, 2], [0, 4]);

    // Move is vetoed: C1 still holds the array formula value, E1 is unchanged.
    expect(result).toBe(false);
    expect(await grid.cellValue(0, 2)).toBe(before);
    expect(await grid.cellValue(0, 4)).toBe(null);
  });

  test('vetoes the move without crashing when a global listener returns a truthy non-range', async ({ page }) => {
    // `Hooks.run` threads a listener's truthy return value into the next listener's first
    // argument, and global-bucket listeners run before the plugin's internal ones — the Formulas
    // `beforeMoveCells` listener used to crash dereferencing the folded garbage.
    await grid.initGrid([
      [1, '=A1+10'],
      [null, null],
      [null, null],
    ]);

    await page.evaluate(() => {
      window.Handsontable.hooks.add('beforeMoveCells', () => 'garbage');
    });

    const result = await grid.moveRange([0, 1, 0, 1], [2, 1]);

    // Vetoed, not crashed: nothing moved.
    expect(result).toBe(false);
    await grid.expectCell(0, 1, '11');
    expect(await grid.cellValue(2, 1)).toBe(null);
  });

  test('vetoes a move whose visual range spans a trimmed row', async () => {
    // With trimRows: [1], visual rows 0 and 1 map to HF rows 0 and 2 — a non-contiguous block.
    // The engine's moveCells works on a single HF rectangle, which would also relocate the
    // trimmed row 1 the grid never touches, desyncing HyperFormula from the data source.
    await grid.initGrid(
      [
        ['A1', 'B1'],
        ['A2', 'B2'],
        ['A3', 'B3'],
        [null, null],
        [null, null],
      ],
      { trimRows: [1] },
    );

    const result = await grid.moveRange([0, 0, 1, 0], [2, 0]);

    // Vetoed: nothing moved, visually or in the engine.
    expect(result).toBe(false);
    await grid.expectCell(0, 0, 'A1');
    await grid.expectCell(1, 0, 'A3');
    expect(await grid.cellValue(2, 0)).toBe(null);
  });

  test('still moves a range that sits entirely above a trimmed row', async () => {
    // Trimming alone must not disable moveCells — only ranges whose HF mapping is
    // non-contiguous are vetoed.
    await grid.initGrid(
      [
        [1, '=A1+10'],
        [null, null],
        ['trimmed', 'trimmed'],
        [null, null],
      ],
      { trimRows: [2] },
    );

    const result = await grid.moveRange([0, 0, 0, 1], [1, 0]);

    expect(result).toBe(true);
    await grid.expectCell(1, 0, '1');
    await grid.expectCell(1, 1, '11');
  });

  test('vetoes a copy onto an array formula before mutating the grid', async () => {
    // E1 holds an array formula spilling into E1:F2. Pasting a copy over it throws inside
    // HyperFormula, so the copy must be vetoed by the isItPossibleToSetCellContents
    // pre-check BEFORE the grid mutates — no meta/selection change and no undo entry.
    await grid.initGrid([[1, 2, null, null, null, null], [3, 4, null, null, null, null]]);

    await grid.setCellValue(0, 4, '=TRANSPOSE(A1:B2)');

    await expect.poll(() => grid.formulaCellType(0, 4)).toBe('ARRAYFORMULA');

    const result = await grid.moveRange([0, 0, 1, 1], [0, 4], true);

    // The copy is rejected and nothing changed: source intact, array output intact.
    expect(result).toBe(false);
    await grid.expectCell(0, 0, '1');
    await grid.expectCell(0, 4, '1');

    // No undo entry was recorded for the failed copy: undo reverts the array-formula
    // write (the previous action), not a phantom move.
    await grid.undo();
    expect(await grid.cellValue(0, 4)).toBe(null);
    await grid.expectCell(0, 0, '1');
  });

  test('propagates a preceding veto without crashing Formulas or UndoRedo listeners', async () => {
    await grid.initGrid([[1, null], [null, null]]);
    await grid.page.evaluate(() => {
      window.hot.addHook('beforeMoveCells', () => false, -1);
    });

    await expect(grid.moveRange([0, 0, 0, 0], [1, 0])).resolves.toBe(false);
    await grid.expectCell(0, 0, '1');
    expect(await grid.cellValue(1, 0)).toBe(null);
  });

  test('keeps moved values when the target range overlaps the source range', async () => {
    // Source 2x2 value block at A1:B2, target top-left B1 — column B overlaps.
    // Regression: the post-move HOT-data sync must clear the source BEFORE writing
    // the target, otherwise the overlap cells are written and then nulled out.
    await grid.initGrid([[1, 2, null], [3, 4, null], [null, null, null]]);

    await grid.moveRange([0, 0, 1, 1], [0, 1]);

    // The block now occupies B1:C2.
    await grid.expectCell(0, 1, '1');
    await grid.expectCell(0, 2, '2');
    await grid.expectCell(1, 1, '3');
    await grid.expectCell(1, 2, '4');
    // Only the non-overlapping part of the source is cleared.
    expect(await grid.cellValue(0, 0)).toBe(null);
    expect(await grid.cellValue(1, 0)).toBe(null);
  });

  test('moves a plain-value cell when the Formulas plugin is active', async () => {
    // Non-formula cells are also relocated through the engine's moveCells.
    await grid.initGrid([[42, 'hello'], [null, null]]);

    await grid.moveRange([0, 0, 0, 0], [1, 0]);

    expect(await grid.cellValue(0, 0)).toBe(null);
    await grid.expectCell(1, 0, '42');
  });

  test('selects the target only after the engine sync, so listeners never read a stale value', async () => {
    await grid.initGrid([['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3']]);

    const observed = await grid.observeDuringSelectionWhileMoving([0, 0, 0, 0], [2, 0]);

    expect(observed.settled).toBe('A1');
    // Selecting the target before `afterMoveCells` let an `afterSelection` listener read the
    // pre-move value ('A3') at a cell HyperFormula had already rewritten.
    expect(observed.seenDuringSelection.length).toBeGreaterThan(0);
    expect(observed.seenDuringSelection).not.toContain('A3');
    for (const seen of observed.seenDuringSelection) {
      expect(seen).toBe('A1');
    }
  });
});
