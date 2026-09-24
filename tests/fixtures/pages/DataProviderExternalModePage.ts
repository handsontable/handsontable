import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the `data-provider-external-mode.html` fixture (DEV-3041).
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
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/data-provider-external-mode.html?theme=${this.theme}&bundle=${this.bundle}`
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
