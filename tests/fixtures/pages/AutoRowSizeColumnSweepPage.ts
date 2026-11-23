import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

type GridInstance = {
  getPlugin(name: 'autoColumnSize' | 'autoRowSize'): { inProgress: boolean },
  getRowHeight(row: number): number | undefined,
  getColWidth(column: number): number,
  getCell(row: number, column: number): HTMLElement | null,
};

type GridWindow = {
  hot: GridInstance,
  referenceHot: GridInstance,
  loadLongTextInAnotherColumn(): void,
  loadLongTextInLastRow(): void,
  hideGridWhenOwedRowMeasureStarts(): void,
  showGrid(): void,
};

/**
 * Page Object for the AutoRowSize column-sweep fixture.
 *
 * The fixture holds two grids with the same data: the grid under test, whose columns past the
 * synchronous part AutoColumnSize measures in idle tasks, and a reference grid that measures every
 * column before `init` returns. Each read returns both values from one evaluation. Nothing here calls
 * `render()`: a render from the test would do the work the grid owes on its own.
 */
export class AutoRowSizeColumnSweepPage {
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
   * Navigate and wait for the grid to have rendered.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/auto-row-size-column-sweep.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);
    await expect(this.grid.locator('.ht_master tbody tr').first()).toBeVisible();
  }

  /**
   * Waits until neither grid has AutoColumnSize or AutoRowSize measuring in idle tasks.
   */
  async waitForSweepsToEnd(): Promise<void> {
    await expect.poll(() => this.page.evaluate(() => {
      const { hot, referenceHot } = window as unknown as GridWindow;

      return [hot, referenceHot].some(instance => (
        instance.getPlugin('autoColumnSize').inProgress || instance.getPlugin('autoRowSize').inProgress
      ));
    })).toBe(false);
  }

  /**
   * The height each grid stores for a row.
   *
   * @param {number} row Visual row index.
   * @returns {Promise<{ grid: number | null, reference: number | null }>}
   */
  async rowHeights(row: number): Promise<{ grid: number | null, reference: number | null }> {
    return this.page.evaluate((target) => {
      const { hot, referenceHot } = window as unknown as GridWindow;

      return {
        grid: hot.getRowHeight(target) ?? null,
        reference: referenceHot.getRowHeight(target) ?? null,
      };
    }, row);
  }

  /**
   * The width the grid under test uses for a column.
   *
   * @param {number} column Visual column index.
   * @returns {Promise<number>}
   */
  async columnWidth(column: number): Promise<number> {
    return this.page.evaluate(target => (window as unknown as GridWindow).hot.getColWidth(target), column);
  }

  /**
   * The drawn height of a row's header in each grid.
   *
   * @param {number} row Visual row index.
   * @returns {Promise<{ grid: number, reference: number }>}
   */
  async drawnRowHeaderHeights(row: number): Promise<{ grid: number, reference: number }> {
    return this.page.evaluate((target) => {
      const { hot, referenceHot } = window as unknown as GridWindow;
      const height = (instance: GridInstance) => {
        const header = instance.getCell(target, -1);

        if (!header) {
          throw new Error(`The header of row ${target} is not rendered.`);
        }

        return header.getBoundingClientRect().height;
      };

      return { grid: height(hot), reference: height(referenceHot) };
    }, row);
  }

  /**
   * Loads data with the long text in column 125, which the previous data measured from short values, into
   * both grids.
   */
  async loadLongTextInAnotherColumn(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as GridWindow).loadLongTextInAnotherColumn());
  }

  /**
   * The scroll height of each grid's master holder, read in one evaluation.
   *
   * @returns {Promise<{ grid: number, reference: number }>}
   */
  async scrollHeights(): Promise<{ grid: number, reference: number }> {
    return this.page.evaluate(() => {
      const read = (testId: string) => {
        const holder = document.querySelector(`[data-testid="${testId}"] .ht_master .wtHolder`);

        if (!holder) {
          throw new Error(`The master holder of "${testId}" is not rendered.`);
        }

        return holder.scrollHeight;
      };

      return { grid: read('grid'), reference: read('reference-grid') };
    });
  }

  /**
   * Hides the grid under test from the render that starts AutoRowSize's owed row measure.
   */
  async hideGridWhenOwedRowMeasureStarts(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as GridWindow).hideGridWhenOwedRowMeasureStarts());
  }

  /**
   * Shows the grid under test again and renders it.
   */
  async showGrid(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as GridWindow).showGrid());
  }

  /**
   * Whether the grid under test is hidden.
   *
   * @returns {Promise<boolean>}
   */
  async gridHidden(): Promise<boolean> {
    return this.grid.evaluate(element => element.style.display === 'none');
  }

  /**
   * Loads 256 rows into both grids, with the long text in column 125 of the last row.
   */
  async loadLongTextInLastRow(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as GridWindow).loadLongTextInLastRow());
  }
}
