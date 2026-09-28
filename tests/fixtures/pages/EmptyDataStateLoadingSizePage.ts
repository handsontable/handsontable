import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * The size of an element on screen, in CSS pixels.
 */
export interface BoxSize {
  width: number;
  height: number;
}

/**
 * The hooks the `empty-data-state-loading-size.html` fixture exposes on `window`.
 */
interface FixtureWindow {
  htServer: { fetchCount: number };
  htReleaseFetch(): void;
  htHasPendingFetch(): boolean;
}

/**
 * Page Object for the emptyDataState loading-overlay size fixture.
 *
 * The grid is paginated and server-backed, and every fetch waits until the spec releases it, so the
 * loading overlay stays on screen while the spec measures it.
 */
export class EmptyDataStateLoadingSizePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly status: Locator;
  readonly rows: Locator;
  readonly overlay: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.status = page.getByTestId('status');
    this.rows = this.grid.locator('.ht_master tbody tr');
    this.overlay = this.grid.locator('.ht-empty-data-state');
  }

  /**
   * Navigate to the fixture, release the initial fetch, and wait for the first page to be on screen.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/empty-data-state-loading-size.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.status).toHaveText('ready');
    await this.releaseFetch();
  }

  /**
   * Resolve the pending fetch and wait until its rows are on screen and the overlay is gone.
   */
  async releaseFetch(): Promise<void> {
    await expect.poll(() => this.page.evaluate(() =>
      (window as unknown as FixtureWindow).htHasPendingFetch())).toBe(true);
    await this.page.evaluate(() => (window as unknown as FixtureWindow).htReleaseFetch());
    await expect(this.rows).toHaveCount(5);
    await expect(this.overlay).toBeHidden();
  }

  /**
   * Change the grid width through `updateSettings()` while the overlay is hidden.
   */
  async setGridWidth(width: number): Promise<void> {
    await this.page.evaluate(w => window.hot.updateSettings({ width: w }), width);
  }

  /**
   * Go to the next page from the pager, which starts a fetch and turns the loading overlay on.
   */
  async nextPageFromPager(): Promise<void> {
    await this.page.getByRole('button', { name: /next page/i }).click();
    await expect(this.overlay).toBeVisible();
  }

  /**
   * The overlay's size as it is on screen now.
   */
  async overlaySize(): Promise<BoxSize> {
    const box = await this.overlay.boundingBox();

    if (!box) {
      throw new Error('The empty data state overlay is not on screen');
    }

    return { width: Math.round(box.width), height: Math.round(box.height) };
  }

  /**
   * Render the grid and return the overlay size the render gives it, which is the size the overlay
   * must have had already.
   */
  async overlaySizeAfterRender(): Promise<BoxSize> {
    await this.page.evaluate(() => window.hot.render());

    return this.overlaySize();
  }
}
