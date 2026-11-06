import { test, expect, THEMES_TAG } from '../fixtures/test';
import { NumericClassNameTypeChangePage as Page } from '../fixtures/pages/NumericClassNameTypeChangePage';

const NUMERIC_TOKENS = /\bhtRight\b/;
const NUMERIC_MARKER = /\bhtNumeric\b/;
const RIGHT_ALIGNED = 'right';
const NOT_RIGHT_ALIGNED = /^(start|left)$/;

/**
 * `numericRenderer` appends `htRight htNumeric` onto the `className` the cell meta stores.
 * When the user set that `className` through `setCellMeta()` or the `cell` option, an
 * `updateSettings()` that changed a column `type` or the grid-level `type` replayed it, renderer
 * tokens included, so the cell kept `htRight htNumeric` after it stopped being numeric.
 *
 * Expected: the renderer tokens are gone, the user's classes stay, and the cell looks like one in a
 * grid created with the new type. A token the user set explicitly (the Alignment menu's Right) stays.
 */
test.describe('numericRenderer tokens after a type change', { tag: THEMES_TAG }, () => {
  let grid: Page;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new Page(page, theme, bundle);
    await grid.goto();
  });

  /**
   * The cell is numeric, carries the user's class, and is right-aligned.
   */
  async function expectNumericWithMarker(gridId: string, row: number, column: number): Promise<void> {
    const cell = grid.cell(gridId, row, column);

    await expect(cell).toHaveClass(/\bmyMarker\b/);
    await expect(cell).toHaveClass(NUMERIC_TOKENS);
    await expect(cell).toHaveClass(NUMERIC_MARKER);
    await expect(cell).toHaveCSS('text-align', RIGHT_ALIGNED);
  }

  /**
   * The cell kept the user's class and no longer looks numeric.
   */
  async function expectMarkerOnly(gridId: string, row: number, column: number): Promise<void> {
    const cell = grid.cell(gridId, row, column);

    await expect(cell).toHaveClass(/\bmyMarker\b/);
    await expect(cell).not.toHaveClass(NUMERIC_TOKENS);
    await expect(cell).not.toHaveClass(NUMERIC_MARKER);
    await expect(cell).toHaveCSS('text-align', NOT_RIGHT_ALIGNED);
    expect(await grid.storedClassName(gridId, row, column)).toBe('myMarker');
  }

  /**
   * The cell no longer looks numeric, and the cell meta holds none of the renderer's class names.
   */
  async function expectNoRendererTokens(gridId: string, row: number, column: number): Promise<void> {
    const cell = grid.cell(gridId, row, column);

    await expect(cell).not.toHaveClass(NUMERIC_TOKENS);
    await expect(cell).not.toHaveClass(NUMERIC_MARKER);
    await expect(cell).toHaveCSS('text-align', NOT_RIGHT_ALIGNED);
    expect(String(await grid.storedClassName(gridId, row, column) ?? '')).not.toMatch(NUMERIC_TOKENS);
    expect(String(await grid.storedClassName(gridId, row, column) ?? '')).not.toMatch(NUMERIC_MARKER);
  }

  test.describe('a className the user stored', () => {
    test('set through setCellMeta() loses the tokens when its column becomes text', async() => {
      await grid.setClassName(Page.SET_CELL_META, 0, 0, 'myMarker');
      await expectNumericWithMarker(Page.SET_CELL_META, 0, 0);

      await grid.switchFirstColumnToText(Page.SET_CELL_META);

      await expectMarkerOnly(Page.SET_CELL_META, 0, 0);
      // The column that stayed numeric is not collateral damage.
      await expect(grid.cell(Page.SET_CELL_META, 0, 1)).toHaveClass(NUMERIC_TOKENS);
      await expect(grid.cell(Page.SET_CELL_META, 0, 1)).toHaveClass(NUMERIC_MARKER);
      await expect(grid.cell(Page.SET_CELL_META, 0, 1)).toHaveCSS('text-align', RIGHT_ALIGNED);
    });

    test('set through the cell option loses the tokens when its column becomes text', async() => {
      await expectNumericWithMarker(Page.CELL_OPTION, 0, 0);

      await grid.switchFirstColumnToText(Page.CELL_OPTION);

      await expectMarkerOnly(Page.CELL_OPTION, 0, 0);
      await expect(grid.cell(Page.CELL_OPTION, 0, 1)).toHaveClass(NUMERIC_TOKENS);
      await expect(grid.cell(Page.CELL_OPTION, 0, 1)).toHaveClass(NUMERIC_MARKER);
    });

    test('loses the tokens when the grid-level type becomes text', async() => {
      await grid.setClassName(Page.GRID_LEVEL, 0, 0, 'myMarker');
      await expectNumericWithMarker(Page.GRID_LEVEL, 0, 0);

      await grid.switchGridTypeToText(Page.GRID_LEVEL);

      await expectMarkerOnly(Page.GRID_LEVEL, 0, 0);
    });

    test('keeps every class of an array className and loses the tokens', async() => {
      await grid.setClassName(Page.ARRAY, 0, 0, ['a', 'b']);
      await expect(grid.cell(Page.ARRAY, 0, 0)).toHaveClass(NUMERIC_TOKENS);

      await grid.switchFirstColumnToText(Page.ARRAY);

      const cell = grid.cell(Page.ARRAY, 0, 0);

      await expect(cell).toHaveClass(/\ba\b/);
      await expect(cell).toHaveClass(/\bb\b/);
      await expect(cell).not.toHaveClass(NUMERIC_TOKENS);
      await expect(cell).not.toHaveClass(NUMERIC_MARKER);
      await expect(cell).toHaveCSS('text-align', NOT_RIGHT_ALIGNED);
      // The renderer has always joined an array into a string, so the stored value is the same
      // classes in string form.
      expect(await grid.storedClassName(Page.ARRAY, 0, 0)).toBe('a b');
    });
  });

  test.describe('a className journaled for undo or copied by moveCells', () => {
    test('undo of a later className write brings back the user class without the tokens', async() => {
      await grid.setClassName(Page.UNDO_LATER_WRITE, 0, 0, 'myMarker');
      await expectNumericWithMarker(Page.UNDO_LATER_WRITE, 0, 0);

      await grid.setClassName(Page.UNDO_LATER_WRITE, 0, 0, 'myMarker2');
      await expect(grid.cell(Page.UNDO_LATER_WRITE, 0, 0)).toHaveClass(/\bmyMarker2\b/);
      await expect(grid.cell(Page.UNDO_LATER_WRITE, 0, 0)).toHaveClass(NUMERIC_TOKENS);

      await grid.undo(Page.UNDO_LATER_WRITE);

      // The undo took the later write back, and the cell is still numeric.
      await expect(grid.cell(Page.UNDO_LATER_WRITE, 0, 0)).not.toHaveClass(/\bmyMarker2\b/);
      await expectNumericWithMarker(Page.UNDO_LATER_WRITE, 0, 0);

      await grid.switchFirstColumnToText(Page.UNDO_LATER_WRITE);

      await expectMarkerOnly(Page.UNDO_LATER_WRITE, 0, 0);
    });

    test('moveCells of a plain numeric cell does not hand the tokens to the destination', async() => {
      const destination = grid.cell(Page.MOVE_PLAIN, 2, 0);

      await expect(destination).toHaveClass(NUMERIC_TOKENS);
      await expect(destination).toHaveClass(NUMERIC_MARKER);
      await expect(destination).toHaveCSS('text-align', RIGHT_ALIGNED);

      expect(await grid.moveCell(Page.MOVE_PLAIN, [0, 0], [2, 0])).toBe(true);
      await expect(destination).toHaveText('1');
      await expect(destination).toHaveClass(NUMERIC_TOKENS);

      await grid.switchFirstColumnToText(Page.MOVE_PLAIN);

      await expectNoRendererTokens(Page.MOVE_PLAIN, 2, 0);
    });

    test('moveCells of a numeric cell with a user class moves the class and not the tokens', async() => {
      await grid.setClassName(Page.MOVE_WITH_CLASS, 0, 0, 'myMarker');
      await expectNumericWithMarker(Page.MOVE_WITH_CLASS, 0, 0);

      expect(await grid.moveCell(Page.MOVE_WITH_CLASS, [0, 0], [2, 0])).toBe(true);
      await expect(grid.cell(Page.MOVE_WITH_CLASS, 2, 0)).toHaveText('1');
      await expectNumericWithMarker(Page.MOVE_WITH_CLASS, 2, 0);

      await grid.switchFirstColumnToText(Page.MOVE_WITH_CLASS);

      await expectMarkerOnly(Page.MOVE_WITH_CLASS, 2, 0);
    });

    test('moveCells of a text cell onto a cell that drew numeric and became text clears the target', async() => {
      const target = grid.cell(Page.MOVE_ONTO_RENDERED, 2, 1);

      await expect(target).toHaveClass(NUMERIC_TOKENS);

      await grid.setCellType(Page.MOVE_ONTO_RENDERED, 2, 1, 'text');
      // The cell still holds the class names the renderer stored when it drew the cell as numeric.
      await expect(target).toHaveClass(NUMERIC_TOKENS);

      expect(await grid.moveCell(Page.MOVE_ONTO_RENDERED, [0, 0], [2, 1])).toBe(true);
      await expect(target).toHaveText('1');
      await expect(target).not.toHaveClass(NUMERIC_TOKENS);
      await expect(target).not.toHaveClass(NUMERIC_MARKER);
      await expect(target).toHaveCSS('text-align', NOT_RIGHT_ALIGNED);
    });

    test('undo of a row removal restores the user class without the tokens', async() => {
      await grid.setClassName(Page.UNDO_ROW_REMOVAL, 0, 0, 'myMarker');
      await expectNumericWithMarker(Page.UNDO_ROW_REMOVAL, 0, 0);

      await grid.removeRow(Page.UNDO_ROW_REMOVAL, 0);
      // The row is gone: the cell on its place now shows the next row.
      await expect(grid.cell(Page.UNDO_ROW_REMOVAL, 0, 0)).toHaveText('3');
      await expect(grid.cell(Page.UNDO_ROW_REMOVAL, 0, 0)).not.toHaveClass(/\bmyMarker\b/);

      await grid.undo(Page.UNDO_ROW_REMOVAL);

      await expect(grid.cell(Page.UNDO_ROW_REMOVAL, 0, 0)).toHaveText('1');
      await expectNumericWithMarker(Page.UNDO_ROW_REMOVAL, 0, 0);

      await grid.switchFirstColumnToText(Page.UNDO_ROW_REMOVAL);

      await expectMarkerOnly(Page.UNDO_ROW_REMOVAL, 0, 0);
    });
  });

  test.describe('a className the user writes after the cell was drawn', () => {
    test('keeps a renderer class name the user writes, and drops the ones they did not write', async() => {
      await grid.setClassName(Page.SET_CELL_META, 0, 0, 'htNumeric mine');
      await expect(grid.cell(Page.SET_CELL_META, 0, 0)).toHaveClass(NUMERIC_TOKENS);

      await grid.switchFirstColumnToText(Page.SET_CELL_META);

      const cell = grid.cell(Page.SET_CELL_META, 0, 0);

      await expect(cell).toHaveClass(/\bmine\b/);
      await expect(cell).toHaveClass(NUMERIC_MARKER);
      await expect(cell).not.toHaveClass(NUMERIC_TOKENS);
      await expect(cell).toHaveCSS('text-align', NOT_RIGHT_ALIGNED);
    });

    test('Alignment > Top does not make the right alignment the cell drew the user\'s', async() => {
      await grid.alignCellThroughMenu(Page.ALIGNMENT, 0, 0, 'Top');
      await expect(grid.cell(Page.ALIGNMENT, 0, 0)).toHaveClass(/\bhtTop\b/);
      await expect(grid.cell(Page.ALIGNMENT, 0, 0)).toHaveClass(NUMERIC_TOKENS);

      await grid.switchFirstColumnToText(Page.ALIGNMENT);

      const cell = grid.cell(Page.ALIGNMENT, 0, 0);

      await expect(cell).toHaveClass(/\bhtTop\b/);
      await expect(cell).not.toHaveClass(NUMERIC_TOKENS);
      await expect(cell).not.toHaveClass(NUMERIC_MARKER);
      await expect(cell).toHaveCSS('text-align', NOT_RIGHT_ALIGNED);
    });

    test('undo and redo of an Alignment > Middle pick do not make the drawn right alignment the user\'s', async() => {
      await grid.alignCellThroughMenu(Page.ALIGNMENT, 0, 0, 'Middle');
      await expect(grid.cell(Page.ALIGNMENT, 0, 0)).toHaveClass(/\bhtMiddle\b/);

      await grid.undo(Page.ALIGNMENT);
      await expect(grid.cell(Page.ALIGNMENT, 0, 0)).not.toHaveClass(/\bhtMiddle\b/);

      await grid.redo(Page.ALIGNMENT);
      await expect(grid.cell(Page.ALIGNMENT, 0, 0)).toHaveClass(/\bhtMiddle\b/);

      await grid.switchFirstColumnToText(Page.ALIGNMENT);

      const cell = grid.cell(Page.ALIGNMENT, 0, 0);

      await expect(cell).toHaveClass(/\bhtMiddle\b/);
      await expect(cell).not.toHaveClass(NUMERIC_TOKENS);
      await expect(cell).not.toHaveClass(NUMERIC_MARKER);
    });

    test('a rendered className the user writes back with one more class is theirs', async() => {
      await grid.setClassName(Page.SET_CELL_META, 0, 0, 'myMarker');
      await expectNumericWithMarker(Page.SET_CELL_META, 0, 0);

      await grid.writeRenderedClassNameBack(Page.SET_CELL_META, 0, 0, 'foo');
      await grid.switchFirstColumnToText(Page.SET_CELL_META);

      const cell = grid.cell(Page.SET_CELL_META, 0, 0);

      // The written value carries `htRight`, so it stays: documented in the cell type guide.
      await expect(cell).toHaveClass(/\bfoo\b/);
      await expect(cell).toHaveClass(NUMERIC_TOKENS);
    });
  });

  test.describe('controls', () => {
    test('restating the numeric type keeps the user class and the tokens', async() => {
      await grid.setClassName(Page.RESTATE, 0, 0, 'myMarker');
      await expectNumericWithMarker(Page.RESTATE, 0, 0);

      await grid.restateNumericColumns(Page.RESTATE);

      await expectNumericWithMarker(Page.RESTATE, 0, 0);
    });

    test('an alignment the user chose in the Alignment menu survives the type change', async() => {
      await grid.alignCellThroughMenu(Page.ALIGNMENT, 0, 0, 'Right');

      const cell = grid.cell(Page.ALIGNMENT, 0, 0);

      await expect(cell).toHaveClass(NUMERIC_TOKENS);
      expect(await grid.storedClassName(Page.ALIGNMENT, 0, 0)).toMatch(NUMERIC_TOKENS);

      await grid.switchFirstColumnToText(Page.ALIGNMENT);

      await expect(cell).toHaveClass(NUMERIC_TOKENS);
      await expect(cell).not.toHaveClass(NUMERIC_MARKER);
      await expect(cell).toHaveCSS('text-align', RIGHT_ALIGNED);
      expect(await grid.storedClassName(Page.ALIGNMENT, 0, 0)).toMatch(NUMERIC_TOKENS);
    });

    test('a cell with no className of its own is clean after the switch (baseline)', async() => {
      const cell = grid.cell(Page.BASELINE, 0, 0);

      await expect(cell).toHaveClass(NUMERIC_TOKENS);
      await expect(cell).toHaveClass(NUMERIC_MARKER);

      await grid.switchFirstColumnToText(Page.BASELINE);

      await expect(cell).not.toHaveClass(NUMERIC_TOKENS);
      await expect(cell).not.toHaveClass(NUMERIC_MARKER);
      await expect(cell).toHaveCSS('text-align', NOT_RIGHT_ALIGNED);
    });
  });
});
