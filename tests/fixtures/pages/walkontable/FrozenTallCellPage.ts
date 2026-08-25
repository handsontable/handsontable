import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the "tall cell in a frozen column" Walkontable fixture.
 *
 * The master table and the inline-start overlay render different column ranges
 * of the SAME rows, so everything here is expressed per table: give it the table
 * you mean, and it answers for that table's copy of the row.
 */
export class FrozenTallCellPage {
  /** The row holding the tall block, and a couple of rows below it. */
  static readonly TALL_ROW = 2;
  /** The row made tall by a cell in a SCROLLABLE column — one the master measures by itself. */
  static readonly SCROLLABLE_TALL_ROW = 4;

  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly master: Locator;
  readonly inlineStartOverlay: Locator;
  readonly topOverlay: Locator;
  readonly topInlineStartCorner: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.master = this.grid.locator('.ht_master');
    this.inlineStartOverlay = this.grid.locator('.ht_clone_inline_start');
    this.topOverlay = this.grid.locator('.ht_clone_top');
    this.topInlineStartCorner = this.grid.locator('.ht_clone_top_inline_start_corner');
  }

  /**
   * Navigate and wait for the grid to render (a real DOM condition, no sleep).
   *
   * @param {object} [options] Fixture options. `fixedRowsTop` and `tallRow` together move the tall
   *   frozen cell into a frozen TOP row, which only the corner overlay renders once scrolled.
   *   `scrollableTallRow` and `scrollableTallHeight` place the second tall cell, the one in a
   *   column the master renders itself; raising the height above the frozen block's 60px makes the
   *   scrollable side the taller of the two.
   */
  async goto(options: {
    fixedRowsTop?: number,
    tallRow?: number,
    scrollableTallRow?: number,
    scrollableTallHeight?: number,
    rows?: number,
    fixedRowsBottom?: number,
    mergeInFrozen?: 0 | 1,
    rowHeaders?: 0 | 1,
    rowHeights?: number,
    mergeRow?: number,
  } = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    Object.entries(options).forEach(([key, value]) => params.set(key, String(value)));

    await this.page.goto(`/tests/fixtures/demo/walkontable/frozen-tall-cell.html?${params}`);
    await expect(this.master).toBeVisible();
    await expect(this.inlineStartOverlay).toBeVisible();
  }

  /**
   * Scroll the master viewport down and let the overlays sync. The exact offset is not asserted —
   * the browser clamps it to the content height, which differs per theme. Callers that depend on
   * having scrolled far enough should assert that, e.g. via `masterFirstRenderedRow`.
   */
  async scrollVerticallyTo(top: number): Promise<void> {
    await this.holder().evaluate((el, value) => {
      el.scrollTop = value;
    }, top);

    // Scrolling back to the very top lands exactly; anything else is clamped to the content height,
    // so only the fact that it moved can be asserted.
    if (top === 0) {
      await expect.poll(async () => this.holder().evaluate(el => el.scrollTop)).toBe(0);
    } else {
      await expect.poll(async () => this.holder().evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    }
  }

  /**
   * Scroll so `row` sits at the top of the viewport. Unlike a raw pixel offset this survives the
   * per-theme row heights, which is what a caller needs when it cares about WHICH row the master's
   * band starts at. The band typically starts one row above the one snapped to the top.
   */
  async scrollToRowAtTop(row: number): Promise<void> {
    await this.page.evaluate(target => (window as unknown as {
      hot: { scrollViewportTo: (options: object) => void }
    }).hot.scrollViewportTo({ row: target, verticalSnap: 'top' }), row);
    await expect.poll(async () => this.holder().evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  }

  /** The lowest row index the master actually renders, read from its first body row's test id. */
  async masterFirstRenderedRow(): Promise<number> {
    const testId = await this.master.locator('tbody > tr').first().getAttribute('data-testid');

    return Number(testId?.replace('row-', '') ?? -1);
  }

  /** Turn a tall cell in a SCROLLABLE column on or off — one the master measures by itself. */
  async setTallScrollableCell(value: boolean): Promise<void> {
    await this.page.evaluate(v => (window as unknown as {
      setTallScrollableCell: (on: boolean) => void
    }).setTallScrollableCell(v), value);
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
   * The height of a normal, single-line row. Row 0 is deliberately not used as the
   * baseline: the rendered band's first row carries an extra 1px top border.
   */
  async normalRowHeight(): Promise<number> {
    return this.rowHeight(this.master, 1);
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

  /**
   * The lowest column index the master actually renders, read from the rendered
   * cell text (`R<row>C<col>`, 1-based) of the first body cell.
   */
  async masterFirstRenderedColumn(): Promise<number> {
    const text = await this.master.locator('tbody td').first().innerText();

    return Number(/C(\d+)$/.exec(text.trim())?.[1] ?? 0) - 1;
  }

  /** The master's scrollable holder. */
  holder(): Locator {
    return this.master.locator('.wtHolder');
  }

  /** Scroll the master viewport horizontally and let the overlays sync. */
  async scrollHorizontallyTo(left: number): Promise<void> {
    await this.holder().evaluate((el, value) => {
      el.scrollLeft = value;
    }, left);
    await expect.poll(async () => this.holder().evaluate(el => el.scrollLeft)).toBe(left);
  }

  /**
   * The master's scrollable content height — what the vertical scrollbar is sized from. It is
   * computed from the summed row heights, not measured off the rendered table, so it goes stale
   * whenever a draw changes the row heights without re-sizing the overlay elements.
   */
  async masterScrollHeight(): Promise<number> {
    return this.holder().evaluate(el => el.scrollHeight);
  }

  /** Force one more full draw, to see whether the previous one had already settled. */
  async forceRender(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as {
      hot: { render: () => void }
    }).hot.render());
  }

  /**
   * How many times `renders` full draws invalidate the row-height cache. A settled grid must
   * report 0: this is the one symptom of a frozen-row bookkeeping mistake that leaves every
   * visible thing correct, so no height or offset assertion can stand in for it.
   */
  async countRowCacheInvalidations(renders: number): Promise<number> {
    return this.page.evaluate(count => (window as unknown as {
      countRowCacheInvalidations: (renders: number) => number
    }).countRowCacheInvalidations(count), renders);
  }

  /**
   * The row-height prefix sum as the cache answers it now, beside the same sum rebuilt from
   * scratch. A gap means the cache was built while `oversizedRows` was missing heights — invisible
   * in the rendered rows, visible only as a scrollbar that cannot reach the end of the grid.
   */
  async rowHeightSum(): Promise<{ cached: number, live: number }> {
    return this.page.evaluate(() => (window as unknown as {
      rowHeightSum: () => { cached: number, live: number }
    }).rowHeightSum());
  }

  /** The rows the engine has an oversized-height record for, beside what `RenderSizeProbe` measured. */
  async recordsVersusProbe(): Promise<Record<string, { engine: number, probe: number | null }>> {
    return this.page.evaluate(() => {
      const hot = (window as unknown as { hot: any }).hot;
      const { oversizedRows } = hot.view._wt.wtViewport;
      const { rowHeights } = hot.view.renderSizeProbe;
      const out: Record<string, { engine: number, probe: number | null }> = {};

      Object.keys(oversizedRows).forEach((key) => {
        out[key] = { engine: oversizedRows[key], probe: rowHeights.get(Number(key)) ?? null };
      });

      return out;
    });
  }

  /** The rows the master's viewport calculator currently reports as visible. */
  async visibleRowRange(): Promise<string> {
    return this.page.evaluate(() => {
      const calculator = (window as unknown as { hot: any }).hot.view._wt.wtViewport.rowsVisibleCalculator;

      return `${calculator?.startRow}..${calculator?.endRow}`;
    });
  }

  /** Turn the tall block in the frozen column on or off and re-render. */
  async setTallCell(value: boolean): Promise<void> {
    await this.page.evaluate(v => (window as unknown as {
      setTallCell: (on: boolean) => void
    }).setTallCell(v), value);
  }
}
