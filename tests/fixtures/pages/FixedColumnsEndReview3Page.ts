import { expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';
import { FixedColumnsEndPage, type Box } from './FixedColumnsEndPage';

/**
 * Query params the `fixed-columns-end-review3.html` fixture understands.
 */
export interface FixedColumnsEndReview3Options {
  rtl?: boolean;
  rows?: number;
  cols?: number;
  colWidth?: number;
  width?: number;
  height?: number;
  fixedColumnsStart?: number;
  fixedColumnsEnd?: number;
  manualColumnResize?: boolean;
  /** Puts a long value in row 1, column 3. */
  longText?: boolean;
  /** A merge as `row,col,rowspan,colspan`. */
  merge?: string;
  /** The `virtualized` option of the merge plugin. */
  virtualized?: boolean;
}

/**
 * The width of the borders that draw one freeze line, as the two cells either side of it contribute them.
 */
export interface FreezeLineWidths {
  /** The inline-end border of the cell before the line. */
  before: number;
  /** The inline-start border of the cell after the line. */
  after: number;
}

type HotWindow = {
  hot: {
    scrollViewportTo(options: { row?: number; col?: number }): boolean;
    getColWidth(col: number): number;
    runHooks(name: string, ...args: unknown[]): unknown;
    view: { getActiveOverlayName(): string };
    selectCell(row: number, col: number, endRow: number, endCol: number, scrollToCell: boolean): boolean;
  };
};

const rectOf = (el: Element): Box => {
  const { left, right, top, bottom } = el.getBoundingClientRect();

  return { left, right, top, bottom };
};

/**
 * Page Object for the `fixed-columns-end-review3.html` fixture. It extends the core page object with the
 * measurements of the review 3 follow-ups, so a spec asserts geometry and not selectors.
 */
export class FixedColumnsEndReview3Page extends FixedColumnsEndPage {
  /**
   * Navigate and wait for the grid to render (a real DOM condition, no sleep).
   *
   * @param {FixedColumnsEndReview3Options} options The fixture options.
   */
  async open(options: FixedColumnsEndReview3Options = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    Object.entries(options).forEach(([name, value]) => {
      if (value !== undefined && value !== false) {
        params.set(name, value === true ? '1' : String(value));
      }
    });
    await this.page.goto(`/tests/fixtures/demo/fixed-columns-end-review3.html?${params}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.master).toBeVisible();
  }

  /**
   * Scroll the master so the column is rendered, and wait until it is.
   *
   * @param {number} col Visual column.
   */
  async scrollToColumn(col: number): Promise<void> {
    await this.page.evaluate(c => (window as unknown as HotWindow).hot.scrollViewportTo({ col: c }), col);
    await expect(this.master.locator(`td[data-testid="cell-1-${col}"]`)).toBeAttached();
  }

  /**
   * The border widths of the two body cells either side of the freeze line at the inline end: the last
   * scrolling column in the master and the first column of the end clone.
   *
   * @param {number} lastScrollingColumn Visual index of the last column that is not frozen at the end.
   */
  async endFreezeLine(lastScrollingColumn: number): Promise<FreezeLineWidths> {
    await this.scrollToColumn(lastScrollingColumn);

    return this.page.evaluate((col) => {
      const width = (selector: string, prop: 'borderInlineEndWidth' | 'borderInlineStartWidth') => {
        const cell = document.querySelector(selector);

        if (!cell) {
          throw new Error(`No cell for ${selector}`);
        }

        return Number.parseFloat(getComputedStyle(cell)[prop]);
      };

      return {
        before: width(`.ht_master td[data-testid="cell-1-${col}"]`, 'borderInlineEndWidth'),
        after: width(`.ht_clone_inline_end td[data-testid="cell-1-${col + 1}"]`, 'borderInlineStartWidth'),
      };
    }, lastScrollingColumn);
  }

  /**
   * The same two widths for the freeze line at the inline start: the last frozen start column in its clone and the
   * first scrolling column in the master.
   *
   * @param {number} lastStartColumn Visual index of the last column frozen at the start.
   */
  async startFreezeLine(lastStartColumn: number): Promise<FreezeLineWidths> {
    await this.scrollToColumn(lastStartColumn + 1);

    return this.page.evaluate((col) => {
      const width = (selector: string, prop: 'borderInlineEndWidth' | 'borderInlineStartWidth') => {
        const cell = document.querySelector(selector);

        if (!cell) {
          throw new Error(`No cell for ${selector}`);
        }

        return Number.parseFloat(getComputedStyle(cell)[prop]);
      };

      return {
        before: width(`.ht_clone_inline_start td[data-testid="cell-1-${col}"]`, 'borderInlineEndWidth'),
        after: width(`.ht_master td[data-testid="cell-1-${col + 1}"]`, 'borderInlineStartWidth'),
      };
    }, lastStartColumn);
  }

  /**
   * The border widths of the two header cells either side of the freeze line at the inline end: the header of the
   * last scrolling column in the master and the first header of the end corner clone.
   *
   * @param {number} lastScrollingColumn Visual index of the last column that is not frozen at the end.
   */
  async endHeaderFreezeLine(lastScrollingColumn: number): Promise<FreezeLineWidths> {
    await this.scrollToColumn(lastScrollingColumn);

    return this.page.evaluate((col) => {
      const endHeader = document.querySelector('.ht_clone_top_inline_end_corner thead tr:last-child th:first-child');
      // `aria-colindex` is 1-based and counts the row header, so the column is the (col + 2)th. The top clone draws
      // the headers of the scrolling columns, the master draws none.
      const masterHeader = document.querySelector(`.ht_clone_top thead tr:last-child th[aria-colindex="${col + 2}"]`);

      if (!endHeader || !masterHeader) {
        throw new Error('No header cells');
      }

      return {
        before: Number.parseFloat(getComputedStyle(masterHeader).borderInlineEndWidth),
        after: Number.parseFloat(getComputedStyle(endHeader).borderInlineStartWidth),
      };
    }, lastScrollingColumn);
  }

  /**
   * Open the editor on a cell and wait for it.
   *
   * @param {number} row Visual row.
   * @param {number} col Visual column.
   */
  async openEditor(row: number, col: number): Promise<void> {
    await this.selectCell(row, col);
    await this.press('Enter');
    await expect.poll(() => this.isEditorOpened()).toBe(true);
  }

  /**
   * The bounding box of the end clone root, in viewport coordinates.
   */
  async endCloneBox(): Promise<Box> {
    return this.endOverlay.evaluate(rectOf);
  }

  /**
   * Hover the last header of the end band and return its box and the box of the resize handle that shows up.
   * The header is the last cell of the head row of the end corner clone.
   */
  async hoverEndHeaderHandle(): Promise<{ header: Box; handle: Box }> {
    const header = this.grid.locator('.ht_clone_top_inline_end_corner thead tr:last-child th').last();

    await header.hover();

    const handle = this.page.locator('.manualColumnResizer');

    await expect(handle).toBeVisible();

    return { header: await header.evaluate(rectOf), handle: await handle.evaluate(rectOf) };
  }

  /**
   * Hover the header of a column rendered in the master and return the box of the resize handle that shows up.
   *
   * @param {number} col Visual column.
   */
  async hoverMasterHeaderHandle(col: number): Promise<Box> {
    // The master head row starts with the row header cell, so the column is the (col + 2)th cell of the row.
    await this.grid.locator(`.ht_clone_top thead tr:last-child th[aria-colindex="${col + 2}"]`).hover();

    const handle = this.page.locator('.manualColumnResizer');

    await expect(handle).toBeVisible();

    return handle.evaluate(rectOf);
  }

  /**
   * Drag the visible resize handle along the horizontal axis.
   *
   * @param {number} deltaX The pointer movement in pixels (positive is to the right).
   */
  async dragHandle(deltaX: number): Promise<void> {
    const box = await this.page.locator('.manualColumnResizer').boundingBox();

    if (!box) {
      throw new Error('The resize handle is not visible');
    }

    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await this.page.mouse.move(x + deltaX / 2, y, { steps: 4 });
    await this.page.mouse.move(x + deltaX, y, { steps: 4 });
    await this.page.mouse.up();
  }

  /**
   * The width of a column as the grid reports it.
   *
   * @param {number} col Visual column.
   */
  async colWidth(col: number): Promise<number> {
    return this.page.evaluate(c => (window as unknown as HotWindow).hot.getColWidth(c), col);
  }

  /**
   * Select a cell through the API without scrolling the viewport to it, so the master stays where it is.
   *
   * @param {number} row Visual row.
   * @param {number} col Visual column.
   */
  async selectCellWithoutScrolling(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      (window as unknown as HotWindow).hot.selectCell(r, c, r, c, false);
    }, [row, col]);
  }

  /**
   * The extent `[fromRow, fromColumn, toRow, toColumn]` the merge plugin reports for a merged cell while the given
   * overlay renders it. The grid draws one overlay at a time and reports it through `getActiveOverlayName()`, which
   * is only meaningful during a draw, so the page names the overlay for the duration of the call.
   *
   * @param {string} overlay The Walkontable overlay name, such as `inline_end`.
   * @param {number} row Visual row of a cell of the merge.
   * @param {number} col Visual column of a cell of the merge.
   */
  async mergeExtentWhileRendering(overlay: string, row: number, col: number): Promise<number[]> {
    return this.page.evaluate(([name, r, c]) => {
      const { hot } = window as unknown as HotWindow;
      const original = hot.view.getActiveOverlayName;

      hot.view.getActiveOverlayName = () => name as string;

      try {
        return hot.runHooks('modifyGetCellCoords', r, c, false, 'render') as number[];
      } finally {
        hot.view.getActiveOverlayName = original;
      }
    }, [overlay, row, col]);
  }

  /**
   * The box of the merged cell the end clone draws.
   */
  async mergedCellBoxInEndClone(): Promise<Box> {
    return this.endOverlay.locator('td[colspan]').first().evaluate(rectOf);
  }

  /**
   * The centers of the visible fill handle corners the end clone draws, in viewport coordinates. The master draws
   * its own corner for the same selection, but the end clone paints over it.
   */
  async endCloneFillHandleCenters(): Promise<{ x: number; y: number }[]> {
    return this.endOverlay.locator('.wtBorder.corner').evaluateAll((corners) => {
      return corners
        .map(el => el.getBoundingClientRect())
        .filter(rect => rect.width > 0 && rect.height > 0)
        .map(rect => ({ x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 }));
    });
  }
}
