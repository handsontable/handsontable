import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * One `fetchRows` call as the `data-provider-refetch-failed-query.html` fixture records it.
 */
export interface FixtureFetchCall {
  page: number;
  pageSize: number;
  sort: { prop: string, order: 'asc' | 'desc' } | null;
  filters: { prop: string, operation: string, conditions: { name?: string, args: unknown[] }[] }[] | null;
}

/**
 * The in-page server the fixture exposes.
 */
interface FixtureServer {
  failing: boolean;
  calls: FixtureFetchCall[];
}

/**
 * Page Object for the DataProvider fixture whose `fetchRows` can be switched to fail.
 *
 * The grid is paginated (10 of 50 records per page), sortable, and filterable, with Notification
 * on, so a failed fetch shows the error toast with its Refetch action. The pager, the header, the
 * toast, and the rows are driven and read the way a user sees them; the fixture additionally
 * reports every `fetchRows` call.
 */
export class DataProviderRefetchFailedQueryPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly status: Locator;
  readonly rows: Locator;
  readonly pageCounter: Locator;
  readonly nextPageButton: Locator;
  readonly pageSizeSelect: Locator;
  readonly refetchButton: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.status = page.getByTestId('status');
    this.rows = this.grid.locator('.ht_master tbody tr');
    this.pageCounter = this.grid.locator('.ht-page-counter-section');
    this.nextPageButton = this.grid.locator('.ht-page-next');
    this.pageSizeSelect = this.grid.locator('.ht-page-size-section select');
    this.refetchButton = this.grid.getByRole('button', { name: 'Refetch' });
  }

  /**
   * Navigate to the fixture and wait for the first server page to be on screen.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/data-provider-refetch-failed-query.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.status).toHaveText('ready');
    await expect(this.pageCounter).toHaveText('1 - 10 of 50');
  }

  /**
   * Make every following `fetchRows` call reject, or succeed again.
   */
  async setServerFailing(failing: boolean): Promise<void> {
    await this.page.evaluate((value) => {
      (window as unknown as { htServer: FixtureServer }).htServer.failing = value;
    }, failing);
  }

  /**
   * Every `fetchRows` call since the page loaded, in call order.
   */
  async fetchCalls(): Promise<FixtureFetchCall[]> {
    return this.page.evaluate(() => (window as unknown as { htServer: FixtureServer }).htServer.calls);
  }

  /**
   * The clickable sorting label of a column header, in the top overlay (the one users click).
   */
  sortLabel(col: number): Locator {
    return this.grid.locator('.ht_clone_top').getByTestId(`col-header-${col}`).locator('span.colHeader');
  }

  /**
   * Filter a column to rows equal to `value` through the Filters plugin API, the way a custom filter UI would.
   */
  async filterByValue(col: number, value: string): Promise<void> {
    await this.page.evaluate(({ c, v }) => {
      const filters = window.hot.getPlugin('filters');

      filters.addCondition(c, 'eq', [v]);
      filters.filter();
    }, { c: col, v: value });
  }

  /**
   * The Filters plugin's current conditions, as `exportConditions()` returns them.
   */
  async filterConditions(): Promise<unknown[]> {
    return this.page.evaluate(() => window.hot.getPlugin('filters').exportConditions());
  }

  /**
   * The text of the first data cell (the record id) in the master overlay.
   */
  firstIdCell(): Locator {
    return this.rows.first().locator('td').first();
  }
}
