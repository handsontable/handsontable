import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

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
 * Inline extents of the grid root, the master holder, and the master table, in viewport x
 * coordinates, plus the holder's inline width and scroll extents.
 */
export interface HorizontalSizes {
  /**
   * How far the master table's inline-end edge (the right edge in LTR, the left edge in RTL) passes
   * the grid root's inline-end edge; `0` or less when it stays inside the root.
   */
  tableInlineEndOverflow: number;
  rootLeft: number;
  rootRight: number;
  rootWidth: number;
  holderLeft: number;
  holderRight: number;
  holderWidth: number;
  holderInlineWidth: string;
  holderClientWidth: number;
  holderScrollWidth: number;
  tableLeft: number;
  tableRight: number;
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
    await awaitBundle(this.page);
    await this.waitForRender();
  }

  /**
   * Rebuilds the grid with the given settings on top of the fixture defaults.
   * `containerClass` picks a parent layout declared in the fixture, and a
   * non-empty `wrapperClass` puts a `<div>` with that class between the parent
   * and the grid.
   */
  async rebuild(settings: Record<string, unknown>, containerClass = '', wrapperClass = ''): Promise<void> {
    await this.page.evaluate(
      ([s, c, w]) => window.initRootSizeGrid(s, c, w),
      [settings, containerClass, wrapperClass] as const,
    );
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

  /**
   * Heights of the fixture's parent container, the master holder and the master table, read in
   * one evaluation, plus the holder's inline height.
   */
  async verticalSizes(): Promise<{
    parentHeight: number,
    holderHeight: number,
    holderInlineHeight: string,
    tableHeight: number,
  }> {
    return this.page.evaluate(() => {
      const holder = document.querySelector<HTMLElement>('.ht_master .wtHolder');
      const table = document.querySelector<HTMLElement>('.ht_master table.htCore');
      const parent = document.getElementById('container');

      if (!holder || !table || !parent) {
        throw new Error('holder, table or container is not rendered');
      }

      return {
        parentHeight: parent.offsetHeight,
        holderHeight: holder.offsetHeight,
        holderInlineHeight: holder.style.height,
        tableHeight: table.offsetHeight,
      };
    });
  }

  /**
   * Rebuilds the grid like `rebuild()` and returns the master table's width as the constructor's own
   * render left it, read in the same task, before any animation frame could redraw the grid.
   */
  async rebuildAndMeasureFirstRender(
    settings: Record<string, unknown>,
    containerClass = '',
    wrapperClass = '',
  ): Promise<number> {
    const tableWidth = await this.page.evaluate(([s, c, w]) => {
      window.initRootSizeGrid(s, c, w);

      const table = window.hot.rootElement.querySelector<HTMLElement>('.ht_master table.htCore');

      if (!table) {
        throw new Error('table is not rendered');
      }

      return table.getBoundingClientRect().width;
    }, [settings, containerClass, wrapperClass] as const);

    await this.waitForRender();

    return tableWidth;
  }

  /**
   * Adds or removes a class on the grid's parent, the way a stylesheet state change would: nothing
   * tells the grid but the resize it causes.
   */
  async toggleContainerClass(className: string, force: boolean): Promise<void> {
    await this.page.evaluate(([name, on]) => {
      document.getElementById('container')?.classList.toggle(name, on);
    }, [className, force] as const);
  }

  /**
   * The content-box width of the modal `<dialog>` `rebuild(..., 'modal-dialog')` put the grid in.
   */
  async dialogContentWidth(): Promise<number> {
    return this.page.evaluate(() => {
      const dialog = document.querySelector('dialog');

      if (!dialog) {
        throw new Error('the grid is not in a dialog');
      }

      const style = getComputedStyle(dialog);

      return dialog.getBoundingClientRect().width
        - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
        - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth);
    });
  }

  /**
   * The width of the top overlay (the column headers), in the same evaluation as the root's.
   */
  async topOverlayAndRootWidths(): Promise<{ topOverlayWidth: number, rootWidth: number }> {
    return this.page.evaluate(() => {
      const root = window.hot.rootElement;
      const clone = root.querySelector<HTMLElement>('.ht_clone_top');

      if (!clone) {
        throw new Error('the top overlay is not rendered');
      }

      return {
        topOverlayWidth: clone.getBoundingClientRect().width,
        rootWidth: root.getBoundingClientRect().width,
      };
    });
  }

  /**
   * Renders the grid, the way any unrelated change would (an edit, new data, a scroll that lands on
   * new rows).
   */
  async render(): Promise<void> {
    await this.page.evaluate(() => {
      window.hot.render();
    });
  }

  /**
   * Resizes the browser window's width, keeping its height, the way a user drags it.
   */
  async setViewportWidth(width: number): Promise<void> {
    const size = this.page.viewportSize();

    await this.page.setViewportSize({ width, height: size?.height ?? 720 });
  }

  /**
   * Waits for the grid to stop redrawing, then redraws it once, so the engine's cached layout
   * measurements describe the settled layout, as on a grid that has been on the page for a while. A
   * fresh grid's resize observers drop that cache once on their first delivery, and a change made
   * before then is re-measured whether the cache would have caught it or not.
   */
  async settleAndRedraw(): Promise<void> {
    await expect.poll(async () => this.rendersOverFrames(5)).toBe(0);
    // The redraw that fills the cache, counted: the positive control for the quiet frames above.
    expect(await this.rendersOverFrames(1, true)).toBeGreaterThan(0);
  }

  /**
   * Sets the padding of the wrapper `rebuild()` put between the parent and the grid (`wrapperClass`),
   * the way a stylesheet change would: nothing tells the grid but the resize it causes.
   */
  async setWrapperPadding(padding: string): Promise<void> {
    await this.page.evaluate((value) => {
      const wrapper = document.querySelector<HTMLElement>('#container > div:not(#grid)');

      if (!wrapper) {
        throw new Error('the grid has no wrapper');
      }

      wrapper.style.padding = value;
    }, padding);
  }

  /**
   * Counts the grid's renders over the next `frames` animation frames. With `forceRender`, the count
   * starts with a `render()` call, which is the positive control for a count expected to be 0: it
   * proves the counter sees a render when there is one.
   */
  async rendersOverFrames(frames: number, forceRender = false): Promise<number> {
    return this.page.evaluate(async([count, force]) => {
      const { hot } = window;
      let renders = 0;
      const onRender = () => {
        renders += 1;
      };

      hot.addHook('afterRender', onRender);

      if (force) {
        hot.render();
      }

      for (let frame = 0; frame < count; frame++) {
        await new Promise(resolve => requestAnimationFrame(resolve));
      }

      hot.removeHook('afterRender', onRender);

      return renders;
    }, [frames, forceRender] as const);
  }

  /**
   * Inline extents of the grid root (`hot.rootElement`), the master holder, and the master table,
   * read in one evaluation.
   */
  async horizontalSizes(): Promise<HorizontalSizes> {
    return this.page.evaluate(() => {
      const root = window.hot.rootElement;
      const holder = root.querySelector<HTMLElement>('.ht_master .wtHolder');
      const table = root.querySelector<HTMLElement>('.ht_master table.htCore');

      if (!holder || !table) {
        throw new Error('holder or table is not rendered');
      }

      const rootRect = root.getBoundingClientRect();
      const holderRect = holder.getBoundingClientRect();
      const tableRect = table.getBoundingClientRect();
      const isRtl = getComputedStyle(holder).direction === 'rtl';

      return {
        tableInlineEndOverflow: isRtl ? rootRect.left - tableRect.left : tableRect.right - rootRect.right,
        rootLeft: rootRect.left,
        rootRight: rootRect.right,
        rootWidth: rootRect.width,
        holderLeft: holderRect.left,
        holderRight: holderRect.right,
        holderWidth: holderRect.width,
        holderInlineWidth: holder.style.width,
        holderClientWidth: holder.clientWidth,
        holderScrollWidth: holder.scrollWidth,
        tableLeft: tableRect.left,
        tableRight: tableRect.right,
      };
    });
  }

  /**
   * Scrolls the master holder to its inline end (the right edge in LTR, the left edge in RTL, where
   * `scrollLeft` counts down from 0) and waits for a cell of `lastColumn` to render. The redraw is
   * batched into an animation frame, so the wait is on the cell, not on `scrollLeft`.
   */
  async scrollHolderToInlineEnd(lastColumn: number): Promise<void> {
    await this.page.evaluate(() => {
      const holder = window.hot.rootElement.querySelector<HTMLElement>('.ht_master .wtHolder');

      if (!holder) {
        throw new Error('holder is not rendered');
      }

      // The browser clamps the offset to the scroll range, so the full scroll width reaches the end.
      holder.scrollLeft = (getComputedStyle(holder).direction === 'rtl' ? -1 : 1) * holder.scrollWidth;
    });
    await expect(this.cell(0, lastColumn)).toBeVisible();
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
