import { type Page, type Locator, expect } from '@playwright/test';
import type { CellValue } from './windowTypes';

/**
 * Page Object for the Formulas + moveCells fixture
 * (tests/fixtures/demo/formulas-move-cells.html).
 *
 * The fixture runs a grid with a real HyperFormula engine and `moveCells`
 * enabled. Tests express intent (`initGrid`, `moveRange`, `expectCell`); the
 * selectors and the `window.hot` driving mechanics live here. Cell reads for
 * user-visible results go through the rendered DOM (`data-testid`); raw data
 * reads (`null` vs empty string, computed numbers) go through the instance.
 */
export class FormulasMoveCellsPage {
  readonly page: Page;
  readonly theme: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main') {
    this.page = page;
    this.theme = theme;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture and wait for the grid to render (web-first wait on
   * a real DOM condition).
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/formulas-move-cells.html?theme=${this.theme}`);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Rebuild the grid with this test's dataset — a fresh Handsontable instance
   * and a fresh HyperFormula sheet, so tests stay isolated.
   */
  async initGrid(data: CellValue[][]): Promise<void> {
    await this.page.evaluate(gridData => window.initGrid(gridData), data);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** Assert a cell renders the expected text (web-first, auto-retrying). */
  async expectCell(row: number, col: number, text: string): Promise<void> {
    await expect(this.cell(row, col)).toHaveText(text);
  }

  /**
   * Read a cell's computed data value (`getDataAtCell`) — used where the
   * distinction the test makes (e.g. `null` vs `''`, number vs string) is not
   * expressible through rendered text.
   */
  async cellValue(row: number, col: number): Promise<CellValue> {
    return this.page.evaluate(([r, c]) => window.hot.getDataAtCell(r, c), [row, col]);
  }

  /** Write a value (e.g. a formula string) into a cell through the instance. */
  async setCellValue(row: number, col: number, value: CellValue): Promise<void> {
    await this.page.evaluate(
      ({ r, c, v }) => window.hot.setDataAtCell(r, c, v),
      { r: row, c: col, v: value },
    );
  }

  /** The Formulas plugin's cell type for a cell (e.g. 'FORMULA', 'ARRAYFORMULA'). */
  async formulaCellType(row: number, col: number): Promise<string> {
    return this.page.evaluate(([r, c]) => window.hot.getPlugin('formulas').getCellType(r, c), [row, col]);
  }

  /**
   * Read a cell's raw source data (`getSourceDataAtCell`) — the stored formula
   * string for formula cells, not the computed value.
   */
  async sourceCellValue(row: number, col: number): Promise<CellValue> {
    return this.page.evaluate(([r, c]) => window.hot.getSourceDataAtCell(r, c), [row, col]);
  }

  /** Undo the last operation through the UndoRedo plugin. */
  async undo(): Promise<void> {
    await this.page.evaluate(() => window.hot.getPlugin('undoRedo').undo());
  }

  /** Redo the last undone operation through the UndoRedo plugin. */
  async redo(): Promise<void> {
    await this.page.evaluate(() => window.hot.getPlugin('undoRedo').redo());
  }

  /** Veto the next move through the public beforeMoveCells hook. */
  async vetoNextMove(): Promise<void> {
    await this.page.evaluate(() => window.hot.addHookOnce('beforeMoveCells', () => false));
  }

  /**
   * Select the given range and move (or copy) it so its top-left lands on the
   * target cell, through the `moveCells` plugin API. Resolves to the
   * operation's return value (`false` when vetoed).
   */
  async moveRange(
    [fromRow, fromCol, toRow, toCol]: [number, number, number, number],
    [targetRow, targetCol]: [number, number],
    isCopy = false,
  ): Promise<boolean> {
    return this.page.evaluate(({ from, target, copy }) => {
      const hot = window.hot;

      hot.selectCells([from]);

      return hot.getPlugin('moveCells').moveCellRange(
        hot.getSelectedRangeLast(),
        hot._createCellCoords(target[0], target[1]),
        copy,
      );
    }, { from: [fromRow, fromCol, toRow, toCol], target: [targetRow, targetCol], copy: isCopy });
  }
}
