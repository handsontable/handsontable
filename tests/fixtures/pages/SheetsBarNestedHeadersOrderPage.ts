import { expect, type Locator, type Page } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { SheetsBarPage } from './SheetsBarPage';

/**
 * Page object for the sheets-bar-nested-headers-order fixture
 * (fixtures/demo/sheets-bar-nested-headers-order.html): a two-sheet workbook whose first sheet,
 * 'Orders', has two header groups over four movable columns. The tab strip comes from
 * `SheetsBarPage`, so the two stay in step.
 */
export class SheetsBarNestedHeadersOrderPage {
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

    await this.page.goto(
      `/tests/fixtures/demo/sheets-bar-nested-headers-order.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);

    await expect(
      this.header(1, 0),
      this.pageErrors.length > 0 ? `the fixture page threw: ${this.pageErrors.join(' | ')}` : undefined,
    ).toBeVisible();
  }

  /**
   * A column header cell as the top overlay draws it, by header level and visual column.
   */
  header(level: number, column: number): Locator {
    return this.page.locator('.ht_clone_top').getByTestId(`header-${level}-${column}`);
  }

  /**
   * Moves one column through ManualColumnMove's API and renders the grid.
   */
  moveColumn(column: number, finalIndex: number): Promise<void> {
    return this.page.evaluate(([from, to]) => {
      window.hot.getPlugin('manualColumnMove').moveColumn(from, to);
      window.hot.render();
    }, [column, finalIndex]);
  }

  /**
   * The values of the first data row, in visual order.
   */
  firstRow(): Promise<unknown[]> {
    return this.page.evaluate(() => window.hot.getDataAtRow(0));
  }

  /**
   * Switches to the sheet under the given tab and waits until the bar reports it active.
   */
  async switchToSheet(index: number): Promise<void> {
    await this.sheetsBar.clickTab(index);
    await this.sheetsBar.expectActiveTab(index);
  }
}
