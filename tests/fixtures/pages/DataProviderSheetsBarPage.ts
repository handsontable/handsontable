import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import type { FixtureHotInstance, FixtureSortConfig } from './windowTypes';

/**
 * The `fetchRows` prefixes the fixture's three server-backed sheets use.
 */
type ServerPrefix = 'ORD' | 'CUS' | 'GRID';

/**
 * The query a `fetchRows` request was called with.
 */
export interface FixtureQueryParameters {
  page: number;
  pageSize: number;
  sort: { prop: string, order: 'asc' | 'desc' } | null;
  filters: unknown[] | null;
}

/**
 * The in-page server the `data-provider-sheets-bar.html` fixture exposes on `window.htServer`.
 */
interface FixtureServer {
  pending: { prefix: ServerPrefix, params: FixtureQueryParameters }[];
  pendingUpdates: unknown[];
  fetchCount: Record<ServerPrefix, number>;
  failNext: Set<ServerPrefix>;
  failNextUpdate: boolean;
  updatePayloads: { id: unknown, changes: Record<string, unknown> }[][];
  consoleProblems: string[];
  events: string[];
  cancelNextSwitch: boolean;
  totalRows: number;
  release(prefix?: ServerPrefix): number;
  releaseUpdates(): number;
}

/**
 * The DataProvider plugin's public surface the page object drives directly, beyond what
 * `windowTypes.ts` already declares for the other plugins under test.
 */
interface FixtureDataProviderPlugin {
  fetchData(): Promise<unknown>;
  createRows(options: { position?: 'above' | 'below', referenceRowId?: unknown, rowsAmount?: number }): Promise<void>;
  removeRows(rowIds: unknown[]): Promise<void>;
}

/**
 * The Pagination plugin's public surface the page object drives directly.
 */
interface FixturePaginationPlugin {
  getPaginationData(): { currentPage: number, pageSize: number, totalPages: number };
  setPage(page: number): void;
}

/**
 * The SheetsBar plugin's public surface the page object drives directly.
 */
interface FixtureSheetsBarPlugin {
  getSheets(): { id: number, isActive: boolean }[];
  duplicateSheet(id: number): unknown;
  removeSheet(id: number): unknown;
}

/**
 * `window.hot`, widened with the plugin surfaces above so `getPlugin()` stays typed without
 * touching the shared `windowTypes.ts` overloads that other fixtures rely on.
 */
type FixtureHotWithSheetPlugins = FixtureHotInstance & {
  getPlugin(name: 'dataProvider'): FixtureDataProviderPlugin;
  getPlugin(name: 'pagination'): FixturePaginationPlugin;
  getPlugin(name: 'sheetsBar'): FixtureSheetsBarPlugin;
};

/**
 * Page Object for the DataProvider + SheetsBar fixture (DEV-3041).
 *
 * "Orders" and "Customers" declare their own `dataProvider` (prefixes `ORD`/`CUS`); "Notes" holds
 * local rows only. `?gridLevel` adds a grid-level `dataProvider` (prefix `GRID`) so a spec can prove
 * SheetsBar disables it for every sheet that does not declare its own. Every `fetchRows` call waits
 * until the spec releases it, so the spec controls exactly when a response lands.
 */
export class DataProviderSheetsBarPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    page.on('pageerror', error => this.pageErrors.push(error.message));
  }

  /**
   * Navigate to the fixture, release the initial `ORD` fetch (Orders declares its own provider
   * whether or not `?gridLevel` is set), and wait for its rows to land.
   *
   * @param {{ gridLevel?: boolean, serverSemantics?: 'custom', cachedRows?: boolean, plain?: boolean }} options
   * `plain: true` builds the grid without SheetsBar, backed by a grid-level `ORD` provider (`?plain=1`); `gridLevel: true`
   * adds a grid-level `dataProvider` alongside the two sheet-level ones (`?gridLevel=1`);
   * `serverSemantics: 'custom'` gives the server a sort order and a `contains` rule no client pass reproduces
   * (`?serverSemantics=custom`); `cachedRows: true` makes `fetchRows` hand back the same array for the same
   * query (`?cachedRows=1`).
   */
  async goto(
    options: { gridLevel?: boolean, serverSemantics?: 'custom', cachedRows?: boolean, plain?: boolean } = {}
  ): Promise<void> {
    const extraParams = [
      options.gridLevel ? '&gridLevel=1' : '',
      options.plain ? '&plain=1' : '',
      options.serverSemantics === 'custom' ? '&serverSemantics=custom' : '',
      options.cachedRows ? '&cachedRows=1' : '',
    ].join('');

    await this.page.goto(
      `/tests/fixtures/demo/data-provider-sheets-bar.html?theme=${this.theme}&bundle=${this.bundle}${extraParams}`
    );
    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect.poll(() => this.pendingCount('ORD')).toBe(1);
    await this.release('ORD');
    await expect(this.cell(0, 0)).toHaveText('ORD-01');
  }

  /**
   * A data cell in the master overlay.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Locator} The cell locator.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * A sheet tab, by its position in the bar.
   *
   * @param {number} index The tab's position, 0-based.
   * @returns {Locator} The tab locator.
   */
  tab(index: number): Locator {
    return this.page.getByTestId(`sheet-tab-${index}`);
  }

  /**
   * Switch sheets by clicking a tab's label, the way a user does it.
   *
   * @param {number} index The tab's position, 0-based.
   */
  async clickTab(index: number): Promise<void> {
    await this.tab(index).locator('.ht-sheets-bar__tab-label').click();
  }

  /**
   * Start a refetch of the current query without waiting for it to settle.
   */
  async startFetch(): Promise<void> {
    await this.page.evaluate(() => {
      (window.hot as unknown as FixtureHotWithSheetPlugins).getPlugin('dataProvider').fetchData().catch(() => {});
    });
  }

  /**
   * Resolve every pending `fetchRows` request for a prefix, or every pending request when no
   * prefix is given.
   *
   * @param {ServerPrefix} [prefix] The prefix to release; omit to release all prefixes.
   * @returns {Promise<number>} How many requests were released.
   */
  async release(prefix?: ServerPrefix): Promise<number> {
    return this.page.evaluate(
      p => (window as unknown as { htServer: FixtureServer }).htServer.release(p),
      prefix
    );
  }

  /**
   * Settle every pending `onRowsCreate`, `onRowsUpdate`, and `onRowsRemove` call.
   *
   * @returns {Promise<number>} How many mutations were released.
   */
  async releaseUpdates(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { htServer: FixtureServer }).htServer.releaseUpdates());
  }

  /**
   * How many `onRowsCreate`, `onRowsUpdate`, and `onRowsRemove` calls are waiting to be settled.
   *
   * @returns {Promise<number>} The count of pending mutations.
   */
  async pendingUpdateCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { htServer: FixtureServer }).htServer.pendingUpdates.length);
  }

  /**
   * The `{ id, changes }` rows of every `onRowsUpdate` call so far, one array per call.
   *
   * @returns {Promise<{ id: unknown, changes: Record<string, unknown> }[][]>} The recorded payloads.
   */
  async updatePayloads(): Promise<{ id: unknown, changes: Record<string, unknown> }[][]> {
    return this.page.evaluate(() => (window as unknown as { htServer: FixtureServer }).htServer.updatePayloads);
  }

  /**
   * Replace the grid-level `dataProvider` through `updateSettings()` with a provider for another prefix.
   *
   * @param {ServerPrefix} prefix The prefix the new provider fetches from.
   */
  async replaceDataProvider(prefix: ServerPrefix): Promise<void> {
    await this.page.evaluate((p) => {
      const { htProvider } = window as unknown as { htProvider(prefix: string): object };

      window.hot.updateSettings({ dataProvider: htProvider(p) });
    }, prefix);
  }

  /**
   * Close the toast with its close button.
   */
  async closeToast(): Promise<void> {
    await this.toast().locator('.ht-notification__close').click();
  }

  /**
   * Make the next released mutation reject instead of resolving.
   */
  async failNextUpdate(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { htServer: FixtureServer }).htServer.failNextUpdate = true;
    });
  }

  /**
   * Start a server create through `createRows()` without waiting for it to settle.
   *
   * @param {unknown} referenceRowId The row id the new row goes below.
   */
  async startCreateRow(referenceRowId: unknown): Promise<void> {
    await this.page.evaluate((id) => {
      (window.hot as unknown as FixtureHotWithSheetPlugins).getPlugin('dataProvider')
        .createRows({ position: 'below', referenceRowId: id }).catch(() => {});
    }, referenceRowId);
  }

  /**
   * Start a server remove through `removeRows()` without waiting for it to settle.
   *
   * @param {unknown[]} rowIds The row ids to remove.
   */
  async startRemoveRows(rowIds: unknown[]): Promise<void> {
    await this.page.evaluate((ids) => {
      (window.hot as unknown as FixtureHotWithSheetPlugins).getPlugin('dataProvider')
        .removeRows(ids).catch(() => {});
    }, rowIds);
  }

  /**
   * Clear the recorded console problems after a spec asserted the ones it expects.
   */
  async clearConsoleProblems(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { htServer: FixtureServer }).htServer.consoleProblems = [];
    });
  }

  /**
   * Make the next `fetchRows` call for a prefix reject instead of resolving.
   *
   * @param {'ORD' | 'CUS'} prefix The sheet-level prefix whose next fetch should fail.
   */
  async failNext(prefix: 'ORD' | 'CUS'): Promise<void> {
    await this.page.evaluate(
      p => (window as unknown as { htServer: FixtureServer }).htServer.failNext.add(p),
      prefix
    );
  }

  /**
   * How many `fetchRows` requests are waiting for a response, for a prefix or overall.
   *
   * @param {ServerPrefix} [prefix] The prefix to count; omit to count every pending request.
   * @returns {Promise<number>} The count of pending requests.
   */
  async pendingCount(prefix?: ServerPrefix): Promise<number> {
    return this.page.evaluate(
      p => (window as unknown as { htServer: FixtureServer }).htServer.pending
        .filter(request => !p || request.prefix === p).length,
      prefix
    );
  }

  /**
   * The query the latest pending `fetchRows` request for a prefix was called with.
   *
   * @param {ServerPrefix} prefix The prefix to read.
   * @returns {Promise<FixtureQueryParameters | null>} The query, or `null` when nothing is pending.
   */
  async pendingParams(prefix: ServerPrefix): Promise<FixtureQueryParameters | null> {
    return this.page.evaluate(
      p => (window as unknown as { htServer: FixtureServer }).htServer.pending
        .filter(request => request.prefix === p).at(-1)?.params ?? null,
      prefix
    );
  }

  /**
   * Set how many rows the server holds for every prefix, from the next response on.
   *
   * @param {number} totalRows The row count.
   */
  async setServerTotalRows(totalRows: number): Promise<void> {
    await this.page.evaluate(
      n => { (window as unknown as { htServer: FixtureServer }).htServer.totalRows = n; },
      totalRows
    );
  }

  /**
   * The position of the active sheet's tab.
   *
   * @returns {Promise<number>} The 0-based position.
   */
  async activeSheetIndex(): Promise<number> {
    return this.page.evaluate(() => (window.hot as unknown as FixtureHotWithSheetPlugins)
      .getPlugin('sheetsBar').getSheets().findIndex(sheet => sheet.isActive));
  }

  /**
   * The Filters plugin's current conditions.
   *
   * @returns {Promise<unknown[]>} The exported conditions.
   */
  async filterConditions(): Promise<unknown[]> {
    return this.page.evaluate(() => (window.hot as unknown as {
      getPlugin(name: 'filters'): { exportConditions(): unknown[] },
    }).getPlugin('filters').exportConditions());
  }

  /**
   * How many `fetchRows` requests a prefix has started since the page loaded.
   *
   * @param {ServerPrefix} prefix The prefix to count.
   * @returns {Promise<number>} The count of started requests.
   */
  async fetchCount(prefix: ServerPrefix): Promise<number> {
    return this.page.evaluate(
      p => (window as unknown as { htServer: FixtureServer }).htServer.fetchCount[p],
      prefix
    );
  }

  /**
   * The `fetch <prefix> #<n>`, `afterDataProviderFetch*`, and `afterColumnSort` events recorded so far, in
   * order.
   *
   * @returns {Promise<string[]>} The recorded events.
   */
  async events(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { htServer: FixtureServer }).htServer.events);
  }

  /**
   * Every `console.error`/`console.warn` call recorded so far, prefixed with its level.
   *
   * @returns {Promise<string[]>} The recorded console problems.
   */
  async consoleProblems(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { htServer: FixtureServer }).htServer.consoleProblems);
  }

  /**
   * Make the next sheet switch get canceled by a `beforeSheetTabChange` listener.
   */
  async cancelNextSwitch(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { htServer: FixtureServer }).htServer.cancelNextSwitch = true;
    });
  }

  /**
   * The ids shown in the first column, in visual order.
   *
   * @returns {Promise<string[]>} The ids, as strings.
   */
  async ids(): Promise<string[]> {
    return this.page.evaluate(() => window.hot.getDataAtCol(0).map(value => String(value)));
  }

  /**
   * ColumnSorting's current sort config.
   *
   * @returns {Promise<FixtureSortConfig[]>} The active sort config.
   */
  async sortConfig(): Promise<FixtureSortConfig[]> {
    return this.page.evaluate(() => window.hot.getPlugin('columnSorting').getSortConfig());
  }

  /**
   * Filter a column down to a fixed set of values through the Filters plugin, the way a "by value"
   * dropdown selection does.
   *
   * @param {number} col The visual column index to filter.
   * @param {string[]} keep The values the column should keep.
   */
  async filterColumnByValue(col: number, keep: string[]): Promise<void> {
    await this.page.evaluate(
      args => {
        window.hot.getPlugin('filters').addCondition(args.col, 'by_value', [args.keep]);
        window.hot.getPlugin('filters').filter();
      },
      { col, keep }
    );
  }

  /**
   * Filter a column with one condition through the Filters plugin, the way the condition menu does.
   *
   * @param {number} col The visual column index to filter.
   * @param {string} name The condition name, for example `contains`.
   * @param {unknown[]} args The condition arguments.
   */
  async filterColumn(col: number, name: string, args: unknown[]): Promise<void> {
    await this.page.evaluate(
      a => {
        window.hot.getPlugin('filters').addCondition(a.col, a.name, a.args);
        window.hot.getPlugin('filters').filter();
      },
      { col, name, args }
    );
  }

  /**
   * The pager's current page, page size, and total page count.
   *
   * @returns {Promise<{ currentPage: number, pageSize: number, totalPages: number }>} The pagination state.
   */
  async pagination(): Promise<{ currentPage: number, pageSize: number, totalPages: number }> {
    return this.page.evaluate(() => {
      const { currentPage, pageSize, totalPages } =
        (window.hot as unknown as FixtureHotWithSheetPlugins).getPlugin('pagination').getPaginationData();

      return { currentPage, pageSize, totalPages };
    });
  }

  /**
   * Move the pager to a page through the Pagination plugin.
   *
   * @param {number} page The 1-based page number to move to.
   */
  async goToPage(page: number): Promise<void> {
    await this.page.evaluate(
      p => (window.hot as unknown as FixtureHotWithSheetPlugins).getPlugin('pagination').setPage(p),
      page
    );
  }

  /**
   * Sort a column through the ColumnSorting plugin, the way clicking its header does.
   *
   * @param {number} col The visual column index to sort by.
   * @param {'asc' | 'desc'} order The sort direction.
   */
  async sortByHeader(col: number, order: 'asc' | 'desc'): Promise<void> {
    await this.page.evaluate(
      sortConfig => window.hot.getPlugin('columnSorting').sort(sortConfig),
      { column: col, sortOrder: order }
    );
  }

  /**
   * Edit a cell's value directly through `setDataAtCell()`, without going through the editor.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {string} value The new value.
   */
  async editCell(row: number, col: number, value: string): Promise<void> {
    await this.page.evaluate(
      args => window.hot.setDataAtCell(args.row, args.col, args.value),
      { row, col, value }
    );
  }

  /**
   * Duplicate a sheet through the SheetsBar plugin, the way its tab menu does.
   *
   * @param {number} index The tab's position, 0-based.
   */
  async duplicateSheet(index: number): Promise<void> {
    await this.page.evaluate(i => {
      const sheetsBar = (window.hot as unknown as FixtureHotWithSheetPlugins).getPlugin('sheetsBar');
      const sheet = sheetsBar.getSheets()[i];

      sheetsBar.duplicateSheet(sheet.id);
    }, index);
  }

  /**
   * Remove a sheet through the SheetsBar plugin, the way its tab menu does.
   *
   * @param {number} index The tab's position, 0-based.
   */
  async removeSheet(index: number): Promise<void> {
    await this.page.evaluate(i => {
      const sheetsBar = (window.hot as unknown as FixtureHotWithSheetPlugins).getPlugin('sheetsBar');
      const sheet = sheetsBar.getSheets()[i];

      sheetsBar.removeSheet(sheet.id);
    }, index);
  }

  /**
   * The EmptyDataState overlay's loading state.
   *
   * @returns {Locator} The overlay locator, matched while it carries the loading modifier class.
   */
  loadingOverlayVisible(): Locator {
    return this.grid.locator('.ht-empty-data-state--loading');
  }

  /**
   * The Notification plugin's toast.
   *
   * @returns {Locator} The toast locator.
   */
  toast(): Locator {
    return this.page.locator('.ht-notification__toast');
  }
}
