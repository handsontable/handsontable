import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the "per-cell className changes the cell's geometry" fixture (DEV-2126).
 *
 * The master table and the inline-start overlay render the SAME rows — the overlay holds only the
 * row headers — so every height question is asked per table: pass the table you mean. Both tables'
 * rows carry a `row-<n>` test id, stamped by the fixture's cell renderer on the master side and by
 * its row-header renderer on the overlay side.
 */
export class GhostTableCellClassPage {
  /** The row whose first cell carries the vertical-padding class. */
  static readonly TALL_ROW = 2;
  /** A single-line row, used as the baseline. Row 0 is avoided: the band's first row adds 1px. */
  static readonly NORMAL_ROW = 1;
  /** A row below the tall one — where a height disagreement shows up as drift. */
  static readonly ROW_BELOW_TALL = 4;
  /** The column whose first cell carries the horizontal-padding class. */
  static readonly WIDE_COLUMN = 1;
  /** Same-length content as WIDE_COLUMN, no class — the width reference. */
  static readonly REFERENCE_COLUMN = 2;

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

  /** Navigate and wait for both tables to have rendered — a real DOM condition, never a sleep. */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/ghost-table-cell-class.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await expect(this.master).toBeVisible();
    await expect(this.inlineStartOverlay).toBeVisible();
    await expect(this.row(this.master, GhostTableCellClassPage.TALL_ROW)).toBeVisible();
    await expect(this.row(this.inlineStartOverlay, GhostTableCellClassPage.TALL_ROW)).toBeVisible();
  }

  /** One row of one table (master or the inline-start clone). */
  row(table: Locator, row: number): Locator {
    return table.locator('tbody').getByTestId(`row-${row}`);
  }

  /** The rendered height of one row in one table. */
  async rowHeight(table: Locator, row: number): Promise<number> {
    const box = await this.row(table, row).boundingBox();

    return box?.height ?? 0;
  }

  /**
   * A row's vertical offset relative to its own table's body, so the master and the overlay are
   * comparable even though they sit at different page positions. This is what "the rows line up"
   * means to someone looking at the grid.
   */
  async rowOffsetWithinTable(table: Locator, row: number): Promise<number> {
    const rowBox = await this.row(table, row).boundingBox();
    const bodyBox = await table.locator('tbody').boundingBox();

    return (rowBox?.y ?? 0) - (bodyBox?.y ?? 0);
  }

  /**
   * The height AutoRowSize settled on for a row — the measured value, not the rendered one.
   *
   * This is the number the bug corrupted. The master's own `<tr>` grows to its content whether or
   * not the measurement was right (the applied height lands on the row's first child, and the
   * content simply overflows it), so a rendered-height assertion on the master alone cannot tell a
   * correct measurement from a wrong one. The overlay, which holds only the row header, has no
   * content to overflow and obeys the cached value exactly — which is why the two disagreed.
   */
  async rowHeightSetting(row: number): Promise<number> {
    return this.page.evaluate(
      r => (window as unknown as { hot: { getRowHeight: (n: number) => number } }).hot.getRowHeight(r),
      row
    );
  }

  /** The width AutoColumnSize settled on for a column. */
  async columnWidth(column: number): Promise<number> {
    return this.page.evaluate(
      col => (window as unknown as { hot: { getColWidth: (c: number) => number } }).hot.getColWidth(col),
      column
    );
  }
}
