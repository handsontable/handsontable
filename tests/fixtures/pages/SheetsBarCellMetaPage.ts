import { expect, type Locator, type Page } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { SheetsBarPage } from './SheetsBarPage';

/**
 * Page object for the sheets-bar-cell-meta fixture (fixtures/demo/sheets-bar-cell-meta.html): a
 * 'Tasks' sheet with a checkbox column whose header checks every row, a tag column and a text
 * column, and a one-row 'Notes' sheet. The tab strip comes from `SheetsBarPage`.
 */
export class SheetsBarCellMetaPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly sheetsBar: SheetsBarPage;
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.sheetsBar = new SheetsBarPage(page, theme, bundle);
  }

  async goto(): Promise<void> {
    this.page.on('pageerror', error => this.pageErrors.push(error.message));

    await this.page.goto(`/tests/fixtures/demo/sheets-bar-cell-meta.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);

    await expect(
      this.cell(0, 1),
      this.pageErrors.length > 0 ? `the fixture page threw: ${this.pageErrors.join(' | ')}` : undefined,
    ).toBeVisible();
  }

  /**
   * A data cell by visual row and column, as drawn in the master table.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Leaves 'Tasks' for 'Notes' and comes back through the tabs.
   */
  async roundTrip(): Promise<void> {
    await this.sheetsBar.clickTab(1);
    await this.sheetsBar.expectActiveTab(1);
    await this.sheetsBar.clickTab(0);
    await this.sheetsBar.expectActiveTab(0);
  }

  setCellMeta(row: number, col: number, key: string, value: unknown): Promise<void> {
    return this.page.evaluate(([r, c, k, v]) => {
      window.hot.setCellMeta(r as number, c as number, k as string, v);
      window.hot.render();
    }, [row, col, key, value]);
  }

  /**
   * Keeps the rows whose tag column holds `tag`.
   */
  filterByTag(tag: string): Promise<void> {
    return this.page.evaluate((value) => {
      const filters = window.hot.getPlugin('filters');

      filters.addCondition(1, 'eq', [value]);
      filters.filter();
    }, tag);
  }

  /**
   * Presses "check all" in the checkbox column's header.
   */
  checkAll(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.getPlugin('checkboxHeader').setColumnChecked(0, true));
  }

  checkboxColumn(): Promise<unknown[]> {
    return this.page.evaluate(() => window.hot.getSourceDataAtCol(0));
  }

  /**
   * Validates every cell and resolves with the `valid` flag of the given cell.
   */
  validateAndRead(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(([r, c]) => new Promise((resolve) => {
      window.hot.validateCells(() => resolve(window.hot.getCellMeta(r, c).valid));
    }), [row, col]);
  }
}
