import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';

/**
 * The fixture's options, `?height=` and `?columns=` by another name.
 */
export interface ClippedContainerOptions {
  /**
   * `auto`, the docs examples' setting, or `300` px. `auto` when omitted.
   */
  height?: 'auto' | '300';
  /**
   * Declares three columns with no rows. The grid has no columns at all when omitted.
   */
  columns?: boolean;
}

/**
 * Where the overlay, the grid's root and the toolbar below the grid end, in viewport coordinates.
 */
export interface OverlayGeometry {
  overlayTop: number;
  overlayBottom: number;
  rootTop: number;
  rootBottom: number;
  toolbarTop: number;
}

/**
 * Page object for `fixtures/demo/empty-data-state-clipped-container.html`, an empty grid in a container
 * that clips its overflow, with a toolbar under it.
 */
export class EmptyDataStateClippedContainerPage {
  readonly overlay: Locator;

  constructor(
    readonly page: Page,
    readonly theme = 'main',
    readonly bundle: Bundle = 'umd',
  ) {
    this.overlay = page.locator('.ht-empty-data-state');
  }

  /**
   * Opens the fixture with the given options and waits for the overlay.
   *
   * @param {ClippedContainerOptions} options The fixture's options.
   */
  async goto(options: ClippedContainerOptions = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    if (options.height) {
      params.set('height', options.height);
    }
    if (options.columns !== undefined) {
      params.set('columns', options.columns ? '1' : '0');
    }

    await this.page.goto(`/tests/fixtures/demo/empty-data-state-clipped-container.html?${params}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.overlay).toBeVisible();
  }

  /**
   * Reads the overlay, the grid's root and the toolbar in one evaluation.
   *
   * @returns {Promise<OverlayGeometry>}
   */
  async geometry(): Promise<OverlayGeometry> {
    return this.page.evaluate(() => {
      const overlay = document.querySelector('.ht-empty-data-state')!.getBoundingClientRect();
      const root = (window as unknown as { hot: { rootElement: HTMLElement } }).hot.rootElement
        .getBoundingClientRect();
      const toolbar = document.querySelector('[data-testid="toolbar"]')!.getBoundingClientRect();

      return {
        overlayTop: overlay.top,
        overlayBottom: overlay.bottom,
        rootTop: root.top,
        rootBottom: root.bottom,
        toolbarTop: toolbar.top,
      };
    });
  }
}
