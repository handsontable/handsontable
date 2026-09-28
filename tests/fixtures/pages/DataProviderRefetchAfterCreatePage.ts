import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import type { FixtureSortConfig } from './windowTypes';

/**
 * The in-page server counters the `data-provider-refetch-after-create.html` fixture exposes.
 */
interface FixtureServer {
  fetchCount: number;
  createCount: number;
}

/**
 * Page Object for the `dataProvider.refetchAfterCreate` fixture (DEV-1679).
 *
 * The grid is server-backed and sorted from the header; `onRowsCreate` applies the created rows
 * itself and the automatic refetch is off. The queries here read what a user sees (row count, sort
 * indicator, cell text) plus the two things only the fixture can report: how many times `fetchRows`
 * ran, and which record carries a `readOnly` mark.
 */
export class DataProviderRefetchAfterCreatePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly status: Locator;
  readonly rows: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.status = page.getByTestId('status');
    this.rows = this.grid.locator('.ht_master tbody tr');
  }

  /**
   * Navigate to the fixture and wait for the first server page to be on screen.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/data-provider-refetch-after-create.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.status).toHaveText('ready');
    // The initial `fetchRows` has applied: the fixture's server holds 12 records.
    await expect(this.rows).toHaveCount(12);
  }

  /**
   * A data cell in the master overlay.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The clickable sorting label of a column header, in the top overlay (the one users click).
   */
  sortLabel(col: number): Locator {
    return this.grid.locator('.ht_clone_top').getByTestId(`col-header-${col}`).locator('span.colHeader');
  }

  /**
   * Sort by a column from its header and wait for the indicator, which ColumnSorting restores from the
   * `afterDataProviderFetch` payload once the sorted server page has loaded.
   */
  async sortByHeader(col: number): Promise<void> {
    await this.sortLabel(col).click();
    await expect(this.sortLabel(col)).toHaveClass(/ascending/);
  }

  /**
   * Insert a row below the given visual row through the context menu, the way a user does it.
   *
   * The left click first is load-bearing: sorting from the header leaves the whole column selected,
   * a right click inside a selection keeps that selection, and the insert items are disabled for a
   * column-header selection. Selecting the cell first is also what a user does.
   */
  async insertRowBelowFromContextMenu(row: number): Promise<void> {
    await this.cell(row, 1).click();
    await this.cell(row, 1).click({ button: 'right' });

    const menu = this.page.locator('.htContextMenu:visible').last();

    await expect(menu).toBeVisible();
    await menu.getByText('Insert row below', { exact: true }).click();
  }

  /**
   * How many times the fixture's `fetchRows` has run since the page loaded.
   */
  async fetchCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { htServer: FixtureServer }).htServer.fetchCount);
  }

  /**
   * The names shown in the name column, in visual order.
   */
  async namesInOrder(): Promise<string[]> {
    return this.page.evaluate(() => window.hot.getDataAtCol(1).map(value => String(value)));
  }

  /**
   * ColumnSorting's current sort config.
   */
  async sortConfig(): Promise<FixtureSortConfig[]> {
    return this.page.evaluate(() => window.hot.getPlugin('columnSorting').getSortConfig());
  }

  /**
   * Mark the name cell of a visual row `readOnly` and return the id of the record that row shows.
   */
  async markReadOnly(row: number): Promise<number> {
    return this.page.evaluate(
      r => (window as unknown as { htMarkReadOnly(row: number): number }).htMarkReadOnly(r),
      row
    );
  }

  /**
   * Ids of the records whose name cell is `readOnly`, in visual order.
   */
  async readOnlyRecordIds(): Promise<number[]> {
    return this.page.evaluate(() => (window as unknown as { htReadOnlyRecordIds(): number[] }).htReadOnlyRecordIds());
  }
}
