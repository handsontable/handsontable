import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object for the numeric-cell E2E fixture.
 *
 * Encapsulates the selectors and interactions used to exercise the numeric
 * editor / valueSetter path: editing a cell, reopening its editor, and reading
 * back what the editor textarea shows. Specs express intent; the DOM mechanics
 * live here. Cells are addressed by stable `data-testid`; waits are web-first.
 */
export class NumericGridPage {
  readonly page: Page;
  readonly theme: string;
  readonly grid: Locator;
  readonly editor: Locator;
  readonly columnHeader: Locator;

  constructor(page: Page, theme = 'main') {
    this.page = page;
    this.theme = theme;
    this.grid = page.getByTestId('grid');
    this.editor = page.locator('.handsontableInput');
    this.columnHeader = page.locator('.ht_clone_top thead th').filter({ hasText: 'Amount' });
  }

  /**
   * Navigate to the fixture and wait for the grid to render. The active theme is
   * passed as a query param so the fixture loads the matching stylesheet.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/numeric.html?theme=${this.theme}`);
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

  /** Open a cell's editor, replace its content with a value, and commit it. */
  async editCell(row: number, col: number, value: string): Promise<void> {
    await this.openEditor(row, col);
    await this.editor.fill(value);
    await this.editor.press('Enter');
  }

  /** Open a cell's editor in full-edit mode and wait until it is visible. */
  async openEditor(row: number, col: number): Promise<void> {
    await this.cell(row, col).dblclick();
    await expect(this.editor).toBeVisible();
  }

  /** Click the "Amount" column header to toggle column sorting. */
  async sortColumn(): Promise<void> {
    await this.columnHeader.click();
  }
}
