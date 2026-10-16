import { type Page, type Locator, expect } from '@playwright/test';
import type { CellValue } from './windowTypes';
import { awaitBundle } from '../bundle';

type Point = { x: number, y: number };

/**
 * Page Object for the fill handle drag fixture (tests/fixtures/demo/fill-handle-drag.html).
 *
 * Every gesture goes through the real pointer (`page.mouse`): the defects this page drives
 * (DEV-140) live in how the Autofill plugin reads the pointer's position, and a dispatched event
 * would skip the browser's own `mouseover`/`mousemove` sequencing. Tests express intent
 * (`pressFillHandle`, `movePointerToCell`, `movePointerBelowGrid`); the coordinates and the
 * `window.hot` driving mechanics live here.
 */
export class FillHandleDragPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture and wait for the grid to have rendered - a real DOM condition, never
   * a sleep.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/fill-handle-drag.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Rebuild the grid with the fixture defaults (10 x 6 labelled cells, `fillHandle: true`) merged
   * with the given overrides.
   */
  async initGrid(overrides: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate(settings => window.initFillGrid(settings), overrides);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Rebuild the grid with `rows` x `cols` cells labelled like a spreadsheet (`A1`, `B1`, ...).
   */
  async initLabelledGrid(rows: number, cols: number, overrides: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate(([r, c, settings]) => window.initFillGrid({
      data: window.buildCellLabels(r as number, c as number),
      ...(settings as Record<string, unknown>),
    }), [rows, cols, overrides] as const);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The autofill fill handle, scoped to the master overlay. A single selected cell draws it on the
   * `current` border, a range on the `area` border; only one of them is visible at a time.
   */
  fillHandle(): Locator {
    return this.page.locator(
      '.ht_master .wtBorder.current.corner:visible, .ht_master .wtBorder.area.corner:visible'
    );
  }

  /** Select a cell range through the instance API. */
  async selectCells(fromRow: number, fromCol: number, toRow = fromRow, toCol = fromCol): Promise<void> {
    await this.page.evaluate(range => window.hot.selectCells([range]), [fromRow, fromCol, toRow, toCol]);
    await expect(this.fillHandle()).toBeVisible();
  }

  /** Press the fill handle's center with the real pointer and keep the button held. */
  async pressFillHandle(): Promise<Point> {
    const center = await this.#center(this.fillHandle());

    await this.page.mouse.move(center.x, center.y);
    await this.page.mouse.down();

    return center;
  }

  /**
   * Move the held pointer to the center of a cell. One `steps` means a single jump, the way a fast
   * flick reaches the browser; more steps interpolate the path.
   */
  async movePointerToCell(row: number, col: number, steps = 1): Promise<void> {
    const center = await this.#center(this.cell(row, col));

    await this.page.mouse.move(center.x, center.y, { steps });
  }

  /**
   * Move the held pointer below the grid's table. `inline` places it horizontally: `'start'` and
   * `'end'` sit `offset` pixels past the table's inline-start and inline-end edges (outside the
   * table), and `'handle'` keeps the x of the point the drag started from.
   */
  async movePointerBelowGrid(
    from: Point, below: number, inline: 'handle' | 'start' | 'end', offset = 0,
  ): Promise<void> {
    const table = await this.page.evaluate(() => {
      const { left, right, bottom } = window.hot.table.getBoundingClientRect();

      return { left, right, bottom, isRtl: window.hot.isRtl() };
    });
    const inlineStart = table.isRtl ? table.right + offset : table.left - offset;
    const inlineEnd = table.isRtl ? table.left - offset : table.right + offset;
    const xByPlacement = { handle: from.x, start: inlineStart, end: inlineEnd };

    await this.page.mouse.move(xByPlacement[inline], table.bottom + below);
  }

  /**
   * Move the held pointer one pixel up and toward the inline start from a point - a press jitter.
   * The fill handle sits on the selected cell's bottom-end corner, so this keeps the pointer over
   * the selected cell; a jitter the other way would land in the next cell and count as a drag step.
   */
  async jitterPointer(from: Point): Promise<void> {
    const isRtl = await this.page.evaluate(() => window.hot.isRtl());

    await this.page.mouse.move(from.x + (isRtl ? 1 : -1), from.y - 1);
  }

  /**
   * Move the held pointer below the grid's table, horizontally centered on a column (by visual
   * index) - within the table's width, so only the vertical axis leaves the table.
   */
  async movePointerBelowColumn(col: number, below: number): Promise<void> {
    const center = await this.#center(this.cell(0, col));
    const bottom = await this.page.evaluate(() => window.hot.table.getBoundingClientRect().bottom);

    await this.page.mouse.move(center.x, bottom + below);
  }

  /**
   * Move the held pointer below the grid's visible area (its root element), keeping the x of the
   * point the drag started from. Unlike `movePointerBelowGrid()`, this measures the box the user
   * sees: a grid with a fixed height clips its table, whose own box ends further down.
   */
  async movePointerBelowGridRoot(from: Point, below: number): Promise<void> {
    const bottom = await this.page.evaluate(() => window.hot.rootElement.getBoundingClientRect().bottom);

    await this.page.mouse.move(from.x, bottom + below);
  }

  /**
   * Scroll a fixed-height grid to its last row and wait until that row is rendered.
   */
  async scrollGridToLastRow(): Promise<void> {
    const lastRow = await this.page.evaluate(() => {
      const row = window.hot.countRows() - 1;

      window.hot.scrollViewportTo({ row, col: 0 });

      return row;
    });

    await expect(this.cell(lastRow, 0)).toBeVisible();
  }

  /**
   * Scroll the page back to its top and wait until it is there, so the next gesture measures the
   * grid where it will stay (a wheel scroll can still be settling, notably in WebKit).
   */
  async scrollPageToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => this.page.evaluate(() => window.scrollY)).toBe(0);
  }

  /**
   * Scroll the page with the mouse wheel, leaving the pointer where it is, and wait until the
   * page has scrolled.
   */
  async scrollPageWithWheel(deltaY: number): Promise<void> {
    const before = await this.page.evaluate(() => window.scrollY);

    await this.page.mouse.wheel(0, deltaY);
    await expect.poll(() => this.page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
  }

  /** Release the held pointer. */
  async releasePointer(): Promise<void> {
    await this.page.mouse.up();
  }

  /** The value of a cell, by visual coordinates. */
  async cellValue(row: number, col: number): Promise<CellValue> {
    return this.page.evaluate(([r, c]) => window.hot.getDataAtCell(r, c), [row, col]);
  }

  /** The values of a column, by visual index. */
  async columnValues(col: number): Promise<CellValue[]> {
    return this.page.evaluate(c => window.hot.getDataAtCol(c), col);
  }

  /** The visual index of the last row the grid renders (past its viewport included). */
  async lastRenderedRow(): Promise<number | null> {
    return this.page.evaluate(() => window.hot.getLastRenderedVisibleRow());
  }

  /** The values of every cell, by visual coordinates. */
  async gridValues(): Promise<CellValue[][]> {
    return this.page.evaluate(() => window.hot.getData());
  }

  /** The values of a row, by visual index. */
  async rowValues(row: number): Promise<CellValue[]> {
    return this.page.evaluate(r => window.hot.getDataAtRow(r), row);
  }

  /** The number of rows the grid holds. */
  async countRows(): Promise<number> {
    return this.page.evaluate(() => window.hot.countRows());
  }

  /** How many rows the grid created since it was built (the `afterCreateRow` calls). */
  async createdRowCount(): Promise<number> {
    return this.page.evaluate(() => window.createdRowLog.length);
  }

  /** The visual corners of the dashed fill preview, or `null` when none is drawn. */
  async fillPreviewCorners(): Promise<[number, number, number, number] | null> {
    return this.page.evaluate(() => window.fillPreviewCorners());
  }

  /**
   * Whether the Autofill plugin still has a row insertion scheduled. It is cleared when the
   * insertion timer runs, whether or not a row could be inserted.
   */
  async isRowInsertPending(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.getPlugin('autofill').addingStarted);
  }

  /** Undo the last action through the UndoRedo plugin. */
  async undo(): Promise<void> {
    await this.page.evaluate(() => window.hot.getPlugin('undoRedo').undo());
  }

  /**
   * Run the Autofill plugin's row insertion timer (200 ms) to completion on the page's fake clock.
   * Requires `page.clock.install()` before `goto()`; the spec decides when the insertion runs, so
   * no test depends on how fast the release follows the move.
   */
  async runRowInsertionTimer(): Promise<void> {
    await this.page.clock.runFor(250);
  }

  /**
   * The center of an element's box. The fixture's grid is not scrolled by any test here, so the
   * box is the pressable area.
   */
  async #center(element: Locator): Promise<Point> {
    const box = await element.boundingBox();

    if (!box) {
      throw new Error('The target element is not rendered.');
    }

    return { x: box.x + (box.width / 2), y: box.y + (box.height / 2) };
  }
}
