import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import './windowTypes';
import { chromiumAccessibility } from '../accessibility';

/**
 * Page Object for the formula cell description fixture. Row 0 holds the plain values 1 and 2 and
 * the formula `=SUM(A1:B1)` in column C, row 1 plain values, row 2 an array formula in column A
 * with its spilled cell below the origin's row.
 */
export class FormulasCellDescriptionPage {
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

  /**
   * Navigate to the fixture and wait until the engine has evaluated the formula. `ariaTags` is an init-only
   * option, so a grid without ARIA attributes is built that way.
   */
  async goto(options: {
    ariaTags?: 'on' | 'off',
    rows?: 'default' | 'exact',
    render?: 'default' | 'onChange',
    comment?: 'on' | 'off',
    first?: 'default' | 'empty',
    dir?: 'ltr' | 'rtl',
    overflow?: 'on' | 'off',
  } = {}): Promise<void> {
    const { ariaTags = 'on', rows = 'default', render = 'default', comment = 'off', first = 'default', dir = 'ltr',
      overflow = 'off' } = options;

    await this.page.goto(
      `/tests/fixtures/demo/formulas-cell-description.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&ariaTags=${ariaTags}&rows=${rows}&render=${render}&comment=${comment}&first=${first}&dir=${dir}&overflow=${overflow}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 2)).toHaveText(overflow === 'on' ? /^x+$/ : /^\d$/);
  }

  /**
   * A single data cell, by visual row/column, via its stable test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The name Chromium's own accessibility tree gives a cell, which is what a screen reader on Chromium reads
   * from it (Playwright's `toHaveAccessibleName()` computes the name from the DOM and the styles instead).
   */
  async chromiumAccessibleName(row: number, col: number): Promise<string> {
    return (await chromiumAccessibility(this.page, `[data-testid="cell-${row}-${col}"]`)).name;
  }

  /**
   * Write a raw value, or a formula, into a cell.
   */
  async setCellValue(row: number, col: number, value: string): Promise<void> {
    await this.page.evaluate(([r, c, v]) => {
      window.hot.setDataAtCell(r, c, v);
    }, [row, col, value] as [number, number, string]);
  }

  /**
   * Call a method of the Formulas plugin.
   */
  async callFormulas(method: 'showFormulas' | 'hideFormulas' | 'disablePlugin' | 'enablePlugin'): Promise<void> {
    await this.page.evaluate((name) => {
      window.hot.getPlugin('formulas')[name]();
      window.hot.render();
    }, method);
  }

  /**
   * Sort the first column descending through the public API.
   */
  async sortColumnDescending(column: number): Promise<void> {
    await this.page.evaluate((c) => {
      window.hot.getPlugin('columnSorting').sort({ column: c, sortOrder: 'desc' });
    }, column);
  }

  /**
   * Switch the grid to another language pack.
   */
  async setLanguage(languageCode: string, phrases: Record<string, string>): Promise<void> {
    await this.page.evaluate(([code, dictionary]) => {
      const hotClass = (window as any).Handsontable;

      hotClass.languages.registerLanguageDictionary({ languageCode: code, ...dictionary });
      window.hot.updateSettings({ language: code });
    }, [languageCode, phrases] as [string, Record<string, string>]);
  }

  /**
   * The width of what the master holder can scroll, which a cell's content wider than the cell grows.
   */
  async scrollWidth(): Promise<number> {
    return this.page.evaluate(() => document.querySelector('.ht_master .wtHolder')!.scrollWidth);
  }
}
