import { expect, type Locator, type Page } from '@playwright/test';
import { awaitBundle } from '../bundle';

export type SwitchOrderWorkbook =
  'spareRows' | 'cellOption' | 'sameFreeze' | 'largerBorders' | 'movedSummary' | 'deeperHeaders';

/**
 * Page object for the sheets-bar-switch-settings-order fixture
 * (fixtures/demo/sheets-bar-switch-settings-order.html): a workbook, picked by `?workbook=`, whose
 * arriving sheet declares settings that describe its own data. Every page error is collected, so a
 * switch that throws fails the test that made it.
 */
export class SheetsBarSwitchSettingsOrderPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  async goto(workbook: SwitchOrderWorkbook): Promise<void> {
    this.page.on('pageerror', error => this.pageErrors.push(error.message));

    await this.page.goto(
      `/tests/fixtures/demo/sheets-bar-switch-settings-order.html?theme=${this.theme}&bundle=${this.bundle}&workbook=${workbook}`
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
   * The tab of a sheet, found by its accessible name.
   */
  tab(name: string): Locator {
    return this.page.locator('.ht-sheets-bar').getByRole('button', { name, exact: true });
  }

  /**
   * Clicks a sheet's tab and waits until it is the active one.
   */
  async openSheet(name: string): Promise<void> {
    await this.tab(name).click();
    await expect(this.tab(name)).toHaveAttribute('aria-current', 'true');
  }

  /**
   * Selects a cell by clicking it and types a value into it with the keyboard.
   */
  async typeInto(row: number, col: number, value: string): Promise<void> {
    await this.cell(row, col).click();
    await this.page.keyboard.type(value);
    await this.page.keyboard.press('Enter');
  }

  isEditorOpened(): Promise<boolean> {
    return this.page.evaluate(() => !!window.hot.getActiveEditor()?.isOpened());
  }

  dataAtCol(col: number): Promise<unknown[]> {
    return this.page.evaluate(c => window.hot.getDataAtCol(c), col);
  }

  /**
   * A column of a sheet's own declared data array, read from the workbook the fixture passed in.
   */
  declaredSheetColumn(sheetIndex: number, col: number): Promise<unknown[]> {
    return this.page.evaluate(([index, c]) => {
      const { workbook } = window as unknown as { workbook: { sheets: Array<{ data: unknown[][] }> } };

      return workbook.sheets[index].data.map(row => row[c]);
    }, [sheetIndex, col]);
  }

  /**
   * The number of data rows the top overlay draws, which is the number of frozen rows on screen.
   */
  frozenTopRowCount(): Promise<number> {
    return this.page.evaluate(() => document.querySelectorAll('.ht_clone_top .htCore tbody tr').length);
  }

  bordersAt(row: number, col: number): Promise<number> {
    return this.page.evaluate(([r, c]) => window.hot.getPlugin('customBorders').getBorders([[r, c, r, c]]).length,
      [row, col]);
  }

  columnHeaderLevels(): Promise<number> {
    return this.page.evaluate(() => document.querySelectorAll('.ht_master .htCore thead tr').length);
  }

  insertRowAbove(row: number): Promise<void> {
    return this.page.evaluate(r => window.hot.alter('insert_row_above', r, 1), row);
  }
}
