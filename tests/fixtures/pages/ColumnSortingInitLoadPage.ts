import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * When the column-sorting-init-load fixture replaces the data: `init` from an `init` listener,
 * `none` never.
 */
export type InitLoad = 'init' | 'none';

/**
 * What one `afterLoadData` call received: its `initialLoad` argument, and whether the view
 * existed at that moment.
 */
export interface LoadCall {
  initialLoad: unknown;
  hasView: boolean;
}

/**
 * Page Object for the column-sorting-init-load fixture.
 */
export class ColumnSortingInitLoadPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   */
  async goto(load: InitLoad): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/column-sorting-init-load.html?theme=${this.theme}&bundle=${this.bundle}&load=${load}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A single data cell, by visual row/column, via its stable test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Assert the rendered column, top to bottom (web-first, auto-retrying).
   */
  async expectColumn(col: number, values: string[]): Promise<void> {
    for (const [row, value] of values.entries()) {
      await expect(this.cell(row, col)).toHaveText(value);
    }
  }

  /**
   * The sort config the ColumnSorting plugin reports.
   */
  async sortConfig(): Promise<unknown> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as {
        hot: { getPlugin(name: string): { getSortConfig(): unknown } };
      };

      return hot.getPlugin('columnSorting').getSortConfig();
    });
  }

  /**
   * Every `afterLoadData` call the fixture recorded, in order.
   */
  async loadCalls(): Promise<LoadCall[]> {
    return this.page.evaluate(() => (window as unknown as { initialLoadCalls: LoadCall[] }).initialLoadCalls);
  }
}
