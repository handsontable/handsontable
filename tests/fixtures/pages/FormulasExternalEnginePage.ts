import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import './windowTypes';

/**
 * Page object for a grid bound to an engine the page also holds, so a spec can write that engine
 * the way application code does.
 */
export class FormulasExternalEnginePage {
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

  /** Navigate to the fixture and wait until the formula cell shows its calculated value. */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/formulas-external-engine.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 1)).toHaveText('2');
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Writes one cell through the engine instance the grid is bound to.
   *
   * @param value The value passed to `setCellContents`.
   */
  async writeEngineCell(value: number): Promise<void> {
    await this.page.evaluate((next) => {
      const sheetId = window.htEngine!.getSheetId('Sheet1');

      window.htEngine!.setCellContents!({ sheet: sheetId, row: 0, col: 0 }, next);
    }, value);
  }
}
