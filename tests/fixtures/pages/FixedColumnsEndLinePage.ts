import { expect, type Locator, type Page } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * Query params the `fixed-columns-end-line.html` fixture understands.
 */
export interface FixedColumnsEndLineOptions {
  rtl?: boolean;
  rows?: number;
  cols?: number;
  colWidth?: number;
  width?: number;
  height?: number;
  fixedColumnsStart?: number;
  fixedColumnsEnd?: number;
  fixedRowsBottom?: number;
  /** `false` renders the grid without row headers. */
  rowHeaders?: boolean;
}

/**
 * Where the freeze line is measured: the first cell of an end clone, and the cells of the table that sits
 * either side of the line when the clone rests against a column.
 */
export type FreezeLineSite = 'body' | 'header' | 'bottom';

/**
 * What draws the freeze line at an end clone's inline-start edge.
 */
export interface FreezeLineMeasure {
  /** The inline-start border of the clone's first cell. */
  own: number;
  /** The inline-end border of the neighbouring cell that ends exactly at the clone's edge, 0 when none does. */
  neighbour: number;
  /** `own + neighbour`: the width of the line the eye sees. */
  total: number;
}

const SITES: Record<FreezeLineSite, { clone: string; row: string; neighbours: string }> = {
  body: {
    clone: '.ht_clone_inline_end',
    row: 'tbody tr:nth-child(2)',
    neighbours: '.ht_master tbody tr:nth-child(2) td',
  },
  header: {
    clone: '.ht_clone_top_inline_end_corner',
    row: 'thead tr:last-child',
    neighbours: '.ht_clone_top thead tr:last-child th',
  },
  bottom: {
    clone: '.ht_clone_bottom_inline_end_corner',
    row: 'tbody tr:last-child',
    neighbours: '.ht_clone_bottom tbody tr:last-child td',
  },
};

/**
 * Page Object for the `fixed-columns-end-line.html` fixture. It measures the freeze line at the inline-start
 * edge of the end clones as computed border widths and box geometry, never as pixels.
 */
export class FixedColumnsEndLinePage {
  readonly master: Locator;

  constructor(
    readonly page: Page,
    readonly theme: string,
    readonly bundle: string
  ) {
    this.master = page.locator('.ht_master');
  }

  /**
   * Navigate and wait for the grid to render (a real DOM condition, no sleep).
   *
   * @param {FixedColumnsEndLineOptions} options The fixture options.
   */
  async open(options: FixedColumnsEndLineOptions = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    Object.entries(options).forEach(([name, value]) => {
      if (name === 'rowHeaders') {
        if (value === false) {
          params.set('rowHeaders', '0');
        }

      } else if (value !== undefined && value !== false) {
        params.set(name, value === true ? '1' : String(value));
      }
    });
    await this.page.goto(`/tests/fixtures/demo/fixed-columns-end-line.html?${params}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.master).toBeVisible();
  }

  /**
   * The master holder's largest horizontal scroll offset, measured from the inline start (always >= 0).
   */
  async maxScroll(): Promise<number> {
    return this.page.evaluate(() => {
      const holder = document.querySelector('.ht_master .wtHolder') as HTMLElement;

      return holder.scrollWidth - holder.clientWidth;
    });
  }

  /**
   * Scroll the master holder to an offset from the inline start, and wait until the scroll event was handled:
   * the column the scroll brings into the render window is drawn, and two frames passed (the overlays sync
   * on the scroll event's frame).
   *
   * @param {number} offset Offset from the inline start, in pixels.
   * @param {number} renderedColumn A visual column the master must have drawn once the scroll landed.
   * @param {boolean} rtl Whether the grid is right to left.
   */
  async scrollTo(offset: number, renderedColumn: number, rtl: boolean): Promise<void> {
    await this.page.evaluate(([x, sign]) => {
      (document.querySelector('.ht_master .wtHolder') as HTMLElement).scrollLeft = x * sign;
    }, [offset, rtl ? -1 : 1]);
    await expect(this.master.locator(`td[data-testid="cell-1-${renderedColumn}"]`)).toBeAttached();
    await this.page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
  }

  /**
   * Whether each end clone root carries the freeze-line state class.
   */
  async sharedStateOfClones(): Promise<Record<string, boolean>> {
    return this.page.evaluate(() => {
      const state: Record<string, boolean> = {};

      ['ht_clone_inline_end', 'ht_clone_top_inline_end_corner', 'ht_clone_bottom_inline_end_corner']
        .forEach((name) => {
          const root = document.querySelector(`.${name}`);

          if (root) {
            state[name] = root.classList.contains('htFreezeLineShared');
          }
        });

      return state;
    });
  }

  /**
   * The freeze line at the inline-start edge of an end clone: the clone's own border, and the border of the
   * neighbouring cell when that cell ends exactly at the clone's edge.
   *
   * @param {FreezeLineSite} site The clone to measure.
   */
  async endLine(site: FreezeLineSite): Promise<FreezeLineMeasure> {
    const { clone, row, neighbours } = SITES[site];

    return this.page.evaluate(([cloneSelector, rowSelector, neighbourSelector]) => {
      const rtl = getComputedStyle(document.documentElement).direction === 'rtl';
      const cell = document.querySelector(`${cloneSelector} ${rowSelector} :is(td, th):first-child`);

      if (!cell) {
        throw new Error(`No first cell for ${cloneSelector} ${rowSelector}`);
      }

      const rect = cell.getBoundingClientRect();
      const edge = rtl ? rect.right : rect.left;
      const own = Number.parseFloat(getComputedStyle(cell).borderInlineStartWidth);
      let neighbour = 0;

      document.querySelectorAll(neighbourSelector).forEach((candidate) => {
        const candidateRect = candidate.getBoundingClientRect();
        const candidateEnd = rtl ? candidateRect.left : candidateRect.right;

        if (Math.abs(candidateEnd - edge) < 1 && candidateRect.width > 0) {
          neighbour = Number.parseFloat(getComputedStyle(candidate).borderInlineEndWidth);
        }
      });

      return { own, neighbour, total: own + neighbour };
    }, [clone, row, neighbours] as const);
  }

  /**
   * The width of the freeze line at the inline start, measured the same way, as the reference the end line is
   * compared with: the inline-end border of the last start column's cell plus the inline-start border of the
   * master cell that begins exactly where it ends.
   *
   * @param {number} lastStartColumn Visual index of the last column frozen at the start.
   */
  async startLine(lastStartColumn: number): Promise<number> {
    return this.page.evaluate((col) => {
      const rtl = getComputedStyle(document.documentElement).direction === 'rtl';
      const cell = document.querySelector(`.ht_clone_inline_start td[data-testid="cell-1-${col}"]`);
      const next = document.querySelector(`.ht_master td[data-testid="cell-1-${col + 1}"]`);

      if (!cell || !next) {
        throw new Error('No cells either side of the start freeze line');
      }

      const cellRect = cell.getBoundingClientRect();
      const nextRect = next.getBoundingClientRect();
      const edge = rtl ? cellRect.left : cellRect.right;
      const nextStart = rtl ? nextRect.right : nextRect.left;
      const own = Number.parseFloat(getComputedStyle(cell).borderInlineEndWidth);
      const other = Math.abs(nextStart - edge) < 1 ? Number.parseFloat(getComputedStyle(next).borderInlineStartWidth) : 0;

      return own + other;
    }, lastStartColumn);
  }
}
