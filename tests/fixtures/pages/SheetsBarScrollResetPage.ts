import { expect, type Page } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { SheetsBarPage } from './SheetsBarPage';

/**
 * Page object for the sheets-bar-scroll-reset fixture (fixtures/demo/sheets-bar-scroll-reset.html):
 * two sheets of 200 rows and 40 columns in a box that scrolls on both axes. The tab strip comes
 * from `SheetsBarPage`, so the two stay in step.
 */
export class SheetsBarScrollResetPage {
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

    await this.page.goto(`/tests/fixtures/demo/sheets-bar-scroll-reset.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);

    await expect(
      this.sheetsBar.tab(0),
      this.pageErrors.length > 0 ? `the fixture page threw: ${this.pageErrors.join(' | ')}` : undefined,
    ).toBeVisible();
  }

  /**
   * Scrolls the grid so the given row and column sit at its top-left.
   */
  async scrollTo(row: number, col: number): Promise<void> {
    await this.page.evaluate(([toRow, toCol]) => {
      window.hot.scrollViewportTo({ row: toRow, col: toCol, verticalSnap: 'top', horizontalSnap: 'start' });
    }, [row, col]);
  }

  /**
   * The first row and column the grid shows in full.
   */
  firstVisible(): Promise<{ row: number | null, col: number | null }> {
    return this.page.evaluate(() => ({
      row: window.hot.getFirstFullyVisibleRow(),
      col: window.hot.getFirstFullyVisibleColumn(),
    }));
  }

  /**
   * Switches to the sheet under the given tab and waits until the bar reports it active.
   */
  async switchToSheet(index: number): Promise<void> {
    await this.sheetsBar.clickTab(index);
    await this.sheetsBar.expectActiveTab(index);
  }

  /**
   * Adds a sheet of 200 rows and 40 columns through the API, makes it the active one, and waits until
   * the bar shows it active.
   */
  async addAndShowSheet(name: string): Promise<void> {
    await this.page.evaluate((sheetName) => {
      const sheetsBar = window.hot.getPlugin('sheetsBar');
      const added = sheetsBar.addSheet(sheetName, Handsontable.helper.createSpreadsheetData(200, 40));

      sheetsBar.setActiveSheet(added.id);
    }, name);
    await expect.poll(() => this.activeSheetName()).toBe(name);
  }

  /**
   * The name of the sheet the bar reports active.
   */
  activeSheetName(): Promise<string | undefined> {
    return this.page.evaluate(() => window.hot.getPlugin('sheetsBar').getSheets().find(sheet => sheet.isActive)?.name);
  }
}
