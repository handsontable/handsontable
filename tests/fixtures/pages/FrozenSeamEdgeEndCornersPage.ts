import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

type HotWindow = {
  hot: {
    countRows(): number;
    isRtl(): boolean;
    scrollViewportTo(options: { row: number; col: number }): boolean;
    selectCell(row: number, column: number, endRow: number, endColumn: number, scrollToCell?: boolean): boolean;
    getCell(row: number, column: number, topmost?: boolean): HTMLElement | null;
  };
};

/**
 * Which freeze line a selection edge lies on: the `fixedRowsTop` one or the `fixedRowsBottom` one.
 */
export type RowFreezeLine = 'top' | 'bottom';

/**
 * Page Object for `frozen-seam-edge-end-corners.html`: a grid frozen on all four edges, used to check which
 * overlay draws a selection edge that lies on a row freeze line.
 */
export class FrozenSeamEdgeEndCornersPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly master: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.master = this.grid.locator('.ht_master');
  }

  /**
   * Navigate and wait for the grid to render (a real DOM condition, no sleep).
   *
   * @param {object} options The fixture options.
   * @param {boolean} [options.rtl] Whether the grid is laid out right to left.
   * @param {boolean} [options.numericEnd] Whether the last column is a numeric one (`dir="ltr"` cells).
   */
  async goto({ rtl = false, numericEnd = false }: { rtl?: boolean, numericEnd?: boolean } = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    if (rtl) {
      params.set('rtl', '1');
    }
    if (numericEnd) {
      params.set('numericEnd', '1');
    }
    await this.page.goto(`/tests/fixtures/demo/frozen-seam-edge-end-corners.html?${params}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.master).toBeVisible();
  }

  /**
   * Scrolls the viewport to the cell and waits until the master renders it, so the scroll-driven draw has
   * landed (a render-state probe, never the scroll offset).
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  async scrollTo(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      (window as unknown as HotWindow).hot.scrollViewportTo({ row: r, col: c });
    }, [row, col]);
    await expect.poll(() => this.page.evaluate(([r, c]) =>
      (window as unknown as HotWindow).hot.getCell(r, c) !== null, [row, col])).toBe(true);
  }

  /**
   * Selects a range through the API. With `scrollToCell: false` the viewport stays where it is, so a test
   * can select first and scroll to any column afterwards.
   *
   * @param {number} row The start row.
   * @param {number} col The start column.
   * @param {number} endRow The end row.
   * @param {number} endCol The end column.
   * @param {object} [options] The options.
   * @param {boolean} [options.scrollToCell] Whether the viewport scrolls to the selection (the default).
   */
  async selectCells(
    row: number, col: number, endRow: number, endCol: number, { scrollToCell = true } = {}
  ): Promise<void> {
    await this.page.evaluate(([r, c, r2, c2, scroll]) => {
      (window as unknown as HotWindow).hot.selectCell(r, c, r2, c2, scroll);
    }, [row, col, endRow, endCol, scrollToCell] as const);
  }

  /**
   * Names the element a user sees on the row freeze line, in the middle of a column: the overlay that holds
   * it and its tag and classes (`ht_clone_bottom/div.wtBorder area`). The point is the pixel a 1px selection
   * edge on that line paints: the top edge of the first `fixedRowsBottom` row, or the last pixel of the
   * last `fixedRowsTop` row. Read in one evaluation, from the topmost copy of the cell.
   *
   * @param {RowFreezeLine} line The freeze line.
   * @param {number} col The visual column index.
   * @returns {Promise<string>}
   */
  async elementOnFreezeLine(line: RowFreezeLine, col: number): Promise<string> {
    return this.page.evaluate(([freezeLine, c]) => {
      const { hot } = window as unknown as HotWindow;
      const row = freezeLine === 'bottom' ? hot.countRows() - 1 : 0;
      const cell = hot.getCell(row, c as number, true);

      if (!cell) {
        return 'no cell';
      }

      const rect = cell.getBoundingClientRect();
      const y = freezeLine === 'bottom' ? rect.top + 0.5 : rect.bottom - 0.5;
      const element = document.elementFromPoint(rect.left + (rect.width / 2), y);
      const overlay = element?.closest('.handsontable')?.className.match(/ht_(clone_[a-z_]+|master)/)?.[0];

      return element ? `${overlay ?? 'none'}/${element.tagName.toLowerCase()}.${element.className}` : 'nothing';
    }, [line, col] as const);
  }

  /**
   * Measures where the end corner's selection edges on a freeze line start, against the end band's
   * inline-start boundary (the left edge of the band's first cell, the right one in RTL): one signed offset
   * in pixels per distinct start. `1` is one pixel outside the band, on the border of the column before it,
   * `0` is on the band's own edge, and a negative value leaves a gap inside the band. The corner's holder
   * does not clip, so an edge outside the band is seen there. The side is the grid's direction, never the
   * cell's: a numeric cell is `dir="ltr"` in an RTL grid. A box read rather than a hit test: a point half a
   * pixel off the boundary can resolve to the cell on either side of it.
   *
   * @param {RowFreezeLine} line The freeze line, which picks the corner (`top` or `bottom` inline-end).
   * @param {number} col The first column of the end band.
   * @returns {Promise<number[]>} The distinct offsets, sorted; empty when the corner draws no such edge.
   */
  async endCornerEdgeOffsets(line: RowFreezeLine, col: number): Promise<number[]> {
    return this.page.evaluate(([freezeLine, c]) => {
      const { hot } = window as unknown as HotWindow;
      const row = freezeLine === 'bottom' ? hot.countRows() - 1 : 0;
      const cell = hot.getCell(row, c as number, true);
      const corner = cell?.closest('.handsontable');

      if (!cell || !corner) {
        return [];
      }

      const cellRect = cell.getBoundingClientRect();
      const isRtl = hot.isRtl();
      const offsets = new Set<number>();

      corner.querySelectorAll('.wtBorder').forEach((edge) => {
        const rect = edge.getBoundingClientRect();

        // Horizontal edges only: the freeze-line edge, not the vertical sides of a box.
        if (getComputedStyle(edge).display === 'none' || rect.width <= rect.height) {
          return;
        }
        offsets.add(isRtl ? rect.right - cellRect.right : cellRect.left - rect.left);
      });

      return [...offsets].sort((a, b) => a - b);
    }, [line, col] as const);
  }

  /**
   * Names the element a user sees on the last pixel row of a cell, in the middle of its column: where a 1px
   * selection edge that ends at that row is drawn. Read from the topmost copy of the cell. Same naming as
   * {@link elementOnFreezeLine}.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Promise<string>}
   */
  async elementOnCellBottomEdge(row: number, col: number): Promise<string> {
    return this.page.evaluate(([r, c]) => {
      const cell = (window as unknown as HotWindow).hot.getCell(r, c, true);

      if (!cell) {
        return 'no cell';
      }

      const rect = cell.getBoundingClientRect();
      const element = document.elementFromPoint(rect.left + (rect.width / 2), rect.bottom - 0.5);
      const overlay = element?.closest('.handsontable')?.className.match(/ht_(clone_[a-z_]+|master)/)?.[0];

      return element ? `${overlay ?? 'none'}/${element.tagName.toLowerCase()}.${element.className}` : 'nothing';
    }, [row, col]);
  }
}
