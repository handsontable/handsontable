import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the
// full instance type, and narrowing it here would be a TS2430 conflict. Every access is cast.
interface FixtureWindow {
  hot: {
    getSourceData(): Array<{ done: unknown }>;
    getSelected(): number[][] | undefined;
    getPlugin(name: 'columnSorting'): { getSortConfig(): unknown[] };
    getPlugin(name: 'undoRedo'): { undo(): void };
    getPlugin(name: 'rowSelection'): { getSelectedRows(): number[] };
  };
  rowSelectionEvents: Array<{ selected: number[]; deselected: number[]; source: string }>;
}

/**
 * Page Object for the checkbox column header fixture (PRO-87): a `done` checkbox column with a
 * "check all" header checkbox, optionally bound to the row selection (`?mode=bound`). Row 2's cell is
 * read-only.
 */
export class CheckboxHeaderPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture in the "header" mode (CheckboxHeader alone) or the "bound" mode (RowSelection
   * uses the column).
   */
  async goto(mode: 'header' | 'bound' = 'header'): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/checkbox-header.html?theme=${this.theme}&bundle=${this.bundle}&mode=${mode}`
    );

    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Returns the checkbox a cell of the `done` column renders.
   */
  cellCheckbox(row: number): Locator {
    return this.cell(row, 1).locator('input[type="checkbox"]');
  }

  /**
   * Returns the header checkbox of the `done` column, shown in the top overlay.
   */
  headerCheckbox(): Locator {
    return this.page.locator('.ht_clone_top').getByRole('checkbox', { name: /^(Check all|Select all rows)/ });
  }

  /**
   * The values of the `done` column, in physical order.
   */
  async doneValues(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSourceData().map(row => row.done));
  }

  /**
   * The cell selection, which a header checkbox press must leave alone.
   */
  async cellSelection(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSelected());
  }

  /**
   * The column sort, which a header checkbox press must leave alone.
   */
  async sortConfig(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot
      .getPlugin('columnSorting').getSortConfig());
  }

  /**
   * Undoes the last action.
   */
  async undo(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getPlugin('undoRedo').undo());
  }

  /**
   * The rows the RowSelection plugin reports as selected (bound mode).
   */
  async selectedRows(): Promise<number[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot
      .getPlugin('rowSelection').getSelectedRows());
  }

  /**
   * The sources of the `afterRowSelectionChange` calls so far (bound mode).
   */
  async selectionSources(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).rowSelectionEvents
      .map(event => event.source));
  }

  /**
   * How far the header checkbox's vertical center sits from its header cell's, in pixels.
   */
  async headerVerticalOffset(): Promise<number> {
    return this.headerCheckbox().evaluate((element) => {
      const input = element.getBoundingClientRect();
      const cell = element.closest('th')!.getBoundingClientRect();

      return (input.top + (input.height / 2)) - (cell.top + (cell.height / 2));
    });
  }
}
