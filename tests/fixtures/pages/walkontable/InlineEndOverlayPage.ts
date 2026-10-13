import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../../bundle';

/**
 * Query params the `inline-end-overlay.html` fixture understands. All numbers or flags.
 */
export interface InlineEndFixtureOptions {
  rtl?: boolean;
  windowScroll?: boolean;
  fixedColumnsStart?: number;
  fixedColumnsEnd?: number;
  fixedRowsTop?: number;
  fixedRowsBottom?: number;
  cols?: number;
  rows?: number;
}

/**
 * A rectangle in viewport coordinates.
 */
export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Page Object for the `fixedColumnsEnd` Walkontable fixture. It hides the overlay clone class names and the
 * geometry reads, so a spec asserts what the user sees: where the end columns stand, what they hold, and
 * which cell a pointer resolves to.
 */
export class InlineEndOverlayPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly master: Locator;
  readonly endOverlay: Locator;
  readonly startOverlay: Locator;
  readonly topEndCorner: Locator;
  readonly bottomEndCorner: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.master = this.grid.locator('.ht_master');
    this.endOverlay = this.grid.locator('.ht_clone_inline_end');
    this.startOverlay = this.grid.locator('.ht_clone_inline_start');
    this.topEndCorner = this.grid.locator('.ht_clone_top_inline_end_corner');
    this.bottomEndCorner = this.grid.locator('.ht_clone_bottom_inline_end_corner');
  }

  /**
   * Navigate and wait for the grid to render (a real DOM condition, no sleep).
   *
   * @param {InlineEndFixtureOptions} options The fixture options.
   */
  async goto(options: InlineEndFixtureOptions = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    Object.entries(options).forEach(([name, value]) => {
      if (value !== undefined && value !== false) {
        params.set(name, value === true ? '1' : String(value));
      }
    });
    await this.page.goto(`/tests/fixtures/demo/walkontable/inline-end-overlay.html?${params}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.master).toBeVisible();
  }

  /** The scrollable master holder. */
  holder(): Locator {
    return this.master.locator('.wtHolder');
  }

  /**
   * A cell by visual coordinates, looked up inside one overlay.
   *
   * @param {Locator} overlay The overlay (or the master) to look in.
   * @param {number} row Visual row.
   * @param {number} col Visual column.
   * @returns {Locator}
   */
  cellIn(overlay: Locator, row: number, col: number): Locator {
    return overlay.getByTestId(`cell-${row}-${col}`);
  }

  /** The texts of the first body row of an overlay. */
  async firstRowTexts(overlay: Locator): Promise<string[]> {
    return overlay.locator('tbody tr').first().locator('td').allTextContents();
  }

  /**
   * The grid's own client box: the part of the holder the scrollbars leave, in viewport coordinates.
   * The inline-end edge of the end columns is expected right on its inline-end side, with a classic
   * scrollbar and with a floating one alike.
   */
  async holderClientBox(): Promise<Box> {
    return this.holder().evaluate((holder) => {
      const rect = holder.getBoundingClientRect();
      const left = rect.left + holder.clientLeft;
      const top = rect.top + holder.clientTop;

      return { left, right: left + holder.clientWidth, top, bottom: top + holder.clientHeight };
    });
  }

  /**
   * The bounding box of a locator in viewport coordinates.
   *
   * @param {Locator} locator The element.
   */
  async box(locator: Locator): Promise<Box> {
    return locator.evaluate((element) => {
      const { left, right, top, bottom } = element.getBoundingClientRect();

      return { left, right, top, bottom };
    });
  }

  /**
   * Scroll the master holder by an absolute offset and let the overlays sync.
   *
   * @param {{ top?: number, left?: number }} offset The offsets to set. `left` is the magnitude: it
   *   follows the layout direction.
   */
  async scrollTo({ top, left }: { top?: number, left?: number }): Promise<void> {
    await this.holder().evaluate((holder, target) => {
      const isRtl = getComputedStyle(holder).direction === 'rtl';

      if (target.top !== undefined) {
        holder.scrollTop = target.top;
      }

      if (target.left !== undefined) {
        holder.scrollLeft = isRtl ? -target.left : target.left;
      }
    }, { top, left });
  }

  /**
   * Scroll sideways and sample how far the end overlay's outer edge is from the inline-end edge it must hold,
   * on each of the next animation frames, all inside one evaluate. The largest drift is returned, so a lag of a
   * single frame shows, which a poll that resolves at the first matching sample cannot catch.
   *
   * @param {object} options The options.
   * @param {number} options.left The horizontal scroll magnitude to set (the layout direction is applied).
   * @param {'holder'|'window'} options.scroller What scrolls: the master holder, or the browser window.
   * @param {number} options.frames How many frames to sample.
   */
  async endEdgeDriftOverFrames({ left, scroller, frames }:
    { left: number, scroller: 'holder' | 'window', frames: number }): Promise<number> {
    return this.page.evaluate(async ({ left: target, scroller: which, frames: count }) => {
      const holder = document.querySelector('[data-testid="grid"] .ht_master .wtHolder') as HTMLElement;
      const overlay = document.querySelector('[data-testid="grid"] .ht_clone_inline_end') as HTMLElement;
      const isRtl = getComputedStyle(holder).direction === 'rtl';
      const signed = isRtl ? -target : target;

      if (which === 'holder') {
        holder.scrollLeft = signed;
      } else {
        window.scrollTo(signed, 0);
      }

      let drift = 0;

      for (let i = 0; i < count; i++) {
        await new Promise(resolve => requestAnimationFrame(resolve));

        const rect = overlay.getBoundingClientRect();
        const actual = isRtl ? rect.left : rect.right;
        let expected: number;

        if (which === 'holder') {
          const holderRect = holder.getBoundingClientRect();

          expected = isRtl ? holderRect.left + holder.clientLeft : holderRect.left + holder.clientLeft + holder.clientWidth;
        } else {
          expected = isRtl ? 0 : document.documentElement.clientWidth;
        }

        drift = Math.max(drift, Math.abs(actual - expected));
      }

      return drift;
    }, { left, scroller, frames });
  }

  /** The largest horizontal scroll offset of the master holder (magnitude). */
  async maxScrollLeft(): Promise<number> {
    return this.holder().evaluate(holder => holder.scrollWidth - holder.clientWidth);
  }

  /**
   * The overlay a "topmost" cell lookup resolves to, as the overlay's clone name (`master` for none).
   *
   * @param {number} row Visual row.
   * @param {number} col Visual column.
   */
  async topmostOverlayOf(row: number, col: number): Promise<string> {
    return this.page.evaluate((coords) => {
      const hot = (window as unknown as { hot: { view: { _wt: { getCell: Function } } } }).hot;
      const td = hot.view._wt.getCell(coords, true) as HTMLElement | undefined;
      const clone = td?.closest('[class*="ht_clone_"]');
      // The legacy `ht_clone_left` style names stand beside the real ones; the real one has `inline` or `top`/`bottom`.
      const names = (clone?.className ?? '').split(/\s+/).filter(name => /^ht_clone_(inline|top|bottom)/.test(name));

      return names.find(name => !/_left_corner$/.test(name))?.replace('ht_clone_', '') ?? 'master';
    }, { row, col });
  }

  /**
   * The coordinates the engine resolves a rendered cell element to (`Table#getCoords`).
   *
   * @param {Locator} cell The cell, in any overlay.
   */
  async coordsOf(cell: Locator): Promise<{ row: number, col: number }> {
    return cell.evaluate((td) => {
      const hot = (window as unknown as { hot: { view: { _wt: { wtTable: { getCoords: Function } } } } }).hot;
      const { row, col } = hot.view._wt.wtTable.getCoords(td) as { row: number, col: number };

      return { row, col };
    });
  }

  /** The last selected range as `[fromRow, fromCol, toRow, toCol]`. */
  async selectedRange(): Promise<number[] | undefined> {
    return this.page.evaluate(() => (window as unknown as { hot: { getSelectedLast(): number[] } }).hot
      .getSelectedLast());
  }

  /**
   * Select a range through the API.
   */
  async selectRange(row: number, col: number, endRow: number, endCol: number): Promise<void> {
    await this.page.evaluate((range) => {
      (window as unknown as { hot: { selectCells(r: number[][]): void } }).hot.selectCells([range]);
    }, [row, col, endRow, endCol]);
  }

  /**
   * Change the grid settings.
   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate((next) => {
      (window as unknown as { hot: { updateSettings(s: object): void } }).hot.updateSettings(next);
    }, settings);
  }

  /** Destroy the instance. */
  async destroy(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as { hot: { destroy(): void } }).hot.destroy());
  }

  /** The number of visible selection handles on one edge, across every overlay. */
  async visibleHandles(edge: 'top' | 'bottom' | 'start' | 'end'): Promise<number> {
    return this.grid.locator(`.wtSelectionHandle--${edge}:visible`).count();
  }
}
