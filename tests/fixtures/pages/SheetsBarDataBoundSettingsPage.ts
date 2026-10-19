import { expect, type Locator, type Page } from '@playwright/test';
import { awaitBundle } from '../bundle';

export type DataBoundWorkbook = 'nestedRows' | 'nestedRowsPadded' | 'nestedSummary' | 'columnSummary' | 'formulasSummary' | 'mergeCells';

/**
 * Page object for the sheets-bar-data-bound-settings fixture
 * (fixtures/demo/sheets-bar-data-bound-settings.html): a workbook, picked by `?workbook=`, whose
 * sheets declare a plugin that reads the grid's data when its settings are applied, opened on the
 * sheet `?open=` names. The fixture records every `console.error` and `console.warn` the page makes.
 */
export class SheetsBarDataBoundSettingsPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  async goto(workbook: DataBoundWorkbook, { open }: { open?: 0 | 1 } = {}): Promise<void> {
    this.page.on('pageerror', error => this.pageErrors.push(error.message));

    const openParam = open === undefined ? '' : `&open=${open}`;

    await this.page.goto(
      `/tests/fixtures/demo/sheets-bar-data-bound-settings.html?theme=${this.theme}&bundle=${this.bundle}&workbook=${workbook}${openParam}`
    );
    await awaitBundle(this.page);

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
   * The cells of the master table that carry a `rowspan` or `colspan` attribute.
   */
  spannedCells(): Locator {
    return this.page.locator('.ht_master td[rowspan], .ht_master td[colspan]');
  }

  /**
   * Switches sheets through the API, one name after another, and returns what each
   * `setActiveSheet()` call answered.
   */
  switchTo(...names: string[]): Promise<boolean[]> {
    return this.page.evaluate(sheetNames => sheetNames
      .map(name => window.hot.getPlugin('sheetsBar').setActiveSheet(name)), names);
  }

  activeSheetName(): Promise<string | undefined> {
    return this.page.evaluate(() => window.hot.getPlugin('sheetsBar').getSheets().find(sheet => sheet.isActive)?.name);
  }

  consoleMessages(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { consoleMessages: string[] }).consoleMessages);
  }

  isPluginEnabled(pluginName: 'nestedRows' | 'columnSummary'): Promise<boolean> {
    return this.page.evaluate(name => window.hot.getPlugin(name).enabled, pluginName);
  }

  isRowHidden(row: number): Promise<boolean> {
    return this.page.evaluate(visualRow => window.hot.getPlugin('hiddenRows').isHidden(visualRow), row);
  }

  countRows(): Promise<number> {
    return this.page.evaluate(() => window.hot.countRows());
  }

  dataAtCell(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(([r, c]) => window.hot.getDataAtCell(r, c), [row, col]);
  }

  /**
   * A cell of a sheet's own declared data array, read from the workbook the fixture passed in,
   * so a write into a sheet that is not shown is seen too.
   */
  declaredSheetCell(sheetIndex: number, row: number, col: number): Promise<unknown> {
    return this.page.evaluate(([index, r, c]) => {
      const { workbook } = window as unknown as { workbook: { sheets: Array<{ data: unknown[][] }> } };

      return workbook.sheets[index].data[r][c];
    }, [sheetIndex, row, col]);
  }

  /**
   * The number of top-level entries in a sheet's own declared data array.
   */
  declaredSheetLength(sheetIndex: number): Promise<number> {
    return this.page.evaluate((index) => {
      const { workbook } = window as unknown as { workbook: { sheets: Array<{ data: unknown[] }> } };

      return workbook.sheets[index].data.length;
    }, sheetIndex);
  }
}
