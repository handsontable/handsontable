import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * One `fetchRows` call as the `data-provider-same-object-update.html` fixture records it.
 */
export interface SameObjectFetchCall {
  page: number;
  pageSize: number;
  sort: { prop: string, order: 'asc' | 'desc' } | null;
}

/**
 * What the grid holds right after a settings update, read in the task that made it.
 */
export interface SameObjectUpdateResult {
  rows: number;
  firstId: unknown;
  fetches: number;
}

/**
 * The in-page server the fixture exposes.
 */
interface FixtureServer {
  calls: SameObjectFetchCall[];
}

/**
 * Page Object for the DataProvider fixture that sends the grid's own `dataProvider` object again.
 *
 * The grid is paginated (10 of 50 records per page) and sortable. The pager, the header, and the rows
 * are read the way a user sees them; the fixture additionally records every `fetchRows` call, and
 * exposes the `dataProvider` object the grid runs on.
 */
export class DataProviderSameObjectUpdatePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly status: Locator;
  readonly rows: Locator;
  readonly pageCounter: Locator;
  readonly nextPageButton: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.status = page.getByTestId('status');
    this.rows = this.grid.locator('.ht_master tbody tr');
    this.pageCounter = this.grid.locator('.ht-page-counter-section');
    this.nextPageButton = this.grid.locator('.ht-page-next');
  }

  /**
   * Navigate to the fixture and wait for the first server page to be on screen.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/data-provider-same-object-update.html?theme=${this.theme}&bundle=${this.bundle}`
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
   * Every `fetchRows` call since the page loaded, in call order.
   */
  async fetchCalls(): Promise<SameObjectFetchCall[]> {
    return this.page.evaluate(() => (window as unknown as { htServer: FixtureServer }).htServer.calls);
  }

  /**
   * Send the grid's own `dataProvider` object again through `updateSettings()`, with `extra` beside it,
   * and read the rows and the fetch count in the same task. `fetchRows` is called synchronously when a
   * fetch starts, so a count read here already holds any fetch the update started, and the rows read
   * here are the ones the update left on screen before anything else could refill them.
   */
  async sendSameProvider(extra: Record<string, unknown>): Promise<SameObjectUpdateResult> {
    return this.page.evaluate((settings) => {
      const win = window as unknown as { htProvider: object, htServer: FixtureServer };

      window.hot.updateSettings({ ...settings, dataProvider: win.htProvider });

      return {
        rows: window.hot.countRows(),
        firstId: window.hot.getDataAtCell(0, 0),
        fetches: win.htServer.calls.length,
      };
    }, extra);
  }

  /**
   * Wait two animation frames, so a fetch a microtask, a timer of the frame, or a render started is
   * recorded. A bounded settle: a spec that reads a negative after it pairs it with a positive control.
   */
  async settleFrames(): Promise<void> {
    await this.page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
  }

  /**
   * The clickable sorting label of a column header, in the top overlay (the one users click).
   */
  sortLabel(col: number): Locator {
    return this.grid.locator('.ht_clone_top').getByTestId(`col-header-${col}`).locator('span.colHeader');
  }

  /**
   * The text of the first data cell (the record id) in the master overlay.
   */
  firstIdCell(): Locator {
    return this.rows.first().locator('td').first();
  }
}
