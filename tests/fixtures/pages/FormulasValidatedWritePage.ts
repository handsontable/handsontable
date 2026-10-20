import { type Page, type Locator } from '@playwright/test';
import { awaitBundle } from '../bundle';
import './windowTypes';
import type { CellValue } from './windowTypes';

/**
 * Page object for the validated-write fixture (`formulas-validated-write.html`): a Formulas grid
 * with a validated column and a hook that calls `updateSettings()` in the same task as the edit.
 */
export class FormulasValidatedWritePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /** Open the fixture and wait for the bundle. */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/formulas-validated-write.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
  }

  /** A data cell in the master table, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Type a value into a cell through the editor, the way a user does: click the cell, Enter to
   * open the editor, type, and Enter to commit.
   */
  async typeInEditor(row: number, col: number, value: string): Promise<void> {
    await this.cell(row, col).click();
    await this.page.keyboard.press('Enter');
    await this.page.keyboard.type(value);
    await this.page.keyboard.press('Enter');
  }

  /** `getSourceDataAtCell()`, read in the page. */
  async sourceDataAtCell(row: number, col: number): Promise<CellValue> {
    return this.page.evaluate(([r, c]) => window.hot.getSourceDataAtCell(r, c), [row, col]);
  }
}
