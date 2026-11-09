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
   */
  async goto(rowMove: 'none' | 'array' = 'none'): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/formulas-sheet-built-grid-sort.html?theme=${this.theme}&bundle=${this.bundle}`
        + `&rowMove=${rowMove}`
    );
    await awaitBundle(this.page);
  }

  /** A data cell in the master table, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /** The sorting label of a column header, scoped to the top overlay. */
  sortLabel(col: number): Locator {
    return this.page.locator('.ht_clone_top').getByTestId(`col-header-${col}`).locator('span.colHeader');
  }

  /** Sort by a column the way a user does: click its header. */
  async sortByHeader(col: number): Promise<void> {
    await this.sortLabel(col).click();
  }

  /**
   * `updateSettings({})`, the call a React or Vue re-render makes, run in the page.
   */
  async updateSettingsWithNothing(): Promise<void> {
    await this.page.evaluate(() => window.hot.updateSettings({}));
  }

  /** `getDataAtCol()`, read in the page. */
  async dataAtCol(col: number): Promise<CellValue[]> {
    return this.page.evaluate((c) => window.hot.getDataAtCol(c), col);
  }
}
