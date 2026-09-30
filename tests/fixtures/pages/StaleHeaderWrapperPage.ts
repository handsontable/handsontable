import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the stale header wrapper fixture.
 *
 * Headers are read from the master table. The fixture has no frozen rows or columns, so nothing is
 * drawn twice and a header label is addressed by its position alone.
 */
export class StaleHeaderWrapperPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  /** Uncaught errors the page raised, collected from the moment the page object is built. */
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    page.on('pageerror', error => this.pageErrors.push(error.message));
  }

  /** Navigate and wait for the headers to have rendered - a real DOM condition, never a sleep. */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/stale-header-wrapper.html?theme=${this.theme}&bundle=${this.bundle}`
    );
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
