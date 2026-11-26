import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the
// full instance type. Every access is cast.
interface FixtureWindow {
  hot: {
    getColHeader(column: number): unknown;
    getRowHeader(row: number): unknown;
    getDataAtCol(column: number): unknown[];
    getSelectedRangeLast(): { highlight: { row: number; col: number } } | undefined;
    getPlugin(name: 'columnSorting'): { getSortConfig(): unknown[] };
  };
  headerChanges: Array<{ axis: string; visualIndex: number; newValue: string; oldValue: unknown }>;
}

/**
 * Page Object for the editable headers fixture: a 5x3 grid with renamable column and row headers.
 * `?mode=sorting` turns on ColumnSorting, `?mode=frozen` freezes the first column.
 */
export class EditableHeadersPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture in one of its modes.
   */
  async goto(mode: 'plain' | 'sorting' | 'frozen' | 'default' | 'wide' = 'plain'): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/editable-headers.html?theme=${this.theme}&bundle=${this.bundle}&mode=${mode}`
    );

    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Returns the column header drawn on top: the corner clone's copy for a frozen column, the top
   * clone's otherwise.
   */
  columnHeader(col: number, { frozen = false } = {}): Locator {
    const overlay = frozen ? '.ht_clone_top_inline_start_corner' : '.ht_clone_top';

    return this.page.locator(overlay).getByTestId(`col-header-${col}`);
  }

  /**
   * Returns a row header from the inline-start clone.
   */
  rowHeader(row: number): Locator {
    return this.page.locator('.ht_clone_inline_start').getByTestId(`row-header-${row}`);
  }

  /**
   * Returns the input laid over a header while it is renamed, by its accessible name.
   */
  headerInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Header name' });
  }

  /**
   * Returns an input outside the grid.
   */
  outsideInput(): Locator {
    return this.page.getByTestId('outside');
  }

  /**
   * Returns the polite live region the rename is announced through.
   */
  politeAnnouncer(): Locator {
    return this.page.locator('[role="status"][aria-live="polite"]');
  }

  /**
   * Returns a menu item of the open context or dropdown menu, by its visible text.
   */
  menuItem(name: string): Locator {
    return this.page.locator('.htContextMenu:visible, .htDropdownMenu:visible')
      .locator('td', { hasText: name }).first();
  }

  /**
   * Scrolls the grid's master holder sideways by `pixels` and waits until the top overlay has followed it.
   */
  async scrollGridBy(pixels: number): Promise<void> {
    const target = await this.page.evaluate((delta) => {
      const holder = document.querySelector('.ht_master .wtHolder') as HTMLElement;

      holder.scrollLeft += delta;

      return holder.scrollLeft;
    }, pixels);

    await expect.poll(() => this.page.evaluate(() => (document.querySelector('.ht_clone_top .wtHolder') as HTMLElement)
      .scrollLeft)).toBe(target);
  }

  /**
   * Opens the column menu (dropdown menu) of a column.
   */
  async openColumnMenu(col: number): Promise<void> {
    await this.columnHeader(col).hover();
    await this.columnHeader(col).locator('.changeType').click();
  }

  /**
   * The header values the grid reports through `getColHeader()`.
   */
  async colHeaders(): Promise<unknown[]> {
    return this.page.evaluate(() => [0, 1, 2]
      .map(col => (window as unknown as FixtureWindow).hot.getColHeader(col)));
  }

  /**
   * The value the grid reports for a row header.
   */
  async rowHeaderValue(row: number): Promise<unknown> {
    return this.page.evaluate(r => (window as unknown as FixtureWindow).hot.getRowHeader(r), row);
  }

  /**
   * The data of a column, which typing in the header input must leave alone.
   */
  async columnData(col: number): Promise<unknown[]> {
    return this.page.evaluate(c => (window as unknown as FixtureWindow).hot.getDataAtCol(c), col);
  }

  /**
   * The `afterHeaderChange` calls recorded by the fixture.
   */
  async headerChanges(): Promise<FixtureWindow['headerChanges']> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).headerChanges);
  }

  /**
   * The focused cell or header (the highlight of the last selection range), or `null`.
   */
  async focusedCell(): Promise<{ row: number; col: number } | null> {
    return this.page.evaluate(() => {
      const range = (window as unknown as FixtureWindow).hot.getSelectedRangeLast();

      return range ? { row: range.highlight.row, col: range.highlight.col } : null;
    });
  }

  /**
   * The column sort.
   */
  async sortConfig(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot
      .getPlugin('columnSorting').getSortConfig());
  }
}
