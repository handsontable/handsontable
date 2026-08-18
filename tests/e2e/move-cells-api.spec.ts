import { test, expect } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * `MoveCells#moveCellRange` — the programmatic move/copy API behind the drag interaction
 * (migrated from the frozen Jasmine suite).
 *
 * The fixture's data is `R<row+1>C<col+1>`, so cell (2, 2) reads `R3C3`.
 */
test.describe('moveCells moveCellRange API', () => {
  let grid: SelectionFeaturesPage;

  test.beforeEach(async ({ page, theme }) => {
    grid = new SelectionFeaturesPage(page, theme);
    await grid.goto();
    await grid.initGrid();
  });

  test('moves a range to the target, clears the source, and selects the target', async () => {
    expect(await grid.moveCellRange([2, 2, 3, 3], [5, 5])).toBe(true);

    expect(await grid.cellValue(5, 5)).toBe('R3C3');
    expect(await grid.cellValue(6, 6)).toBe('R4C4');
    expect(await grid.cellValue(2, 2)).toBe(null);
    expect(await grid.selectedBounds()).toEqual({ top: 5, start: 5, bottom: 6, end: 6 });
  });

  test('keeps the source when isCopy is true', async () => {
    expect(await grid.moveCellRange([2, 2, 3, 3], [5, 5], true)).toBe(true);

    expect(await grid.cellValue(2, 2)).toBe('R3C3');
    expect(await grid.cellValue(5, 5)).toBe('R3C3');
  });

  test('vetoes the move when beforeMoveCells returns false', async () => {
    await grid.setBeforeMoveCellsVeto(true);

    expect(await grid.moveCellRange([2, 2, 3, 3], [5, 5])).toBe(false);

    expect(await grid.cellValue(2, 2)).toBe('R3C3');
    expect(await grid.cellValue(5, 5)).toBe('R6C6');
  });

  test('fires afterMoveCells with the source range, target range, and isCopy', async () => {
    await grid.moveCellRange([2, 2, 3, 3], [5, 5]);

    const after = (await grid.hookLog()).filter(record => record.hook === 'afterMoveCells');

    expect(after).toHaveLength(1);
    expect(after[0].source).toEqual([2, 2, 3, 3]);
    expect(after[0].target).toEqual([5, 5, 6, 6]);
    expect(after[0].isCopy).toBe(false);
  });

  test('vetoes the move when the target overlaps a read-only cell', async () => {
    await grid.initGrid({ cell: [{ row: 5, col: 5, readOnly: true }] });

    expect(await grid.moveCellRange([2, 2, 3, 3], [5, 5])).toBe(false);
    expect(await grid.cellValue(2, 2)).toBe('R3C3');
  });

  test('vetoes the move when the SOURCE overlaps a read-only cell', async () => {
    // Without this veto the move silently degrades into a copy: `populateFromArray` skips read-only
    // cells, so the target is written while the source survives and the data ends up duplicated.
    await grid.initGrid({ cell: [{ row: 2, col: 2, readOnly: true }] });

    expect(await grid.moveCellRange([2, 2, 3, 3], [5, 5])).toBe(false);
    expect(await grid.cellValue(2, 2)).toBe('R3C3');
    expect(await grid.cellValue(5, 5)).toBe('R6C6');
  });

  test('allows a COPY whose source overlaps a read-only cell', async () => {
    // A copy never clears the source, so a read-only source cell is harmless.
    await grid.initGrid({ cell: [{ row: 2, col: 2, readOnly: true }] });

    expect(await grid.moveCellRange([2, 2, 3, 3], [5, 5], true)).toBe(true);
    expect(await grid.cellValue(2, 2)).toBe('R3C3');
    expect(await grid.cellValue(5, 5)).toBe('R3C3');
  });

  test('moves the className meta with the data', async () => {
    await grid.initGrid({ cell: [{ row: 2, col: 2, className: 'my-cell' }] });

    await grid.moveCellRange([2, 2, 2, 2], [5, 5]);

    expect(await grid.cellClassName(5, 5)).toBe('my-cell');
    expect(await grid.cellClassName(2, 2)).not.toBe('my-cell');
  });

  test('keeps the source className when isCopy is true', async () => {
    await grid.initGrid({ cell: [{ row: 2, col: 2, className: 'my-cell' }] });

    await grid.moveCellRange([2, 2, 2, 2], [5, 5], true);

    expect(await grid.cellClassName(5, 5)).toBe('my-cell');
    expect(await grid.cellClassName(2, 2)).toBe('my-cell');
  });

  test('vetoes the move when the target intersects a merged cell', async () => {
    await grid.initGrid({ mergeCells: [{ row: 5, col: 5, rowspan: 2, colspan: 2 }] });

    expect(await grid.moveCellRange([2, 2, 3, 3], [5, 5])).toBe(false);
    expect(await grid.cellValue(2, 2)).toBe('R3C3');
  });

  test('moves data correctly when the target overlaps the source range', async () => {
    // Source 2x2 at rows 2-3, cols 2-3; target top-left (2, 3) overlaps column 3.
    await grid.moveCellRange([2, 2, 3, 3], [2, 3]);

    expect(await grid.cellValue(2, 3)).toBe('R3C3');
    expect(await grid.cellValue(2, 4)).toBe('R3C4');
    expect(await grid.cellValue(3, 3)).toBe('R4C3');
    expect(await grid.cellValue(3, 4)).toBe('R4C4');
    // The non-overlapping column of the source is cleared.
    expect(await grid.cellValue(2, 2)).toBe(null);
    expect(await grid.cellValue(3, 2)).toBe(null);
  });

  test('moves the className meta correctly when the target overlaps the source range', async () => {
    await grid.initGrid({
      cell: [
        { row: 2, col: 2, className: 'meta-a' },
        { row: 2, col: 3, className: 'meta-b' },
      ],
    });

    await grid.moveCellRange([2, 2, 2, 3], [2, 3]);

    // (2,3) receives (2,2)'s meta and (2,4) receives (2,3)'s ORIGINAL meta — an in-place move would
    // overwrite (2,3)'s meta before reading it and duplicate 'meta-a' into (2,4).
    expect(await grid.cellClassName(2, 3)).toBe('meta-a');
    expect(await grid.cellClassName(2, 4)).toBe('meta-b');
    expect(await grid.cellClassName(2, 2)).not.toBe('meta-a');
  });

  test('vetoes the move when the target range would overflow the grid bounds', async () => {
    // Target (9, 9) with a 2x2 range reaches row/col 10 — past the 10x10 grid's last index.
    expect(await grid.moveCellRange([2, 2, 3, 3], [9, 9])).toBe(false);
    expect(await grid.cellValue(2, 2)).toBe('R3C3');
  });

  test('does not fire beforeMoveCells for a move rejected by bounds validation', async () => {
    await grid.moveCellRange([2, 2, 3, 3], [9, 9]);

    // Validation runs before the hook, so listeners never observe a rejected move.
    expect(await grid.hookLog()).toHaveLength(0);
  });

  test('does not fire beforeMoveCells for a move rejected by a read-only target', async () => {
    await grid.initGrid({ cell: [{ row: 5, col: 5, readOnly: true }] });

    await grid.moveCellRange([2, 2, 3, 3], [5, 5]);

    expect(await grid.hookLog()).toHaveLength(0);
  });

  test('does not fire beforeMoveCells for a move rejected by a read-only source', async () => {
    // The source veto must also precede the hook — and, with Formulas active, precede the engine
    // call that would otherwise leave HyperFormula desynced from the data source.
    await grid.initGrid({ cell: [{ row: 2, col: 2, readOnly: true }] });

    await grid.moveCellRange([2, 2, 3, 3], [5, 5]);

    expect(await grid.hookLog()).toHaveLength(0);
  });
});
