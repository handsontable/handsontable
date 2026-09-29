import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * An option that blocks the DataProvider plugin through its hard conflicts.
 */
export type ConflictingOption = 'trimRows' | 'manualRowMove' | 'manualColumnMove' | 'multiColumnSorting';

/**
 * Page Object for the `data-provider-external-mode.html` fixture.
 *
 * A local grid (Pagination + Filters, no `dataProvider` at init) whose `dataProvider` is added
 * and removed through `updateSettings()` after init — the shape a SheetsBar switch between a
 * server sheet and a local one produces. Used to prove Pagination and Filters read the
 * `hasExternalDataSource` mode live instead of caching it at `enablePlugin()` time.
 */
export class DataProviderExternalModePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly status: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.status = page.getByTestId('status');
  }

  /**
   * Navigate to the fixture and wait for the grid to be ready.
   *
   * @param {object} [options] `blockedBy` builds the grid with a complete `dataProvider` next to that
   * option, which blocks the DataProvider plugin through its hard conflicts (`?blocked=<option>`).
   */
  async goto(options: { blockedBy?: ConflictingOption } = {}): Promise<void> {
    const blocked = options.blockedBy ? `&blocked=${options.blockedBy}` : '';

    await this.page.goto(
      `/tests/fixtures/demo/data-provider-external-mode.html?theme=${this.theme}&bundle=${this.bundle}${blocked}`
    );
    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.status).toHaveText('ready');
  }

  /**
   * The pager's current total page count.
   */
  async totalPages(): Promise<number> {
    return this.page.evaluate(() => window.hot.getPlugin('pagination').getPaginationData().totalPages);
  }

  /**
   * The state a blocked `dataProvider` leaves behind: whether the plugin is on, what
   * `hasExternalDataSource` answers, the row count, the first cell, and how many `fetchRows` calls ran.
   */
  async dataSourceState(): Promise<{
    pluginEnabled: boolean, external: unknown, rows: number, firstCell: unknown, fetches: number,
  }> {
    return this.page.evaluate(() => ({
      pluginEnabled: window.hot.getPlugin('dataProvider').enabled,
      external: window.hot.runHooks('hasExternalDataSource'),
      rows: window.hot.countRows(),
      firstCell: window.hot.getDataAtCell(0, 0),
      fetches: (window as unknown as { htFetchCount: number }).htFetchCount,
    }));
  }

  /**
   * Filters the only column locally to the values greater than the given number, through the Filters API.
   *
   * @param {number} value The lower bound.
   */
  async filterGreaterThan(value: number): Promise<void> {
    await this.page.evaluate((bound) => {
      const filters = window.hot.getPlugin('filters');

      filters.addCondition(0, 'gt', [bound]);
      filters.filter();
    }, value);
  }

  /**
   * The rows the grid shows, read from the first column.
   */
  async columnValues(): Promise<unknown[]> {
    return this.page.evaluate(() => window.hot.getDataAtCol(0));
  }

  /**
   * Adds a `dataProvider` to the grid through `updateSettings()`, the way a SheetsBar switch to
   * a server sheet does.
   */
  async enableProvider(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as { htEnableProvider(): void }).htEnableProvider());
  }

  /**
   * Removes the grid's `dataProvider` through `updateSettings()`, the way a SheetsBar switch
   * back to a local sheet does.
   */
  async disableProvider(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as { htDisableProvider(): void }).htDisableProvider());
  }
}
