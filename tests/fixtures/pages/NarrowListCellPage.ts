import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface FixtureWindow {
  hot: {
    getCell(row: number, col: number, topmost?: boolean): HTMLElement | null;
  };
}

export type ListCellType = 'autocomplete' | 'dropdown' | 'handsontable';
export type Mode = 'narrow' | 'tall' | 'autosize';
export type Dir = 'ltr' | 'rtl';

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

/**
 * Geometry of one arrow cell, read in a single `page.evaluate` on a node the grid never recycles
 * across the round trip.
 */
interface CellMetrics {
  /** The cell's own box. */
  cell: Box;
  /** Content width the browser laid out on a single line, before clipping. */
  scrollWidth: number;
  /** Visible (clipped) content width. */
  clientWidth: number;
  /** The dropdown arrow's box, or `null` when the arrow is missing. */
  arrow: Box | null;
  /** Union box of everything in the cell except the arrow (the rendered value), or `null` when empty. */
  content: Box | null;
  /**
   * The x of the cell's content-box trailing (right) edge - where `overflow: hidden` clips the value
   * and `text-overflow: ellipsis` places the ellipsis. The reserve must keep this before the arrow.
   * (The value's own `Range` rect is the UNCLIPPED single-line layout, so it cannot be used for this.)
   */
  contentBoxRight: number;
  /** The x of the cell's content-box leading (left) edge - the RTL counterpart of `contentBoxRight`. */
  contentBoxLeft: number;
  /** The cell's resolved `line-height`, in pixels. */
  lineHeight: number;
  /** The cell's resolved top padding, in pixels. */
  paddingTop: number;
}

/**
 * Page Object for the narrow list-cell fixture (`autocomplete` / `dropdown` / `handsontable`), which
 * reproduces the DEV-28 bug: a long value in a narrow column tangled with the right-floated arrow.
 * The fix reserves the arrow's space and takes it out of flow; wrap/ellipsis stay under the user's
 * `wordWrap` / `textEllipsis` control.
 */
export class NarrowListCellPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly cellType: ListCellType;

  constructor(page: Page, theme = 'main', bundle = 'umd', cellType: ListCellType = 'autocomplete') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.cellType = cellType;
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   *
   * @param {object} [options] Fixture options.
   * @param {Mode} [options.mode] `narrow` (fixed 60px column), `tall` (narrow + large `rowHeights`),
   *   or `autosize` (`autoColumnSize`).
   * @param {Dir} [options.dir] Layout direction.
   */
  async goto({ mode = 'narrow', dir = 'ltr' }: {
    mode?: Mode, dir?: Dir,
  } = {}): Promise<void> {
    const query = `theme=${this.theme}&bundle=${this.bundle}&cellType=${this.cellType}`
      + `&mode=${mode}&dir=${dir}`;

    await this.page.goto(`/tests/fixtures/demo/narrow-list-cell-truncation.html?${query}`);

    await awaitBundle(this.page);

    await expect(this.page.locator('.ht_master').getByTestId('cell-0-0')).toBeVisible();
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Reads a cell's geometry, its arrow's box, and the value's box (everything except the arrow) in
   * one round trip. The value box comes from real client rects - a `Range` for text nodes, the box
   * for elements - so it reflects where the contents actually render, not the renderer's arithmetic.
   */
  async metrics(row: number, col: number): Promise<CellMetrics> {
    return this.page.evaluate(({ row: r, col: c }) => {
      const td = (window as unknown as FixtureWindow).hot.getCell(r, c);

      if (!td) {
        throw new Error(`Cell (${r}, ${c}) is not rendered`);
      }

      const toBox = (rect: DOMRect): Box => ({
        left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
        width: rect.width, height: rect.height,
      });
      const unionOf = (rects: DOMRect[]): Box | null => {
        const real = rects.filter(rect => rect.width > 0 && rect.height > 0);

        if (real.length === 0) {
          return null;
        }

        const left = Math.min(...real.map(rect => rect.left));
        const right = Math.max(...real.map(rect => rect.right));
        const top = Math.min(...real.map(rect => rect.top));
        const bottom = Math.max(...real.map(rect => rect.bottom));

        return { left, right, top, bottom, width: right - left, height: bottom - top };
      };

      const arrowEl = td.querySelector('.htAutocompleteArrow');
      const cs = getComputedStyle(td);
      const cellRect = td.getBoundingClientRect();
      const borderLeft = parseFloat(cs.borderLeftWidth);
      const borderRight = parseFloat(cs.borderRightWidth);
      const paddingLeft = parseFloat(cs.paddingLeft);
      const paddingRight = parseFloat(cs.paddingRight);

      const contentRects: DOMRect[] = [];

      td.childNodes.forEach((node) => {
        if (node === arrowEl) {
          return;
        }

        if (node.nodeType === Node.TEXT_NODE) {
          const range = document.createRange();

          range.selectNode(node);
          contentRects.push(...Array.from(range.getClientRects()));
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          contentRects.push((node as HTMLElement).getBoundingClientRect());
        }
      });

      return {
        cell: toBox(cellRect),
        scrollWidth: td.scrollWidth,
        clientWidth: td.clientWidth,
        arrow: arrowEl ? toBox(arrowEl.getBoundingClientRect()) : null,
        content: unionOf(contentRects),
        contentBoxRight: cellRect.right - borderRight - paddingRight,
        contentBoxLeft: cellRect.left + borderLeft + paddingLeft,
        lineHeight: parseFloat(cs.lineHeight),
        paddingTop: parseFloat(cs.paddingTop),
      };
    }, { row, col });
  }
}
