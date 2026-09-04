import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the width-only window-scroll fixture: a grid with a definite
 * `width`, no `height`, and frozen rows and columns. The root clips the
 * horizontal axis only, so the holder scrolls the columns while the WINDOW
 * scrolls the rows. Encapsulates the overlay locators, the two scroll drivers,
 * and the geometry reads the specs compare.
 */
export class WidthWindowScrollPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly master: Locator;
  readonly holder: Locator;
  readonly topOverlay: Locator;
  readonly inlineStartOverlay: Locator;
  readonly topCorner: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.master = this.grid.locator('.ht_master');
    this.holder = this.master.locator('.wtHolder');
    this.topOverlay = this.grid.locator('.ht_clone_top');
    this.inlineStartOverlay = this.grid.locator('.ht_clone_inline_start');
    this.topCorner = this.grid.locator('.ht_clone_top_inline_start_corner');
  }

  /**
   * Navigate and wait for the bundle and the first render (a real DOM
   * condition, no sleep).
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/width-window-scroll.html?theme=${this.theme}&bundle=${this.bundle}`);
    await this.page.waitForFunction(() => 'Handsontable' in window);
    await this.waitForRender();
  }

  /**
   * Rebuilds the grid with setting overrides. `containerWidth` sizes the
   * parent instead of the grid (the legacy `preventOverflow` leg).
   */
  async rebuild(overrides: Record<string, unknown>, containerWidth = ''): Promise<void> {
    await this.page.evaluate(([o, w]) => window.initGrid(o, w), [overrides, containerWidth] as const);
    await this.waitForRender();
  }

  /**
   * Waits for the frozen corner to render. The master never renders the
   * frozen columns, so cell (0,0) exists only in the corner clone.
   */
  async waitForRender(): Promise<void> {
    await expect(this.frozenCornerCell(0, 0)).toBeVisible();
  }

  /** A data cell in the MASTER table (frozen cells live only in the clones). */
  cell(row: number, col: number): Locator {
    return this.master.getByTestId(`cell-${row}-${col}`);
  }

  /** A frozen-row cell in the top clone. */
  topCloneCell(row: number, col: number): Locator {
    return this.topOverlay.getByTestId(`cell-${row}-${col}`);
  }

  /** A frozen-column cell in the inline-start clone. */
  inlineStartCloneCell(row: number, col: number): Locator {
    return this.inlineStartOverlay.getByTestId(`cell-${row}-${col}`);
  }

  /** The visible instance of a cell inside the top/inline-start corner clone. */
  frozenCornerCell(row: number, col: number): Locator {
    return this.topCorner.getByTestId(`cell-${row}-${col}`);
  }

  /** Scrolls the master holder horizontally and waits two frames. */
  async scrollHolderBy(x: number): Promise<void> {
    await this.page.evaluate((dx) => {
      const holder = document.querySelector('.ht_master .wtHolder');

      if (!holder) {
        throw new Error('holder is not rendered');
      }

      holder.scrollLeft += dx;

      return new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    }, x);
  }

  /** Scrolls the window by a delta and waits two frames. */
  async scrollWindowBy(x: number, y: number): Promise<void> {
    await this.page.evaluate(([dx, dy]) => {
      window.scrollBy(dx, dy);

      return new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    }, [x, y]);
  }

  /** Holder and document scroll extents, to tell which one scrolls each axis. */
  async scrollExtents(): Promise<{
    holderScrollWidth: number,
    holderClientWidth: number,
    holderScrollLeft: number,
    documentScrollWidth: number,
    documentClientWidth: number,
    windowScrollY: number,
  }> {
    return this.page.evaluate(() => {
      const holder = document.querySelector('.ht_master .wtHolder');

      if (!holder) {
        throw new Error('holder is not rendered');
      }

      return {
        holderScrollWidth: holder.scrollWidth,
        holderClientWidth: holder.clientWidth,
        holderScrollLeft: holder.scrollLeft,
        documentScrollWidth: document.documentElement.scrollWidth,
        documentClientWidth: document.documentElement.clientWidth,
        windowScrollY: window.scrollY,
      };
    });
  }

  /** Applies settings to the live grid through `updateSettings()` and waits for the render. */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate((s) => {
      window.hot.updateSettings(s);

      return new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    }, settings);
    await this.waitForRender();
  }

  /**
   * The grid root's inline overflow longhands and class list. The root is the `<div>` core builds
   * inside the container (`hot.rootElement`), not the `#grid` container itself.
   */
  async rootState(): Promise<{ overflow: string, overflowX: string, classes: string[] }> {
    return this.page.evaluate(() => {
      const root = window.hot.rootElement;

      return {
        overflow: root.style.overflow,
        overflowX: root.style.overflowX,
        classes: Array.from(root.classList),
      };
    });
  }

  /** Bounding box of the grid root (`hot.rootElement`), which carries the `width`. */
  async rootBox(): Promise<{ x: number, y: number, width: number, height: number }> {
    return this.page.evaluate(() => {
      const { x, y, width, height } = window.hot.rootElement.getBoundingClientRect();

      return { x, y, width, height };
    });
  }

  /** The engine's own answer to which element owns each axis. */
  async axisOwners(): Promise<{ verticalByWindow: boolean, horizontalByWindow: boolean }> {
    return this.page.evaluate(() => ({
      verticalByWindow: window.hot.view.isVerticallyScrollableByWindow(),
      horizontalByWindow: window.hot.view.isHorizontallyScrollableByWindow(),
    }));
  }

  /** How many rows and columns the master rendered (virtualization probe). */
  async renderedCounts(): Promise<{ rows: number, columns: number }> {
    return this.page.evaluate(() => ({
      rows: document.querySelectorAll('.ht_master tbody tr').length,
      columns: document.querySelectorAll('.ht_master tbody tr:first-child td').length,
    }));
  }

  /** The count of `afterScrollVertically` calls since the last rebuild. */
  async verticalScrollCount(): Promise<number> {
    return this.page.evaluate(() => window.verticalScrollCount);
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
