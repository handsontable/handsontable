import { expect, type Locator, type Page } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * Query params of the `fixed-columns-end-line.html` fixture this page object uses.
 */
export interface FixedRowsBottomLineOptions {
  rtl?: boolean;
  rows?: number;
  cols?: number;
  height?: number;
  fixedColumnsStart?: number;
  fixedRowsBottom?: number;
}

/**
 * What draws the freeze line at the bottom clone's top edge.
 */
export interface BottomFreezeLineMeasure {
  /** The top border of the clone's first row. */
  own: number;
  /** The bottom border of a master row that ends exactly at the clone's top edge, beside it; 0 when none does. */
  neighbour: number;
  /** `own + neighbour`: the height of the line the eye sees. */
  total: number;
}

interface HotLike {
  selectCell(row: number, col: number): void;
  deselectCell(): void;
  scrollViewportTo(options: object): boolean;
  updateSettings(settings: object): void;
  getCell(row: number, col: number): HTMLElement;
  getSelectedRangeLast(): { to: { row: number } };
}

/**
 * Page Object for the `fixedRowsBottom` freeze line, on the `fixed-columns-end-line.html` fixture. It measures
 * the line at the top edge of the bottom clone as computed border widths, box geometry and hit tests.
 */
export class FixedRowsBottomLinePage {
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
   * @param {FixedRowsBottomLineOptions} options The fixture options.
   */
  async open(options: FixedRowsBottomLineOptions = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    Object.entries(options).forEach(([name, value]) => {
      if (value !== undefined && value !== false) {
        params.set(name, value === true ? '1' : String(value));
      }
    });
    await this.page.goto(`/tests/fixtures/demo/fixed-columns-end-line.html?${params}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.master).toBeVisible();
  }

  /**
   * Waits two animation frames: the clones follow a scroll on the frame after it.
   */
  async #settle(): Promise<void> {
    await this.page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
  }

  /**
   * Scrolls the master holder to its largest vertical offset and waits until the last scrollable row is drawn.
   *
   * @param {number} lastScrollableRow The visual row right above the bottom rows.
   */
  async scrollToEnd(lastScrollableRow: number): Promise<void> {
    await this.page.evaluate(() => {
      const holder = document.querySelector('.ht_master .wtHolder') as HTMLElement;

      holder.scrollTop = holder.scrollHeight;
    });
    await expect(this.master.locator(`td[data-testid="cell-${lastScrollableRow}-1"]`)).toBeAttached();
    await this.#settle();
  }

  /**
   * Scrolls so that a visual row ends on the bottom rows' top edge (the place a keyboard move snaps a row to),
   * and waits until the row is drawn and the clones followed the scroll.
   *
   * @param {number} row The visual row to align.
   */
  async scrollRowToBandEdge(row: number): Promise<void> {
    await this.page.evaluate((r) => {
      (window as unknown as { hot: HotLike }).hot.scrollViewportTo({ row: r, verticalSnap: 'bottom' });
    }, row);
    await expect(this.master.locator(`td[data-testid="cell-${row}-1"]`)).toBeAttached();
    await this.#settle();
  }

  /**
   * Selects a cell and presses the down arrow until the grid scrolls, the way a user reaches the bottom rows
   * from the keyboard: the selected row then ends on the bottom rows' top edge.
   *
   * @param {number} row The visual row to start from.
   * @param {number} column The visual column to select.
   * @returns {Promise<number>} The visual row the selection ends on.
   */
  async arrowToBandEdge(row: number, column: number): Promise<number> {
    const scrollTop = () => this.page.evaluate(() => (
      document.querySelector('.ht_master .wtHolder') as HTMLElement).scrollTop);

    await this.page.evaluate(([r, c]) => {
      (window as unknown as { hot: HotLike }).hot.selectCell(r, c);
    }, [row, column] as const);

    const start = await scrollTop();

    for (let press = 0; press < 40 && await scrollTop() === start; press++) {
      await this.page.keyboard.press('ArrowDown');
    }

    await this.#settle();

    return this.page.evaluate(() => (window as unknown as { hot: HotLike }).hot.getSelectedRangeLast().to.row);
  }

  /**
   * Whether a master row ends at the freeze line: its bottom edge on the clone's first pixel row or right
   * above it. That is the junction where two borders can meet, whichever of the two draws the line.
   */
  async masterRowEndsAtLine(): Promise<boolean> {
    return this.page.evaluate(() => {
      const cell = document.querySelector('.ht_clone_bottom tbody tr:first-child > td');

      if (!cell) {
        throw new Error('No first cell in the bottom clone');
      }

      const edge = cell.getBoundingClientRect().top;

      return Array.from(document.querySelectorAll('.ht_master tbody tr > td:first-of-type')).some((candidate) => {
        const rect = candidate.getBoundingClientRect();

        return rect.height > 0 && (Math.abs(rect.bottom - edge) < 0.5 || Math.abs(rect.bottom - (edge + 1)) < 0.5);
      });
    });
  }

  /**
   * The freeze line at the top edge of the bottom clone: the clone's own border, and the border of a master row
   * when that row ends exactly at the clone's edge, right above it. A row that ends inside the clone's first
   * pixel row has its border under the clone's and is not counted.
   */
  async bottomLine(): Promise<BottomFreezeLineMeasure> {
    return this.page.evaluate(() => {
      const cell = document.querySelector('.ht_clone_bottom tbody tr:first-child > td');

      if (!cell) {
        throw new Error('No first cell in the bottom clone');
      }

      const edge = cell.getBoundingClientRect().top;
      const own = Number.parseFloat(getComputedStyle(cell).borderTopWidth);
      let neighbour = 0;

      document.querySelectorAll('.ht_master tbody tr > td:first-of-type').forEach((candidate) => {
        const rect = candidate.getBoundingClientRect();

        if (rect.height > 0 && Math.abs(rect.bottom - edge) < 0.5) {
          neighbour = Number.parseFloat(getComputedStyle(candidate).borderBottomWidth);
        }
      });

      return { own, neighbour, total: own + neighbour };
    });
  }

  /**
   * What a user sees across the selected cell's bottom edge, at the cell's middle column, in one read: the
   * topmost element on the freeze line's pixel (the bottom clone's first pixel row) and on the pixel above it,
   * each named `<overlay>/<element>`. Also whether the fill handle is the topmost element at its center, and
   * whether it stays above the bottom rows: at most one pixel row of its box, the empty margin under its painted
   * dot, lies on the line's pixel.
   *
   * @param {number} row The visual row of the selected cell.
   * @param {number} column The visual column of the selected cell.
   */
  async bottomEdgeAcrossLine(row: number, column: number): Promise<{
    onLine: string; inside: string; handleOnTop: boolean; handleAboveBand: boolean;
  }> {
    return this.page.evaluate(([r, c]) => {
      const { hot } = window as unknown as { hot: HotLike };
      const cell = hot.getCell(r, c).getBoundingClientRect();
      const line = (document.querySelector('.ht_clone_bottom tbody tr:first-child > td') as HTMLElement)
        .getBoundingClientRect().top;
      const x = cell.left + (cell.width / 2);
      const describe = (y: number) => {
        const el = document.elementFromPoint(x, y);
        const overlay = el?.closest('.handsontable')?.className.match(/ht_clone_\w+|ht_master/)?.[0] ?? 'none';

        return `${overlay}/${el?.tagName.toLowerCase()}.${el?.className ?? ''}`;
      };
      const corner = Array.from(document.querySelectorAll('.wtBorder.current.corner'))
        .find(el => getComputedStyle(el).display !== 'none');
      let handleOnTop = false;
      let handleAboveBand = false;

      if (corner) {
        const rect = corner.getBoundingClientRect();

        handleOnTop = document.elementFromPoint(rect.left + (rect.width / 2), rect.top + (rect.height / 2)) === corner;
        handleAboveBand = Math.round(rect.bottom - line) <= 1;
      }

      return {
        onLine: describe(line + 0.5),
        inside: describe(line - 0.5),
        handleOnTop,
        handleAboveBand,
      };
    }, [row, column] as const);
  }

  /**
   * Clears the selection and gives one cell a 1px custom border on its bottom side.
   *
   * @param {number} row The visual row.
   * @param {number} column The visual column.
   */
  async addCustomBottomBorder(row: number, column: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      const { hot } = window as unknown as { hot: HotLike };

      hot.deselectCell();
      hot.updateSettings({ customBorders: [{ row: r, col: c, bottom: { width: 1, color: 'red' } }] });
    }, [row, column] as const);
  }

  /**
   * The master's custom border edge against the bottom clone, in one read: its height, and how much of it lies
   * under the clone, which paints over it (`0`: all of it shows).
   *
   * @returns {Promise<{ height: number, underBand: number } | null>} `null` while no custom border is drawn.
   */
  async customBottomBorderAgainstBand(): Promise<{ height: number; underBand: number } | null> {
    return this.page.evaluate(() => {
      const band = (document.querySelector('.ht_clone_bottom tbody tr:first-child > td') as HTMLElement)
        .getBoundingClientRect();
      // The selection was cleared, so the only drawn border of the master is the custom one.
      const edge = Array.from(document.querySelectorAll('.ht_master .wtBorder'))
        .filter(el => getComputedStyle(el).display !== 'none')
        .map(el => el.getBoundingClientRect())
        .find(rect => rect.height > 0 && rect.width > rect.height);

      if (!edge) {
        return null;
      }

      return {
        height: Math.round(edge.height),
        underBand: Math.max(0, Math.round(edge.bottom - band.top)),
      };
    });
  }
}
