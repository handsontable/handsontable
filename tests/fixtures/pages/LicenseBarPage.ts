import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the license notification bar fixture.
 *
 * The fixture renders a deliberately narrow grid without a license key, so the
 * license notification appears in the bottom slot. The bar's width is defined
 * by the grid (DEV-1108). On grids narrower than the bar's minimum width the
 * bottom slot scrolls the excess horizontally instead of letting the bar's
 * content overflow the grid (DEV-2192).
 */
export class LicenseBarPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly slot: Locator;
  readonly bar: Locator;
  readonly supportLink: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.slot = page.locator('.ht-slot-bottom');
    this.bar = page.locator('.hot-display-license-info');
    this.supportLink = this.bar.getByRole('link', { name: 'support@handsontable.com' });
  }

  /**
   * Navigate to the fixture with the given grid width and wait for the
   * license bar to render. Waits on a real DOM condition (the bar and its
   * support link are visible) — no fixed timeouts.
   */
  async goto(gridWidth: number): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/license-bar.html?theme=${this.theme}&bundle=${this.bundle}&width=${gridWidth}`);
    await expect(this.bar).toBeVisible();
    await expect(this.supportLink).toBeVisible();
  }

  /**
   * The bar's rendered width in pixels — must never fall below its CSS
   * minimum width, regardless of how narrow the grid is.
   */
  async barWidthPx(): Promise<number> {
    return this.bar.evaluate(element => element.getBoundingClientRect().width);
  }

  /**
   * The bar's horizontal content overflow in pixels — 0 when everything
   * fits within the bar's own box.
   */
  async barContentOverflowPx(): Promise<number> {
    return this.bar.evaluate(element => element.scrollWidth - element.clientWidth);
  }

  /**
   * The bottom slot's horizontal overflow state: how many pixels of content
   * exceed the slot's visible width, and whether the slot is set up to
   * scroll (rather than clip or spill) that excess.
   */
  async slotOverflowState(): Promise<{ hiddenContentPx: number; scrollsHorizontally: boolean }> {
    return this.slot.evaluate(element => ({
      hiddenContentPx: element.scrollWidth - element.clientWidth,
      scrollsHorizontally: ['auto', 'scroll'].includes(getComputedStyle(element).overflowX),
    }));
  }
}
