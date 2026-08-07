import { test, expect } from '../fixtures/test';
import { FormulasGridPage } from '../fixtures/pages/FormulasGridPage';

/**
 * Fill-handle drag over a RANGE selection with dates + formulas — migrated
 * from the skipped formulas autofill spec "should populate dates and formulas
 * referencing to them properly" (DEV-99: the legacy simulated-drag helper
 * could only grab the single-cell `.current.corner` handle, never the range
 * `.area.corner`, and could not drag past the viewport). A real mouse drag
 * exercises both, including the grid's auto-scroll when the pointer passes
 * the grid's bottom edge (DEV-2183).
 */
test.describe('fill handle over a formulas range', () => {
  test('populates dates and formulas from a range dragged below the viewport', async ({ page, theme }) => {
    const grid = new FormulasGridPage(page, theme);

    await grid.goto();

    // Rows 2-3 (a date row + a formula row referencing it), columns C-E.
    await grid.selectRange(1, 2, 2, 4);

    // Drag the range handle below the 130px-high grid — the pointer leaves
    // the grid viewport, auto-scroll kicks in, and the gesture finishes on
    // the last row once it scrolls into view.
    await grid.dragAreaFillHandleToCell(6, 4);

    // The 2-row pattern repeats down the grid: every filled cell renders the
    // same date the source range showed (the last row lives below the grid's
    // 130px viewport, so this also proves the auto-scrolled fill reached it)
    // and passes date validation. The legacy spec's engine-level assertions
    // (getSheetValues/getSheetSerialized serials) are deliberately dropped:
    // they pinned HyperFormula's internal date bridging, which the rendered
    // values + raw source below already prove end-to-end.
    for (const row of [3, 4, 5, 6]) {
      for (const col of [2, 3, 4]) {
        await expect(grid.cell(row, col)).toHaveText('02/28/1900');
        await expect(grid.cell(row, col)).not.toHaveClass(/htInvalid/);
      }
    }

    // The raw source alternates dates and reference-shifted formulas — the
    // fill semantics the legacy spec encoded, minus its pre-ISO date shapes.
    expect(await grid.sourceData()).toEqual([
      [null, null, null, null, null],
      [null, null, '1900-02-28', '1900-02-28', '1900-02-28'],
      [null, null, '=C2', '=D2', '=E2'],
      [null, null, '1900-02-28', '1900-02-28', '1900-02-28'],
      [null, null, '=C4', '=D4', '=E4'],
      [null, null, '1900-02-28', '1900-02-28', '1900-02-28'],
      [null, null, '=C6', '=D6', '=E6'],
    ]);
  });
});
