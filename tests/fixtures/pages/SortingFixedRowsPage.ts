import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { type CellValue } from './windowTypes';

/** Which sorting plugin the grid is built with. Both share the sortable-range calculation. */
export type SortingPlugin = 'columnSorting' | 'multiColumnSorting';

/** A sort config as the public plugin API takes it: a VISUAL column index plus an order. */
export interface SortRequest {
  column: number;
  sortOrder: 'asc' | 'desc';
}

/**
 * Page object for the DEV-59 fixture: which rows a sort is allowed to move when
 * `fixedRowsTop` / `fixedRowsBottom` pin rows at either end of the grid.
 *
 * Every cell locator is scoped to one overlay layer. A pinned row is rendered in the master
 * table AND cloned into its overlay, so the fixture's `cell-<row>-<col>` id exists more than
 * once in the document and an unscoped `getByTestId` would be a strict-mode violation rather
 * than a useful assertion.
 *
 * `window.hot` and `window.initSortingFixedRowsGrid` are declared in `windowTypes.ts` - the
 * single home of the `Window` augmentation shared by every page object in this directory.
 */
export class SortingFixedRowsPage {
  /** The Playwright page the fixture is driven through. */
  readonly page: Page;
  /** The active theme, passed through to the fixture URL. */
  readonly theme: string;
  /** The active bundle, passed through to the fixture URL. */
  readonly bundle: string;
  /** The master table - the only layer that renders every row exactly once. */
  readonly master: Locator;
  /** The top overlay, which holds the column headers and the `fixedRowsTop` rows. */
  readonly topOverlay: Locator;
  /** The bottom overlay, which holds the `fixedRowsBottom` rows. */
  readonly bottomOverlay: Locator;
  /** Uncaught page errors seen since construction, in the order they fired. */
  readonly pageErrors: string[] = [];
  /** The plugin the grid was last built with, so the API sort reaches the right one. */
  activePlugin: SortingPlugin = 'columnSorting';

  /**
   * Wires up the page object for one theme/bundle leg and starts collecting uncaught page
   * errors immediately, so a spec that never calls `goto()` before an assertion still sees them.
   */
  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.master = page.locator('.ht_master');
    this.topOverlay = page.locator('.ht_clone_top');
    this.bottomOverlay = page.locator('.ht_clone_bottom');
    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/sorting-fixed-rows.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.masterCell(0, 0)).toBeVisible();
  }

  /** Rebuilds the grid with the given setting overrides, so one test cannot leak into the next. */
  async rebuild(overrides: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate(settings => window.initSortingFixedRowsGrid(settings), overrides);
    await expect(this.masterCell(0, 0)).toBeVisible();
  }

  /**
   * Rebuilds the grid with the given sorting plugin. `multiColumnSorting` extends
   * `ColumnSorting` and the two refuse to run together, so the single-column plugin has to be
   * switched off explicitly.
   */
  async useSortingPlugin(plugin: SortingPlugin, overrides: Record<string, unknown> = {}): Promise<void> {
    this.activePlugin = plugin;

    await this.rebuild({
      columnSorting: plugin === 'columnSorting',
      multiColumnSorting: plugin === 'multiColumnSorting',
      ...overrides,
    });
  }

  /**
   * Turns `sortFixedRows` on or off at runtime, through `updateSettings`, keeping whichever
   * plugin the grid was built with. This is the path a user takes to change the option after
   * initialization, and it is the one that proves the flag is read per sort rather than cached
   * when the plugin was enabled.
   */
  async setSortFixedRows(sortFixedRows: boolean): Promise<void> {
    await this.page.evaluate(({ plugin, value }) => {
      window.hot.updateSettings({ [plugin]: { sortFixedRows: value } });
    }, { plugin: this.activePlugin, value: sortFixedRows });
  }

  /** A single data cell in the master table, by visual row/column. */
  masterCell(row: number, col: number): Locator {
    return this.master.getByTestId(`cell-${row}-${col}`);
  }

  /** A single data cell as the top overlay renders it - only `fixedRowsTop` rows are there. */
  topOverlayCell(row: number, col: number): Locator {
    return this.topOverlay.getByTestId(`cell-${row}-${col}`);
  }

  /** A single data cell as the bottom overlay renders it - only `fixedRowsBottom` rows are there. */
  bottomOverlayCell(row: number, col: number): Locator {
    return this.bottomOverlay.getByTestId(`cell-${row}-${col}`);
  }

  /** A column header, scoped to the top overlay so the match is unambiguous. */
  header(col: number): Locator {
    return this.topOverlay.getByTestId(`col-header-${col}`);
  }

  /** The clickable sorting label inside a column header. */
  sortLabel(col: number): Locator {
    return this.header(col).locator('span.colHeader');
  }

  /**
   * Click a column header's sorting label - the gesture a user makes - and wait for the
   * indicator so the follow-up assertions run against a sorted grid.
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
   * Sort through the public plugin API. Used for the multi-column case, where the alternative
   * gesture is a ctrl-click whose modifier state the shortcut manager tracks through real
   * keydown/keyup events - a second thing to get wrong in a test whose subject is the sortable
   * range, not the gesture.
   */
  async sortByApi(configs: SortRequest | SortRequest[]): Promise<void> {
    await this.page.evaluate(({ plugin, sortConfigs }) => {
      window.hot.getPlugin(plugin).sort(sortConfigs);
    }, { plugin: this.activePlugin, sortConfigs: configs });
  }

  /** The values the grid currently holds in a column, top to bottom, pinned rows included. */
  async columnValues(col: number): Promise<CellValue[]> {
    return this.page.evaluate(column => window.hot.getDataAtCol(column), col);
  }

  /** The number of rows the grid currently renders. */
  async rowCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.countRows());
  }
}
