import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the Filters "replace data with an active filter" scenario (DEV-2889).
 *
 * The scenario is driven entirely through the public plugin API and `updateSettings`, so this
 * object owns the `page.evaluate` calls into `window.hot` instead of clicking the dropdown menu.
 * It reuses the `filters-value-list.html` fixture, which already exposes `window.hot` with the
 * `filters` and `dropdownMenu` plugins enabled and a two-column dataset.
 *
 * The crash under test is an uncaught `TypeError` thrown synchronously inside an `afterUpdateData`
 * or `afterChange` hook, so it surfaces as a rejection of the `page.evaluate` that triggered it.
 * `pageErrors` additionally captures anything that escapes to the page as a safety net.
 */
export class FiltersDataReplacePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly pageErrors: string[] = [];

  /**
   * Builds the page object for one theme and bundle.
   *
   * @param {Page} page The Playwright page.
   * @param {string} theme The active theme.
   * @param {string} bundle The active bundle.
   */
  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;

    this.page.on('pageerror', error => this.pageErrors.push(error.message));
  }

  /**
   * Navigate to the fixture and wait for the grid to render. The active theme and bundle are passed
   * as query params so the fixture loads the matching stylesheet and Handsontable build.
   */
  async goto(): Promise<void> {
    if (this.bundle !== 'umd' && this.bundle !== 'full-min') {
      throw new Error(
        `Unknown bundle ${JSON.stringify(this.bundle)} - expected 'umd' or 'full-min'.`);
    }

    await this.page.goto(
      `/tests/fixtures/demo/filters-value-list.html?theme=${this.theme}&bundle=${this.bundle}`);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Add a filter condition to a column and apply it, the way the documented `filter()` recipe does.
   *
   * @param {number} column The visual column index.
   * @param {string} name The condition short name (e.g. `eq`, `by_value`).
   * @param {Array} args The condition arguments.
   */
  async applyCondition(column: number, name: string, args: unknown[]): Promise<void> {
    await this.page.evaluate(({ column: col, name: conditionName, args: conditionArgs }) => {
      const plugin = window.hot.getPlugin('filters');

      plugin.addCondition(col, conditionName, conditionArgs);
      plugin.filter();
    }, { column, name, args });
  }

  /**
   * Replace the grid's source data while keeping the `filters` option in the payload, exactly as the
   * framework wrappers re-send their whole settings object on every commit. Passing `filters` is what
   * makes `updateSettings` run the Filters plugin's `updatePlugin` (disable + enable) cycle.
   *
   * @param {Array} data The new source data.
   */
  async replaceData(data: unknown[][]): Promise<void> {
    await this.page.evaluate((newData) => {
      window.hot.updateSettings({ data: newData, filters: true });
    }, data);
  }

  /**
   * Write a value into a cell through the API, which fires `afterChange`.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {string} value The new value.
   */
  async setCell(row: number, col: number, value: string): Promise<void> {
    await this.page.evaluate(({ row: r, col: c, value: v }) => {
      window.hot.setDataAtCell(r, c, v);
    }, { row, col, value });
  }

  /** The number of rows the grid currently shows (source rows minus the filtered-out ones). */
  async visibleRowCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.countRows());
  }
}
