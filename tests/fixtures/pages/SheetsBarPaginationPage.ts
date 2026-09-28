import { expect, type Locator, type Page } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { SheetsBarPage } from './SheetsBarPage';

/**
 * Page object for the sheets-bar-pagination fixture (fixtures/demo/sheets-bar-pagination.html):
 * a two-sheet workbook with Pagination on, a 200-row sheet and a 15-row sheet, 10 rows a page.
 * The tab strip comes from `SheetsBarPage`, so the two stay in step.
 */
export class SheetsBarPaginationPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly sheetsBar: SheetsBarPage;
  readonly pageLabel: Locator;
  readonly pageSizeSelect: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.sheetsBar = new SheetsBarPage(page, theme, bundle);
    this.pageLabel = page.locator('.ht-pagination .ht-page-navigation-section__label');
    this.pageSizeSelect = page.locator('.ht-pagination select[name="pageSize"]');
  }

  async goto(): Promise<void> {
    const pageErrors: string[] = [];

    this.page.on('pageerror', error => pageErrors.push(error.message));

    await this.page.goto(`/tests/fixtures/demo/sheets-bar-pagination.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);

    await expect(
      this.cell(0, 0),
      pageErrors.length > 0 ? `the fixture page threw: ${pageErrors.join(' | ')}` : undefined,
    ).toBeVisible();
  }

  /**
   * A data cell by visual row and column. Pagination hides the rows of every other page without
   * renumbering them, so the visual row of a cell is the same on every page.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Opens a page through the Pagination API and waits until the bar reports it.
   */
  async goToPage(pageNumber: number, totalPages: number): Promise<void> {
    await this.page.evaluate(target => window.hot.getPlugin('pagination').setPage(target), pageNumber);
    await this.expectPage(pageNumber, totalPages);
  }

  async expectPage(pageNumber: number, totalPages: number): Promise<void> {
    await expect(this.pageLabel).toHaveText(`Page ${pageNumber} of ${totalPages}`);
  }

  /**
   * Switches to the sheet under the given tab and waits until the bar reports it active.
   */
  async switchToSheet(index: number): Promise<void> {
    await this.sheetsBar.clickTab(index);
    await this.sheetsBar.expectActiveTab(index);
  }

  /**
   * The row header in the frozen start column that shows the given one-based row label.
   */
  rowHeader(label: number): Locator {
    return this.page.locator('.ht_clone_inline_start th').filter({ hasText: new RegExp(`^${label}$`) }).first();
  }

  selectedLast(): Promise<number[] | undefined> {
    return this.page.evaluate(() => window.hot.getSelectedLast());
  }

  selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => window.hot.getSelected());
  }

  isSelectedByRowHeader(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.selection.isSelectedByRowHeader());
  }
}
