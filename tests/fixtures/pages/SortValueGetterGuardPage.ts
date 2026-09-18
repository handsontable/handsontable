import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Which layer the fixture puts a `valueGetter` on.
 */
export type GuardMode = 'plain' | 'column' | 'cells' | 'cell-option';

interface ColumnReadComparison {
  perCell: string[];
  bulk: string[];
  renderedRows: number;
}

interface GuardFixtureWindow extends Window {
  readColumnBothWays(): ColumnReadComparison;
  hot: {
    countRows(): number;
    getDataAtCell(row: number, column: number): unknown;
    getPlugin(name: string): { sort(config: { column: number; sortOrder: string }): void };
  };
}

/**
 * Page Object for the fixture that exercises the guarded bulk column read the sort gather loop uses.
 */
export class SortValueGetterGuardPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture in one of the guard modes and waits for the grid to render.
   *
   * @param {GuardMode} mode Which layer declares the `valueGetter`.
   */
  async goto(mode: GuardMode): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/sort-value-getter-guard.html?theme=${this.theme}&bundle=${this.bundle}&mode=${mode}`
    );

    // Wait for the bundle before the cell: the test id comes from the fixture's renderer, so a
    // missing cell alone cannot tell a slow bundle apart from a grid that failed to render.
    await awaitBundle(this.page);

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell, by the test id the fixture's renderer stamps on it.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {Locator}
   */
  cell(row: number, column: number): Locator {
    return this.page.getByTestId(`cell-${row}-${column}`);
  }

  /**
   * Reads the sorted column through the public per-cell path and through the bulk accessor, against
   * one and the same grid state.
   *
   * @returns {Promise<ColumnReadComparison>}
   */
  async readColumnBothWays(): Promise<ColumnReadComparison> {
    return this.page.evaluate(() => (window as unknown as GuardFixtureWindow).readColumnBothWays());
  }

  /**
   * Sorts the first column ascending through the plugin API.
   */
  async sortFirstColumnAscending(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as GuardFixtureWindow).hot
        .getPlugin('columnSorting')
        .sort({ column: 0, sortOrder: 'asc' });
    });
  }

  /**
   * Reads the first column's value at a visual row through the public API.
   *
   * @param {number} row Visual row index.
   * @returns {Promise<unknown>}
   */
  async valueAt(row: number): Promise<unknown> {
    return this.page.evaluate(
      visualRow => (window as unknown as GuardFixtureWindow).hot.getDataAtCell(visualRow, 0),
      row
    );
  }
}
