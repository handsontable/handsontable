import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface FixtureWindow {
  hot: {
    getCell(row: number, col: number, topmost?: boolean): HTMLElement | null;
  };
}

export type ListCellType = 'autocomplete' | 'dropdown' | 'handsontable';
export type Mode = 'colWidths' | 'autosize' | 'wrap' | 'tall';
export type Dir = 'ltr' | 'rtl';
export type Align = 'top' | 'middle' | 'bottom';
export type RowHeightMode = 'min' | 'exact';
export type ListEllipsis = 'on' | 'off';
export type SideColumn = 'none' | 'wrap' | 'ellipsis';

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
  /** Content width the browser laid out, before clipping. */
  scrollWidth: number;
  /** Visible (clipped) content width. */
  clientWidth: number;
  /** The dropdown arrow's box, or `null` when the arrow is missing. */
  arrow: Box | null;
  /** Union box of everything in the cell except the arrow (the rendered value), or `null` when empty. */
  content: Box | null;
  /**
   * The x of the cell's content-box trailing (right) edge. The reserved inline-end padding must
   * keep the arrow at or past this edge so the value never paints under it.
   */
  contentBoxRight: number;
  /** The x of the cell's content-box leading (left) edge — the RTL counterpart of `contentBoxRight`. */
  contentBoxLeft: number;
  /** The cell's resolved `line-height`, in pixels. */
  lineHeight: number;
  /** The cell's resolved top padding, in pixels. */
  paddingTop: number;
  /**
   * Distance from the arrow's trailing edge to the content root's padding-box trailing edge.
   * On a normal cell that is `--ht-cell-horizontal-padding + 1px`; on `.htCellClip` it is `1px`.
   */
  arrowEndGap: number | null;
  /** Resolved `--ht-cell-horizontal-padding` on the cell, in pixels. */
  cellHorizontalPadding: number;
  /** Whether the cell clips through `div.htCellClip` (exact-height rows). */
  hasClip: boolean;
}

/**
 * Page Object for the list-cell arrow layout fixture (`autocomplete` / `dropdown` / `handsontable`).
 *
 * Reproduces DEV-348: a long value next to a floated `.htAutocompleteArrow` wraps the arrow onto a
 * second line under `colWidths` (which disables AutoColumnSize). The fix takes the in-cell arrow
 * out of flow and reserves its width as padding, so AutoColumnSize can expand to fit text plus
 * arrow, and a fixed `colWidths` column keeps the arrow on the first line without overriding
 * `wordWrap` / `textEllipsis`.
 */
export class ListCellArrowLayoutPage {
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
   * @param {Mode} [options.mode] `colWidths` (fixed 100px column), `autosize` (`autoColumnSize`),
   *   `wrap` (fixed column + breakable phrase), or `tall` (fixed column + large `rowHeights`).
   * @param {Dir} [options.dir] Layout direction.
   * @param {Align} [options.align] Cell vertical alignment class (`htMiddle` / `htBottom`).
   * @param {RowHeightMode} [options.rowHeightMode] Engine row-height mode; `exact` clips through
   *   `.htCellClip`.
   * @param {ListEllipsis} [options.listEllipsis] `off` sets `textEllipsis: false` on the list column
   *   (the per-column opt-out that restores wrapping).
   * @param {SideColumn} [options.sideColumn] Adds a second `text` column: `wrap` (plain) or
   *   `ellipsis` (`textEllipsis: true`).
   */
  async goto({
    mode = 'colWidths', dir = 'ltr', align = 'top', rowHeightMode = 'min',
    listEllipsis = 'on', sideColumn = 'none',
  }: {
    mode?: Mode, dir?: Dir, align?: Align, rowHeightMode?: RowHeightMode,
    listEllipsis?: ListEllipsis, sideColumn?: SideColumn,
  } = {}): Promise<void> {
    const query = `theme=${this.theme}&bundle=${this.bundle}&cellType=${this.cellType}`
      + `&mode=${mode}&dir=${dir}&align=${align}&rowHeightMode=${rowHeightMode}`
      + `&listEllipsis=${listEllipsis}&sideColumn=${sideColumn}`;

    await this.page.goto(`/tests/fixtures/demo/list-cell-arrow-layout.html?${query}`);

    await awaitBundle(this.page);

    const cell = this.page.locator('.ht_master').getByTestId('cell-0-0');

    await expect(cell).toBeVisible();

    if (rowHeightMode === 'exact') {
      await expect(cell.locator('.htCellClip')).toBeVisible();
    }
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Reads a cell's geometry, its arrow's box, and the value's box (everything except the arrow) in
   * one round trip. The value box comes from real client rects — a `Range` for text nodes, the box
   * for elements — so it reflects where the contents actually render, not the renderer's arithmetic.
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

      const hasClip = td.firstElementChild?.classList.contains('htCellClip') === true;
      const contentRoot = hasClip ? td.firstElementChild as HTMLElement : td;
      const arrowEl = contentRoot.querySelector('.htAutocompleteArrow');
      const cs = getComputedStyle(td);
      const cellRect = td.getBoundingClientRect();
      const borderLeft = parseFloat(cs.borderLeftWidth);
      const borderRight = parseFloat(cs.borderRightWidth);
      const paddingLeft = parseFloat(cs.paddingLeft);
      const paddingRight = parseFloat(cs.paddingRight);

      const contentRects: DOMRect[] = [];

      contentRoot.childNodes.forEach((node) => {
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

      const rootRect = contentRoot.getBoundingClientRect();
      const rootCs = getComputedStyle(contentRoot);
      const rootBorderStart = parseFloat(rootCs.borderLeftWidth);
      const rootBorderEnd = parseFloat(rootCs.borderRightWidth);
      const arrowRect = arrowEl ? arrowEl.getBoundingClientRect() : null;
      const isRtl = cs.direction === 'rtl';
      let arrowEndGap: number | null = null;

      if (arrowRect) {
        arrowEndGap = isRtl
          ? arrowRect.left - (rootRect.left + rootBorderStart)
          : rootRect.right - rootBorderEnd - arrowRect.right;
      }

      return {
        cell: toBox(cellRect),
        scrollWidth: td.scrollWidth,
        clientWidth: td.clientWidth,
        arrow: arrowRect ? toBox(arrowRect) : null,
        content: unionOf(contentRects),
        contentBoxRight: cellRect.right - borderRight - paddingRight,
        contentBoxLeft: cellRect.left + borderLeft + paddingLeft,
        lineHeight: parseFloat(cs.lineHeight),
        paddingTop: parseFloat(cs.paddingTop),
        arrowEndGap,
        cellHorizontalPadding: parseFloat(cs.getPropertyValue('--ht-cell-horizontal-padding')),
        hasClip,
      };
    }, { row, col });
  }
}
