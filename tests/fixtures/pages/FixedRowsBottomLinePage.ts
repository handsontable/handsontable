import { expect, type Locator, type Page } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';
import { dragFillHandle } from '../gestures';

/**
 * Query params of the `fixed-columns-end-line.html` fixture this page object uses.
 */
export interface FixedRowsBottomLineOptions {
  rtl?: boolean;
  rows?: number;
  cols?: number;
  fixedRowsBottom?: number;
  fixedColumnsStart?: number;
  /** `false` builds the grid without column headers. */
  colHeaders?: boolean;
  autoRowSize?: boolean;
  minRowHeights?: number;
  rowHeights?: number;
  /** The height ManualRowResize gives the grid's last row. */
  manualRowResizeLast?: number;
  /** Long, line-broken text in the last row, which makes it taller than the default height. */
  wrapLastRow?: boolean;
  fixedColumnsEnd?: number;
  /** The visual row the HiddenRows plugin hides. */
  hiddenRow?: number;
  /** The height a `modifyRowHeightByOverlayName` hook gives the grid's last row in the `bottom` overlay only. */
  bottomOverlayHeight?: number;
}

/**
 * The heights of the bottom clone and of the first row of its tables, against what the row calculators count.
 */
export interface BottomCloneMetrics {
  /** The summed heights of the frozen bottom rows as the row calculators count them. */
  counted: number;
  /** The drawn height of the bottom clone's table. */
  clone: number;
  /** The drawn heights of the clone's rows, from the first. */
  rows: number[];
  /** The drawn heights of the rows of the bottom start corner, from the first; empty without frozen start columns. */
  cornerRows: number[];
  /** The drawn heights of the rows of the bottom end corner, from the first; empty without frozen end columns. */
  cornerEndRows: number[];
  /** The drawn heights of the first three rows the master renders. */
  masterRows: number[];
  /** The height recorded for the grid's last row from what it renders; `null` when nothing is recorded. */
  recordedLastRow: number | null;
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
  selectCells(ranges: number[][], scrollToCell: boolean): void;
  getDataAtCol(column: number): unknown[];
  deselectCell(): void;
  scrollViewportTo(options: object): boolean;
  updateSettings(settings: object): void;
  setDataAtCell(row: number, col: number, value: string): void;
  getCell(row: number, col: number, topmost?: boolean): HTMLElement;
  getSelectedRangeLast(): { to: { row: number } };
  view: { invalidateRowHeightCache(): void };
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
      if (typeof value === 'boolean') {
        // `false` is sent too: `colHeaders` is on unless the fixture is told otherwise.
        params.set(name, value ? '1' : '0');

      } else if (value !== undefined) {
        params.set(name, String(value));
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
   * How far a row reaches under the bottom clone: its bottom edge minus the top edge of the clone's first
   * row. `1` is the aligned state, where the row's bottom border lies under the clone's first pixel row.
   *
   * @param {number} row The visual row.
   * @param {number} [column] The visual column to measure.
   */
  async rowOverlapWithBottomRows(row: number, column = 1): Promise<number> {
    return this.page.evaluate(([r, c]) => {
      const cell = (window as unknown as { hot: HotLike }).hot.getCell(r, c).getBoundingClientRect();
      const band = (document.querySelector('.ht_clone_bottom tbody tr:first-child > td') as HTMLElement)
        .getBoundingClientRect();

      return Math.round((cell.bottom - band.top) * 100) / 100;
    }, [row, column] as const);
  }

  /**
   * Snaps each row to the bottom rows in turn and reads how far it reaches under them.
   *
   * @param {number[]} rows The visual rows, in the order they are snapped.
   * @param {{ invalidateCache?: boolean, column?: number }} [options] With `invalidateCache`, the engine's row
   * height cache is dropped after each snap and the same row is snapped again, so the cache is rebuilt at the band
   * the previous snap left. That is what a measuring pass does when a scroll moves the band. `column` is the visual
   * column to measure in (1 by default).
   * @returns {Promise<number[]>} The overlap of each row, from the last snap of that row.
   */
  async snapOverlaps(
    rows: number[],
    options: { invalidateCache?: boolean; column?: number } = {}
  ): Promise<number[]> {
    const overlaps: number[] = [];

    for (const row of rows) {
      await this.scrollRowToBandEdge(row);

      if (options.invalidateCache) {
        await this.page.evaluate(() => {
          (window as unknown as { hot: HotLike }).hot.view.invalidateRowHeightCache();
        });
        await this.scrollRowToBandEdge(row);
      }

      overlaps.push(await this.rowOverlapWithBottomRows(row, options.column));
    }

    return overlaps;
  }

  /**
   * Snaps each row to the bottom edge of the viewport in turn and reads how far above that edge the row ends.
   * For a grid without frozen bottom rows, where `1` is the extra pixel the scroll target keeps.
   *
   * @param {number[]} rows The visual rows, in the order they are snapped.
   * @returns {Promise<number[]>} The distance of each row's bottom edge from the viewport's bottom edge.
   */
  async snapViewportInsets(rows: number[]): Promise<number[]> {
    const insets: number[] = [];

    for (const row of rows) {
      await this.scrollRowToBandEdge(row);
      insets.push(await this.cellBottomInsetFromViewport(row, 1));
    }

    return insets;
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

    const selectedRow = await this.page.evaluate(
      () => (window as unknown as { hot: HotLike }).hot.getSelectedRangeLast().to.row);

    // In whichever overlay draws it: a cell of a frozen start column is not always in the master.
    await expect(this.page.locator(`td[data-testid="cell-${selectedRow}-${column}"]`).first()).toBeAttached();
    await this.#settle();

    return selectedRow;
  }

  /**
   * Turns the AutoRowSize plugin on or off through `updateSettings()`, and waits until the grid root carries
   * (or dropped) the plugin's class name, which the plugin toggles when it is enabled and disabled.
   *
   * @param {boolean} enabled The plugin state to set.
   */
  async setAutoRowSize(enabled: boolean): Promise<void> {
    await this.page.evaluate((autoRowSize) => {
      (window as unknown as { hot: HotLike }).hot.updateSettings({ autoRowSize });
    }, enabled);
    await expect(this.page.locator('.ht-wrapper.htAutoRowSize')).toHaveCount(enabled ? 1 : 0);
    await this.#settle();
  }

  /**
   * Writes a text that wraps to several lines into a cell, and waits until its row is drawn taller than the
   * row above it.
   *
   * @param {number} row The visual row, below the first one.
   * @param {number} column The visual column.
   */
  async fillWithWrappingText(row: number, column: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      (window as unknown as { hot: HotLike }).hot.setDataAtCell(r, c, 'a b c d e f g h i j k l m n o p q r s t');
    }, [row, column] as const);

    await expect.poll(async() => (await this.rowGrowthAndScrollRange(row, column)).rowGrowth).toBeGreaterThan(10);
  }

  /**
   * By how many pixels a row is taller than the row above it, and the height of the master's scroll range
   * (the element that gives the holder its scroll height), read in one go so both come from the same layout.
   *
   * @param {number} row The visual row, below the first one.
   * @param {number} column The visual column to measure the rows in.
   */
  async rowGrowthAndScrollRange(row: number, column: number): Promise<{ rowGrowth: number; scrollRange: number }> {
    return this.page.evaluate(([r, c]) => {
      const { hot } = window as unknown as { hot: HotLike };
      const height = (visualRow: number) => hot.getCell(visualRow, c).getBoundingClientRect().height;
      const hider = document.querySelector('.ht_master .wtHider') as HTMLElement;

      return {
        rowGrowth: height(r) - height(r - 1),
        scrollRange: hider.getBoundingClientRect().height,
      };
    }, [row, column] as const);
  }

  /**
   * Selects a range through the API without scrolling to it, and waits for the draw that follows.
   *
   * @param {number} fromRow The first visual row.
   * @param {number} fromColumn The first visual column.
   * @param {number} toRow The last visual row.
   * @param {number} toColumn The last visual column.
   */
  async selectRange(fromRow: number, fromColumn: number, toRow: number, toColumn: number): Promise<void> {
    await this.page.evaluate((range) => {
      (window as unknown as { hot: HotLike }).hot.selectCells([range], false);
    }, [fromRow, fromColumn, toRow, toColumn]);
    await this.#settle();
  }

  /**
   * Scrolls the master holder down by a few pixels, and waits until no master row ends at the freeze line
   * any more: the clones follow the scroll on a later frame.
   *
   * @param {number} pixels How far to scroll.
   */
  async scrollDownBy(pixels: number): Promise<void> {
    await this.page.evaluate((delta) => {
      (document.querySelector('.ht_master .wtHolder') as HTMLElement).scrollTop += delta;
    }, pixels);
    await expect.poll(() => this.masterRowEndsAtLine()).toBe(false);
    await this.#settle();
  }

  /**
   * In a grid without frozen bottom rows, scrolls so that a row ends where the top border of one frozen
   * bottom row would cover it, selects a cell of that row, and then freezes the last row with one
   * `updateSettings()` call. The row is lined up with the bottom rows from the first draw that has them.
   *
   * @param {number} row The visual row to line up.
   * @param {number} column The visual column to select.
   */
  async freezeBottomRowUnderLinedUpRow(row: number, column: number): Promise<void> {
    // The row below ends 1px above the viewport edge after a bottom snap. One pixel back, this row ends 1px
    // under the place where a default-height bottom row starts.
    await this.page.evaluate((r) => {
      (window as unknown as { hot: HotLike }).hot.scrollViewportTo({ row: r + 1, verticalSnap: 'bottom' });
    }, row);
    await expect(this.master.locator(`td[data-testid="cell-${row + 1}-1"]`)).toBeAttached();
    await this.#settle();
    await this.page.evaluate(() => {
      (document.querySelector('.ht_master .wtHolder') as HTMLElement).scrollTop -= 1;
    });
    await this.#settle();
    await this.selectRange(row, column, row, column);
    await this.page.evaluate(() => {
      (window as unknown as { hot: HotLike }).hot.updateSettings({ fixedRowsBottom: 1 });
    });
    await expect(this.page.locator('.ht_clone_bottom tbody tr:first-child > td').first()).toBeAttached();
  }

  /**
   * The master holder's vertical scroll offset.
   */
  async scrollTop(): Promise<number> {
    return this.page.evaluate(() => (document.querySelector('.ht_master .wtHolder') as HTMLElement).scrollTop);
  }

  /**
   * How far above the master viewport's bottom edge a cell ends: `0` on the edge itself.
   *
   * @param {number} row The visual row.
   * @param {number} column The visual column.
   */
  async cellBottomInsetFromViewport(row: number, column: number): Promise<number> {
    return this.page.evaluate(([r, c]) => {
      const holder = document.querySelector('.ht_master .wtHolder') as HTMLElement;
      const viewportBottom = holder.getBoundingClientRect().top + holder.clientHeight;
      const cell = (window as unknown as { hot: HotLike }).hot.getCell(r, c).getBoundingClientRect();

      return Math.round(viewportBottom - cell.bottom);
    }, [row, column] as const);
  }

  /**
   * Drags the selection's fill handle with the real pointer onto the first frozen bottom row, in the given
   * column, and releases.
   *
   * @param {number} column The visual column to end the drag in.
   */
  async dragFillHandleOntoBottomRow(column: number): Promise<void> {
    const handle = this.page.locator('.ht_master .wtBorder.current.corner:visible');
    const target = this.page.locator('.ht_clone_bottom tbody tr:first-child')
      .locator(`td[data-testid$="-${column}"]`);

    await dragFillHandle(this.page, handle, target);
    await this.#settle();
  }

  /**
   * Every value of a column, by visual row.
   *
   * @param {number} column The visual column.
   */
  async columnValues(column: number): Promise<unknown[]> {
    return this.page.evaluate(c => (window as unknown as { hot: HotLike }).hot.getDataAtCol(c), column);
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
   * The drawn heights of the bottom clone and of its rows, with the height the row calculators count for the
   * frozen bottom rows. The clone is one pixel taller than counted wherever its first row draws the freeze line.
   *
   * @param {number} fixedRowsBottom The number of frozen bottom rows the grid was built with.
   */
  async bottomCloneMetrics(fixedRowsBottom: number): Promise<BottomCloneMetrics> {
    return this.page.evaluate((frozen) => {
      const hot = (window as unknown as {
        hot: {
          countRows(): number;
          view: {
            _wt: {
              wtViewport: {
                sumRowHeights(from: number, to: number): number;
                oversizedRows: Record<number, number | undefined>;
              };
            };
          };
        };
      }).hot;
      const rowHeights = (selector: string) => Array.from(document.querySelectorAll(`${selector} tbody tr`))
        .map(row => row.getBoundingClientRect().height);
      const cloneTable = document.querySelector('.ht_clone_bottom table');

      if (!cloneTable) {
        throw new Error('No bottom clone');
      }

      const total = hot.countRows();

      return {
        counted: hot.view._wt.wtViewport.sumRowHeights(total - frozen, total),
        clone: cloneTable.getBoundingClientRect().height,
        rows: rowHeights('.ht_clone_bottom'),
        cornerRows: rowHeights('.ht_clone_bottom_inline_start_corner'),
        cornerEndRows: rowHeights('.ht_clone_bottom_inline_end_corner'),
        masterRows: rowHeights('.ht_master').slice(0, 3),
        recordedLastRow: hot.view._wt.wtViewport.oversizedRows[total - 1] ?? null,
      };
    }, fixedRowsBottom);
  }

  /**
   * Drags the row resize handle of a frozen bottom row's header with the real mouse and releases it.
   *
   * @param {number} rowInCorner The place of the row among the frozen bottom rows, from 0.
   * @param {number} deltaY The distance to drag, positive to grow the row.
   * @returns {Promise<number>} The height the plugin stores for the last row, read after the release.
   */
  async dragBottomRowHandle(rowInCorner: number, deltaY: number): Promise<number> {
    const header = this.page.locator('.ht_clone_bottom_inline_start_corner tbody tr th').nth(rowInCorner);
    const box = await header.boundingBox();

    if (!box) {
      throw new Error(`Frozen bottom row ${rowInCorner} has no row header to hover`);
    }

    await this.page.mouse.move(box.x + (box.width / 2), box.y + (box.height / 2));
    await this.page.mouse.move(box.x + (box.width / 2), box.y + box.height - 3);

    const handle = this.page.locator('.manualRowResizer');

    await expect(handle).toBeVisible();

    const handleBox = await handle.boundingBox();

    if (!handleBox) {
      throw new Error('The row resize handle has no box');
    }

    const x = handleBox.x + (handleBox.width / 2);
    const y = handleBox.y + (handleBox.height / 2);

    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await this.page.mouse.move(x, y + deltaY, { steps: 4 });
    await this.page.mouse.up();

    return this.page.evaluate(() => {
      const hot = (window as unknown as { hot: { countRows(): number; getRowHeight(row: number): number } }).hot;

      return hot.getRowHeight(hot.countRows() - 1);
    });
  }

  /**
   * Renders the grid again, one render per animation frame, and waits for the last draw to settle.
   *
   * @param {number} times The number of renders.
   */
  async renderAgain(times: number): Promise<void> {
    await this.page.evaluate(async(count) => {
      const hot = (window as unknown as { hot: { render(): void } }).hot;

      for (let render = 0; render < count; render++) {
        hot.render();
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      }
    }, times);
    await this.#settle();
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
      // The topmost copy: a cell of a frozen start column is drawn by the inline-start clone.
      const cell = hot.getCell(r, c, true).getBoundingClientRect();
      const line = (document.querySelector('.ht_clone_bottom tbody tr:first-child > td') as HTMLElement)
        .getBoundingClientRect().top;
      const x = cell.left + (cell.width / 2);
      const describe = (y: number) => {
        const el = document.elementFromPoint(x, y);
        const overlay = el?.closest('.handsontable')?.className.match(/ht_clone_\w+|ht_master/)?.[0] ?? 'none';

        return `${overlay}/${el?.tagName.toLowerCase()}.${el?.className ?? ''}`;
      };
      // A single cell has its handle on the `current` border, a range on the `area` border.
      const corner = Array.from(document.querySelectorAll('.wtBorder.current.corner, .wtBorder.area.corner'))
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
   * How far the master's custom border edge ends from its cell's bottom edge: `0` on the cell's own gridline,
   * `-1` one pixel higher, which is where the edge goes on a row whose bottom border the bottom clone covers.
   *
   * @param {number} row The visual row of the cell with the custom border.
   * @param {number} column The visual column of that cell.
   * @returns {Promise<number | null>} `null` while no custom border is drawn.
   */
  async customBottomBorderOffGridline(row: number, column: number): Promise<number | null> {
    return this.page.evaluate(([r, c]) => {
      const cell = (window as unknown as { hot: HotLike }).hot.getCell(r, c).getBoundingClientRect();
      // The selection was cleared, so the only drawn border of the master is the custom one.
      const edge = Array.from(document.querySelectorAll('.ht_master .wtBorder'))
        .filter(el => getComputedStyle(el).display !== 'none')
        .map(el => el.getBoundingClientRect())
        .find(rect => rect.height > 0 && rect.width > rect.height);

      return edge ? Math.round(edge.bottom - cell.bottom) : null;
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
