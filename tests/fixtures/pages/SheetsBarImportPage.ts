import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Locator, type Page } from '@playwright/test';
import { assertKnownBundle, awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';
import { SheetsBarPage } from './SheetsBarPage';

/**
 * The xlsx fixtures the core package's unit tests read.
 */
const XLSX_FIXTURES = new URL('../../../handsontable/src/utils/xlsxEngine/__tests__/fixtures/', import.meta.url);

/**
 * Page object for the sheets-bar-import fixture (fixtures/demo/sheets-bar-import.html): an 'Alpha' and a
 * 'Beta' sheet of three columns each, and a file input that imports the picked workbook into the visible
 * sheet with its styles. The tab strip comes from `SheetsBarPage`.
 */
export class SheetsBarImportPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly sheetsBar: SheetsBarPage;
  readonly pageErrors: string[] = [];
  #imports = 0;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.sheetsBar = new SheetsBarPage(page, theme, bundle);
  }

  async goto(): Promise<void> {
    assertKnownBundle(this.bundle, '(page, theme, bundle)');
    this.page.on('pageerror', error => this.pageErrors.push(error.message));

    await this.page.goto(`/tests/fixtures/demo/sheets-bar-import.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell by visual row and column, as drawn in the master table.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Picks one of the committed xlsx fixtures in the file input, the way a user picks a file, and waits
   * until the import into the visible sheet has finished.
   */
  async importFixture(name: string): Promise<void> {
    this.#imports += 1;

    await this.page.getByTestId('import-input').setInputFiles({
      name: `${name}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: readFileSync(fileURLToPath(new URL(`${name}.xlsx`, XLSX_FIXTURES))),
    });
    await expect(this.page.getByTestId('status')).toHaveText(String(this.#imports));
  }

  /**
   * Shows the sheet at a tab position, by clicking its tab.
   */
  async showSheet(index: number): Promise<void> {
    await this.sheetsBar.clickTab(index);
    await this.sheetsBar.expectActiveTab(index);
  }

  /**
   * Opens the editor of a cell with Enter, and tells whether it opened.
   */
  async opensEditor(row: number, col: number): Promise<boolean> {
    await this.page.evaluate(([r, c]) => window.hot.selectCell(r, c), [row, col]);
    await this.page.keyboard.press('Enter');

    const opened = await this.page.evaluate(() => window.hot.getActiveEditor()?.isOpened() ?? false);

    await this.page.keyboard.press('Escape');

    return opened;
  }

  columnCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.countCols());
  }
}
