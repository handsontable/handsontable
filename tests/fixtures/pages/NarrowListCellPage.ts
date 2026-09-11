import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface FixtureWindow {
  hot: {
    getCell(row: number, col: number, topmost?: boolean): HTMLElement | null;
    rootElement: HTMLElement;
  };
}

export type ListCellType = 'autocomplete' | 'dropdown';
export type Mode = 'narrow' | 'autosize';
export type Dir = 'ltr' | 'rtl';

/**
 * Geometry read from a single arrow cell, all measured inside one `page.evaluate` on a node the grid
 * never recycles across the round trip.
 */
interface CellMetrics {
  /** Rendered height of the cell's box (`getBoundingClientRect().height`). */
  height: number;
  /** Content width the browser laid out on a single line, before clipping. */
  scrollWidth: number;
  /** Visible (clipped) content width. */
  clientWidth: number;
  /** Center x of the cell. */
  cellCenterX: number;
  /** Center x of the dropdown arrow, or `null` when the arrow is missing. */
  arrowCenterX: number | null;
}

/**
 * Page Object for the narrow list-cell fixture (`autocomplete` / `dropdown`), which reproduces the
 * DEV-28 wrapping bug: a long value in a narrow column used to wrap around the floated arrow instead
 * of truncating on one line.
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
   * Opens the fixture in the requested mode and waits for the first data cell to render.
   *
   * @param {object} [options] Fixture options.
   * @param {Mode} [options.mode] `narrow` (fixed 60px column) or `autosize` (`autoColumnSize`).
   * @param {Dir} [options.dir] Layout direction.
   */
  async goto({ mode = 'narrow', dir = 'ltr' }: { mode?: Mode, dir?: Dir } = {}): Promise<void> {
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
   * The grid's single-line height, in CSS pixels: the `--ht-line-height` token plus the cell's own
   * vertical padding and bottom border. This is what an unwrapped arrow cell must not exceed.
   */
  async lineHeight(): Promise<number> {
    return this.page.evaluate(() => {
      const cs = getComputedStyle((window as unknown as FixtureWindow).hot.rootElement);

      return parseFloat(cs.getPropertyValue('--ht-line-height'));
    });
  }

  /**
   * Reads a cell's geometry and its arrow's center in one round trip.
   */
  async metrics(row: number, col: number): Promise<CellMetrics> {
    return this.page.evaluate(({ row: r, col: c }) => {
      const td = (window as unknown as FixtureWindow).hot.getCell(r, c);

      if (!td) {
        throw new Error(`Cell (${r}, ${c}) is not rendered`);
      }

      const rect = td.getBoundingClientRect();
      const arrow = td.querySelector('.htAutocompleteArrow');
      const arrowRect = arrow ? arrow.getBoundingClientRect() : null;

      return {
        height: rect.height,
        scrollWidth: td.scrollWidth,
        clientWidth: td.clientWidth,
        cellCenterX: rect.left + (rect.width / 2),
        arrowCenterX: arrowRect ? arrowRect.left + (arrowRect.width / 2) : null,
      };
    }, { row, col });
  }
}
