import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the `showFormulas()`/`hideFormulas()` fixture (DEV-207). Column A is a plain
 * value, column B a formula, column C a `HYPERLINK` formula.
 */
export class FormulasShowFormulasPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /** Navigate to the fixture and wait until the engine has evaluated the formula. */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/formulas-show-formulas.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 2)).toHaveText('3');
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** The anchor a `HYPERLINK` cell renders, if any. */
  link(row: number, col: number): Locator {
    return this.cell(row, col).locator('a.ht-link.ht-hyperlink');
  }

  /** Click a cell so it becomes the selected one, and wait until the selection lands. */
  async selectCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).click();
    await expect.poll(() => this.page.evaluate(() => {
      const highlight = (window as any).hot.getSelectedRangeActive()?.highlight;

      return highlight ? [highlight.row, highlight.col] : null;
    })).toEqual([row, col]);
  }

  /** `formulas.isShowingFormulas()`. */
  async isShowingFormulas(): Promise<boolean> {
    return this.page.evaluate(() => (window as any).hot.getPlugin('formulas').isShowingFormulas());
  }

  /** `formulas.showFormulas()`, called through the public API. */
  async showFormulasViaApi(): Promise<void> {
    await this.page.evaluate(() => (window as any).hot.getPlugin('formulas').showFormulas());
  }
}
