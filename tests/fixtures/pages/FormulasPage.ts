import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Sheet identifiers used by the formulas Playwright fixture.
 */
export type FormulasSheet = 'revenue' | 'expenses';

/**
 * Page Object for the formulas Playwright fixture.
 */
export class FormulasPage {
  readonly page: Page;
  readonly theme: string;
  readonly revenueGrid: Locator;
  readonly expensesGrid: Locator;

  /**
   * Default grid used by same-sheet formula interactions.
   */
  readonly grid: Locator;

  constructor(page: Page, theme = 'main') {
    this.page = page;
    this.theme = theme;
    this.revenueGrid = page.getByTestId('grid-revenue');
    this.expensesGrid = page.getByTestId('grid-expenses');
    this.grid = this.revenueGrid;
  }

  /**
   * Navigate to the formulas fixture and wait for both sheet grids.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/formulas.html?theme=${this.theme}`);
    await expect(this.cell(0, 0, 'revenue')).toBeVisible();
    await expect(this.cell(0, 0, 'expenses')).toBeVisible();
  }

  /**
   * Returns the locator for a fixture sheet grid.
   */
  sheetGrid(sheet: FormulasSheet = 'revenue'): Locator {
    return sheet === 'expenses' ? this.expensesGrid : this.revenueGrid;
  }

  /**
   * A single data cell in a fixture sheet.
   */
  cell(row: number, col: number, sheet: FormulasSheet = 'revenue'): Locator {
    return this.sheetGrid(sheet).locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * A column header in a fixture sheet.
   */
  columnHeader(col: number, sheet: FormulasSheet = 'revenue'): Locator {
    return this.sheetGrid(sheet).locator('.ht_clone_top').getByTestId(`col-header-${col}`);
  }

  /**
   * A row header in a fixture sheet.
   */
  rowHeader(row: number, sheet: FormulasSheet = 'revenue'): Locator {
    return this.sheetGrid(sheet).locator('.ht_clone_inline_start').getByTestId(`row-header-${row}`);
  }

  /**
   * The active (open) formula editor textarea.
   */
  editor(): Locator {
    return this.page.locator('.handsontableInputHolder:not(.ht_editor_hidden) .handsontableInput');
  }

  /**
   * The active editor holder that toggles visibility via CSS class.
   */
  editorHolder(): Locator {
    return this.page.locator('.handsontableInputHolder:not(.ht_editor_hidden)');
  }

  /**
   * Open the editor on a cell and type a formula prefix without committing.
   */
  async beginFormulaEdit(
    row: number,
    col: number,
    value: string,
    sheet: FormulasSheet = 'revenue',
  ): Promise<void> {
    await this.cell(row, col, sheet).click();
    await this.page.keyboard.press('F2');
    const editor = this.editor();
    await expect(editor).toBeVisible();
    await editor.fill(value);
  }

  /**
   * Click a cell while the editor is open.
   */
  async clickCellWhileEditing(
    row: number,
    col: number,
    sheet: FormulasSheet = 'revenue',
  ): Promise<void> {
    await this.cell(row, col, sheet).click();
  }

  /**
   * Click a column header while the editor is open.
   */
  async clickColumnHeaderWhileEditing(
    col: number,
    sheet: FormulasSheet = 'revenue',
  ): Promise<void> {
    await this.columnHeader(col, sheet).click();
  }

  /**
   * Click a row header while the editor is open.
   */
  async clickRowHeaderWhileEditing(
    row: number,
    sheet: FormulasSheet = 'revenue',
  ): Promise<void> {
    await this.rowHeader(row, sheet).click();
  }

  /**
   * Drag from one cell to another while the editor is open.
   */
  async dragCellsWhileEditing(
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
    sheet: FormulasSheet = 'revenue',
  ): Promise<void> {
    await this.cell(fromRow, fromCol, sheet).dragTo(this.cell(toRow, toCol, sheet));
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

  /**
   * Assert the cell editor is closed.
   */
  async expectEditorClosed(): Promise<void> {
    await expect(this.page.locator('.handsontableInputHolder:not(.ht_editor_hidden)')).toHaveCount(0);
  }

  /**
   * The colored formula-reference overlay under the active editor textarea.
   */
  editorReferenceHighlightLayer(): Locator {
    return this.editorHolder().locator('.handsontableInputReferenceHighlight');
  }

  /**
   * A colored reference token in the editor highlight overlay.
   */
  editorReferenceToken(colorIndex: number): Locator {
    return this.editorReferenceHighlightLayer().locator(`.ht-formula-reference-${colorIndex}`);
  }

  /**
   * Grid borders painted for a formula reference color on a sheet.
   */
  referenceBorders(colorIndex: number, sheet: FormulasSheet = 'revenue'): Locator {
    return this.sheetGrid(sheet).locator(
      `.wtBorder[style*="--ht-formula-reference-color-${colorIndex}"]`,
    );
  }

  /**
   * Assert a formula reference token is colored in the editor overlay.
   */
  async expectEditorReferenceToken(text: string, colorIndex: number): Promise<void> {
    const token = this.editorReferenceToken(colorIndex).filter({ hasText: text });

    await expect(token).toBeVisible();
    await expect(token).toHaveText(text);
  }

  /**
   * Assert a cell has the fill highlight for a formula reference color.
   */
  async expectCellReferenceFill(
    row: number,
    col: number,
    colorIndex: number,
    sheet: FormulasSheet = 'revenue',
  ): Promise<void> {
    await expect(this.cell(row, col, sheet)).toHaveClass(
      new RegExp(`formula-reference-area-${colorIndex}`),
    );
  }

  /**
   * Assert a cell does not have a formula reference fill highlight.
   */
  async expectNoCellReferenceFill(
    row: number,
    col: number,
    sheet: FormulasSheet = 'revenue',
  ): Promise<void> {
    await expect(this.cell(row, col, sheet)).not.toHaveClass(/formula-reference-area-\d+/);
  }

  /**
   * Assert a sheet shows borders for a formula reference color.
   */
  async expectReferenceBorder(
    colorIndex: number,
    sheet: FormulasSheet = 'revenue',
  ): Promise<void> {
    await expect(
      this.referenceBorders(colorIndex, sheet).filter({ visible: true }).first(),
    ).toBeVisible();
  }

  /**
   * Assert a sheet has no visible formula reference borders.
   */
  async expectNoReferenceBorder(
    colorIndex: number,
    sheet: FormulasSheet = 'revenue',
  ): Promise<void> {
    await expect(
      this.referenceBorders(colorIndex, sheet).filter({ visible: true }),
    ).toHaveCount(0);
  }

  /**
   * Assert no formula reference fills or colored borders remain on a sheet.
   */
  async expectNoFormulaReferenceHighlights(sheet: FormulasSheet = 'revenue'): Promise<void> {
    const grid = this.sheetGrid(sheet);

    await expect(grid.locator('[class*="formula-reference-area-"]')).toHaveCount(0);
    await expect(
      grid.locator('.wtBorder[style*="--ht-formula-reference-color-"]').filter({ visible: true }),
    ).toHaveCount(0);
  }
}
