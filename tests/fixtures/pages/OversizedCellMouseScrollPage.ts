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
   *
   * @param {string} [scrollCase='both'] Fixture variant: both axes oversized,
   *   one-axis oversized, or a content-tall row without `rowHeights`.
   */
  async goto(scrollCase = 'both'): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/oversized-cell-mouse-scroll.html?theme=${this.theme}&bundle=${this.bundle}&case=${scrollCase}`
    );
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Last partially visible visual row, from the public Core API.
   *
   * @returns {Promise<number>}
   */
  async lastPartiallyVisibleRow(): Promise<number> {
    return this.page.evaluate(() => window.hot.getLastPartiallyVisibleRow());
  }

  /**
   * Last partially visible visual column, from the public Core API.
   *
   * @returns {Promise<number>}
   */
  async lastPartiallyVisibleColumn(): Promise<number> {
    return this.page.evaluate(() => window.hot.getLastPartiallyVisibleColumn());
  }

  /**
   * Settings-level row height from {@link Core#getRowHeight}.
   *
   * @param {number} row Visual row index.
   * @returns {Promise<number|undefined>}
   */
  async settingsRowHeight(row: number): Promise<number | undefined> {
    return this.page.evaluate(visualRow => window.hot.getRowHeight(visualRow), row);
  }

  /**
   * Current selection as `[startRow, startCol, endRow, endCol]`, or `null`.
   *
   * @returns {Promise<number[]|null>}
   */
  async selectedCell(): Promise<number[] | null> {
    return this.page.evaluate(() => window.hot.getSelectedLast() ?? null);
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
   * @param {number} [inset=8] Pixels to stay inside the intersection. Use 1
   *   for a last-partial sliver that is thinner than 16px.
   */
  async clickVisiblePart(row: number, col: number, inset = 8): Promise<void> {
    const point = await this.page.evaluate(([r, c, pad]) => {
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
      // clientWidth/Height exclude the scrollbars, so a last-partial sliver
      // is not clicked on the bar (which would miss the cell).
      const holderRight = holderBox.left + holder.clientWidth;
      const holderBottom = holderBox.top + holder.clientHeight;
      const rawLeft = Math.max(cellBox.left, dataLeft);
      const rawTop = Math.max(cellBox.top, dataTop);
      const rawRight = Math.min(cellBox.right, holderRight);
      const rawBottom = Math.min(cellBox.bottom, holderBottom);

      if (rawRight <= rawLeft || rawBottom <= rawTop) {
        throw new Error('cell has no clickable intersection with the holder');
      }

      const left = Math.min(rawLeft + pad, rawRight - 1);
      const top = Math.min(rawTop + pad, rawBottom - 1);
      const right = Math.max(rawRight - pad, rawLeft + 1);
      const bottom = Math.max(rawBottom - pad, rawTop + 1);

      return { x: (left + right) / 2, y: (top + bottom) / 2 };
    }, [row, col, inset] as const);

    await this.page.mouse.click(point.x, point.y);
  }

  /**
   * Dispatches mouse events on the cell element itself, like the Jasmine
   * `simulateClick` helper. Use this when the visible sliver is too thin
   * for a page-coordinate click (last-partial row above an overlay
   * scrollbar).
   *
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   */
  async clickCellByEvent(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      const cell = document.querySelector(`.ht_master [data-testid="cell-${r}-${c}"]`);

      if (!(cell instanceof HTMLElement)) {
        throw new Error('cell is not rendered');
      }

      const box = cell.getBoundingClientRect();
      const init: MouseEventInit = {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 0,
        buttons: 1,
        clientX: box.left + Math.min(20, box.width / 2),
        clientY: box.top + Math.min(8, box.height / 2),
      };

      cell.dispatchEvent(new MouseEvent('mousedown', init));
      cell.dispatchEvent(new MouseEvent('mouseup', { ...init, buttons: 0 }));
      cell.dispatchEvent(new MouseEvent('click', { ...init, buttons: 0 }));
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
