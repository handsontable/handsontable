import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/** The block-start and block-end border widths of one cell, in CSS pixels. */
export interface BlockBorders {
  top: number;
  bottom: number;
}

/** The sizes that must not change when the grid is scrolled vertically. */
export interface VerticalMetrics {
  columnHeaderHeight: number;
  viewportHeight: number;
  hiderHeight: string;
  scrollRange: number;
}

/**
 * Page Object for the column header border ownership fixture (DEV-2786), the row-axis twin of
 * `RowHeaderBorderOwnershipPage`.
 *
 * Heights are read as `clientHeight` where the point is a cell's CONTENT box and as
 * `getBoundingClientRect().height` where it is the space the element occupies. The distinction
 * matters: with `box-sizing: border-box` a row that draws one border more has the same outer height
 * only when something else gave a pixel up, which is exactly what this change moved.
 */
export class ColumnHeaderBorderOwnershipPage {
  /** Every grid the fixture builds, keyed by test id. `goto()` waits for all of them. */
  static readonly GRID_IDS = [
    'column-headers', 'frozen', 'frozen-bottom', 'nested', 'auto-row-size', 'control', 'empty',
    'multi-row-headers', 'prevent-overflow',
  ];

  /** The grids that render a column header, so their head row owns the seam below it. */
  static readonly HEADER_GRID_IDS = [
    'column-headers', 'frozen', 'frozen-bottom', 'nested', 'auto-row-size', 'multi-row-headers',
    'prevent-overflow',
  ];

  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * The grid container carrying the given test id.
   *
   * @param {string} testId The container's test id.
   * @returns {Locator}
   */
  grid(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * The last head row's `th` for the first data column, taken from the clone that renders it.
   *
   * @param {string} testId The grid's test id.
   * @returns {Locator}
   */
  lastHeadRowCell(testId: string): Locator {
    return this.grid(testId)
      .locator('.ht_clone_top table.htCore > thead > tr').last()
      .locator('th').nth(1);
  }

  /**
   * The first body cell of one overlay's first rendered row.
   *
   * @param {string} testId The grid's test id.
   * @param {string} overlay The overlay to read from.
   * @returns {Locator}
   */
  firstBodyCell(testId: string, overlay = '.ht_master'): Locator {
    return this.grid(testId)
      .locator(`${overlay} table.htCore > tbody > tr`).first()
      .locator('td').first();
  }

  /**
   * The block-start / block-end border widths of a cell.
   *
   * @param {Locator} cell The cell to measure.
   * @returns {Promise<BlockBorders>}
   */
  async borders(cell: Locator): Promise<BlockBorders> {
    return cell.evaluate((element) => {
      const style = getComputedStyle(element);

      return {
        top: Number.parseFloat(style.borderTopWidth),
        bottom: Number.parseFloat(style.borderBottomWidth),
      };
    });
  }

  /**
   * The outer heights of the leading body rows of one overlay, in render order.
   *
   * @param {string} testId The grid's test id.
   * @param {number} count How many rows to read.
   * @param {string} overlay The overlay to read from.
   * @returns {Promise<number[]>}
   */
  async bodyRowHeights(testId: string, count: number, overlay = '.ht_master'): Promise<number[]> {
    const heights = await this.grid(testId).locator(`${overlay} table.htCore > tbody > tr`)
      .evaluateAll(rows => rows.map(row => Math.round(row.getBoundingClientRect().height)));

    return heights.slice(0, count);
  }

  /**
   * The sizes that a vertical scroll must leave alone: the header height the engine caches (it is
   * re-measured from the DOM on every full draw), the viewport height derived from it, the hider
   * height that drives the scroll range, and the range itself.
   *
   * @param {string} testId The grid's test id.
   * @param {string} name The grid's key in `window.grids`.
   * @returns {Promise<VerticalMetrics>}
   */
  async verticalMetrics(testId: string, name: string): Promise<VerticalMetrics> {
    const engine = await this.page.evaluate((gridName) => {
      const wt = (window as unknown as {
        grids: Record<string, { view: { _wt: {
          wtViewport: { getColumnHeaderHeight: () => number; getViewportHeight: () => number };
          wtTable: { hider: HTMLElement };
        } } }>
      }).grids[gridName as string].view._wt;

      return {
        columnHeaderHeight: wt.wtViewport.getColumnHeaderHeight(),
        viewportHeight: wt.wtViewport.getViewportHeight(),
        hiderHeight: wt.wtTable.hider.style.height,
      };
    }, name);
    const scrollRange = await this.grid(testId).locator('.ht_master .wtHolder')
      .evaluate(holder => holder.scrollHeight - holder.clientHeight);

    return { ...engine, scrollRange };
  }

  /**
   * Scrolls one grid vertically and waits for the draw to land.
   *
   * The wait is on the master holder's own scroll offset leaving zero - a real DOM state rather than
   * a sleep. `innerBorderTop` cannot serve as the signal: it is stamped for backward compatibility
   * only, and it never toggles at all on a grid with frozen top rows or `preventOverflow`.
   *
   * @param {string} name The grid's key in `window.grids`.
   * @param {string} testId The grid's test id.
   * @param {number} row The visual row index to snap to the top.
   */
  async scrollVerticallyTo(name: string, testId: string, row: number): Promise<void> {
    await this.page.evaluate(
      ([gridName, r]) => (window as unknown as {
        scrollVerticallyTo: (name: string, row: number) => void
      }).scrollVerticallyTo(gridName as string, r as number),
      [name, row]
    );

    // End on the RENDER state, never on `scrollTop`: the offset is applied synchronously while the
    // redraw it triggers is coalesced into a later animation frame, so a settled offset does not
    // mean the band the assertions read has moved yet.
    await expect.poll(() => this.#firstRenderedRow(name)).toBeGreaterThan(0);
  }

  /**
   * Scrolls one grid to its very last row, snapped to the viewport's bottom edge.
   *
   * @param {string} name The grid's key in `window.grids`.
   * @param {string} testId The grid's test id.
   */
  async scrollToLastRow(name: string, testId: string): Promise<void> {
    await this.page.evaluate((gridName) => {
      const hot = (window as unknown as {
        grids: Record<string, {
          countRows: () => number;
          scrollViewportTo: (options: { row: number; verticalSnap: string }) => void;
        }>
      }).grids[gridName as string];

      hot.scrollViewportTo({ row: hot.countRows() - 1, verticalSnap: 'bottom' });
    }, name);

    // Same rule as above: the end state is the band holding the last row, not the scroll offset.
    await expect.poll(() => this.#lastRowIsRendered(name)).toBe(true);
  }

  /**
   * The lowest row index the named grid's master renders.
   *
   * @param {string} name The grid's key in `window.grids`.
   * @returns {Promise<number>}
   */
  async #firstRenderedRow(name: string): Promise<number> {
    return this.page.evaluate(gridName => (window as any)
      .grids[gridName].view._wt.wtTable.getFirstRenderedRow(), name);
  }

  /**
   * Whether the named grid's master renders its very last row.
   *
   * @param {string} name The grid's key in `window.grids`.
   * @returns {Promise<boolean>}
   */
  async #lastRowIsRendered(name: string): Promise<boolean> {
    return this.page.evaluate((gridName) => {
      const hot = (window as any).grids[gridName];

      return hot.view._wt.wtTable.getLastRenderedRow() === hot.countRows() - 1;
    }, name);
  }

  /**
   * The gap in CSS pixels between the last rendered row's bottom edge and the master holder's, once
   * the grid is scrolled to its end. `0` means the last row is flush.
   *
   * @param {string} testId The grid's test id.
   * @returns {Promise<number>}
   */
  async lastRowBottomGap(testId: string): Promise<number> {
    return this.grid(testId).locator('.ht_master').evaluate((master) => {
      const holder = master.querySelector<HTMLElement>('.wtHolder');
      const rows = master.querySelectorAll<HTMLElement>('table.htCore > tbody > tr');

      if (holder === null || rows.length === 0) {
        throw new Error('The master rendered no rows');
      }

      return Math.round(
        holder.getBoundingClientRect().bottom - rows[rows.length - 1].getBoundingClientRect().bottom
      );
    });
  }

  /**
   * How far the selection's top edge sits from the selected cell's own top boundary, in CSS pixels.
   *
   * `0` means the edge is drawn just inside the cell. `-1` means it straddles the gridline shared
   * with the row above, which is right for a cell whose neighbour is another CELL. Under a column
   * header it is wrong: the shared pixel is the last pixel of the top overlay, which paints at
   * z-index 160 against the border layer's 10, so half the edge would be hidden behind the header
   * (the row-axis twin of the `standsBehindRowHeader` case in #6673).
   *
   * The edge element is the horizontal `.wtBorder` of the `current` layer nearest the cell's top
   * boundary - identified by geometry rather than by DOM order, which `Border` owns.
   *
   * @param {string} testId The grid's test id.
   * @param {number} row The rendered row index of the selected cell within this overlay.
   * @param {number} column The visual column index of the selected cell.
   * @param {string} overlay The overlay whose border layer to read.
   * @returns {Promise<number>}
   */
  async selectionTopEdgeOffset(
    testId: string,
    row: number,
    column: number,
    overlay = '.ht_master'
  ): Promise<number> {
    return this.grid(testId).locator(overlay).evaluate((element, args) => {
      const { row: r, column: c } = args as { row: number; column: number };
      const cell = element.querySelector<HTMLElement>(
        `table.htCore > tbody > tr:nth-child(${r + 1}) > td:nth-of-type(${c + 1})`
      );

      if (cell === null) {
        throw new Error(`No cell at rendered row ${r}, column ${c} in this overlay`);
      }

      const cellRect = cell.getBoundingClientRect();
      const edges = [...element.querySelectorAll<HTMLElement>('.wtBorder.current')]
        .map(border => border.getBoundingClientRect())
        .filter(rect => rect.width > rect.height);

      if (edges.length === 0) {
        throw new Error('The selection drew no horizontal edge');
      }

      const nearest = edges
        .sort((a, b) => Math.abs(a.top - cellRect.top) - Math.abs(b.top - cellRect.top))[0];

      return Math.round(nearest.top - cellRect.top);
    }, { row, column });
  }

  /**
   * Whether the master's selection edges reach above the top overlay's bottom edge, where the
   * overlay paints over them.
   *
   * @param {string} testId The grid's test id.
   * @returns {Promise<boolean>}
   */
  async selectionEdgeHiddenBehindColumnHeader(testId: string): Promise<boolean> {
    return this.grid(testId).evaluate((element) => {
      const overlay = element.querySelector<HTMLElement>('.ht_clone_top .wtHolder');
      const master = element.querySelector<HTMLElement>('.ht_master');

      if (overlay === null || master === null) {
        throw new Error('The grid renders no top overlay');
      }

      const overlayBottom = overlay.getBoundingClientRect().bottom;

      return [...master.querySelectorAll<HTMLElement>('.wtBorder.current')]
        .map(border => border.getBoundingClientRect())
        .filter(rect => rect.width > rect.height)
        .some(rect => rect.top < overlayBottom);
    });
  }

  /**
   * The corner cells of the last head row, as the corner overlay renders them - the cells whose
   * `border-bottom` is the gridline above the first body row's row headers, and therefore where the
   * active-row accent has to be drawn.
   *
   * @param {string} testId The grid's test id.
   * @returns {Locator}
   */
  cornerCells(testId: string): Locator {
    return this.grid(testId)
      .locator('.ht_clone_top_inline_start_corner table.htCore > thead > tr').last()
      .locator('th');
  }

  /**
   * The corner cells the selection manager tagged as carrying the active row's accent.
   *
   * The class, not the color, is what separates a tagged corner from an untagged one on every theme:
   * `--ht-header-active-border-color` resolves to the plain border color in `classic`, so a color
   * comparison cannot tell the two apart there and a negative control built on one passes vacuously.
   *
   * @param {string} testId The grid's test id.
   * @returns {Locator} The tagged corner cells.
   */
  taggedCornerCells(testId: string): Locator {
    return this.cornerCells(testId).and(this.page.locator('.ht__active_highlight-row-seam-top'));
  }

  /**
   * The computed bottom border color of a cell.
   *
   * @param {Locator} cell The cell to measure.
   * @returns {Promise<string>}
   */
  async bottomBorderColor(cell: Locator): Promise<string> {
    return cell.evaluate(element => getComputedStyle(element).borderBottomColor);
  }

  /**
   * The active-header accent color this theme resolves `--ht-header-active-border-color` to, read off
   * a cell that certainly carries it: the bottom border of the row header above an active one, which
   * the `-prev-row` rule colors and which this change does not touch.
   *
   * Read from the DOM rather than named as a literal, the same reason
   * `RowHeaderBorderOwnershipPage#inlineEndBorderColor` is.
   *
   * @param {string} testId The grid's test id.
   * @returns {Promise<string>}
   */
  async activeAccentColor(testId: string): Promise<string> {
    return this.grid(testId)
      .locator('.ht_clone_inline_start table.htCore > tbody > tr > th.ht__active_highlight-prev-row')
      .first()
      .evaluate(element => getComputedStyle(element).borderBottomColor);
  }

  /**
   * Selects a whole row through the grid's own API, which is what marks its row header active.
   *
   * @param {string} name The grid's key in `window.grids`.
   * @param {number} row The visual row index.
   */
  async selectRow(name: string, row: number): Promise<void> {
    await this.page.evaluate(
      ([gridName, r]) => (window as unknown as {
        grids: Record<string, { selectRows: (row: number) => void }>
      }).grids[gridName as string].selectRows(r as number),
      [name, row]
    );
  }

  /**
   * Selects one cell through the grid's own API, so no click can land on a renderer's indicator.
   *
   * @param {string} name The grid's key in `window.grids`.
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   */
  async selectCell(name: string, row: number, column: number): Promise<void> {
    await this.page.evaluate(
      ([gridName, r, c]) => (window as unknown as {
        grids: Record<string, { selectCell: (row: number, column: number) => void }>
      }).grids[gridName as string].selectCell(r as number, c as number),
      [name, row, column]
    );
  }

  /**
   * How many oversized-row records the engine holds. A grid of uniform rows must hold none: a
   * measurement that disagrees with the configured height by a pixel would show up here first, and it
   * would cost a row-height cache invalidation on every draw.
   *
   * @param {string} name The grid's key in `window.grids`.
   * @returns {Promise<number>}
   */
  async oversizedRowCount(name: string): Promise<number> {
    return this.page.evaluate((gridName) => {
      const wt = (window as unknown as {
        grids: Record<string, { view: { _wt: { wtViewport: { oversizedRows: object } } } }>
      }).grids[gridName as string].view._wt;

      return Object.keys(wt.wtViewport.oversizedRows).length;
    }, name);
  }

  /**
   * What the grid predicts the first rendered row's height to be, next to what it actually renders.
   *
   * The prediction is `StylesHandler#getDefaultRowHeight(row)`, which every row-height sum in the
   * core reads. It has to match the DOM, and the two can only be compared from the same place.
   *
   * @param {string} testId The grid's test id.
   * @param {string} name The grid's key in `window.grids`.
   * @returns {Promise<{ predictedFirst: number, predictedSecond: number, renderedFirst: number,
   *   renderedSecond: number, headerRowsRendered: number, hasColHeadersSetting: boolean }>}
   */
  async firstRowHeightAgreement(testId: string, name: string) {
    const rendered = await this.bodyRowHeights(testId, 2);
    const predicted = await this.page.evaluate((gridName) => {
      const hot = (window as unknown as {
        grids: Record<string, {
          hasColHeaders: () => boolean,
          view: { getColumnHeadersCount: () => number, getFirstRenderedVisibleRow: () => number },
          stylesHandler: { getDefaultRowHeight: (row?: number) => number },
        }>
      }).grids[gridName as string];
      const first = hot.view.getFirstRenderedVisibleRow();

      return {
        predictedFirst: Math.round(hot.stylesHandler.getDefaultRowHeight(first)),
        predictedSecond: Math.round(hot.stylesHandler.getDefaultRowHeight(first + 1)),
        headerRowsRendered: hot.view.getColumnHeadersCount(),
        hasColHeadersSetting: hot.hasColHeaders(),
      };
    }, name);

    return { ...predicted, renderedFirst: rendered[0], renderedSecond: rendered[1] };
  }

  /**
   * Navigate and wait for the grids to have rendered - a real DOM condition, never a sleep.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/column-header-border-ownership.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    // The bundle first, or a leg fails pointing at a missing overlay class instead of the real
    // cause. The helper owns the `waitForFunction`-over-`expect` choice and the polling interval.
    await awaitBundle(this.page);

    // The control grid has no column headers, so its top clone renders nothing and stays collapsed.
    for (const testId of ColumnHeaderBorderOwnershipPage.HEADER_GRID_IDS) {
      await expect(this.grid(testId).locator('.ht_clone_top')).toBeVisible();
    }

    for (const testId of ColumnHeaderBorderOwnershipPage.GRID_IDS) {
      await expect(this.grid(testId).locator('.ht_master')).toBeVisible();
    }
  }
}
