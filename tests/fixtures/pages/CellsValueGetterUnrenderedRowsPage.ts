import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

type HotWindow = Window & {
  hot: any;
  htBuildError?: string;
};

/**
 * Page Object for the fixture whose `cells` function gives every row of a 1000-row grid a
 * `valueGetter`. Only the rows around the viewport are rendered and keep cell meta, so the reads it
 * exposes tell whether a data read applies the getter to the rows the grid has not rendered.
 */
export class CellsValueGetterUnrenderedRowsPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigates to the fixture and waits for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/cells-value-getter-unrendered-rows.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);

    const buildError = await this.page.evaluate(() => (window as unknown as HotWindow).htBuildError ?? null);

    if (buildError !== null) {
      throw new Error(`Handsontable constructor threw in the fixture:\n${buildError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master overlay, by visual row and column.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Locator}
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Reads one cell through `getDataAtCell()`, and whether the cell has stored cell meta at that moment.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Promise<{ value: unknown, hasStoredMeta: boolean }>}
   */
  async readCell(row: number, col: number): Promise<{ value: unknown; hasStoredMeta: boolean }> {
    return this.page.evaluate(([r, c]) => {
      const { hot } = window as unknown as HotWindow;

      return {
        hasStoredMeta: hot._getMetaManager().getCellMetaIfExists(hot.toPhysicalRow(r), hot.toPhysicalColumn(c)) !==
          undefined,
        value: hot.getDataAtCell(r, c),
      };
    }, [row, col]);
  }

  /**
   * Reads one row of `getData()`.
   *
   * @param {number} row The visual row index.
   * @returns {Promise<unknown[]>}
   */
  async rowOfGetData(row: number): Promise<unknown[]> {
    return this.page.evaluate(r => (window as unknown as HotWindow).hot.getData()[r], row);
  }

  /**
   * Scrolls the viewport to the last row and waits until the grid has rendered it.
   */
  async scrollToLastRow(): Promise<void> {
    await this.page.evaluate(() => {
      const { hot } = window as unknown as HotWindow;

      hot.scrollViewportTo({ row: hot.countRows() - 1 });
      hot.render();
    });
    await expect(this.cell(999, 0)).toBeVisible();
  }

  /**
   * Sorts a column by clicking its header label, the way a user does.
   *
   * @param {number} col The visual column index.
   */
  async sortByHeader(col: number): Promise<void> {
    const label = this.grid.locator('.ht_clone_top').getByTestId(`col-header-${col}`).locator('span.colHeader');

    await label.click();
    await expect(label).toHaveClass(/ascending|descending/);
  }

  /**
   * Filters a column to the rows whose value equals the given one, through the Filters API.
   * `filter()` renders synchronously, so the grid shows the result when this resolves.
   *
   * @param {number} col The visual column index.
   * @param {string} value The value to keep.
   */
  async filterColumnEquals(col: number, value: string): Promise<void> {
    await this.page.evaluate(([c, v]) => {
      const filters = (window as unknown as HotWindow).hot.getPlugin('filters');

      filters.addCondition(c, 'eq', [v]);
      filters.filter();
    }, [col, value] as const);
  }

  /**
   * Reads how many rows the grid shows.
   *
   * @returns {Promise<number>}
   */
  async countRows(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.countRows());
  }

  /**
   * Reads which physical row each of the first visual rows shows.
   *
   * @param {number} count How many visual rows to read.
   * @returns {Promise<number[]>}
   */
  async physicalRowsAtTop(count: number): Promise<number[]> {
    return this.page.evaluate(
      n => Array.from({ length: n }, (_, row) => (window as unknown as HotWindow).hot.toPhysicalRow(row)), count);
  }
}
