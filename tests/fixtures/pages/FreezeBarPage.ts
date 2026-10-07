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

    await expect(this.colHeader(5)).toBeVisible();
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
    return this.grid.locator(`.ht-freeze-bar--${edge}`);
  }

  /**
   * Every element the plugin added to the page.
   */
  get allBars(): Locator {
    return this.page.locator('.ht-freeze-bar, .ht-freeze-bar-guide');
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

    const target = await this.boundaryPosition(edge, count);
    const startX = bar.x + bar.width / 2;
    const startY = bar.y + bar.height / 2;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
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
      scrollbarX: window.hot.view._wt.wtTable.holder.offsetWidth - window.hot.view._wt.wtTable.holder.clientWidth,
      scrollbarY: window.hot.view._wt.wtTable.holder.offsetHeight - window.hot.view._wt.wtTable.holder.clientHeight,
    }));
    const root = info.root;
    const startSideLeft = !info.rtl;

    if (count === 0) {
      return {
        top: root.y + info.colHeader,
        bottom: root.y + root.height - info.scrollbarY,
        start: startSideLeft ? root.x + info.rowHeader : root.x + root.width - info.rowHeader,
        end: startSideLeft ? root.x + root.width - info.scrollbarX : root.x + info.scrollbarX,
      }[edge];
    }

    if (edge === 'start') {
      const box = (await this.colHeader(count - 1).boundingBox())!;

      return startSideLeft ? box.x + box.width : box.x;
    }

    if (edge === 'top') {
      const box = (await this.rowHeader(count - 1).boundingBox())!;

      return box.y + box.height;
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
      return startSideLeft ? root.x + root.width - info.scrollbarX - sizes : root.x + info.scrollbarX + sizes;
    }

    return root.y + root.height - info.scrollbarY - sizes;
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
