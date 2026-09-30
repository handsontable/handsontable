import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Which box scrolls: the page (`window`, a grid with no size of its own) or the grid's own holder
 * (`sized`, a 1000 x 700 grid in a wider viewport).
 */
export type Layout = 'window' | 'sized';

/**
 * Which editor opens the list: `handsontable` (a nested grid as wide as its own columns) or `dropdown`
 * (the same flip, but `AutocompleteEditor#updateDropdownDimensions` sizes the list, trimmed to the
 * cell's width by default).
 */
export type EditorType = 'handsontable' | 'dropdown';

/**
 * One way to lay the fixture out.
 */
export interface Variant {
  /**
   * The grid's `layoutDirection`.
   */
  dir: 'ltr' | 'rtl';
  /**
   * Which box scrolls.
   */
  layout: Layout;
  /**
   * The document's direction; the grid's when omitted, as on a real RTL page.
   */
  doc?: 'ltr' | 'rtl';
  /**
   * The editor under test; `handsontable` when omitted.
   */
  type?: EditorType;
}

/**
 * A box in viewport coordinates, as `getBoundingClientRect()` reports it.
 */
export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * The edited cell, the editor's list, and the viewport, read in one evaluation.
 */
export interface ListGeometry {
  cell: Box;
  list: Box;
  viewport: { width: number; height: number };
}

/**
 * Where the list opened, in words a failure message can carry: which edge of the edited cell it is
 * aligned to (and so which way it extends, or `cell width` for a list trimmed to the cell), whether it
 * sits below or above the cell, and whether it is on screen (`yes`, or the boxes that say why not).
 */
export interface ListPlacement {
  aligned: string;
  side: string;
  inViewport: string;
}

/**
 * How far an edge may be from where it should be. The offsets are whole pixels, measured the same
 * on all three themes and in both layouts, so a 1 px shift fails on every leg:
 *
 * - opened toward the inline end (the default), the list starts 1 px before the cell's inline start
 *   (the editor border compensation in `BaseEditor#getEditedCellRect`);
 * - flipped toward the inline start, its inline end is flush with the cell's;
 * - below the cell, its top is the cell's bottom; flipped above, its bottom is 1 px above the cell's
 *   top.
 */
export const EDGE_TOLERANCE_PX = 0.5;

/**
 * How far short of the cell's inline end a list trimmed to the cell may stop. Measured on all three
 * themes in both directions: the dropdown's trimmed list meets the cell's inline end on `main` and
 * `classic` and stops 2 px short of it on `horizon`, whose editor input is 2 px narrower.
 */
export const TRIMMED_SHORTFALL_PX = 2;

/**
 * Names a placement from its boxes. A list that matches no expected edge, or leaves the viewport, is
 * reported with the measured boxes, so a regression says what it did.
 *
 * @param {ListGeometry} geometry The boxes.
 * @param {'ltr' | 'rtl'} dir The grid's layout direction, which decides which edge carries the 1 px.
 * @returns {ListPlacement} The placement.
 */
export function placementOf(geometry: ListGeometry, dir: 'ltr' | 'rtl'): ListPlacement {
  const { cell, list, viewport } = geometry;
  const round = (value: number) => Math.round(value * 10) / 10;
  const meets = (a: number, b: number) => Math.abs(a - b) <= EDGE_TOLERANCE_PX;
  // The border compensation sits on the cell's inline start: its left in LTR, its right in RTL.
  const leftEdge = dir === 'rtl' ? cell.left : cell.left - 1;
  const rightEdge = dir === 'rtl' ? cell.right + 1 : cell.right;
  let aligned: string;
  let side: string;

  // A list trimmed to the cell (the dropdown's default) starts at the cell's inline start and ends at,
  // or up to TRIMMED_SHORTFALL_PX short of, its inline end, so no flip moves it. A wider one is aligned
  // to the cell's left edge and extends right, or to its right edge and extends left; which of those
  // two is the default depends on the layout direction.
  const startsAtInlineStart = dir === 'rtl' ? meets(list.right, rightEdge) : meets(list.left, leftEdge);
  const inlineEndShortfall = dir === 'rtl' ? list.left - cell.left : cell.right - list.right;

  if (startsAtInlineStart && inlineEndShortfall >= -EDGE_TOLERANCE_PX
    && inlineEndShortfall <= TRIMMED_SHORTFALL_PX + EDGE_TOLERANCE_PX) {
    aligned = 'cell width';
  } else if (meets(list.left, leftEdge) && list.right > cell.right) {
    aligned = 'left edge';
  } else if (meets(list.right, rightEdge) && list.left < cell.left) {
    aligned = 'right edge';
  } else {
    aligned = `neither: list ${round(list.left)}–${round(list.right)}, cell ${round(cell.left)}–${round(cell.right)}`;
  }

  if (meets(list.top, cell.bottom)) {
    side = 'below';
  } else if (meets(list.bottom, cell.top - 1)) {
    side = 'above';
  } else {
    side = `detached: list ${round(list.top)}–${round(list.bottom)}, cell ${round(cell.top)}–${round(cell.bottom)}`;
  }

  // The same tolerance as the edges: a list placed flush with the viewport's edge after a flip can end
  // a sub-pixel past it.
  const inside = list.left >= -EDGE_TOLERANCE_PX && list.top >= -EDGE_TOLERANCE_PX
    && list.right <= viewport.width + EDGE_TOLERANCE_PX && list.bottom <= viewport.height + EDGE_TOLERANCE_PX;
  const inViewport = inside ? 'yes' : `no: list ${round(list.left)}–${round(list.right)} × `
    + `${round(list.top)}–${round(list.bottom)} in a ${viewport.width} × ${viewport.height} viewport`;

  return { aligned, side, inViewport };
}

/**
 * Page Object for the list-position fixture of the `handsontable` and `dropdown` editors, in either
 * layout: a grid the WINDOW scrolls, whose list has to fit the viewport, and a sized grid that scrolls
 * its own holder, whose list's horizontal flip measures the grid.
 *
 * Cells are picked by a point, not by index, because which cell sits under a point after a scroll
 * depends on the theme's row height. The point is an offset from the edges of the box that scrolls
 * (the viewport, or the grid's holder), so the same offsets name the same corner in both layouts.
 * The cell is then selected through the API and the editor opened with Enter, so no click can land
 * on anything but the cell.
 */
export class HandsontableEditorListPositionPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly dir: 'ltr' | 'rtl';
  readonly doc: 'ltr' | 'rtl';
  readonly layout: Layout;
  readonly type: EditorType;
  readonly grid: Locator;
  readonly list: Locator;

  /**
   * Builds the page object for one theme, bundle, and layout of the fixture.
   *
   * @param {Page} page The Playwright page.
   * @param {string} theme The active theme.
   * @param {string} bundle The active bundle.
   * @param {Variant} variant The grid's direction, the layout, and optionally the document's direction
   * and the editor type.
   */
  constructor(page: Page, theme = 'main', bundle = 'umd', variant: Variant = { dir: 'ltr', layout: 'window' }) {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.dir = variant.dir;
    this.doc = variant.doc ?? variant.dir;
    this.layout = variant.layout;
    this.type = variant.type ?? 'handsontable';
    this.grid = page.getByTestId('grid');
    // The editor's own container, which holds the nested grid that is the list.
    this.list = page.locator('.handsontableEditor');
  }

  /**
   * Navigate to the fixture and wait for the grid. Theme, bundle, both directions, layout, and editor
   * type travel as query params, so the fixture loads the matching stylesheet and build and lays the
   * page out that way.
   */
  async goto(): Promise<void> {
    await this.page.goto('/tests/fixtures/demo/handsontable-editor-list-position.html'
      + `?theme=${this.theme}&bundle=${this.bundle}&dir=${this.dir}&doc=${this.doc}`
      + `&layout=${this.layout}&type=${this.type}`);
    // The bundle first, or a slow leg fails pointing at a missing cell instead of the real cause.
    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master overlay, by its test id.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Locator} The cell.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Scrolls whatever scrolls to its bottom and inline end, and waits until the grid's last cell is
   * rendered, which is the render state that scroll produces. The window's inline end is on the right
   * in an LTR document and on the left in an RTL one, where `scrollX` runs from 0 down to a negative
   * value.
   */
  async scrollToEnd(): Promise<void> {
    if (this.layout === 'window') {
      await this.page.evaluate((rtl) => {
        const { scrollWidth, scrollHeight } = document.documentElement;

        window.scrollTo(rtl ? -scrollWidth : scrollWidth, scrollHeight);
      }, this.doc === 'rtl');
    } else {
      await this.page.evaluate(() => {
        const { hot } = window as unknown as {
          hot: { scrollViewportTo(options: { row: number; col: number }): boolean;
            countRows(): number; countCols(): number; };
        };

        hot.scrollViewportTo({ row: hot.countRows() - 1, col: hot.countCols() - 1 });
      });
    }

    await expect(this.cell(99, 49)).toBeVisible();
  }

  /**
   * Opens the editor on the data cell under a point. A positive offset counts from the left or top
   * edge of the box that scrolls, a negative one from its right or bottom edge; `'center'` is the
   * middle of that box. Waits until the list is visible.
   *
   * @param {number | 'center'} offsetX The horizontal offset.
   * @param {number | 'center'} offsetY The vertical offset.
   * @returns {Promise<{ row: number; col: number }>} The cell that was opened.
   */
  async openEditorAt(offsetX: number | 'center', offsetY: number | 'center'): Promise<{ row: number; col: number }> {
    const coords = await this.page.evaluate(([x, y, layout]) => {
      const holder = document.querySelector('[data-testid="grid"] .ht_master .wtHolder');
      const area = layout === 'window' || !holder
        ? { left: 0, top: 0, right: document.documentElement.clientWidth, bottom: document.documentElement.clientHeight }
        : holder.getBoundingClientRect();
      const resolve = (offset: number | 'center', start: number, end: number) => {
        if (offset === 'center') {
          return (start + end) / 2;
        }

        return offset >= 0 ? start + offset : end + offset;
      };
      const td = document.elementFromPoint(resolve(x, area.left, area.right), resolve(y, area.top, area.bottom))
        ?.closest('.ht_master td');
      const { hot } = window as unknown as {
        hot: {
          getCoords(td: Element): { row: number; col: number };
          selectCell(row: number, col: number): boolean;
        };
      };

      if (!td) {
        return null;
      }

      const { row, col } = hot.getCoords(td);

      hot.selectCell(row, col);

      return { row, col };
    }, [offsetX, offsetY, this.layout] as const);

    if (!coords || coords.row < 0 || coords.col < 0) {
      throw new Error(`No data cell under the point (${offsetX}, ${offsetY}) of the ${this.layout} layout`);
    }

    await this.page.keyboard.press('Enter');
    await expect(this.list).toBeVisible();

    return coords;
  }

  /**
   * Closes the editor with Escape and waits for the list to go.
   */
  async closeEditor(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.list).toBeHidden();
  }

  /**
   * The edited cell, the list, and the viewport, read in one evaluation, so a re-render between two
   * round trips cannot mix two frames into one measurement.
   *
   * @param {{ row: number; col: number }} coords The edited cell.
   * @returns {Promise<ListGeometry>} The boxes.
   */
  async geometry(coords: { row: number; col: number }): Promise<ListGeometry> {
    return this.page.evaluate(({ row, col }) => {
      const box = (element: Element | null | undefined) => {
        if (!element) {
          throw new Error('An element the list geometry needs is not in the DOM');
        }

        const { left, right, top, bottom } = element.getBoundingClientRect();

        return { left, right, top, bottom };
      };
      const { hot } = window as unknown as {
        hot: { getCell(row: number, col: number): HTMLElement | null;
          getActiveEditor(): { htContainer?: HTMLElement } | undefined; };
      };

      return {
        cell: box(hot.getCell(row, col)),
        list: box(hot.getActiveEditor()?.htContainer),
        viewport: { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight },
      };
    }, coords);
  }

  /**
   * Where the open list sits relative to the edited cell, named by `placementOf()`. Poll it with
   * `expect.poll`, so the assertion cannot run between the list appearing and the flip moving it.
   *
   * @param {{ row: number; col: number }} coords The edited cell.
   * @returns {Promise<ListPlacement>} The placement.
   */
  async listPlacement(coords: { row: number; col: number }): Promise<ListPlacement> {
    return placementOf(await this.geometry(coords), this.dir);
  }
}
