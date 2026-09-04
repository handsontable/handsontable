import { type Page, type Locator, expect } from '@playwright/test';
import { type CellValue } from './windowTypes';

/** Which sorting plugin the grid is built with. Both share the sortable-range calculation. */
export type SortingPlugin = 'columnSorting' | 'multiColumnSorting';

/**
 * Page object for the GH #5983 fixture: sorting a filtered grid that has `minSpareRows` set.
 *
 * Filtering is driven through the Filters plugin API rather than the dropdown menu, because
 * that is what the bug report does (a button beside the grid calling `addCondition` +
 * `filter`), and it keeps the spec's subject the sort rather than the menu. Sorting is driven
 * by clicking the header label, which is the user gesture the report describes.
 *
 * `window.hot` and `window.initSortingSpareRowsGrid` are declared in `windowTypes.ts` - the
 * single home of the `Window` augmentation shared by every page object in this directory.
 */
export class SortingFilteredSpareRowsPage {
  /** The Playwright page the fixture is driven through. */
  readonly page: Page;
  /** The active theme, passed through to the fixture URL. */
  readonly theme: string;
  /** The active bundle, passed through to the fixture URL. */
  readonly bundle: string;
  /** Column headers live in several overlay layers, so every header locator is scoped to the top one. */
  readonly headerOverlay: Locator;
  /** Uncaught page errors seen since construction, in the order they fired. */
  readonly pageErrors: string[] = [];

  /**
   * Wires up the page object for one theme/bundle leg and starts collecting uncaught page
   * errors immediately, so a spec that never calls `goto()` before an assertion still sees them.
   */
  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.headerOverlay = page.locator('.ht_clone_top');
    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   *
   * The bundle is injected with `document.write`, so it loads separately from the block that
   * builds the grid. Wait for `Handsontable` itself first, and with `waitForFunction` rather
   * than `expect`: the plain UMD bundle is ~6 MB and every worker pulls its own copy, so a cold
   * or busy server outlasts the 10s `expect` timeout while `waitForFunction` polls against the
   * test budget.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/sorting-filtered-spare-rows.html?theme=${this.theme}&bundle=${this.bundle}`);
    await this.page.waitForFunction(() => 'Handsontable' in window, undefined, { polling: 100 });
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** Rebuilds the grid with the given setting overrides, so one test cannot leak into the next. */
  async rebuild(overrides: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate(settings => window.initSortingSpareRowsGrid(settings), overrides);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Rebuilds the grid with the given sorting plugin. `multiColumnSorting` extends
   * `ColumnSorting` and the two refuse to run together, so the single-column plugin has to be
   * switched off explicitly.
   */
  async useSortingPlugin(plugin: SortingPlugin, overrides: Record<string, unknown> = {}): Promise<void> {
    await this.rebuild({
      columnSorting: plugin === 'columnSorting',
      multiColumnSorting: plugin === 'multiColumnSorting',
      ...overrides,
    });
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** A column header, scoped to the top overlay so the match is unambiguous. */
  header(col: number): Locator {
    return this.headerOverlay.getByTestId(`col-header-${col}`);
  }

  /** The clickable sorting label inside a column header. */
  sortLabel(col: number): Locator {
    return this.header(col).locator('span.colHeader');
  }

  /**
   * Click a column header's sorting label, the gesture the bug report describes, and wait for
   * the indicator so the follow-up assertions run against a sorted grid.
   *
   * The expected order is required rather than optional: a second click lands on a label that
   * already carries `ascending`, so waiting for "either indicator" would resolve the instant the
   * click is dispatched and never wait for anything. Naming the order makes a lost click fail
   * here, where it happened, instead of surfacing as a value mismatch further down the test.
   */
  async sortByHeader(col: number, expectedOrder: 'ascending' | 'descending'): Promise<void> {
    await this.sortLabel(col).click();
    await expect(this.sortLabel(col)).toHaveClass(new RegExp(`\\b${expectedOrder}\\b`));
  }

  /**
   * Apply a "contains" condition through the Filters plugin API - what the reported repro's
   * button does. The condition takes a VISUAL column index, as every public `Filters` method
   * does.
   */
  async applyContainsFilter(col: number, value: string): Promise<void> {
    await this.page.evaluate(({ column, needle }) => {
      const filters = window.hot.getPlugin('filters');

      filters.addCondition(column, 'contains', [needle]);
      filters.filter();
    }, { column: col, needle: value });
  }

  /** Drop every condition and re-run the filter, bringing the trimmed rows back. */
  async clearFilter(): Promise<void> {
    await this.page.evaluate(() => {
      const filters = window.hot.getPlugin('filters');

      filters.clearConditions();
      filters.filter();
    });
  }

  /** The values the grid currently holds in a column, top to bottom, spare rows included. */
  async columnValues(col: number): Promise<CellValue[]> {
    return this.page.evaluate(column => window.hot.getDataAtCol(column), col);
  }

  /** The number of rows the grid currently renders, spare rows included. */
  async rowCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.countRows());
  }

  /** The number of empty rows at the bottom of the grid - what `minSpareRows` is measured against. */
  async trailingEmptyRowCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.countEmptyRows(true));
  }
}
