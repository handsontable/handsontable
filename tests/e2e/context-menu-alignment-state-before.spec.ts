import { test, expect } from '../fixtures/test';
import { ContextMenuAlignmentStateBeforePage } from '../fixtures/pages/ContextMenuAlignmentStateBeforePage';

/**
 * DEV-857. The `stateBefore` argument of `beforeCellAlignment` is the alignment the selected cells
 * had before the change. It used to hold each cell's whole `className`, so a custom class such as
 * `htBlue` came through as if it were an alignment. It now holds the alignment class names only, and
 * `undefined` for a cell that has none.
 *
 * Column 0 of the fixture holds one `className` case per row (see the fixture's comment).
 */
test.describe('stateBefore of the beforeCellAlignment hook', () => {
  let grid: ContextMenuAlignmentStateBeforePage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ContextMenuAlignmentStateBeforePage(page, theme, bundle);
    await grid.goto();
  });

  test('leaves a custom class out when the cell has no alignment class', async () => {
    await grid.selectCells([0, 0]);
    await grid.alignThroughMenu([0, 0], 'Left');

    expect(await grid.alignmentLog()).toEqual([[[0, [null]]]]);
    // The custom class is still on the cell: only the snapshot is narrowed, not the write.
    expect(await grid.className(0, 0)).toBe('htBlue htLeft');
  });

  test('reports only the alignment class when a custom class sits beside it', async () => {
    await grid.selectCells([1, 0]);
    await grid.alignThroughMenu([1, 0], 'Left');

    expect(await grid.alignmentLog()).toEqual([[[1, ['htCenter']]]]);
    expect(await grid.className(1, 0)).toBe('htBlue htLeft');
  });

  test('reads an array className the same way', async () => {
    await grid.selectCells([2, 0]);
    await grid.alignThroughMenu([2, 0], 'Left');

    expect(await grid.alignmentLog()).toEqual([[[2, ['htTop']]]]);
    // Left is a horizontal action, so the vertical `htTop` stays beside the custom class.
    expect(await grid.className(2, 0)).toBe('htBlue htTop htLeft');
  });

  test('keeps reporting no state for a cell that has no class at all', async () => {
    // The control for the tests above: an unset cell was `undefined` before and must stay so.
    await grid.selectCells([3, 0]);
    await grid.alignThroughMenu([3, 0], 'Left');

    expect(await grid.alignmentLog()).toEqual([[[3, [null]]]]);
  });

  test('leaves out the alignment class a renderer adds', async () => {
    // The precondition: the numeric cell shows right-aligned through the renderer's class alone.
    await expect(grid.cell(4, 1)).toHaveClass(/htRight/);

    await grid.selectCells([4, 1]);
    await grid.alignThroughMenu([4, 1], 'Left');

    expect(await grid.alignmentLog()).toEqual([[[4, [null, null]]]]);
  });

  test('keeps the undo step intact when a hook listener edits stateBefore', async () => {
    await grid.mutateStateBeforeInHook();
    await grid.selectCells([1, 0]);
    await grid.alignThroughMenu([1, 0], 'Left');
    await grid.undo();

    // The listener emptied the object it was given. The undo listeners must still see the snapshot.
    expect(await grid.alignmentLog()).toEqual([[[1, ['htCenter']]]]);
    expect(await grid.undoLog()).toEqual([[[1, ['htCenter']]]]);
  });

  test('reports every cell of a multi-row selection', async () => {
    await grid.selectCells([0, 0], [3, 0]);
    await grid.alignThroughMenu([3, 0], 'Right');

    expect(await grid.alignmentLog()).toEqual([[
      [0, [null]],
      [1, ['htCenter']],
      [2, ['htTop']],
      [3, [null]],
    ]]);
  });

  test('hands the same narrowed state to the undo listeners and restores the cell on undo', async () => {
    await grid.selectCells([0, 0]);
    await grid.alignThroughMenu([0, 0], 'Left');
    await grid.undo();

    expect(await grid.undoLog()).toEqual([[[0, [null]]]]);
    // Undo replays the cell meta writes, so the custom class survives and the alignment is gone.
    expect(await grid.className(0, 0)).toBe('htBlue');
  });
});
