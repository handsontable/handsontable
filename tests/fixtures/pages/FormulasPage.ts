import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the formulas Playwright fixture.
 */
export class FormulasPage {
  readonly page: Page;
  readonly theme: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main') {
    this.page = page;
    this.theme = theme;
    this.grid = page.getByTestId('grid-revenue');
  }

  /**
   * Navigate to the formulas fixture and wait for the first grid cell.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/formulas.html?theme=${this.theme}`);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A single data cell in the fixture grid.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * A column header in the fixture grid.
   */
  columnHeader(col: number): Locator {
    return this.grid.locator('.ht_clone_top').getByTestId(`col-header-${col}`);
  }

  /**
   * A row header in the fixture grid.
   */
  rowHeader(row: number): Locator {
    return this.grid.locator('.ht_clone_inline_start').getByTestId(`row-header-${row}`);
  }

  /**
   * The active formula editor textarea.
   */
  editor(): Locator {
    return this.page.locator('.handsontableInput');
  }

  /**
   * Open the editor on a cell and type a formula prefix without committing.
   */
  async beginFormulaEdit(row: number, col: number, value: string): Promise<void> {
    await this.cell(row, col).click();
    await this.page.keyboard.press('F2');
    const editor = this.editor();
    await expect(editor).toBeVisible();
    await editor.fill(value);
  }

  /**
   * Click a cell while the editor is open.
   */
  async clickCellWhileEditing(row: number, col: number): Promise<void> {
    await this.cell(row, col).click();
  }

  /**
   * Click a column header while the editor is open.
   */
  async clickColumnHeaderWhileEditing(col: number): Promise<void> {
    await this.columnHeader(col).click();
  }

  /**
   * Click a row header while the editor is open.
   */
  async clickRowHeaderWhileEditing(row: number): Promise<void> {
    await this.rowHeader(row).click();
  }

  /**
   * Drag from one cell to another while the editor is open.
   */
  async dragCellsWhileEditing(
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ): Promise<void> {
    await this.cell(fromRow, fromCol).dragTo(this.cell(toRow, toCol));
  }

  /**
   * Assert the editor still shows the expected formula text.
   */
  async expectEditorValue(value: string): Promise<void> {
    const editor = this.editor();
    await expect(editor).toHaveValue(value);
    await expect(editor).toBeVisible();
  }

  /**
   * Assert the formula editor textarea owns the browser focus.
   */
  async expectEditorFocused(): Promise<void> {
    await expect(this.editor()).toBeFocused();
  }
}
