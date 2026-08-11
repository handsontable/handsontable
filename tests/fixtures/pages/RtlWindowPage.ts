import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the RTL window-scroll Walkontable fixture: an RTL grid with
 * frozen top/bottom rows, frozen inline-start columns, and both header kinds,
 * where the WINDOW scrolls in both axes. Encapsulates the overlay-clone
 * locators and viewport-edge measurements so specs assert overlay stickiness
 * without engine-internal holder arithmetic.
 */
export class RtlWindowPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly master: Locator;
  readonly topOverlay: Locator;
  readonly bottomOverlay: Locator;
  readonly inlineStartOverlay: Locator;
  readonly topCorner: Locator;
  readonly bottomCorner: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.master = this.grid.locator('.ht_master');
    this.topOverlay = this.grid.locator('.ht_clone_top');
    this.bottomOverlay = this.grid.locator('.ht_clone_bottom');
    this.inlineStartOverlay = this.grid.locator('.ht_clone_inline_start');
    this.topCorner = this.grid.locator('.ht_clone_top_inline_start_corner');
    this.bottomCorner = this.grid.locator('.ht_clone_bottom_inline_start_corner');
  }

  /**
   * Navigate and wait for the grid to render (a real DOM condition, no sleep).
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/walkontable-rtl-window.html?theme=${this.theme}&bundle=${this.bundle}`);
    await expect(this.master).toBeVisible();
  }

  /**
   * Scroll the window to the document end in both axes (in RTL the horizontal
   * end is the leftmost scroll position — negative scrollLeft in Chromium)
   * and wait two frames for the overlays to reposition.
   */
  async scrollWindowToEnd(): Promise<void> {
    await this.page.evaluate(() => {
      const el = document.documentElement;

      window.scrollTo(-el.scrollWidth, el.scrollHeight);

      return new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    });
  }

  /** The viewport size, for edge assertions. */
  async viewport(): Promise<{ width: number, height: number }> {
    return this.page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    }));
  }

  /** Bounding box of a locator, throwing when it is not rendered. */
  async box(locator: Locator): Promise<{ x: number, y: number, width: number, height: number }> {
    const b = await locator.boundingBox();

    if (!b) {
      throw new Error('element is not rendered');
    }

    return b;
  }
}
