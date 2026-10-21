import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page object for the fixture with object data, a `dataSchema` of non-null leaves and no
 * `columns`. Cells are addressed by `data-testid="cell-<row>-<col>"`; edits go through the real
 * editor (select, type, Enter). `window.hot` is declared in `windowTypes.ts`.
 */
export class DataSchemaNonNullLeavesPage {
  /** The Playwright page the fixture is driven through. */
  readonly page: Page;
  /** The active theme, passed through to the fixture URL. */
  readonly theme: string;
  /** The active bundle, passed through to the fixture URL. */
  readonly bundle: string;
  /** Uncaught page errors seen since construction, in the order they fired. */
  readonly pageErrors: string[] = [];

  /**
   * Wires up the page object for one theme/bundle leg and starts collecting uncaught page errors.
   */
  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/data-schema-non-null-leaves.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Types a value into a cell the way a user does: select it, type, commit with Enter.
   */
  async typeIntoCell(row: number, col: number, value: string): Promise<void> {
    await this.cell(row, col).click();
    await this.page.keyboard.type(value);
    await this.page.keyboard.press('Enter');
    await expect(this.cell(row, col)).toHaveText(value);
  }

  /** The number of columns the grid resolved. */
  async countCols(): Promise<number> {
    return this.page.evaluate(() => window.hot.countCols());
  }

  /** The source data object of a row. */
  async sourceRow(row: number): Promise<unknown> {
    return this.page.evaluate(r => window.hot.getSourceDataAtRow(r), row);
  }
}
