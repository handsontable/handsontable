import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS } from '../bundle';
import { FiltersValueListPage } from './FiltersValueListPage';
import './windowTypes';

interface FixtureWindow extends Window {
  htClearMerges(): void;
  htResendMerges(): void;
  htFilterRegionTo(values: string[]): void;
  htClearFilters(): void;
}

/**
 * Page Object for the DEV-3135 fixture: a grid with one merge over the first two rows of the first
 * column, filtered through the dropdown menu, whose merges the host application then drops or sends
 * again through `updateSettings({ mergeCells })`.
 *
 * The dropdown menu is driven through `FiltersValueListPage`, which owns the plugin's class hooks,
 * so no filter-menu selector is spelled out here or in the spec.
 */
export class MergeCellsFilteredOutClearPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  /**
   * The filter dropdown menu, opened on this page's fixture.
   */
  readonly filters: FiltersValueListPage;
  /**
   * Uncaught page errors seen since construction, in the order they fired.
   */
  readonly pageErrors: string[] = [];

  /**
   * Wires up the page object for one theme/bundle leg and starts collecting uncaught page errors
   * right away, so an error raised by any step of the flow is seen.
   */
  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.filters = new FiltersValueListPage(page, theme, bundle, 'merge-cells-filtered-out-clear.html');
    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /**
   * Opens the fixture and waits for the grid to render. A captured constructor throw is rethrown
   * here, so a failed build is one diagnosed red rather than a bare wait timeout.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      '/tests/fixtures/demo/merge-cells-filtered-out-clear.html' +
      `?theme=${this.theme}&bundle=${this.bundle}`,
    );

    await awaitBundle(this.page);
    await this.page.waitForFunction(
      () => 'htReady' in window || 'htBuildError' in window, undefined, { polling: BUNDLE_POLLING_MS },
    );

    const buildError = await this.page.evaluate(
      () => (window as { htBuildError?: string }).htBuildError ?? null,
    );

    if (buildError !== null) {
      throw new Error(`Handsontable constructor threw in the fixture:\n${buildError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Unchecks every value in the column's "Filter by value" list with the "Clear" link and confirms
   * the menu with "OK", filtering out every row.
   *
   * @param {string} headerLabel The column header's visible label.
   */
  async filterOutEveryValue(headerLabel: string): Promise<void> {
    await this.filters.openMenu(headerLabel);
    await this.filters.clearAllValues();
    await this.filters.confirmMenu();
  }

  /**
   * Keeps only the rows whose "Region" holds one of the given values, through the plugin API.
   *
   * @param {string[]} values The values to keep.
   */
  async filterRegionTo(values: string[]): Promise<void> {
    await this.page.evaluate(
      keptValues => (window as unknown as FixtureWindow).htFilterRegionTo(keptValues),
      values,
    );
  }

  /**
   * Drops every merge through `updateSettings({ mergeCells: [] })`. A throw rejects this call.
   */
  async clearMerges(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).htClearMerges());
  }

  /**
   * Sends the same merges again through `updateSettings()`, the way the React and Angular wrappers
   * do on every commit. A throw rejects this call.
   */
  async resendMerges(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).htResendMerges());
  }

  /**
   * Asserts that a merge covers the given cell: the cell is rendered, but not displayed.
   */
  async expectCoveredByMerge(row: number, col: number): Promise<void> {
    await expect(this.cell(row, col)).toBeAttached();
    await expect(this.cell(row, col)).toHaveCSS('display', 'none');
  }

  /**
   * Removes every filter condition through the plugin API, the way a host application resets the
   * filters, and waits for the last row to render.
   */
  async clearFilters(): Promise<void> {
    const lastRow = await this.page.evaluate(() => {
      (window as unknown as FixtureWindow).htClearFilters();

      return window.hot.countRows() - 1;
    });

    await expect(this.cell(lastRow, 0)).toBeVisible();
  }

  /**
   * Checks every value in the column's "Filter by value" list with the "Select all" link and
   * confirms the menu with "OK", the way a user brings the filtered-out rows back.
   *
   * @param {string} headerLabel The column header's visible label.
   */
  async restoreEveryValue(headerLabel: string): Promise<void> {
    await this.filters.openMenu(headerLabel);
    await this.filters.selectAllValues();
    await this.filters.confirmMenu();
  }

  /**
   * The number of rows the grid currently shows.
   */
  async visibleRowCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.countRows());
  }
}
