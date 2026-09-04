import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the "exact row heights" Walkontable fixture.
 *
 * Every row of the fixture grid is given a provided height shorter than its content. The
 * engine's `rowHeightMode` decides whether that height is a floor (`min`) or the rendered height
 * (`exact`). The master table and the inline-start overlay render different column ranges of the
 * SAME rows, so the row helpers take the table they should answer for.
 */
export class ExactRowHeightsPage {
  /** The provided height of every row, matching the fixture's default. */
  static readonly ROW_HEIGHT = 10;
  /** The row whose cell in a scrollable column wraps onto three lines. */
  static readonly MULTILINE_ROW = 3;
  /** The column holding the three-line text. */
  static readonly MULTILINE_COLUMN = 4;
  /** The row holding a 60px block in the frozen column. */
  static readonly TALL_FROZEN_ROW = 5;
  /** The checkbox column. */
  static readonly CHECKBOX_COLUMN = 1;
  /** The autocomplete column. */
  static readonly AUTOCOMPLETE_COLUMN = 2;

  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly master: Locator;
  readonly inlineStartOverlay: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.master = this.grid.locator('.ht_master');
    this.inlineStartOverlay = this.grid.locator('.ht_clone_inline_start');
  }

  /**
   * Navigate and wait for the grid to render (a real DOM condition, no sleep).
   *
   * @param {object} [options] Fixture options. `mode` is the engine's row-height mode the fixture
   *   starts in; `rowHeight` the provided height of every row.
   */
  async goto(options: {
    mode?: 'min' | 'exact',
    rowHeight?: number,
    /** `0` drops the `modifyRowHeight` hook; pair it with `rowHeights` for the uniform source. */
    hook?: 0 | 1,
    /** The `rowHeights` OPTION (clamped to the theme default by Handsontable — keep it above 37). */
    rowHeights?: number,
    rowHeaders?: 0 | 1,
    fixedColumnsStart?: number,
    rows?: number,
  } = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    Object.entries(options).forEach(([key, value]) => params.set(key, String(value)));

    await this.page.goto(`/tests/fixtures/demo/walkontable/exact-row-heights.html?${params}`);
    await this.page.waitForFunction(() => 'Handsontable' in window);
    await expect(this.master).toBeVisible();
    await expect(this.row(this.master, 1)).toBeAttached();
  }

  /** Flip the engine's row-height mode at runtime and redraw. */
  async setMode(mode: 'min' | 'exact'): Promise<void> {
    await this.page.evaluate(value => (window as unknown as {
      setRowHeightMode: (mode: string) => void
    }).setRowHeightMode(value), mode);
  }

  /** One row of one table (master or an overlay clone). */
  row(table: Locator, row: number): Locator {
    return table.locator('tbody').getByTestId(`row-${row}`);
  }

  /** The rendered height of one row in one table. */
  async rowHeight(table: Locator, row: number): Promise<number> {
    const box = await this.row(table, row).boundingBox();

    return box?.height ?? 0;
  }

  /**
   * The vertical offset of a row relative to its own table's body, so the master
   * and a clone are comparable even though they sit at different page positions.
   */
  async rowOffsetWithinTable(table: Locator, row: number): Promise<number> {
    const rowBox = await this.row(table, row).boundingBox();
    const bodyBox = await table.locator('tbody').boundingBox();

    return (rowBox?.y ?? 0) - (bodyBox?.y ?? 0);
  }

  /** The distinct rendered heights of every body row the master currently renders. */
  async distinctMasterRowHeights(): Promise<number[]> {
    return this.master.locator('tbody > tr').evaluateAll(rows => Array.from(new Set(
      rows.map(row => Math.round(row.getBoundingClientRect().height)),
    )).sort((a, b) => a - b));
  }

  /** One data cell of the master, by the fixture's row/column numbering. */
  cell(row: number, column: number): Locator {
    return this.row(this.master, row).locator(`td:nth-child(${column + 2})`);
  }

  /** The row header cell of one table's row. */
  rowHeader(table: Locator, row: number): Locator {
    return this.row(table, row).locator('th');
  }

  /** How many clipping wrappers the whole grid holds, across every table. */
  async clipWrapperCount(): Promise<number> {
    return this.grid.locator('.htCellClip').count();
  }

  /**
   * Whether a cell's content is clipped: its wrapper holds more than it shows. `false` when the
   * cell has no wrapper at all.
   */
  async isContentClipped(row: number, column: number): Promise<boolean> {
    return this.cell(row, column).evaluate((td) => {
      const wrapper = td.querySelector('.htCellClip');

      return wrapper !== null && wrapper.scrollHeight > wrapper.clientHeight;
    });
  }

  /** The master's scrollable holder. */
  holder(): Locator {
    return this.master.locator('.wtHolder');
  }

  /** The master's scrollable content height — what the vertical scrollbar is sized from. */
  async masterScrollHeight(): Promise<number> {
    return this.holder().evaluate(el => el.scrollHeight);
  }

  /** Scroll the master viewport vertically and wait for the scroll position to land. */
  async scrollVerticallyTo(top: number): Promise<void> {
    await this.holder().evaluate((el, value) => {
      el.scrollTop = value;
    }, top);

    if (top === 0) {
      await expect.poll(async () => this.holder().evaluate(el => el.scrollTop)).toBe(0);
    } else {
      await expect.poll(async () => this.holder().evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    }
  }

  /** Scroll the master viewport horizontally and let the overlays sync. */
  async scrollHorizontallyTo(left: number): Promise<void> {
    await this.holder().evaluate((el, value) => {
      el.scrollLeft = value;
    }, left);
    await expect.poll(async () => this.holder().evaluate(el => el.scrollLeft)).toBe(left);
  }

  /**
   * The lowest column index the master actually renders, read from the rendered
   * cell text (`R<row>C<col>`, 1-based) of a text cell in the first body row.
   */
  async masterFirstRenderedColumn(): Promise<number> {
    const text = await this.master.locator('tbody > tr').first().locator('td').last().innerText();

    return Number(/C(\d+)$/.exec(text.trim())?.[1] ?? 0) - 1;
  }

  /**
   * Whether the engine sees a UNIFORM row-size source — the handle `markOversizedRows` reads for
   * its uniform-band shortcut. `false` whenever a `modifyRowHeight` hook is registered.
   */
  async isRowSizeSourceUniform(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { view: { _wt: { wtTable: { deps: { rowSizeSource: { isUniform: () => boolean } } } } } }
    }).hot.view._wt.wtTable.deps.rowSizeSource.isUniform());
  }

  /** How many times `renders` full draws invalidate the row-height cache. */
  async countRowCacheInvalidations(renders: number): Promise<number> {
    return this.page.evaluate(count => (window as unknown as {
      countRowCacheInvalidations: (renders: number) => number
    }).countRowCacheInvalidations(count), renders);
  }
}
