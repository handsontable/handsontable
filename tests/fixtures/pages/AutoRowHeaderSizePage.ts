import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the AutoRowHeaderSize fixture.
 *
 * Row headers are drawn in the inline-start overlay, so that is where the cells are read from. The
 * two custom levels stamp a test id on every cell they draw; the assertions only ever look at the
 * row carrying the longest label, which the fixture puts at row 1.
 */
export class AutoRowHeaderSizePage {
  /** The label the "line item" level is sized by. */
  static readonly WIDEST_LINE_ITEM = 'Cost of goods sold';
  /** The label the "group" level is sized by. */
  static readonly WIDEST_GROUP = 'Direct costs';

  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly inlineStartOverlay: Locator;
  readonly lateGrid: Locator;
  readonly editGrid: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.inlineStartOverlay = this.grid.locator('.ht_clone_inline_start');
    this.lateGrid = page.getByTestId('late-grid');
    this.editGrid = page.getByTestId('edit-grid');
  }

  /**
   * The rendered width of the first row header cell of one of the extra grids, in CSS pixels.
   *
   * Read from the master table, which is what the reader actually sees - the point of both async
   * cases is that a width the plugin has worked out has to reach the DOM.
   *
   * @param {Locator} grid The grid to read.
   * @returns {Promise<number>}
   */
  async firstRowHeaderWidth(grid: Locator): Promise<number> {
    return grid.locator('.ht_master tbody tr th').first()
      .evaluate(th => th.getBoundingClientRect().width);
  }

  /**
   * Writes a value into the "label built from cell data" grid.
   *
   * @param {number} row The row to write to.
   * @param {string} value The value to write.
   */
  async editLabelSource(row: number, value: string): Promise<void> {
    await this.page.evaluate(
      ([r, v]) => (window as unknown as {
        editHot: { setDataAtCell: (row: number, col: number, value: string) => void }
      }).editHot.setDataAtCell(r as number, 0, v as string),
      [row, value]
    );
  }

  /** Navigate and wait for the row headers to have rendered - a real DOM condition, never a sleep. */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/auto-row-header-size.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await expect(this.inlineStartOverlay).toBeVisible();
    await expect(this.cell('line-item-header', AutoRowHeaderSizePage.WIDEST_LINE_ITEM)).toBeVisible();
  }

  /**
   * The header cell of one level that carries the given label.
   *
   * @param {string} testId The level's test id.
   * @param {string} label The label the cell draws.
   * @returns {Locator}
   */
  cell(testId: string, label: string): Locator {
    return this.inlineStartOverlay.getByTestId(testId).filter({ hasText: label });
  }

  /**
   * Measures how much room is left around a label inside its own cell, in CSS pixels.
   *
   * The text is measured with a Range over the cell's contents, which is the rendered width of the
   * glyphs themselves - so what comes back is the space the label is NOT using. A label flush
   * against the border reports about zero.
   *
   * @param {string} testId The level's test id.
   * @param {string} label The label the cell draws.
   * @returns {Promise<number>}
   */
  async slackAround(testId: string, label: string): Promise<number> {
    return this.cell(testId, label).evaluate((th) => {
      const range = th.ownerDocument.createRange();

      range.selectNodeContents(th.querySelector('div, span') ?? th);

      return th.clientWidth - range.getBoundingClientRect().width;
    });
  }

  /**
   * Whether a label is cut off by its own cell.
   *
   * @param {string} testId The level's test id.
   * @param {string} label The label the cell draws.
   * @returns {Promise<boolean>}
   */
  async isClipped(testId: string, label: string): Promise<boolean> {
    return this.cell(testId, label).evaluate(th => th.scrollWidth > th.clientWidth + 1);
  }

  /**
   * The rendered width of one level's header cell, in CSS pixels.
   *
   * @param {string} testId The level's test id.
   * @param {string} label The label the cell draws.
   * @returns {Promise<number>}
   */
  async cellWidth(testId: string, label: string): Promise<number> {
    return this.cell(testId, label).evaluate(th => th.getBoundingClientRect().width);
  }
}
