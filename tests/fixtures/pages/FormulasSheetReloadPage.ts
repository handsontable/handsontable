import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import './windowTypes';

/**
 * Page Object for the sheet-reload fixture (DEV-1143): a grid built without `data`, bound to a
 * shared HyperFormula sheet of 15 columns, with a button that resends its settings.
 */
export class FormulasSheetReloadPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly rerenderButton: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.rerenderButton = page.getByTestId('rerender');
  }

  /** Navigate to the fixture and wait until the engine sheet is loaded into the grid. */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/formulas-sheet-reload.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toHaveText('R0C0');
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** Scroll the grid to its last column and click the first-row cell there, so it takes the focus. */
  async selectLastColumnFirstRow(): Promise<void> {
    await this.page.evaluate(() => {
      window.hot.scrollViewportTo({ row: 0, col: window.hot.countCols() - 1 });
    });
    await expect(this.cell(0, 14)).toHaveText('R0C14');
    await this.cell(0, 14).click();
    await expect.poll(() => this.page.evaluate(() => {
      const highlight = window.hot.getSelectedRangeActive()?.highlight;

      return highlight ? [highlight.row, highlight.col] : null;
    })).toEqual([0, 14]);
  }

  /** Click the button that resends the settings, the way a framework re-render does. */
  async rerender(): Promise<void> {
    await this.rerenderButton.click();
  }

  /** `countCols()`, read through the public API. */
  async countCols(): Promise<number> {
    return this.page.evaluate(() => window.hot.countCols());
  }

  /** The number of columns the engine sheet holds. */
  async engineSheetWidth(): Promise<number> {
    return this.page.evaluate(() => {
      const formulas = window.hot.getPlugin('formulas');

      return formulas.engine && formulas.sheetId !== null ?
        formulas.engine.getSheetDimensions(formulas.sheetId).width : -1;
    });
  }
}
