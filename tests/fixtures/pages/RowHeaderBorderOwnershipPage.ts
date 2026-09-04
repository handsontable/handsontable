import { type Page, type Locator, expect } from '@playwright/test';

/** The inline-start and inline-end border widths of one cell, in CSS pixels. */
export interface LogicalBorders {
  start: number;
  end: number;
}

/** The physical left and right border widths of one cell, in CSS pixels. */
export interface PhysicalBorders {
  left: number;
  right: number;
}

/** The sizes that must not change when the grid is scrolled horizontally. */
export interface HorizontalMetrics {
  rowHeaderWidth: number;
  rowHeaderColWidth: string;
  hiderWidth: string;
}

/**
 * Page Object for the row header border ownership fixture (issue #6673).
 *
 * Widths are read as `clientWidth`, which is the cell's CONTENT box - the number the issue is
 * about. `offsetWidth` and `getBoundingClientRect().width` both include the borders, so they read
 * the declared `colWidths` for every column whether the bug is present or not, which is why the
 * legacy `colWidth()` helper could never see it.
 */
export class RowHeaderBorderOwnershipPage {
  /** Every grid the fixture builds. `goto()` waits for all of them. */
  static readonly GRID_IDS = ['row-headers', 'frozen', 'rtl', 'nested', 'control', 'empty'];

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
   * The width every column of the fixture asks for.
   *
   * @returns {Promise<number>}
   */
  async declaredColumnWidth(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { htColWidth: number }).htColWidth);
  }

  /**
   * The content-box widths of the leading body cells of one overlay's first row.
   *
   * @param {string} testId The grid's test id.
   * @param {number} count How many cells to read.
   * @param {string} overlay The overlay to read from.
   * @returns {Promise<number[]>}
   */
  async bodyCellContentWidths(testId: string, count: number, overlay = '.ht_master'): Promise<number[]> {
    const widths = await this.grid(testId).locator(`${overlay} table.htCore > tbody > tr`).first()
      .locator('td')
      .evaluateAll(cells => cells.map(cell => cell.clientWidth));

    return widths.slice(0, count);
  }

  /**
   * The inline-start / inline-end border widths of a cell.
   *
   * @param {Locator} cell The cell to measure.
   * @returns {Promise<LogicalBorders>}
   */
  async borders(cell: Locator): Promise<LogicalBorders> {
    return cell.evaluate((element) => {
      const style = getComputedStyle(element);

      return {
        start: Number.parseFloat(style.borderInlineStartWidth),
        end: Number.parseFloat(style.borderInlineEndWidth),
      };
    });
  }

  /**
   * The physical left / right border widths of a cell. Used for the RTL case, where the point is
   * that the logical rules land on the mirrored physical side without a mirror rule.
   *
   * @param {Locator} cell The cell to measure.
   * @returns {Promise<PhysicalBorders>}
   */
  async physicalBorders(cell: Locator): Promise<PhysicalBorders> {
    return cell.evaluate((element) => {
      const style = getComputedStyle(element);

      return {
        left: Number.parseFloat(style.borderLeftWidth),
        right: Number.parseFloat(style.borderRightWidth),
      };
    });
  }

  /**
   * The first row header cell of a body row, taken from the clone that actually renders it.
   *
   * @param {string} testId The grid's test id.
   * @returns {Locator}
   */
  rowHeaderCell(testId: string): Locator {
    return this.grid(testId)
      .locator('.ht_clone_inline_start table.htCore > tbody > tr').first()
      .locator('th').first();
  }

  /**
   * The corner header cell - the one above the row headers.
   *
   * @param {string} testId The grid's test id.
   * @param {number} level Which header row to read, for nested headers.
   * @returns {Locator}
   */
  cornerHeaderCell(testId: string, level = 0): Locator {
    return this.grid(testId)
      .locator('.ht_clone_top_inline_start_corner table.htCore > thead > tr').nth(level)
      .locator('th').first();
  }

  /**
   * The header cell of the first data column.
   *
   * @param {string} testId The grid's test id.
   * @param {number} level Which header row to read, for nested headers.
   * @returns {Locator}
   */
  firstColumnHeaderCell(testId: string, level = 0): Locator {
    return this.grid(testId)
      .locator('.ht_clone_top table.htCore > thead > tr').nth(level)
      .locator('th').nth(1);
  }

  /**
   * The first body cell of one overlay's first row.
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
   * How many header rows the grid renders.
   *
   * @param {string} testId The grid's test id.
   * @returns {Promise<number>}
   */
  async headerLevelCount(testId: string): Promise<number> {
    return this.grid(testId).locator('.ht_clone_top table.htCore > thead > tr').count();
  }

  /**
   * The sizes that a horizontal scroll must leave alone: the rendered row header width, the inline
   * width written onto its `col` element, and the hider width that drives the scroll range.
   *
   * @param {string} testId The grid's test id.
   * @returns {Promise<HorizontalMetrics>}
   */
  async horizontalMetrics(testId: string): Promise<HorizontalMetrics> {
    const rowHeaderWidth = await this.rowHeaderCell(testId)
      .evaluate(th => th.getBoundingClientRect().width);
    const rowHeaderColWidth = await this.grid(testId)
      .locator('.ht_master table.htCore > colgroup > col.rowHeader')
      .evaluate(col => (col as HTMLElement).style.width);
    const hiderWidth = await this.grid(testId).locator('.ht_master .wtHider')
      .evaluate(hider => (hider as HTMLElement).style.width);

    return { rowHeaderWidth, rowHeaderColWidth, hiderWidth };
  }

  /**
   * Scrolls one grid horizontally and waits for the draw to land.
   *
   * The wait is on the master holder's own scroll offset leaving zero - a real DOM state rather
   * than a sleep, and the one condition that holds for every grid here. It is `not.toBe(0)`, not
   * `toBeGreaterThan(0)`: `setScrollPosition` negates the target in RTL, so an RTL holder's
   * `scrollLeft` goes NEGATIVE and a greater-than poll would sit until it timed out. The
   * `innerBorderInlineStart` class cannot serve as the signal either: the inline-start overlay only
   * toggles it when the grid has row headers and NO frozen columns, so it never appears on the
   * frozen grid. It is pinned separately instead.
   *
   * @param {string} name The grid's key in `window.grids`.
   * @param {string} testId The grid's test id.
   * @param {number} column The visual column index to snap to the inline start.
   */
  async scrollHorizontallyTo(name: string, testId: string, column: number): Promise<void> {
    await this.page.evaluate(
      ([gridName, col]) => (window as unknown as {
        scrollHorizontallyTo: (name: string, column: number) => void
      }).scrollHorizontallyTo(gridName as string, col as number),
      [name, column]
    );

    await expect.poll(() => this.grid(testId).locator('.ht_master .wtHolder')
      .evaluate(holder => holder.scrollLeft)).not.toBe(0);
  }

  /**
   * Whether `.ht_master` carries the given class.
   *
   * @param {string} testId The grid's test id.
   * @param {string} className The class to look for.
   * @returns {Promise<boolean>}
   */
  async masterHasClass(testId: string, className: string): Promise<boolean> {
    return this.grid(testId).locator('.ht_master')
      .evaluate((master, name) => master.classList.contains(name as string), className);
  }

  /**
   * The computed inline-end border color of a cell, as the browser resolves it. Read as a string so
   * the assertion can compare two elements against each other without naming a theme's palette:
   * `--ht-cell-horizontal-border-color` is transparent in `horizon` and equal to the frame color in
   * `main` and `classic`, so a literal would only ever hold on one theme.
   *
   * @param {Locator} cell The cell to measure.
   * @returns {Promise<string>}
   */
  async inlineEndBorderColor(cell: Locator): Promise<string> {
    return cell.evaluate(element => getComputedStyle(element).borderInlineEndColor);
  }

  /**
   * The computed inline-start border color of a cell. On a row header that side is always the grid's
   * outer frame, which makes it the reference for what a frame color looks like in this theme.
   *
   * @param {Locator} cell The cell to measure.
   * @returns {Promise<string>}
   */
  async inlineStartBorderColor(cell: Locator): Promise<string> {
    return cell.evaluate(element => getComputedStyle(element).borderInlineStartColor);
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
   * How far the selection's inline-start edge sits from the selected cell's own inline-start
   * boundary, in CSS pixels and in the inline direction (so RTL needs no separate expectation).
   *
   * `0` means the edge is drawn just inside the cell. `-1` means it straddles the gridline shared
   * with the inline-start neighbour, which is right for a cell that owns no start border of its own
   * and has another CELL beside it. Behind a row header it is wrong: the shared pixel is the last
   * pixel of the inline-start overlay, which paints at z-index 120 against the border layer's 10, so
   * the edge would be hidden behind the row header (#6673).
   *
   * The edge element is the vertical `.wtBorder` of the `current` layer nearest the cell's
   * inline-start boundary - identified by geometry rather than by DOM order, which `Border` owns.
   * The cell is addressed with `td:nth-of-type()`, not `nth-child()`: a body row starts with the
   * row-header `th`, so `nth-child` is off by one for every column.
   *
   * @param {string} testId The grid's test id.
   * @param {number} row The visual row index of the selected cell.
   * @param {number} column The visual column index of the selected cell.
   * @param {string} overlay The overlay whose border layer to read.
   * @returns {Promise<number>}
   */
  async selectionInlineStartEdgeOffset(
    testId: string,
    row: number,
    column: number,
    overlay = '.ht_master'
  ): Promise<number> {
    return this.grid(testId).locator(overlay).evaluate((element, args) => {
      const { row: r, column: c } = args as { row: number; column: number };
      const rtl = getComputedStyle(element).direction === 'rtl';
      const cell = element.querySelector<HTMLElement>(
        `table.htCore > tbody > tr:nth-child(${r + 1}) > td:nth-of-type(${c + 1})`
      );

      if (cell === null) {
        throw new Error(`No cell at row ${r}, column ${c} in this overlay`);
      }

      const cellRect = cell.getBoundingClientRect();
      const edges = [...element.querySelectorAll<HTMLElement>('.wtBorder.current')]
        .map(border => border.getBoundingClientRect())
        .filter(rect => rect.height > rect.width);

      if (edges.length === 0) {
        throw new Error('The selection drew no vertical edge');
      }

      const inlineStartOf = (rect: DOMRect) => (rtl ? -rect.right : rect.left);
      const nearest = edges
        .sort((a, b) => Math.abs(inlineStartOf(a) - inlineStartOf(cellRect))
          - Math.abs(inlineStartOf(b) - inlineStartOf(cellRect)))[0];

      return Math.round(inlineStartOf(nearest) - inlineStartOf(cellRect));
    }, { row, column });
  }

  /**
   * Whether the master's selection edges overlap the inline-start overlay, which paints above the
   * border layer and would therefore hide them.
   *
   * Only meaningful for a grid whose inline-start overlay renders the row-header column ALONE. With
   * `fixedColumnsStart` the overlay covers column 0 on purpose and draws its own copy of every edge,
   * so the master's edges are under it by design.
   *
   * @param {string} testId The grid's test id.
   * @returns {Promise<boolean>}
   */
  async selectionEdgeHiddenBehindRowHeader(testId: string): Promise<boolean> {
    return this.grid(testId).evaluate((element) => {
      const overlay = element.querySelector<HTMLElement>('.ht_clone_inline_start');
      const master = element.querySelector<HTMLElement>('.ht_master');

      if (overlay === null || master === null) {
        throw new Error('The grid renders no inline-start overlay');
      }

      const rtl = getComputedStyle(master).direction === 'rtl';

      const overlayRect = overlay.getBoundingClientRect();
      const edges = [...master.querySelectorAll<HTMLElement>('.wtBorder.current')]
        .map(border => border.getBoundingClientRect())
        .filter(rect => rect.height > rect.width);

      return rtl
        ? edges.some(rect => rect.right > overlayRect.left)
        : edges.some(rect => rect.left < overlayRect.right);
    });
  }

  /**
   * Navigate and wait for the grids to have rendered - a real DOM condition, never a sleep.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/row-header-border-ownership.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    for (const testId of RowHeaderBorderOwnershipPage.GRID_IDS) {
      await expect(this.grid(testId).locator('.ht_clone_top')).toBeVisible();
    }

    // The control grid has no row headers, so it draws no inline-start clone at all.
    for (const testId of ['row-headers', 'frozen', 'rtl', 'nested', 'empty']) {
      await expect(this.grid(testId).locator('.ht_clone_inline_start')).toBeVisible();
    }
  }
}
