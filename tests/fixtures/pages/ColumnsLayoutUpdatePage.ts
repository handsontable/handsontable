import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS, type Bundle } from '../bundle';

type HotWindow = Window & {
  hot: {
    countCols(): number;
    countRows(): number;
    render(): void;
    getColWidth(column: number): number;
    getPlugin(name: string): {
      sort(config: { column: number, sortOrder: 'asc' | 'desc' }): void;
      getSortConfig(): unknown[];
      getHiddenColumns(): number[];
      hideColumn(column: number): void;
      setManualSize(column: number, width: number): void;
      addCondition(column: number, name: string, args: unknown[]): void;
      filter(): void;
      exportConditions(): unknown[];
    };
  };
  buildGrid(props: string[]): void;
  updateColumns(props: string[]): void;
  htBuildError?: string;
};

/**
 * Page Object for the columns layout update fixture.
 *
 * The state the tests watch lives in column index maps: a manual width, a hidden flag, and the sort config.
 * The rendered headers and the first column are the user-visible half.
 */
export class ColumnsLayoutUpdatePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Rebuilds the grid with one column per property name.
   *
   * @param {string[]} props The property names.
   */
  async rebuild(props: string[]): Promise<void> {
    await this.page.evaluate((names) => (window as unknown as HotWindow).buildGrid(names), props);
    await expect(this.headers()).toHaveCount(props.length);
  }

  /**
   * Sends `{ data, columns }` for the given property names, as a wrapper does on a change of its `columns` prop.
   *
   * @param {string[]} props The property names.
   */
  async updateColumns(props: string[]): Promise<void> {
    await this.page.evaluate((names) => (window as unknown as HotWindow).updateColumns(names), props);
  }

  /**
   * Sets the width of a column the way a drag does.
   *
   * @param {number} column The visual column index.
   * @param {number} width The width in pixels.
   */
  async resizeColumn(column: number, width: number): Promise<void> {
    await this.page.evaluate(({ index, value }) => {
      const { hot } = window as unknown as HotWindow;

      hot.getPlugin('manualColumnResize').setManualSize(index, value);
      hot.render();
    }, { index: column, value: width });
  }

  /**
   * Hides a column through the plugin API, the way application code or a menu does.
   *
   * @param {number} column The visual column index.
   */
  async hideColumn(column: number): Promise<void> {
    await this.page.evaluate((index) => {
      const { hot } = window as unknown as HotWindow;

      hot.getPlugin('hiddenColumns').hideColumn(index);
      hot.render();
    }, column);
  }

  /**
   * Sorts a column in ascending order.
   *
   * @param {number} column The visual column index.
   */
  async sortColumn(column: number): Promise<void> {
    await this.page.evaluate((index) => (window as unknown as HotWindow).hot.getPlugin('columnSorting')
      .sort({ column: index, sortOrder: 'asc' }), column);
  }

  /**
   * Filters a column to the rows whose value equals the given text, the way the filter plugin's API does.
   *
   * @param {number} column The visual column index.
   * @param {string} value The value the rows keep.
   */
  async filterColumn(column: number, value: string): Promise<void> {
    await this.page.evaluate(({ index, text }) => {
      const filters = (window as unknown as HotWindow).hot.getPlugin('filters');

      filters.addCondition(index, 'eq', [text]);
      filters.filter();
    }, { index: column, text: value });
  }

  /**
   * The number of rows the grid shows, after the filter.
   *
   * @returns {Promise<number>}
   */
  async rowCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.countRows());
  }

  /**
   * The conditions the `Filters` plugin holds.
   *
   * @returns {Promise<unknown[]>}
   */
  async filterConditions(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.getPlugin('filters').exportConditions());
  }

  /**
   * The widths the grid uses for every column, in visual order.
   *
   * @returns {Promise<number[]>}
   */
  async columnWidths(): Promise<number[]> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as HotWindow;

      return Array.from({ length: hot.countCols() }, (_, column) => hot.getColWidth(column));
    });
  }

  /**
   * The physical indexes of the columns `HiddenColumns` hides.
   *
   * @returns {Promise<number[]>}
   */
  async hiddenColumns(): Promise<number[]> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.getPlugin('hiddenColumns')
      .getHiddenColumns());
  }

  /**
   * The sort configuration the `ColumnSorting` plugin holds.
   *
   * @returns {Promise<unknown[]>}
   */
  async sortConfig(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.getPlugin('columnSorting')
      .getSortConfig());
  }

  /**
   * The column headers the grid renders, left to right. A hidden column renders none.
   *
   * @returns {Locator}
   */
  headers(): Locator {
    // The corner cell above the row headers renders a blank `.colHeader`, so the text filter leaves it out.
    return this.grid.locator('.ht_master thead tr:last-child th .colHeader').filter({ hasText: /\S/ });
  }

  /**
   * The text of the first rendered column, top to bottom, which shows the row order.
   *
   * @returns {Promise<string[]>}
   */
  async firstColumnTexts(): Promise<string[]> {
    return this.grid.locator('.ht_master tbody tr td:first-of-type').allInnerTexts();
  }

  /**
   * Navigates and waits for the grid to have rendered - a real DOM condition, never a sleep.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/columns-layout-update.html?theme=${this.theme}&bundle=${this.bundle}`);

    try {
      await awaitBundle(this.page);

      await this.page.waitForFunction(
        () => (window as unknown as HotWindow).hot !== null || 'htBuildError' in window,
        undefined,
        { polling: BUNDLE_POLLING_MS }
      );
    } catch (timeoutError) {
      const snapshot = await this.page.evaluate(() => ({
        readyState: document.readyState,
        handsontable: typeof (window as { Handsontable?: unknown }).Handsontable,
      })).catch(() => 'page unreachable');

      throw new Error(`The fixture never built its grid; page snapshot: ${JSON.stringify(snapshot)}`,
        { cause: timeoutError });
    }

    const buildError = await this.page.evaluate(() => (window as unknown as HotWindow).htBuildError ?? null);

    if (buildError) {
      throw new Error(`The fixture threw while building its grid: ${buildError}`);
    }

    await expect(this.headers()).not.toHaveCount(0);
  }
}
