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
   * Scroll so that a visual column ends exactly on the end band's inline-start edge (the place a selection or
   * a keyboard move snaps a column to), and wait until the column is drawn and the clones followed the scroll.
   *
   * @param {number} column The visual column to align.
   */
  async scrollColumnToBandEdge(column: number): Promise<void> {
    await this.page.evaluate((col) => {
      (window as unknown as { hot: { scrollViewportTo(options: object): boolean } }).hot
        .scrollViewportTo({ col, horizontalSnap: 'end' });
    }, column);
    await expect(this.master.locator(`td[data-testid="cell-1-${column}"]`)).toBeAttached();
    await this.page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
  }

  /**
   * Where the freeze line is and how much room the band's first column has, in one read: the distance from
   * the master's inline-end edge to the inline-start edge of the clone's first cell, and the content width
   * (`clientWidth`) of the clone's first and second cells.
   *
   * @param {FreezeLineSite} site The clone to measure.
   */
  async endLineGeometry(site: FreezeLineSite): Promise<{ fromGridEnd: number; first: number; second: number }> {
    const { clone, row } = SITES[site];

    return this.page.evaluate(([cloneSelector, rowSelector]) => {
      const rtl = getComputedStyle(document.documentElement).direction === 'rtl';
      const cells = document.querySelectorAll(`${cloneSelector} ${rowSelector} > :is(td, th)`);
      const grid = (document.querySelector('.ht_master') as HTMLElement).getBoundingClientRect();

      if (cells.length < 2) {
        throw new Error(`Fewer than two cells in ${cloneSelector} ${rowSelector}`);
      }

      const rect = cells[0].getBoundingClientRect();

      return {
        fromGridEnd: rtl ? rect.right - grid.left : grid.right - rect.left,
        first: cells[0].clientWidth,
        second: cells[1].clientWidth,
      };
    }, [clone, row] as const);
  }

  /**
   * Whether a master column ends at the freeze line: its inline-end edge on the clone's first pixel or right
   * beside it. That is the junction where two borders can meet, whichever of the two draws the line.
   */
  async masterColumnEndsAtLine(): Promise<boolean> {
    const { clone, row, neighbours } = SITES.body;

    return this.page.evaluate(([cloneSelector, rowSelector, neighbourSelector]) => {
      const rtl = getComputedStyle(document.documentElement).direction === 'rtl';
      const cell = document.querySelector(`${cloneSelector} ${rowSelector} > :is(td, th):first-child`);

      if (!cell) {
        throw new Error(`No first cell for ${cloneSelector} ${rowSelector}`);
      }

      const rect = cell.getBoundingClientRect();
      const edge = rtl ? rect.right : rect.left;
      const inward = rtl ? -1 : 1;

      return Array.from(document.querySelectorAll(neighbourSelector)).some((candidate) => {
        const candidateRect = candidate.getBoundingClientRect();
        const end = rtl ? candidateRect.left : candidateRect.right;

        return candidateRect.width > 0 && (Math.abs(end - edge) < 0.5 || Math.abs(end - (edge + inward)) < 0.5);
      });
    }, [clone, row, neighbours] as const);
  }

  /**
   * Opens the editor of a cell with the keyboard and waits until it is open.
   *
   * @param {number} row The visual row.
   * @param {number} column The visual column.
   */
  async openEditor(row: number, column: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      (window as unknown as { hot: { selectCell(row: number, col: number): void } }).hot.selectCell(r, c);
    }, [row, column] as const);
    await this.page.keyboard.press('Enter');
    await expect.poll(() => this.page.evaluate(() => (
      window as unknown as { hot: { getActiveEditor(): { isOpened(): boolean } } }
    ).hot.getActiveEditor().isOpened())).toBe(true);
  }

  /**
   * The distance from the open editor's inline-end edge to the freeze line (the inline-start edge of the end
   * clone's first body cell), in one read: `0` when the editor ends right before the line, negative when it
   * reaches under it.
   */
  async editorGapToLine(): Promise<number> {
    return this.page.evaluate(() => {
      const rtl = getComputedStyle(document.documentElement).direction === 'rtl';
      const editor = document.querySelector('textarea.handsontableInput') as HTMLElement;
      const cell = document.querySelector('.ht_clone_inline_end tbody tr > :is(td, th):first-child') as HTMLElement;
      const editorRect = editor.getBoundingClientRect();
      const cellRect = cell.getBoundingClientRect();

      return rtl ? editorRect.left - cellRect.right : cellRect.left - editorRect.right;
    });
  }

  /**
   * Selects a cell and presses the arrow key toward the inline end until the grid scrolls, the way a user
   * reaches the end band from the keyboard: the selected column then ends on the band's edge.
   *
   * @param {number} row The visual row to select.
   * @param {number} column The visual column to start from.
   * @param {boolean} rtl Whether the grid is right to left.
   * @returns {Promise<number>} The visual column the selection ends on.
   */
  async arrowToBandEdge(row: number, column: number, rtl: boolean): Promise<number> {
    const scrollLeft = () => this.page.evaluate(() => (
      document.querySelector('.ht_master .wtHolder') as HTMLElement).scrollLeft);

    await this.page.evaluate(([r, c]) => {
      (window as unknown as { hot: { selectCell(row: number, col: number): void } }).hot.selectCell(r, c);
    }, [row, column] as const);

    const start = await scrollLeft();

    for (let press = 0; press < 40 && await scrollLeft() === start; press++) {
      await this.page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight');
    }

    // The clones follow the scroll a frame later.
    await this.page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));

    return this.page.evaluate(() => (
      window as unknown as { hot: { getSelectedRangeLast(): { to: { col: number } } } }
    ).hot.getSelectedRangeLast().to.col);
  }

  /**
   * What a user sees across the selected cell's inline-end edge, at the cell's middle row, in one read: the
   * topmost element on the freeze line's pixel (the end clone's first pixel) and on the pixel before it, each named
   * `<overlay>/<element>`. Also whether the fill handle is the topmost element at its center. A border element's
   * hit area is wider than what it paints, so a pixel further inside cannot be judged this way.
   *
   * @param {number} row The visual row of the selected cell.
   * @param {number} column The visual column of the selected cell.
   * @returns {Promise<{ onLine: string, inside: string, handleOnTop: boolean }>}
   */
  async endEdgeAcrossLine(row: number, column: number): Promise<{
    onLine: string; inside: string; handleOnTop: boolean;
  }> {
    return this.page.evaluate(([r, c]) => {
      const { hot } = window as unknown as {
        hot: { getCell(row: number, col: number): HTMLElement, isRtl(): boolean },
      };
      const rtl = hot.isRtl();
      const cell = hot.getCell(r, c).getBoundingClientRect();
      const y = cell.top + (cell.height / 2);
      // The column is lined up with the band, so its own last pixel is the line, under the band's first pixel.
      const lineX = rtl ? cell.left + 0.5 : cell.right - 0.5;
      const step = rtl ? 1 : -1;
      const describe = (x: number) => {
        const el = document.elementFromPoint(x, y);
        const overlay = el?.closest('.handsontable')?.className.match(/ht_clone_\w+|ht_master/)?.[0] ?? 'none';

        return `${overlay}/${el?.tagName.toLowerCase()}.${el?.className ?? ''}`;
      };
      const corner = Array.from(document.querySelectorAll('.wtBorder.current.corner'))
        .find(el => getComputedStyle(el).display !== 'none');
      let handleOnTop = false;

      if (corner) {
        const rect = corner.getBoundingClientRect();

        handleOnTop = document.elementFromPoint(rect.left + (rect.width / 2), rect.top + (rect.height / 2)) === corner;
      }

      return {
        onLine: describe(lineX),
        inside: describe(lineX + step),
        handleOnTop,
      };
    }, [row, column] as const);
  }

  /**
   * Clears the selection and gives one cell a 1px custom border on its inline-end side.
   *
   * @param {number} row The visual row.
   * @param {number} column The visual column.
   */
  async addCustomEndBorder(row: number, column: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      const { hot } = window as unknown as {
        hot: { deselectCell(): void, updateSettings(settings: object): void },
      };

      hot.deselectCell();
      hot.updateSettings({ customBorders: [{ row: r, col: c, end: { width: 1, color: 'red' } }] });
    }, [row, column] as const);
  }

  /**
   * The master's custom border edge against the end clone's table, in one read: its width, and how much of it
   * lies under the clone, which paints over it (`0`: all of it shows).
   *
   * @returns {Promise<{ width: number, underBand: number } | null>} `null` while no custom border is drawn.
   */
  async customEndBorderAgainstBand(): Promise<{ width: number; underBand: number } | null> {
    return this.page.evaluate(() => {
      const rtl = getComputedStyle(document.documentElement).direction === 'rtl';
      const band = (document.querySelector('.ht_clone_inline_end .wtHolder table') as HTMLElement)
        .getBoundingClientRect();
      // The selection was cleared, so the only drawn border of the master is the custom one.
      const edge = Array.from(document.querySelectorAll('.ht_master .wtBorder'))
        .filter(el => getComputedStyle(el).display !== 'none')
        .map(el => el.getBoundingClientRect())
        .find(rect => rect.width > 0 && rect.height > rect.width);

      if (!edge) {
        return null;
      }

      return {
        width: Math.round(edge.width),
        underBand: Math.max(0, Math.round(rtl ? band.right - edge.left : edge.right - band.left)),
      };
    });
  }

  /**
   * The color a user sees on the pixel inside a lined-up cell's inline-end edge (the cell's last pixel is the freeze
   * line, under the band), at the cell's middle row, read from a
   * screenshot (decoded by the page's own canvas), as `[r, g, b]`. A hit test cannot stand in for it there: the end
   * clone's hit area starts a fraction of a pixel before the pixel it paints.
   *
   * @param {number} row The visual row.
   * @param {number} column The visual column.
   * @returns {Promise<number[]>}
   */
  async colorInsideEndEdge(row: number, column: number): Promise<number[]> {
    const point = await this.page.evaluate(([r, c]) => {
      const { hot } = window as unknown as {
        hot: { getCell(row: number, col: number): HTMLElement, isRtl(): boolean },
      };
      const cell = hot.getCell(r, c).getBoundingClientRect();

      // The cell's own last pixel is the line, under the band; the pixel inside it is the next one in.
      return {
        x: Math.round(hot.isRtl() ? cell.left + 1 : cell.right - 2),
        y: Math.floor(cell.top + (cell.height / 2)),
      };
    }, [row, column] as const);
    const shot = await this.page.screenshot({ clip: { x: point.x, y: point.y, width: 1, height: 1 } });

    return this.page.evaluate(async(base64) => {
      const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
      const canvas = new OffscreenCanvas(1, 1);
      const context = canvas.getContext('2d')!;

      context.drawImage(bitmap, 0, 0);

      return Array.from(context.getImageData(0, 0, 1, 1).data.slice(0, 3));
    }, shot.toString('base64'));
  }

  /**
   * Scrolls the master holder by a few pixels toward the inline end and waits for the clones to follow.
   *
   * @param {number} pixels How far to scroll.
   */
  async scrollFurtherBy(pixels: number): Promise<void> {
    await this.page.evaluate(async(by) => {
      const holder = document.querySelector('.ht_master .wtHolder') as HTMLElement;
      const rtl = getComputedStyle(holder).direction === 'rtl';

      holder.scrollLeft += rtl ? -by : by;
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
    }, pixels);
  }

  /**
   * Whether an end clone shows a piece of a `current` selection border.
   *
   * @returns {Promise<boolean>}
   */
  async endCloneShowsCurrentBorder(): Promise<boolean> {
    return this.page.evaluate(() => Array.from(document.querySelectorAll('.ht_clone_inline_end .wtBorder.current'))
      .some(el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0));
  }

  /**
   * Merges a block of cells and selects it.
   *
   * @param {number} row The visual row of the block's top-start cell.
   * @param {number} col The visual column of the block's top-start cell.
   * @param {number} rowspan How many rows the block spans.
   * @param {number} colspan How many columns the block spans.
   */
  async mergeAndSelect(row: number, col: number, rowspan: number, colspan: number): Promise<void> {
    await this.page.evaluate(([r, c, rs, cs]) => {
      const { hot } = window as unknown as {
        hot: { updateSettings(settings: object): void, selectCell(row: number, col: number): void },
      };

      hot.updateSettings({ mergeCells: [{ row: r, col: c, rowspan: rs, colspan: cs }] });
      hot.selectCell(r, c);
    }, [row, col, rowspan, colspan] as const);
  }

  /**
   * What the end clone draws of the selected block, in one read, measured against the block's bottom-end corner
   * (the corner of its master cell): whether the fill handle the clone draws is the topmost element at its center,
   * and how far that center is from the corner on each axis; how far the clone's displayed inline-end and bottom
   * edges are from the block's own, in whole pixels. `null` for a part the clone does not draw.
   *
   * @param {number} row The visual row of the block's top-start cell.
   * @param {number} col The visual column of the block's top-start cell.
   * @returns {Promise<{ handleOnTop: boolean, handleOffset: number[] | null, endEdgeOffset: number | null,
   * bottomEdgeOffset: number | null }>}
   */
  async blockOutlineInEndClone(row: number, col: number): Promise<{
    handleOnTop: boolean; handleOffset: number[] | null; endEdgeOffset: number | null; bottomEdgeOffset: number | null;
  }> {
    return this.page.evaluate(([r, c]) => {
      const { hot } = window as unknown as {
        hot: { getCell(row: number, col: number): HTMLElement, isRtl(): boolean },
      };
      const rtl = hot.isRtl();
      const block = hot.getCell(r, c).getBoundingClientRect();
      const cornerX = rtl ? block.left : block.right;
      const shown = Array.from(document.querySelectorAll('.ht_clone_inline_end .wtBorder.current'))
        .filter(el => getComputedStyle(el).display !== 'none')
        .map(el => ({ el, rect: el.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width > 0 && rect.height > 0);
      const corner = shown.find(({ el }) => el.classList.contains('corner'));
      const lines = shown.filter(({ el }) => !el.classList.contains('corner'));
      const vertical = lines.filter(({ rect }) => rect.height > rect.width)
        .map(({ rect }) => Math.round((rtl ? rect.left : rect.right) - cornerX));
      const horizontal = lines.filter(({ rect }) => rect.width > rect.height)
        .map(({ rect }) => Math.round(rect.bottom - block.bottom));
      const nearest = (values: number[]) => (values.length === 0 ? null :
        values.reduce((best, value) => (Math.abs(value) < Math.abs(best) ? value : best)));
      let handleOnTop = false;
      let handleOffset: number[] | null = null;

      if (corner) {
        const x = corner.rect.left + (corner.rect.width / 2);
        const y = corner.rect.top + (corner.rect.height / 2);

        handleOnTop = document.elementFromPoint(x, y) === corner.el;
        handleOffset = [Math.round(x - cornerX), Math.round(y - block.bottom)];
      }

      return {
        handleOnTop,
        handleOffset,
        endEdgeOffset: nearest(vertical),
        bottomEdgeOffset: nearest(horizontal),
      };
    }, [row, col] as const);
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
   * neighbouring cell when that cell ends exactly at the clone's edge, beside it. A neighbour that ends inside
   * the clone's first pixel has its border under the clone's and is not counted.
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
