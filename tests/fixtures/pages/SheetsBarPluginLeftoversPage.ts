import { expect, type Locator, type Page } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';
import { SheetsBarPage } from './SheetsBarPage';

/**
 * The grids the sheets-bar-plugin-leftovers fixture builds, one per page load.
 */
export type LeftoversScenario =
  | 'summary-workbook'
  | 'summary-plain'
  | 'collapsible-workbook'
  | 'collapsible-plain'
  | 'tall-header-workbook'
  | 'tall-header-plain';

/**
 * The height of the column header row, read in one evaluation from the master table and from the
 * top overlay that draws the header the user sees.
 */
export type HeaderRowHeights = {
  master: number;
  top: number;
};

/**
 * Page object for the sheets-bar-plugin-leftovers fixture (fixtures/demo/sheets-bar-plugin-leftovers.html):
 * plugin state that one sheet leaves behind on the next, and the same state on a plain grid. The
 * `scenario` picks the grid: a ColumnSummary total, CollapsibleColumns over NestedHeaders, or a
 * three-line column header. The tab strip comes from `SheetsBarPage`.
 */
export class SheetsBarPluginLeftoversPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly sheetsBar: SheetsBarPage;
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.sheetsBar = new SheetsBarPage(page, theme, bundle);
  }

  async goto(scenario: LeftoversScenario): Promise<void> {
    this.page.on('pageerror', error => this.pageErrors.push(error.message));

    await this.page.goto(
      `/tests/fixtures/demo/sheets-bar-plugin-leftovers.html?theme=${this.theme}&bundle=${this.bundle}&scenario=${scenario}`
    );
    await awaitBundle(this.page);

    const buildError = await this.page.evaluate(() => (window as any).htBuildError ?? null);

    if (buildError) {
      throw new Error(`The fixture grid threw while it was built: ${buildError}`);
    }

    await expect(
      this.cell(0, 0),
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
   * The CollapsibleColumns indicators of the header the user sees (the top overlay).
   */
  collapsibleIndicators(): Locator {
    return this.page.locator('.ht_clone_top .collapsibleIndicator');
  }

  /**
   * Switches to the sheet under the given tab and waits until the bar reports it active.
   */
  async switchToSheet(index: number): Promise<void> {
    await this.sheetsBar.clickTab(index);
    await this.sheetsBar.expectActiveTab(index);
  }

  /**
   * The source data array the fixture declared for sheet `A` or `B` of the summary scenarios, as it
   * is now.
   */
  declaredSheetData(name: 'A' | 'B'): Promise<unknown[][]> {
    return this.page.evaluate(sheetName => (window as any).sheetData[sheetName], name);
  }

  /**
   * Replaces the grid's data through `loadData()` with sheet `A` or `B` of the summary scenarios,
   * the same array object every time.
   */
  async loadDeclaredData(name: 'A' | 'B'): Promise<void> {
    await this.page.evaluate((sheetName) => {
      (window as any).hot.loadData((window as any).sheetData[sheetName]);
    }, name);
  }

  /**
   * Replaces the grid's data with a fresh 3x3 spreadsheet through `loadData()`.
   */
  async loadFreshData(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).hot.loadData((window as any).Handsontable.helper.createSpreadsheetData(3, 3));
    });
  }

  /**
   * Turns on the two-level NestedHeaders layout of the collapsible scenarios through `updateSettings()`.
   */
  async enableNestedHeaders(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).hot.updateSettings({ nestedHeaders: (window as any).nestedHeadersSetting });
    });
  }

  /**
   * Sets the column headers through `updateSettings()`.
   */
  async setColHeaders(colHeaders: string[]): Promise<void> {
    await this.page.evaluate((headers) => {
      (window as any).hot.updateSettings({ colHeaders: headers });
    }, colHeaders);
  }

  /**
   * Renders the grid again through `render()`.
   */
  async render(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).hot.render();
    });
  }

  /**
   * The column header row's height in the master table and in the top overlay, read in one evaluation.
   */
  headerRowHeights(): Promise<HeaderRowHeights> {
    return this.page.evaluate(() => {
      const read = (selector: string) => {
        const row = document.querySelector(`${selector} thead tr`);

        return row ? row.getBoundingClientRect().height : -1;
      };

      return { master: read('.ht_master'), top: read('.ht_clone_top') };
    });
  }
}
