import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the stale header wrapper fixture.
 *
 * Headers are read from the master table. The top and inline-start overlay clones draw the headers
 * too, so every locator is scoped to `.ht_master`, and the helpers change only the master header.
 */
export class StaleHeaderWrapperPage {
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

  /** Navigate, wait for the bundle, then for the headers to have rendered - never a sleep. */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/stale-header-wrapper.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);
    await expect(this.columnHeaderLabel(0)).toHaveText('Alpha');
  }

  /**
   * The label element of one column header.
   *
   * @param {number} column The column index.
   * @returns {Locator}
   */
  columnHeaderLabel(column: number): Locator {
    return this.grid.locator('.ht_master thead th').nth(column + 1).locator('.colHeader');
  }

  /**
   * The label element of one row header.
   *
   * @param {number} row The row index.
   * @returns {Locator}
   */
  rowHeaderLabel(row: number): Locator {
    return this.grid.locator('.ht_master tbody tr').nth(row).locator('th .rowHeader');
  }

  /**
   * Removes the label element from a column header's wrapper, leaving the wrapper in place.
   *
   * @param {number} column The column index.
   */
  async removeColumnHeaderLabel(column: number): Promise<void> {
    await this.columnHeaderLabel(column).evaluate(label => label.remove());
  }

  /**
   * Removes the label element from a row header's wrapper, leaving the wrapper in place.
   *
   * @param {number} row The row index.
   */
  async removeRowHeaderLabel(row: number): Promise<void> {
    await this.rowHeaderLabel(row).evaluate(label => label.remove());
  }

  /**
   * The wrapper element of one column header.
   *
   * @param {number} column The column index.
   * @returns {Locator}
   */
  columnHeaderWrapper(column: number): Locator {
    return this.grid.locator('.ht_master thead th').nth(column + 1).locator('.relative');
  }

  /**
   * The wrapper element of one row header.
   *
   * @param {number} row The row index.
   * @returns {Locator}
   */
  rowHeaderWrapper(row: number): Locator {
    return this.grid.locator('.ht_master tbody tr').nth(row).locator('th .relative');
  }

  /**
   * Replaces everything a column header cell holds with one element that is not the grid's wrapper,
   * the way a header hook that assigns `innerHTML` leaves it.
   *
   * @param {number} column The column index.
   */
  async replaceColumnHeaderContent(column: number): Promise<void> {
    await this.grid.locator('.ht_master thead th').nth(column + 1).evaluate((th) => {
      th.replaceChildren(th.ownerDocument.createElement('b'));
    });
  }

  /**
   * How many times `afterGetColHeader` fired for one column since the last call to
   * `clearColumnHeaderHookCalls()`.
   *
   * @param {number} column The column index.
   * @returns {Promise<number>}
   */
  async columnHeaderHookCallCount(column: number): Promise<number> {
    return this.page.evaluate(
      col => (window as unknown as { columnHeaderHookCalls: number[] })
        .columnHeaderHookCalls.filter(calledFor => calledFor === col).length,
      column
    );
  }

  /** Forgets the `afterGetColHeader` calls recorded so far. */
  async clearColumnHeaderHookCalls(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { columnHeaderHookCalls: number[] }).columnHeaderHookCalls.length = 0;
    });
  }

  /**
   * Renders the grid and reports the error it threw, if any. Returned rather than asserted here so
   * the spec states the expectation.
   *
   * @returns {Promise<string | null>}
   */
  async render(): Promise<string | null> {
    return this.page.evaluate(() => {
      try {
        (window as unknown as { hot: { render: () => void } }).hot.render();

        return null;
      } catch (error) {
        return (error as Error).message;
      }
    });
  }
}
