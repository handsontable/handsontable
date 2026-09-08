import { type Page, type Locator, expect } from '@playwright/test';

/**
 * The root element's inline size properties, plus the computed overflow the browser resolved from
 * them.
 */
export interface RootInlineSize {
  height: string;
  width: string;
  overflow: string;
  overflowX: string;
  overflowY: string;
  computedOverflowX: string;
  computedOverflowY: string;
}

/**
 * Page Object for the root size options fixture: one grid rebuilt per case
 * through `initRootSizeGrid()`. Encapsulates the rebuild, the inline-style and
 * axis-owner reads, the two scroll drivers, and the console warning collector.
 */
export class RootSizeOptionsPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly master: Locator;
  readonly holder: Locator;
  readonly warnings: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.master = this.grid.locator('.ht_master');
    this.holder = this.master.locator('.wtHolder');
  }

  /**
   * Starts recording console warnings. Call it before the action expected to warn.
   */
  collectWarnings(): void {
    this.page.on('console', (message) => {
      if (message.type() === 'warning') {
        this.warnings.push(message.text());
      }
    });
  }

  /**
   * The recorded warnings about a size option.
   */
  sizeWarnings(): string[] {
    return this.warnings.filter(text => text.includes('cannot be read as a size'));
  }

  /**
   * Navigate and wait for the bundle and the first render (a real DOM
   * condition, no sleep).
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/root-size-options.html?theme=${this.theme}&bundle=${this.bundle}`);
    await this.page.waitForFunction(() => 'Handsontable' in window);
    await this.waitForRender();
  }

  /**
   * Rebuilds the grid with the given settings on top of the fixture defaults.
   * `containerClass` picks a parent layout declared in the fixture.
   */
  async rebuild(settings: Record<string, unknown>, containerClass = ''): Promise<void> {
    await this.page.evaluate(([s, c]) => window.initRootSizeGrid(s, c), [settings, containerClass] as const);
    await this.waitForRender();
  }

  /**
   * Waits for the first data cell of the master table to render.
   */
  async waitForRender(): Promise<void> {
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A data cell in the master table. */
  cell(row: number, col: number): Locator {
    return this.master.getByTestId(`cell-${row}-${col}`);
  }

  /** Applies settings to the live grid through `updateSettings()` and waits two frames. */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate((s) => {
      window.hot.updateSettings(s);

      return new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    }, settings);
  }

  /**
   * The grid root's inline size properties. The root is the `<div>` core builds inside the
   * container (`hot.rootElement`), not the `#grid` container itself.
   */
  async rootState(): Promise<RootInlineSize> {
    return this.page.evaluate(() => {
      const root = window.hot.rootElement;
      const computed = getComputedStyle(root);

      return {
        height: root.style.height,
        width: root.style.width,
        overflow: root.style.overflow,
        overflowX: root.style.overflowX,
        overflowY: root.style.overflowY,
        computedOverflowX: computed.overflowX,
        computedOverflowY: computed.overflowY,
      };
    });
  }

  /** Bounding box of the grid root (`hot.rootElement`). */
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

  /** How many rows the master rendered (virtualization probe). */
  async renderedRows(): Promise<number> {
    return this.page.evaluate(() => document.querySelectorAll('.ht_master tbody tr').length);
  }

  /** Scroll extents of the holder and the fixture's parent container. */
  async scrollExtents(): Promise<{
    holderScrollWidth: number,
    holderClientWidth: number,
    holderScrollHeight: number,
    holderClientHeight: number,
    parentScrollHeight: number,
    parentClientHeight: number,
  }> {
    return this.page.evaluate(() => {
      const holder = document.querySelector('.ht_master .wtHolder');
      const parent = document.getElementById('container');

      if (!holder || !parent) {
        throw new Error('holder or container is not rendered');
      }

      return {
        holderScrollWidth: holder.scrollWidth,
        holderClientWidth: holder.clientWidth,
        holderScrollHeight: holder.scrollHeight,
        holderClientHeight: holder.clientHeight,
        parentScrollHeight: parent.scrollHeight,
        parentClientHeight: parent.clientHeight,
      };
    });
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

  /** Bounding box of a locator, throwing when it is not rendered. */
  async box(locator: Locator): Promise<{ x: number, y: number, width: number, height: number }> {
    const b = await locator.boundingBox();

    if (!b) {
      throw new Error('element is not rendered');
    }

    return b;
  }
}
