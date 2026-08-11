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

  readonly page: Page;
  readonly theme: string;
  readonly grid: Locator;
  readonly master: Locator;
  readonly inlineStartOverlay: Locator;

  constructor(page: Page, theme = 'main') {
    this.page = page;
    this.theme = theme;
    this.grid = page.getByTestId('grid');
    this.master = this.grid.locator('.ht_master');
    this.inlineStartOverlay = this.grid.locator('.ht_clone_inline_start');
  }

  /**
   * Navigate and wait for the grid to render (a real DOM condition, no sleep).
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/walkontable/frozen-tall-cell.html?theme=${this.theme}`);
    await expect(this.master).toBeVisible();
    await expect(this.inlineStartOverlay).toBeVisible();
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

  /** Turn the tall block in the frozen column on or off and re-render. */
  async setTallCell(value: boolean): Promise<void> {
    await this.page.evaluate(v => (window as unknown as {
      setTallCell: (on: boolean) => void
    }).setTallCell(v), value);
  }
}
