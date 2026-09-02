import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the FormulaBuilder plugin fixture.
 *
 * Grid cells are addressed via the `data-testid` stamped by the fixture
 * renderer; the formula bar and editor use the stable class names owned by the
 * @hfe/core package (`.hfe-formula-bar`, `.hfe-editor__input`). Waits are
 * condition-based — never fixed timeouts.
 */
export class FormulaBuilderPage {
  readonly page: Page;
  readonly theme: string;
  readonly grid: Locator;
  readonly formulaBar: Locator;
  readonly addressInput: Locator;
  readonly editorInput: Locator;

  constructor(page: Page, theme = 'main') {
    this.page = page;
    this.theme = theme;
    this.grid = page.getByTestId('grid');
    this.formulaBar = page.locator('.hfe-formula-bar').first();
    this.addressInput = page.locator('.hfe-formula-bar__address-input').first();
    this.editorInput = page.locator('.hfe-editor__input').first();
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/formula-builder.html?theme=${this.theme}`);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** Assert a cell shows the expected text (web-first, auto-retrying). */
  async expectCell(row: number, col: number, text: string): Promise<void> {
    await expect(this.cell(row, col)).toHaveText(text);
  }

  /** Click a cell to select it. */
  async selectCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).click();
  }

  /** Open the formula editor on a cell via double click. */
  async openEditor(row: number, col: number): Promise<void> {
    await this.cell(row, col).dblclick();
    await expect(this.editorInput).toBeVisible();
  }

  /** The formula bar's idle (click-to-edit) formula area. */
  get barFormulaArea(): Locator {
    return this.page.locator('.hfe-formula-bar__idle').first();
  }

  /**
   * Start a bar-hosted edit of the selected cell by clicking the bar's formula
   * area, and wait for the shared editor to take focus.
   */
  async openBarEditor(): Promise<void> {
    await this.barFormulaArea.click();
    await expect(this.editorInput).toBeFocused();
  }
}
