import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { GridLayoutsPage, type GridLayout } from '../fixtures/pages/GridLayoutsPage';

/**
 * A cell edited through the editor is undone and then redone with the keyboard shortcuts, and each
 * step leaves the whole grid's data, the rendered cell and the selection where they belong.
 *
 * The cross-browser visual suite photographed this sequence on six demo routes
 * (`visual-tests/tests/cross-browser/undo-redo.spec.ts`, 54 goldens until DEV-3257), with nothing
 * asserting that Enter committed the edit or that the undo restored it: an editor left open, or an
 * undo that restored a different cell, would have become the golden. Each case here rebuilds one
 * route's shape in `fixtures/demo/grid-layouts.html` and edits the cell the visual spec edited –
 * the third rendered row and the third rendered column, so the visual indexes skip a hidden column.
 *
 * The data is compared whole, not only at the edited cell: an undo that wrote the old value back
 * through the wrong index mapping (the sorted shape, where visual row 2 is physical row 27) restores
 * the edited cell's text somewhere else and leaves `test` behind. On the cell-types shape the edited
 * cell is numeric, as the demo's "Cost" column is, so the text is kept and marked invalid; the undo
 * clears the mark and the redo sets it again, which the retired captures showed and this asserts.
 */

type UndoCase = {
  layout: GridLayout,
  route: string,
  cell: [number, number],
  // Where Enter moves the selection after the commit: one VISIBLE row down.
  afterEnter: [number, number],
  // A numeric cell: `test` is kept and marked invalid.
  numeric?: true,
};

const CASES: UndoCase[] = [
  // Columns 0 and 2 are hidden, so the third rendered column is column 4.
  { layout: 'frozen-hidden', route: '/cell-types-demo', cell: [2, 4], afterEnter: [3, 4], numeric: true },
  { layout: 'rtl-nested-headers', route: '/arabic-rtl-demo', cell: [2, 2], afterEnter: [3, 2] },
  { layout: 'custom-borders', route: '/custom-style-demo', cell: [2, 2], afterEnter: [3, 2] },
  { layout: 'merged-sorted', route: '/merged-cells-demo', cell: [2, 2], afterEnter: [3, 2] },
  { layout: 'nested-headers', route: '/nested-headers-demo', cell: [2, 2], afterEnter: [3, 2] },
  // Column 1 is hidden, and rows 3, 4 and 5 are, so Enter lands on row 6.
  { layout: 'nested-rows', route: '/nested-rows-demo', cell: [2, 3], afterEnter: [6, 3] },
];

test.describe('undo and redo of a cell edit with the keyboard', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: GridLayoutsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new GridLayoutsPage(page, theme, bundle);
  });

  for (const { layout, route, cell: [row, column], afterEnter: [nextRow, nextColumn], numeric } of CASES) {
    test(`commits, undoes and redoes an edit on the ${route} shape`, async() => {
      await grid.goto(layout);

      const original = await grid.dataAt(row, column);
      const before = await grid.data();

      // The edit commits on Enter, and Enter moves the selection one visible row down.
      await grid.editCell(row, column, 'test');

      expect(await grid.dataAt(row, column)).toBe('test');
      await expect(grid.cell(row, column)).toHaveText('test');
      expect(await grid.selected()).toEqual([[nextRow, nextColumn, nextRow, nextColumn]]);

      if (numeric) {
        // Validation is asynchronous, so the mark is polled for.
        await expect.poll(async() => grid.cellValid(row, column)).toBe(false);
        await expect(grid.cell(row, column)).toHaveClass(/(^|\s)htInvalid(\s|$)/);
      }

      const edited = await grid.data();

      // The edit is the only change: the cell that changed is the one that was clicked.
      expect(edited.flat().filter((value, index) => value !== before.flat()[index])).toEqual(['test']);

      // Undo writes the old value back, everywhere, and selects the cell it changed.
      await grid.undoWithKeyboard();

      await expect(grid.cell(row, column)).toHaveText(String(original));
      expect(await grid.data()).toEqual(before);
      expect(await grid.selected()).toEqual([[row, column, row, column]]);

      if (numeric) {
        await expect.poll(async() => grid.cellValid(row, column)).toBe(true);
        await expect(grid.cell(row, column)).not.toHaveClass(/(^|\s)htInvalid(\s|$)/);
      }

      // Redo applies the edit again, and selects the same cell.
      await grid.redoWithKeyboard();

      await expect(grid.cell(row, column)).toHaveText('test');
      expect(await grid.data()).toEqual(edited);
      expect(await grid.selected()).toEqual([[row, column, row, column]]);

      if (numeric) {
        await expect.poll(async() => grid.cellValid(row, column)).toBe(false);
        await expect(grid.cell(row, column)).toHaveClass(/(^|\s)htInvalid(\s|$)/);
      }
    });
  }
});
