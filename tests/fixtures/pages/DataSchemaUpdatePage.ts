import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS, type Bundle } from '../bundle';

type HotWindow = Window & {
  hot: {
    countCols(): number;
    toPhysicalColumn(visualColumn: number): number;
    updateSettings(settings: Record<string, unknown>): void;
    render(): void;
    countRows(): number;
    getColWidth(column: number): number;
    getPlugin(name: string): {
      moveColumn(column: number, finalIndex: number): void;
      sort(config: { column: number, sortOrder: 'asc' | 'desc' }): void;
      getSortConfig(): unknown[];
      getHiddenColumns(): number[];
      hideColumn(column: number): void;
      setManualSize(column: number, width: number): void;
      addCondition(column: number, name: string, args: unknown[]): void;
      filter(): void;
      isEnabled(): boolean;
    };
  };
  buildGrid(extraSettings?: Record<string, unknown>): void;
  updateWithFunctionSchema(keys: string[]): void;
  clearSchema(): void;
  htBuildError?: string;
};

/**
 * Page Object for the data schema update fixture.
 *
 * The state the tests watch is the column index sequence: `ManualColumnMove` writes it into the
 * column index mapper, which is what an index mapper re-initialization resets. The rendered cell
 * count of the first row is the user-visible half: it follows the column count the grid resolved.
 */
export class DataSchemaUpdatePage {
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
   * Rebuilds the grid with extra settings merged over the fixture defaults.
   *
   * @param {object} extraSettings JSON-serializable settings.
   */
  async rebuild(extraSettings: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate(
      (settings) => (window as unknown as HotWindow).buildGrid(settings),
      extraSettings
    );
    await expect(this.firstRowCells()).not.toHaveCount(0);
  }

  /**
   * Moves the first column to the third position, so the sequence differs from the identity.
   */
  async moveFirstColumnToThirdPosition(): Promise<void> {
    await this.page.evaluate(() => {
      const { hot } = window as unknown as HotWindow;

      hot.getPlugin('manualColumnMove').moveColumn(0, 2);
      hot.render();
    });
  }

  /**
   * Sends a new function as the schema, which returns an object with the given keys.
   *
   * @param {string[]} keys The property names the function returns.
   */
  async updateWithFunctionSchema(keys: string[]): Promise<void> {
    await this.page.evaluate((names) => (window as unknown as HotWindow).updateWithFunctionSchema(names), keys);
  }

  /**
   * Sends `dataSchema: undefined`.
   */
  async clearSchema(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as HotWindow).clearSchema());
  }

  /**
   * Sorts the first column in descending order.
   */
  async sortFirstColumnDescending(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as HotWindow).hot.getPlugin('columnSorting')
      .sort({ column: 0, sortOrder: 'desc' }));
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
   * The physical indexes of the columns `HiddenColumns` hides.
   *
   * @returns {Promise<number[]>}
   */
  async hiddenColumns(): Promise<number[]> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.getPlugin('hiddenColumns')
      .getHiddenColumns());
  }

  /**
   * Hides the second column through the plugin API, the way application code or a menu does.
   */
  async hideSecondColumn(): Promise<void> {
    await this.page.evaluate(() => {
      const { hot } = window as unknown as HotWindow;

      hot.getPlugin('hiddenColumns').hideColumn(1);
      hot.render();
    });
  }

  /**
   * Sets the width of the first column the way a drag does, and reads back the width the grid uses.
   *
   * @param {number} width The width in pixels.
   * @returns {Promise<number>}
   */
  async resizeFirstColumn(width: number): Promise<number> {
    return this.page.evaluate((value) => {
      const { hot } = window as unknown as HotWindow;

      hot.getPlugin('manualColumnResize').setManualSize(0, value);
      hot.render();

      return hot.getColWidth(0);
    }, width);
  }

  /**
   * The width the grid uses for the first column.
   *
   * @returns {Promise<number>}
   */
  async firstColumnWidth(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.getColWidth(0));
  }

  /**
   * Filters the rows down to the ones whose first column equals a value.
   *
   * @param {string} value The value to keep.
   */
  async filterFirstColumnEqualTo(value: string): Promise<void> {
    await this.page.evaluate((expected) => {
      const filters = (window as unknown as HotWindow).hot.getPlugin('filters');

      filters.addCondition(0, 'eq', [expected]);
      filters.filter();
    }, value);
  }

  /**
   * The number of rows the grid shows.
   *
   * @returns {Promise<number>}
   */
  async countRows(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.countRows());
  }

  /**
   * Applies a settings payload through `updateSettings()`.
   *
   * @param {object} settings JSON-serializable settings.
   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(
      (payload) => (window as unknown as HotWindow).hot.updateSettings(payload),
      settings
    );
  }

  /**
   * The physical column shown first. `0` when the index sequence is the identity, `1` after
   * {@link moveFirstColumnToThirdPosition}.
   *
   * @returns {Promise<number>}
   */
  async firstPhysicalColumn(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.toPhysicalColumn(0));
  }

  /**
   * The column count the grid resolved.
   *
   * @returns {Promise<number>}
   */
  async countCols(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.countCols());
  }

  /**
   * The text of the first body row, which shows the property each column reads.
   *
   * @returns {Promise<string[]>}
   */
  async firstRowTexts(): Promise<string[]> {
    return this.firstRowCells().allInnerTexts();
  }

  /**
   * The text of the first column, top to bottom, which shows the row order.
   *
   * @returns {Promise<string[]>}
   */
  async firstColumnTexts(): Promise<string[]> {
    return this.grid.locator('.ht_master tbody tr td:first-of-type').allInnerTexts();
  }

  /**
   * The cells of the first rendered body row of the master table.
   *
   * @returns {Locator}
   */
  firstRowCells(): Locator {
    return this.grid.locator('.ht_master tbody tr').first().locator('td');
  }

  /** Navigate and wait for the grid to have rendered - a real DOM condition, never a sleep. */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/data-schema-update.html?theme=${this.theme}&bundle=${this.bundle}`);

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

    if (buildError !== null) {
      throw new Error(`Handsontable constructor threw in the fixture:\n${buildError}`);
    }

    await expect(this.firstRowCells()).not.toHaveCount(0);
  }
}
