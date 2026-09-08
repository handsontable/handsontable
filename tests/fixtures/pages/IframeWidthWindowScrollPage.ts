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
   * Turns the wheel over a frozen-row cell INSIDE the iframe. The one place this page object goes
   * through a `frameLocator`: the pointer has to land on the iframe's node, and that is an input,
   * not a read of the engine's state.
   */
  async wheelOverFrozenRow(deltaX: number, deltaY: number): Promise<void> {
    await this.page.frameLocator('#frame').locator('.ht_clone_top').getByTestId('cell-0-3').hover();
    await this.page.mouse.wheel(deltaX, deltaY);
  }

  /**
   * The rows the master renders right now, read off the engine. Which BAND renders is the vertical
   * axis' answer to "where is the window scrolled to", and a window the engine cannot recognize
   * answered it with `undefined` — the band then landed on the last rows of the grid.
   */
  async masterRowBand(): Promise<{ first: number, last: number }> {
    return this.page.evaluate(() => {
      const wtTable = (window as unknown as { hot: { view: { _wt: { wtTable: {
        getFirstRenderedRow(): number,
        getLastRenderedRow(): number,
      } } } } }).hot.view._wt.wtTable;

      return { first: wtTable.getFirstRenderedRow(), last: wtTable.getLastRenderedRow() };
    });
  }

  /** Scrolls the IFRAME's window by a delta and waits two of its frames. */
  async scrollFrameWindowBy(x: number, y: number): Promise<void> {
    await this.page.evaluate(([dx, dy]) => {
      const win = (window as unknown as { frameWin: Window }).frameWin;

      win.scrollBy(dx, dy);

      return new Promise(resolve => {
        win.requestAnimationFrame(() => win.requestAnimationFrame(resolve));
      });
    }, [x, y]);
  }

  /** Clicks a master cell INSIDE the iframe — an input, so it goes through a `frameLocator`. */
  async clickMasterCell(row: number, col: number): Promise<void> {
    await this.page.frameLocator('#frame').locator('.ht_master').getByTestId(`cell-${row}-${col}`).click();
  }

  /**
   * Where one rendered column sits in the master and in the top clone, inside the iframe's own
   * coordinate space. The two must agree: the top clone follows the master's horizontal scroll,
   * and nothing else keeps the frozen rows over their columns.
   */
  async columnAlignment(): Promise<{ column: number, masterX: number, topCloneX: number }> {
    return this.page.evaluate(() => {
      const doc = (window as unknown as { frameDoc: Document }).frameDoc;
      const firstRow = doc.querySelector('.ht_master tbody tr:first-child');
      const cells = Array.from(firstRow?.querySelectorAll('td[data-testid]') ?? []);
      const probe = cells[Math.floor(cells.length / 2)];

      if (!probe) {
        throw new Error('the master renders no columns');
      }

      const [, row, column] = (probe.getAttribute('data-testid') ?? '').split('-').map(Number);
      const topCell = doc.querySelector(`.ht_clone_top [data-testid="cell-0-${column}"]`);

      if (!topCell) {
        throw new Error(`column ${column} is not rendered in the top clone`);
      }

      return {
        column,
        masterX: doc.querySelector(`.ht_master [data-testid="cell-${row}-${column}"]`)!.getBoundingClientRect().x,
        topCloneX: topCell.getBoundingClientRect().x,
      };
    });
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
