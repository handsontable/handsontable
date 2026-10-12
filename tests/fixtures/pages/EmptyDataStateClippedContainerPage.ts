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
  /**
   * A 400 px wide grid with 30 columns, so it scrolls horizontally. Needs `columns`.
   */
  wide?: boolean;
  /**
   * Turns pagination on, which adds a bar under the grid.
   */
  pagination?: boolean;
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
  /**
   * Bottom of the master holder's client area, above a horizontal scrollbar track when there is one.
   */
  holderClientBottom: number;
  /**
   * Top of the pagination bar, or `null` without one.
   */
  paginationTop: number | null;
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

    if (options.wide !== undefined) {
      params.set('wide', options.wide ? '1' : '0');
    }
    if (options.pagination !== undefined) {
      params.set('pagination', options.pagination ? '1' : '0');
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
      const holder = document.querySelector('.ht_master .wtHolder') as HTMLElement;
      const pagination = document.querySelector('.ht-pagination');

      return {
        overlayTop: overlay.top,
        overlayBottom: overlay.bottom,
        rootTop: root.top,
        rootBottom: root.bottom,
        toolbarTop: toolbar.top,
        holderClientBottom: holder.getBoundingClientRect().top + holder.clientHeight,
        paginationTop: pagination ? pagination.getBoundingClientRect().top : null,
      };
    });
  }
}
