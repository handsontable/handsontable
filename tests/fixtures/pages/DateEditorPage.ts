import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the native date editor fixture.
 *
 * Wraps the grid seeded with a `date` column that has `allowInvalid: false` (see
 * `tests/fixtures/demo/date-editor.html`). Cells carry a `data-testid` stamped by the fixture's
 * afterRenderer hook; the native `<input type="date">` is located by its stable type/class hooks
 * because Handsontable renders it without a test id.
 */
export class DateEditorPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly editorInput: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.editorInput = page.locator('input[type="date"].handsontableInput');
  }

  /**
   * Navigate to the fixture and wait for the grid to render, with a web-first wait on the first cell.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/date-editor.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 1)).toBeVisible();
  }

  /**
   * A single data cell, by visual row and column, via its stable test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Selects a cell with a click, so the editor can be opened from the keyboard.
   */
  async selectCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).click();
  }

  /**
   * Opens the editor in full edit mode on the selected cell, which seeds the input with the cell's date.
   */
  async openEditorWithEnter(row: number, col: number): Promise<void> {
    await this.selectCell(row, col);
    await this.page.keyboard.press('Enter');
    await expect(this.editorInput).toBeVisible();
  }

  /**
   * The raw source value of a cell, which is the ISO string, not the formatted text.
   */
  async sourceAt(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(
      ([r, c]) => (window as unknown as { hot: { getSourceDataAtCell: (r: number, c: number) => unknown } })
        .hot.getSourceDataAtCell(r, c),
      [row, col]
    );
  }

  /**
   * Whether the active editor is open.
   */
  async isEditorOpened(): Promise<boolean> {
    return this.page.evaluate(
      () => (window as unknown as { hot: { getActiveEditor: () => { isOpened: () => boolean } } })
        .hot.getActiveEditor().isOpened()
    );
  }
}
