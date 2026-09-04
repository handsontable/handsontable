import { type Page, expect } from '@playwright/test';

/**
 * Page Object for the cross-realm fixture: the grid's DOM lives in an iframe while the
 * `Handsontable` constructor that built it is the parent page's. Every node the engine holds is
 * therefore from another realm, where `node instanceof HTMLElement` is false. The layout is the
 * width-only split mode — the root owns the horizontal axis, the iframe's window owns the vertical
 * one — so the engine has to agree with itself about an owner it cannot recognize by constructor.
 *
 * Every read goes through the PARENT page (`window.frameDoc` / `window.hot`), because the state
 * under test is the engine's, not the rendered document's.
 */
export class IframeWidthWindowScrollPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate and wait for the bundle, the iframe's stylesheets, and the first render. The fixture
   * builds the grid asynchronously (it awaits the iframe stylesheets), so `ready` is the signal.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/iframe-width-window-scroll.html?theme=${this.theme}&bundle=${this.bundle}`);
    await this.page.waitForFunction(() => 'Handsontable' in window);
    await this.page.waitForFunction(() => (window as unknown as { ready: boolean }).ready === true);
    await expect
      .poll(async () => (await this.holderState()).scrollWidth)
      .toBeGreaterThan(0);
  }

  /**
   * The master holder's layout, read inside the iframe's realm. `computedOverflowX` is the tell for
   * which mode the master table laid the holder out in: the window mode writes `visible` on it, an
   * owner-sized axis leaves the stylesheet's `auto` in place.
   */
  async holderState(): Promise<{
    computedOverflowX: string,
    inlineOverflow: string,
    scrollWidth: number,
    clientWidth: number,
    scrollLeft: number,
  }> {
    return this.page.evaluate(() => {
      const win = (window as unknown as { frameWin: Window }).frameWin;
      const holder = (window as unknown as { frameDoc: Document }).frameDoc
        .querySelector('.ht_master .wtHolder');

      if (!holder) {
        throw new Error('holder is not rendered inside the iframe');
      }

      return {
        computedOverflowX: win.getComputedStyle(holder).overflowX,
        inlineOverflow: (holder as HTMLElement).style.overflow,
        scrollWidth: holder.scrollWidth,
        clientWidth: holder.clientWidth,
        scrollLeft: holder.scrollLeft,
      };
    });
  }

  /** The engine's own answer to which element owns each axis. */
  async axisOwners(): Promise<{ verticalByWindow: boolean, horizontalByWindow: boolean }> {
    return this.page.evaluate(() => {
      const hot = (window as unknown as { hot: { view: {
        isVerticallyScrollableByWindow(): boolean,
        isHorizontallyScrollableByWindow(): boolean,
      } } }).hot;

      return {
        verticalByWindow: hot.view.isVerticallyScrollableByWindow(),
        horizontalByWindow: hot.view.isHorizontallyScrollableByWindow(),
      };
    });
  }

  /** Scrolls the master holder horizontally and waits two frames of the IFRAME's rendering. */
  async scrollHolderBy(x: number): Promise<void> {
    await this.page.evaluate((dx) => {
      const win = (window as unknown as { frameWin: Window }).frameWin;
      const holder = (window as unknown as { frameDoc: Document }).frameDoc
        .querySelector('.ht_master .wtHolder');

      if (!holder) {
        throw new Error('holder is not rendered inside the iframe');
      }

      holder.scrollLeft += dx;

      return new Promise(resolve => {
        win.requestAnimationFrame(() => win.requestAnimationFrame(resolve));
      });
    }, x);
  }

  /**
   * How many times the grid's scroll hooks fired since the last build. They are driven by the
   * engine's per-frame scroll-direction flags, which are computed from the offsets read off each
   * axis' owner — the one thing in the engine that ONLY those reads decide.
   */
  async scrollHookCounts(): Promise<{ horizontal: number, vertical: number }> {
    return this.page.evaluate(() =>
      (window as unknown as { scrollHookCounts: { horizontal: number, vertical: number } }).scrollHookCounts);
  }

  /**
   * The column indexes the master and the top clone render right now. The two must match: the top
   * clone follows the master's horizontal scroll, and nothing else keeps the frozen rows aligned.
   */
  async renderedColumns(): Promise<{ master: number[], topClone: number[] }> {
    return this.page.evaluate(() => {
      const doc = (window as unknown as { frameDoc: Document }).frameDoc;
      const read = (selector: string) => Array
        .from(doc.querySelectorAll(`${selector} tbody tr:first-child td[data-testid]`))
        .map(td => Number(td.getAttribute('data-testid')?.split('-').pop()));

      return {
        master: read('.ht_master'),
        topClone: read('.ht_clone_top'),
      };
    });
  }
}
