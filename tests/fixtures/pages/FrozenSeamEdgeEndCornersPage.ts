import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

type HotWindow = {
  hot: {
    countRows(): number;
    countCols(): number;
    scrollViewportTo(options: { row: number; col: number }): boolean;
    selectCell(row: number, column: number, endRow: number, endColumn: number): boolean;
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
   */
  async goto({ rtl = false }: { rtl?: boolean } = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    if (rtl) {
      params.set('rtl', '1');
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
   * Selects a range through the API.
   *
   * @param {number} row The start row.
   * @param {number} col The start column.
   * @param {number} endRow The end row.
   * @param {number} endCol The end column.
   */
  async selectCells(row: number, col: number, endRow: number, endCol: number): Promise<void> {
    await this.page.evaluate(([r, c, r2, c2]) => {
      (window as unknown as HotWindow).hot.selectCell(r, c, r2, c2);
    }, [row, col, endRow, endCol]);
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
}
