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

  /** The cell is numeric, carries the user's class, and is right-aligned. */
  async function expectNumericWithMarker(gridId: string, row: number, column: number): Promise<void> {
    const cell = grid.cell(gridId, row, column);

    await expect(cell).toHaveClass(/\bmyMarker\b/);
    await expect(cell).toHaveClass(NUMERIC_TOKENS);
    await expect(cell).toHaveClass(NUMERIC_MARKER);
    await expect(cell).toHaveCSS('text-align', RIGHT_ALIGNED);
  }

  /** The cell kept the user's class and no longer looks numeric. */
  async function expectMarkerOnly(gridId: string, row: number, column: number): Promise<void> {
    const cell = grid.cell(gridId, row, column);

    await expect(cell).toHaveClass(/\bmyMarker\b/);
    await expect(cell).not.toHaveClass(NUMERIC_TOKENS);
    await expect(cell).not.toHaveClass(NUMERIC_MARKER);
    await expect(cell).toHaveCSS('text-align', NOT_RIGHT_ALIGNED);
    expect(await grid.storedClassName(gridId, row, column)).toBe('myMarker');
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

  test.describe('controls', () => {
    test('restating the numeric type keeps the user class and the tokens', async() => {
      await grid.setClassName(Page.RESTATE, 0, 0, 'myMarker');
      await expectNumericWithMarker(Page.RESTATE, 0, 0);

      await grid.restateNumericColumns(Page.RESTATE);

      await expectNumericWithMarker(Page.RESTATE, 0, 0);
    });

    test('an alignment the user chose in the Alignment menu survives the type change', async() => {
      await grid.alignCellRightThroughMenu(Page.ALIGNMENT, 0, 0);

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
