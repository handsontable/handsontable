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
  readonly overlay: Locator;
  readonly pager: Locator;
  readonly nextPageButton: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.status = page.getByTestId('status');
    this.overlay = this.grid.locator('.ht-empty-data-state');
    this.pager = this.grid.locator('.ht-pagination');
    this.nextPageButton = this.grid.getByRole('button', { name: 'Go to next page', exact: true });
  }

  /**
   * Navigate to the fixture and release the initial fetch.
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
   * Resolve the pending fetch and wait for the loading overlay to go away, which happens once the
   * fetched rows are applied.
   */
  async releaseFetch(): Promise<void> {
    await expect.poll(() => this.page.evaluate(() =>
      (window as unknown as FixtureWindow).htHasPendingFetch())).toBe(true);
    await this.page.evaluate(() => (window as unknown as FixtureWindow).htReleaseFetch());
    await expect(this.overlay).toBeHidden();
  }

  /**
   * Change the grid width through `updateSettings()` while the overlay is hidden.
   */
  async setGridWidth(width: number): Promise<void> {
    await this.page.evaluate(w => window.hot.updateSettings({ width: w }), width);
  }

  /**
   * Change the grid height through `updateSettings()` while the overlay is hidden.
   */
  async setGridHeight(height: number): Promise<void> {
    await this.page.evaluate(h => window.hot.updateSettings({ height: h }), height);
  }

  /**
   * Go to the next page from the pager, which starts a fetch and turns the loading overlay on.
   */
  async nextPageFromPager(): Promise<void> {
    await this.nextPageButton.click();
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
   * How far the overlay's bottom edge reaches past the pager's top edge, in CSS pixels. Zero or less
   * means the overlay leaves the pager uncovered.
   */
  async overlayOverlapWithPager(): Promise<number> {
    const overlayBox = await this.overlay.boundingBox();
    const pagerBox = await this.pager.boundingBox();

    if (!overlayBox || !pagerBox) {
      throw new Error('The overlay or the pager is not on screen');
    }

    return Math.round(overlayBox.y + overlayBox.height - pagerBox.y);
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
