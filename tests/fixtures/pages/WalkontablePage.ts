import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the Walkontable frozen-panes fixture. Encapsulates the
 * overlay clones the engine produces (master, top, inline-start, corner) and
 * scroll interaction, so specs assert engine behavior without reaching into
 * walkontable DOM class names directly.
 */
export class WalkontablePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly master: Locator;
  readonly topOverlay: Locator;
  readonly inlineStartOverlay: Locator;
  readonly corner: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.master = this.grid.locator('.ht_master');
    this.topOverlay = this.grid.locator('.ht_clone_top');
    this.inlineStartOverlay = this.grid.locator('.ht_clone_inline_start');
    this.corner = this.grid.locator('.ht_clone_top_inline_start_corner');
  }

  /**
   * Navigate and wait for the grid to render (a real DOM condition, no sleep).
   * The active theme and bundle are passed as query params so the fixture
   * loads the matching stylesheet and Handsontable build.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/walkontable.html?theme=${this.theme}&bundle=${this.bundle}`);
    await expect(this.master).toBeVisible();
  }

  /** The scrollable master holder. */
  holder(): Locator {
    return this.master.locator('.wtHolder');
  }

  /** Scroll the master viewport by a pixel delta and let the overlays sync. */
  async scrollBy(top: number, left = 0): Promise<void> {
    await this.holder().evaluate((el, d) => {
      el.scrollTop += d.top;
      el.scrollLeft += d.left;
    }, { top, left });
  }

  /** Current scroll offset of the master holder. */
  async scrollOffset(): Promise<{ top: number, left: number }> {
    return this.holder().evaluate(el => ({ top: el.scrollTop, left: el.scrollLeft }));
  }
}
