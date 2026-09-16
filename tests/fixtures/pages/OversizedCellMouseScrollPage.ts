import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page object for the oversized-cell mouse-scroll fixture (DEV-1159).
 *
 * The first column and first row are larger than the viewport. Selecting the
 * clipped cell with the mouse must start-snap so the start edge is visible.
 */
export class OversizedCellMouseScrollPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture and wait for the bundle and first cell.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/oversized-cell-mouse-scroll.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master table, by visual row/column.
   *
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   * @returns {Locator}
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Scrolls the master holder and waits until the target cell's start is clipped.
   *
   * Ends on a geometry probe, not on `scrollLeft`/`scrollTop` settling: the
   * rAF-batched redraw can lag the scroll position.
   *
   * @param {number} left Horizontal scroll offset.
   * @param {number} top Vertical scroll offset.
   * @param {number} row Visual row of the cell that must end up clipped.
   * @param {number} col Visual column of the cell that must end up clipped.
   */
  async scrollUntilCellStartClipped(
    left: number,
    top: number,
    row: number,
    col: number
  ): Promise<void> {
    await this.page.evaluate(([x, y]) => {
      const holder = document.querySelector('.ht_master .wtHolder');

      if (!(holder instanceof HTMLElement)) {
        throw new Error('holder is not rendered');
      }

      holder.scrollLeft = x;
      holder.scrollTop = y;
    }, [left, top] as const);

    await expect.poll(async () => (await this.cellClip(row, col)).startClipped).toBe(true);
  }

  /**
   * Clicks the visible intersection of a cell and the holder, without
   * Playwright scrolling the cell into view first.
   *
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   */
  async clickVisiblePart(row: number, col: number): Promise<void> {
    const point = await this.page.evaluate(([r, c]) => {
      const holder = document.querySelector('.ht_master .wtHolder');
      const cell = document.querySelector(`.ht_master [data-testid="cell-${r}-${c}"]`);

      if (!(holder instanceof HTMLElement) || !(cell instanceof HTMLElement)) {
        throw new Error('holder or cell is not rendered');
      }

      const holderBox = holder.getBoundingClientRect();
      const cellBox = cell.getBoundingClientRect();
      const rowHeader = document.querySelector('.ht_clone_inline_start');
      const colHeader = document.querySelector('.ht_clone_top');
      const dataLeft = rowHeader instanceof HTMLElement
        ? rowHeader.getBoundingClientRect().right
        : holderBox.left;
      const dataTop = colHeader instanceof HTMLElement
        ? colHeader.getBoundingClientRect().bottom
        : holderBox.top;
      const left = Math.max(cellBox.left, dataLeft) + 8;
      const top = Math.max(cellBox.top, dataTop) + 8;
      const right = Math.min(cellBox.right, holderBox.right) - 8;
      const bottom = Math.min(cellBox.bottom, holderBox.bottom) - 8;

      if (right <= left || bottom <= top) {
        throw new Error('cell has no clickable intersection with the holder');
      }

      return { x: (left + right) / 2, y: (top + bottom) / 2 };
    }, [row, col] as const);

    await this.page.mouse.click(point.x, point.y);
  }

  /**
   * Selects a cell through the public API.
   *
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   */
  async selectCellByApi(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      window.hot.selectCell(r, c);
    }, [row, col] as const);
  }

  /**
   * Master holder scroll offsets. Read in one evaluate so a comparison cannot
   * straddle a redraw.
   *
   * @returns {Promise<{ left: number, top: number }>}
   */
  async holderScroll(): Promise<{ left: number, top: number }> {
    return this.page.evaluate(() => {
      const holder = document.querySelector('.ht_master .wtHolder');

      if (!(holder instanceof HTMLElement)) {
        throw new Error('holder is not rendered');
      }

      return { left: holder.scrollLeft, top: holder.scrollTop };
    });
  }

  /**
   * Whether the start (left and/or top) of a cell sits past the data-area
   * origin of the holder. Measured in one evaluate so the comparison cannot
   * straddle a redraw.
   *
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   * @returns {Promise<{ startClipped: boolean, startClippedInline: boolean, startClippedBlock: boolean }>}
   */
  async cellClip(row: number, col: number): Promise<{
    startClipped: boolean,
    startClippedInline: boolean,
    startClippedBlock: boolean,
  }> {
    return this.page.evaluate(([r, c]) => {
      const holder = document.querySelector('.ht_master .wtHolder');
      const cell = document.querySelector(`.ht_master [data-testid="cell-${r}-${c}"]`);
      const rowHeader = document.querySelector('.ht_clone_inline_start');
      const colHeader = document.querySelector('.ht_clone_top');

      if (!(holder instanceof HTMLElement) || !(cell instanceof HTMLElement)) {
        throw new Error('holder or cell is not rendered');
      }

      const holderBox = holder.getBoundingClientRect();
      const cellBox = cell.getBoundingClientRect();
      const dataLeft = rowHeader instanceof HTMLElement
        ? rowHeader.getBoundingClientRect().right
        : holderBox.left;
      const dataTop = colHeader instanceof HTMLElement
        ? colHeader.getBoundingClientRect().bottom
        : holderBox.top;
      const startClippedInline = cellBox.left < dataLeft - 2;
      const startClippedBlock = cellBox.top < dataTop - 2;

      return {
        startClipped: startClippedInline || startClippedBlock,
        startClippedInline,
        startClippedBlock,
      };
    }, [row, col] as const);
  }
}
