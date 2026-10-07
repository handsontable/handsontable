import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

export type FreezeBarEdge = 'top' | 'bottom' | 'start' | 'end';

/**
 * Page Object for the freezeBar plugin.
 *
 * The fixture has 50 rows and 15 columns in a 500 x 300 box. Column and row headers are stamped with their
 * visual index (`colheader-<col>`, `rowheader-<row>`). `freezeLog` collects every `afterFreezeChange` call.
 */
export class FreezeBarPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  /**
   * Errors the page reported since this page object was created.
   */
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');

    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /**
   * Navigate to the fixture and wait for the grid. `query` switches the variants the fixture knows.
   *
   * @param query The fixture's query params.
   */
  async goto(query: Record<string, string | number> = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    Object.entries(query).forEach(([key, value]) => params.set(key, String(value)));
    await this.page.goto(`/tests/fixtures/demo/freeze-bar.html?${params.toString()}`);
    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Grid failed to initialize: ${initError}`);
    }

    // a grid without headers has no column header to wait for
    await expect(this.grid.locator('.ht_master td').first()).toBeAttached();
  }

  colHeader(col: number): Locator {
    // the master table keeps a hidden copy under the overlay that draws the header
    return this.page.locator(`[data-testid="colheader-${col}"]:visible`).first();
  }

  rowHeader(row: number): Locator {
    return this.page.locator(`[data-testid="rowheader-${row}"]:visible`).first();
  }

  /**
   * The bar (or the handle of an empty edge) of an edge.
   *
   * @param edge The edge.
   */
  bar(edge: FreezeBarEdge): Locator {
    return this.grid.locator(`.ht-freeze-bar--${edge}:not(.ht-freeze-bar--segment)`);
  }

  /**
   * The pieces of a bar that lie in the corner overlays, so the bar is as long as the viewport.
   *
   * @param edge The edge.
   */
  segments(edge: FreezeBarEdge): Locator {
    return this.grid.locator(`.ht-freeze-bar--${edge}.ht-freeze-bar--segment`);
  }

  /**
   * Every element the plugin added to the page.
   */
  get allBars(): Locator {
    return this.page.locator('.ht-freeze-bar, .ht-freeze-bar-guide');
  }

  /**
   * Scrolls the grid to a cell and waits until the scroll is done.
   *
   * @param target The visual row and/or column to scroll to.
   */
  async scrollTo(target: { row?: number, col?: number }): Promise<void> {
    await this.page.evaluate((to) => {
      window.hot.scrollViewportTo({ row: to.row, col: to.col, verticalSnap: 'bottom', horizontalSnap: 'end' });
    }, target);
    await this.page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
  }

  /**
   * The count the grid reports for an edge.
   *
   * @param edge The edge.
   */
  async count(edge: FreezeBarEdge): Promise<number> {
    return this.page.evaluate((e) => window.hot.getPlugin('freezeBar').getFreezeCount(e), edge);
  }

  async log(): Promise<Array<{ edge: string, newCount: number, oldCount: number, source: string }>> {
    return this.page.evaluate(() => (window as any).freezeLog);
  }

  async columnOrder(): Promise<number[]> {
    return this.page.evaluate(() => window.hot.columnIndexMapper.getIndexesSequence());
  }

  /**
   * Starts a drag on the bar and moves the pointer to the boundary after `count` tracks, without releasing.
   *
   * @param edge The edge.
   * @param count The count to drag to.
   */
  async dragTo(edge: FreezeBarEdge, count: number): Promise<void> {
    const bar = await this.bar(edge).boundingBox();

    if (!bar) {
      throw new Error(`The ${edge} bar is not visible`);
    }

    const startX = bar.x + bar.width / 2;
    const startY = bar.y + bar.height / 2;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();

    // measured after the press: the grid scrolls to the edge when a drag starts
    const target = await this.boundaryPosition(edge, count);
    const horizontal = edge === 'start' || edge === 'end';

    await this.page.mouse.move(horizontal ? target : startX, horizontal ? startY : target, { steps: 5 });
  }

  /**
   * Drags a bar by a distance in pixels, along its axis, and releases.
   *
   * @param edge The edge (`start` or `top`).
   * @param pixels How far to move the pointer.
   */
  async dragByPixels(edge: FreezeBarEdge, pixels: number): Promise<void> {
    const bar = await this.bar(edge).boundingBox();

    if (!bar) {
      throw new Error(`The ${edge} bar is not visible`);
    }

    const x = bar.x + bar.width / 2;
    const y = bar.y + bar.height / 2;

    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    const horizontal = edge === 'start' || edge === 'end';

    await this.page.mouse.move(horizontal ? x + pixels : x, horizontal ? y : y + pixels, { steps: 5 });
    await this.release();
  }

  /**
   * Drags a bar with a finger (the Chrome DevTools protocol touch events) to the boundary after `count` tracks.
   * Returns the scroll position of the grid before and after, to tell a drag from a scroll.
   *
   * @param edge The edge.
   * @param count The count.
   */
  async touchDrag(edge: FreezeBarEdge, count: number): Promise<{ before: number[], after: number[] }> {
    const bar = await this.bar(edge).boundingBox();

    if (!bar) {
      throw new Error(`The ${edge} bar is not visible`);
    }

    const target = await this.boundaryPosition(edge, count);
    const horizontal = edge === 'start' || edge === 'end';
    const x = bar.x + bar.width / 2;
    const y = bar.y + bar.height / 2;
    const readScroll = () => this.page.evaluate(() => {
      const holder = window.hot.view._wt.wtTable.holder;

      return [holder.scrollLeft, holder.scrollTop, window.scrollX, window.scrollY];
    });
    const client = await this.page.context().newCDPSession(this.page);
    const before = await readScroll();

    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });

    for (let step = 1; step <= 5; step++) {
      const along = (horizontal ? x : y) + ((target - (horizontal ? x : y)) * step) / 5;

      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [horizontal ? { x: along, y } : { x, y: along }],
      });
    }

    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await client.detach();

    return { before, after: await readScroll() };
  }

  /**
   * The scroll position of the grid: left and top of the master holder.
   */
  async scrollPosition(): Promise<{ left: number, top: number }> {
    return this.page.evaluate(() => {
      const holder = window.hot.view._wt.wtTable.holder;

      return { left: Math.abs(holder.scrollLeft), top: holder.scrollTop };
    });
  }

  async release(): Promise<void> {
    await this.page.mouse.up();
  }

  /**
   * The page coordinate of the boundary after `count` tracks: the inner edge of the last frozen header.
   * With nothing frozen it is the edge of the data area.
   *
   * @param edge The edge.
   * @param count The count.
   */
  async boundaryPosition(edge: FreezeBarEdge, count: number): Promise<number> {
    const info = await this.page.evaluate(() => ({
      root: window.hot.rootElement.getBoundingClientRect().toJSON() as { x: number, y: number, width: number, height: number },
      rtl: window.hot.isRtl(),
      rowHeader: window.hot.view.getRowHeaderWidth(),
      colHeader: window.hot.view.getColumnHeaderHeight(),
      content: (() => {
        const root = window.hot.rootElement.getBoundingClientRect();
        const rtl = window.hot.isRtl();
        const w = window.hot.view.getTotalTableWidth();
        const h = window.hot.view.getTotalTableHeight();

        return { left: rtl ? root.right - w : root.left, right: rtl ? root.right : root.left + w, bottom: root.top + h };
      })(),
      scrollbarX: window.hot.view._wt.wtTable.holder.offsetWidth - window.hot.view._wt.wtTable.holder.clientWidth,
      scrollbarY: window.hot.view._wt.wtTable.holder.offsetHeight - window.hot.view._wt.wtTable.holder.clientHeight,
    }));
    const root = info.root;
    const startSideLeft = !info.rtl;
    // the end and bottom bands sit at the edge of the rendered table when it is smaller than the container
    const endEdgeX = startSideLeft ?
      Math.min(root.x + root.width - info.scrollbarX, info.content.right) :
      Math.max(root.x + info.scrollbarX, info.content.left);
    const bottomEdgeY = Math.min(root.y + root.height - info.scrollbarY, info.content.bottom);

    // The tracks of the start and top bands may be scrolled out of view, so they are measured by their sizes from
    // the overlay that is pinned to the viewport (the page scrolls the rows in window scroll mode).
    if (edge === 'start' || edge === 'top') {
      const pinned = await this.page.evaluate(([horizontal, taken]) => {
        const clone = document.querySelector(horizontal ? '.ht_clone_inline_start' : '.ht_clone_top')!;
        const rect = clone.getBoundingClientRect();
        let sum = 0;

        for (let index = 0; index < taken; index++) {
          sum += horizontal ? window.hot.getColWidth(index) :
            (window.hot.getRowHeight(index) ?? window.hot.stylesHandler.getDefaultRowHeight(index));
        }

        return { left: rect.left, right: rect.right, top: rect.top, sum };
      }, [edge === 'start', count] as [boolean, number]);

      if (edge === 'top') {
        return pinned.top + info.colHeader + pinned.sum;
      }

      return startSideLeft ? pinned.left + info.rowHeader + pinned.sum : pinned.right - info.rowHeader - pinned.sum;
    }

    if (count === 0) {
      return {
        bottom: bottomEdgeY,
        end: endEdgeX,
      }[edge];
    }

    // The tracks of the end bands are not always rendered, so measure from the edge by their sizes.
    const sizes = await this.page.evaluate(([horizontal, taken]) => {
      const total = horizontal ? window.hot.countCols() : window.hot.countRows();
      let sum = 0;

      for (let index = total - taken; index < total; index++) {
        sum += horizontal ? window.hot.getColWidth(index) : (window.hot.getRowHeight(index) ?? window.hot.stylesHandler.getDefaultRowHeight(index));
      }

      return sum;
    }, [edge === 'end', count] as [boolean, number]);

    if (edge === 'end') {
      return startSideLeft ? endEdgeX - sizes : endEdgeX + sizes;
    }

    return bottomEdgeY - sizes;
  }

  /**
   * Drags a bar to the boundary after `count` tracks and releases.
   *
   * @param edge The edge.
   * @param count The count.
   */
  async drag(edge: FreezeBarEdge, count: number): Promise<void> {
    await this.dragTo(edge, count);
    await this.release();
  }
}
