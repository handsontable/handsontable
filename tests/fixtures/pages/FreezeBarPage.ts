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
   * @param edge The edge (`start` or `top`).
   * @param count The count to drag to.
   */
  async dragTo(edge: 'start' | 'top', count: number): Promise<void> {
    const bar = await this.bar(edge).boundingBox();

    if (!bar) {
      throw new Error(`The ${edge} bar is not visible`);
    }

    const target = await this.boundaryPosition(edge, count);
    const startX = bar.x + bar.width / 2;
    const startY = bar.y + bar.height / 2;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(edge === 'start' ? target : startX, edge === 'top' ? target : startY, { steps: 5 });
  }

  /**
   * Drags a bar by a distance in pixels, along its axis, and releases.
   *
   * @param edge The edge (`start` or `top`).
   * @param pixels How far to move the pointer.
   */
  async dragByPixels(edge: 'start' | 'top', pixels: number): Promise<void> {
    const bar = await this.bar(edge).boundingBox();

    if (!bar) {
      throw new Error(`The ${edge} bar is not visible`);
    }

    const x = bar.x + bar.width / 2;
    const y = bar.y + bar.height / 2;

    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await this.page.mouse.move(edge === 'start' ? x + pixels : x, edge === 'top' ? y + pixels : y, { steps: 5 });
    await this.release();
  }

  async release(): Promise<void> {
    await this.page.mouse.up();
  }

  /**
   * The page coordinate of the boundary after `count` tracks: the far edge of the last frozen header.
   *
   * @param edge The edge (`start` or `top`).
   * @param count The count.
   */
  async boundaryPosition(edge: 'start' | 'top', count: number): Promise<number> {
    if (count === 0) {
      const root = (await this.grid.boundingBox())!;
      const rtl = await this.page.evaluate(() => window.hot.isRtl());
      const header = await this.page.evaluate(() => ({
        row: window.hot.view.getRowHeaderWidth(),
        col: window.hot.view.getColumnHeaderHeight(),
      }));

      if (edge === 'top') {
        return root.y + header.col;
      }

      return rtl ? root.x + root.width - header.row : root.x + header.row;
    }

    const rtl = await this.page.evaluate(() => window.hot.isRtl());
    const box = (await (edge === 'start' ? this.colHeader(count - 1) : this.rowHeader(count - 1)).boundingBox())!;

    if (edge === 'top') {
      return box.y + box.height;
    }

    return rtl ? box.x : box.x + box.width;
  }

  /**
   * Drags a bar to the boundary after `count` tracks and releases.
   *
   * @param edge The edge (`start` or `top`).
   * @param count The count.
   */
  async drag(edge: 'start' | 'top', count: number): Promise<void> {
    await this.dragTo(edge, count);
    await this.release();
  }
}
