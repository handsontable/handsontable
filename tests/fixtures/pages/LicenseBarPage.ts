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
  readonly contactLink: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.slot = page.locator('.ht-slot-bottom');
    this.bar = page.locator('.hot-display-license-info');
    // The unbreakable token this spec is about: whichever contact address the bar's state
    // carries. The fixture's lapsed key names sales@; a missing or invalid key no longer
    // renders a bar at all (DEV-2562), so support@ is not reachable here any more.
    this.contactLink = this.bar.getByRole('link', { name: /@handsontable\.com$/ }).first();
  }

  /**
   * Navigate to the fixture with the given grid width and wait for the
   * license bar to render. Waits on a real DOM condition (the bar and its
   * support link are visible) — no fixed timeouts.
   */
  async goto(gridWidth: number): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/license-bar.html?theme=${this.theme}&bundle=${this.bundle}&width=${gridWidth}`);
    await expect(this.bar).toBeVisible();
    await expect(this.contactLink).toBeVisible();
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
   * Gives the grid the page's width (`width: '100%'`), as a page narrower than the fixture's pixel
   * width does for a reader at 320 px.
   */
  async fitGridToViewport(): Promise<void> {
    await this.page.evaluate(() => {
      const root = document.querySelector('.ht-root-wrapper') as (Element & {
        __hotInstance?: { updateSettings(settings: object): void };
      }) | null;

      root!.__hotInstance!.updateSettings({ width: '100%' });
    });
    // The new width settles over the next frames (the bar wraps, the height is re-applied).
    await this.page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
  }

  /**
   * How many lines the notice text takes: the bar's content height over its line height.
   */
  async barLineCount(): Promise<number> {
    return this.bar.evaluate((element) => {
      const style = getComputedStyle(element);
      const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

      return Math.round((element.getBoundingClientRect().height - padding) / parseFloat(style.lineHeight));
    });
  }

  /**
   * How many pixels the page scrolls sideways (WCAG 1.4.10 asks for none at 320 px).
   */
  async pageSidewaysScrollPx(): Promise<number> {
    return this.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  }

  /**
   * How many pixels of the grid's own box (`.ht-wrapper`, which clips) its content reaches past:
   * the header row of a grid the bottom bar left too little room reads as cut off.
   */
  async gridBoxClippedPx(): Promise<number> {
    return this.page.locator('.ht-wrapper').first()
      .evaluate(element => element.scrollHeight - element.clientHeight);
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
