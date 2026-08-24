import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the "renderer valueFormatter static and the auto-size plugins" fixture
 * (DEV-2126 follow-up).
 *
 * The master table and the inline-start overlay render the SAME rows — the overlay holds only the
 * row headers — so every height question is asked per table: pass the table you mean. Both tables'
 * rows carry a `row-<n>` test id, stamped by the fixture's custom cell renderer on the master side
 * and by its row-header renderer on the overlay side.
 */
export class AutoSizeValueFormatterPage {
  /** Numeric column without `numericFormat` — the raw-value width reference. */
  static readonly RAW_NUMERIC_COLUMN = 0;
  /** Same numbers as the reference, plus a currency `numericFormat` (a longer rendered string). */
  static readonly CURRENCY_COLUMN = 1;
  /** The row whose third cell the renderer's `valueFormatter` static expands to three lines. */
  static readonly MULTILINE_ROW = 2;
  /** A single-line row, used as the baseline. Row 0 is avoided: the band's first row adds 1px. */
  static readonly NORMAL_ROW = 1;

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
      `/tests/fixtures/demo/auto-size-value-formatter.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await expect(this.master).toBeVisible();
    await expect(this.inlineStartOverlay).toBeVisible();
    await expect(this.row(this.master, AutoSizeValueFormatterPage.MULTILINE_ROW)).toBeVisible();
    await expect(
      this.row(this.inlineStartOverlay, AutoSizeValueFormatterPage.MULTILINE_ROW)
    ).toBeVisible();
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

  /** The text one master cell actually renders — ties the measured value to the visible one. */
  async cellText(row: number, column: number): Promise<string> {
    return this.page.evaluate(
      ([r, c]) => (window as unknown as {
        hot: { getCell: (row: number, col: number) => HTMLTableCellElement | null }
      }).hot.getCell(r, c)?.textContent ?? '',
      [row, column]
    );
  }

  /**
   * The height AutoRowSize settled on for a row — the measured value, not the rendered one. The
   * master's own `<tr>` grows to its content whether or not the measurement was right, so only
   * this cached value (and the overlay, which obeys it exactly) can tell the two apart.
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
