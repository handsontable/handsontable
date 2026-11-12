import { type Page, type Locator } from '@playwright/test';
import { awaitBundle } from '../bundle';
import './windowTypes';
import type { CellValue } from './windowTypes';

/**
 * Page object for the sheet-built grid fixture (`formulas-sheet-built-grid-sort.html`): a Formulas
 * grid bound to an engine sheet, built without `data`, with `columnSorting` enabled.
 */
export class FormulasSheetBuiltGridSortPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Open the fixture and wait for the bundle.
   *
   * @param rowMove `'array'` builds the grid with `manualRowMove: [2, 0, 1]`.
   * @param validator `'held'` gives column B a validator that holds its callback until `answerValidations()`.
   */
  async goto(rowMove: 'none' | 'array' = 'none', validator: 'none' | 'held' = 'none'): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/formulas-sheet-built-grid-sort.html?theme=${this.theme}&bundle=${this.bundle}`
        + `&rowMove=${rowMove}&validator=${validator}`
    );
    await awaitBundle(this.page);
  }

  /**
   * A data cell in the master table, by visual row/column, via its stable test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The sorting label of a column header, scoped to the top overlay.
   */
  sortLabel(col: number): Locator {
    return this.page.locator('.ht_clone_top').getByTestId(`col-header-${col}`).locator('span.colHeader');
  }

  /**
   * Sort by a column the way a user does: click its header.
   */
  async sortByHeader(col: number): Promise<void> {
    await this.sortLabel(col).click();
  }

  /**
   * `updateSettings({})`, the call a React or Vue re-render makes, run in the page.
   */
  async updateSettingsWithNothing(): Promise<void> {
    await this.page.evaluate(() => window.hot.updateSettings({}));
  }

  /**
   * How many validator calls of column B wait for their answer.
   */
  async heldValidationCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { heldValidations: unknown[] }).heldValidations.length);
  }

  /**
   * Answers every validator call of column B that waits.
   *
   * @param valid The answer.
   */
  async answerValidations(valid: boolean): Promise<void> {
    await this.page.evaluate((answer) => {
      const held = (window as unknown as { heldValidations: Array<(value: boolean) => void> }).heldValidations;

      held.splice(0).forEach(callback => callback(answer));
    }, valid);
  }

  /**
   * `getSortConfig()` of the ColumnSorting plugin, read in the page.
   */
  async sortConfig(): Promise<unknown> {
    return this.page.evaluate(() => window.hot.getPlugin('columnSorting').getSortConfig());
  }

  /**
   * `clearSort()` of the ColumnSorting plugin, run in the page.
   */
  async clearSort(): Promise<void> {
    await this.page.evaluate(() => window.hot.getPlugin('columnSorting').clearSort());
  }

  /**
   * Writes a value into the bound engine sheet through the engine API, the way a host does, at engine
   * coordinates.
   *
   * @param row The engine row.
   * @param col The engine column.
   * @param value The value.
   */
  async writeEngineCell(row: number, col: number, value: string): Promise<void> {
    await this.page.evaluate(({ r, c, v }) => {
      const formulas = window.hot.getPlugin('formulas') as unknown as {
        sheetId: number,
        engine: { setCellContents(address: object, content: unknown[][]): void },
      };

      formulas.engine.setCellContents({ sheet: formulas.sheetId, row: r, col: c }, [[v]]);
    }, { r: row, c: col, v: value });
  }

  /**
   * The rendered width of a column header cell, in pixels.
   *
   * @param col The visual column.
   */
  async headerWidth(col: number): Promise<number> {
    const box = await this.page.locator('.ht_clone_top').getByTestId(`col-header-${col}`).boundingBox();

    return box?.width ?? 0;
  }

  /**
   * `getDataAtCol()`, read in the page.
   */
  async dataAtCol(col: number): Promise<CellValue[]> {
    return this.page.evaluate((c) => window.hot.getDataAtCol(c), col);
  }
}
