import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the
// full instance type, and narrowing it here would be a TS2430 conflict. Every access is cast.
interface FixtureWindow {
  hot: {
    getPlugin(name: 'rowSelection'): {
      getSelectedRows(): number[];
      getSelectedPhysicalRows(): number[];
      getServerSelection(): { selectAll: boolean; toggledRowIds: unknown[] } | null;
    };
    getPlugin(name: 'filters'): {
      addCondition(column: number, name: string, args: unknown[]): void;
      filter(): void;
    };
    getSelected(): number[][] | undefined;
    getSettings(): { rowSelection: Record<string, unknown> };
    updateSettings(settings: Record<string, unknown>): void;
    selectCell(row: number, col: number, endRow?: number, endCol?: number): void;
    getActiveEditor(): { isOpened(): boolean } | undefined;
    getDataAtCell(row: number, col: number): unknown;
    countRows(): number;
  };
  rowSelectionEvents: Array<{ selected: number[]; deselected: number[]; source: string }>;
  fetchCount: number;
}

/**
 * Page Object for the RowSelection fixture (PRO-87). The checkboxes are found by their accessible
 * names ("Select row 3", "Select all rows (...)"), scoped to the overlay that shows them: the
 * master table renders the row header column too, underneath the inline-start clone.
 */
export class RowSelectionPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture with the checkbox location, the "select all" scope, and the row numbers on or off.
   */
  async goto({ location = 'rowHeader', scope = 'all', rowHeaders = true } = {}): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/row-selection.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&location=${location}&scope=${scope}&rowHeaders=${rowHeaders}`
    );

    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Opens the fixture backed by an in-page server (12 rows, 5 per page) and waits for the first page.
   */
  async gotoServerBacked(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/row-selection-data-provider.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    await awaitBundle(this.page);
    await expect(this.cell(0, 1)).toHaveText('Item 1');
  }

  /**
   * Moves to the next page with the pager button, and waits for its first row.
   */
  async nextPage(expectedFirstName: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Go to next page' }).click();
    await expect(this.cell(0, 1)).toHaveText(expectedFirstName);
  }

  /**
   * Moves to the previous page with the pager button, and waits for its first row.
   */
  async previousPage(expectedFirstName: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Go to previous page' }).click();
    await expect(this.cell(0, 1)).toHaveText(expectedFirstName);
  }

  /**
   * The selection of the server-backed grid, by row id.
   */
  async serverSelection(): Promise<{ selectAll: boolean; toggledRowIds: unknown[] } | null> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot
      .getPlugin('rowSelection').getServerSelection());
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Returns the checkbox of a row (visual index). With the row header location it lives in the
   * inline-start clone; with the first column location, inside the row's first data cell.
   */
  rowCheckbox(row: number, location: 'rowHeader' | 'firstColumn' = 'rowHeader'): Locator {
    const scope = location === 'rowHeader' ?
      this.page.locator('.ht_clone_inline_start') : this.cell(row, 0);

    return scope.getByRole('checkbox', { name: `Select row ${row + 1}`, exact: true });
  }

  /**
   * Returns the "select all" checkbox: in the corner with the row header location, in the first
   * column's header with the first column location.
   */
  headerCheckbox(location: 'rowHeader' | 'firstColumn' = 'rowHeader'): Locator {
    const scope = this.page.locator(
      location === 'rowHeader' ? '.ht_clone_top_inline_start_corner' : '.ht_clone_top'
    );

    return scope.getByRole('checkbox', { name: /^Select all rows/ });
  }

  /**
   * Whether the checkbox shows the mixed state (the `indeterminate` property has no attribute).
   */
  async isIndeterminate(checkbox: Locator): Promise<boolean> {
    return checkbox.evaluate(element => (element as HTMLInputElement).indeterminate);
  }

  /**
   * How far the checkbox's vertical center sits from its header cell's, in pixels. Measured in one
   * evaluation, so a re-render cannot land between the two reads.
   */
  async verticalOffsetInHeader(checkbox: Locator): Promise<number> {
    return checkbox.evaluate((element) => {
      const input = element.getBoundingClientRect();
      const cell = element.closest('th')!.getBoundingClientRect();

      return (input.top + (input.height / 2)) - (cell.top + (cell.height / 2));
    });
  }

  /**
   * The selected rows, in visual indexes.
   */
  async selectedRows(): Promise<number[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot
      .getPlugin('rowSelection').getSelectedRows());
  }

  /**
   * The selected rows, in physical indexes (rows the filters removed included).
   */
  async selectedPhysicalRows(): Promise<number[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot
      .getPlugin('rowSelection').getSelectedPhysicalRows());
  }

  /**
   * The cell selection, which a checkbox press must leave alone.
   */
  async cellSelection(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSelected());
  }

  /**
   * The sources of the `afterRowSelectionChange` calls so far.
   */
  async eventSources(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).rowSelectionEvents
      .map(event => event.source));
  }

  /**
   * Moves the cell selection (focus) to a cell or header through the API.
   */
  async focusCell(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => (window as unknown as FixtureWindow).hot.selectCell(r, c), [row, col]);
  }

  /**
   * Selects a range of cells through the API.
   */
  async selectRange(fromRow: number, fromCol: number, toRow: number, toCol: number): Promise<void> {
    await this.page.evaluate(([r1, c1, r2, c2]) => (window as unknown as FixtureWindow).hot
      .selectCell(r1, c1, r2, c2), [fromRow, fromCol, toRow, toCol]);
  }

  /**
   * Whether a cell editor is open.
   */
  async isEditorOpened(): Promise<boolean> {
    return this.page.evaluate(() => !!(window as unknown as FixtureWindow).hot.getActiveEditor()?.isOpened());
  }

  /**
   * The value of a cell.
   */
  async dataAt(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(([r, c]) => (window as unknown as FixtureWindow).hot.getDataAtCell(r, c), [row, col]);
  }

  /**
   * The live region the grid announces changes through.
   */
  announcer(): Locator {
    return this.page.getByRole('status');
  }

  /**
   * Keeps the rows whose status equals the value.
   */
  async filterStatus(value: string): Promise<void> {
    await this.page.evaluate((status) => {
      const filters = (window as unknown as FixtureWindow).hot.getPlugin('filters');

      filters.addCondition(1, 'eq', [status]);
      filters.filter();
    }, value);
  }

  /**
   * Moves the checkboxes to another location through `updateSettings()`, keeping the rest of the
   * plugin settings.
   */
  async switchLocation(location: 'rowHeader' | 'firstColumn'): Promise<void> {
    await this.page.evaluate((checkboxLocation) => {
      const { hot } = window as unknown as FixtureWindow;

      hot.updateSettings({ rowSelection: { ...hot.getSettings().rowSelection, checkboxLocation } });
    }, location);
  }

  /**
   * The number of rows the grid shows.
   */
  async countRows(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.countRows());
  }
}
