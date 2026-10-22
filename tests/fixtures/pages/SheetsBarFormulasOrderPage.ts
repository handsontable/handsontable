import { expect, type Locator, type Page } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

export type FormulasOrderWorkbook =
  'sortedReport' | 'summary' | 'sortedData' | 'movedColumns' | 'sortedFormulas' | 'sortedSum' | 'showFormulas'
  | 'quotedNames';

/**
 * Page object for the sheets-bar-formulas-order fixture (fixtures/demo/sheets-bar-formulas-order.html):
 * a workbook, picked by `?workbook=`, whose formulas sheets share one HyperFormula engine. The fixture
 * records every `console.error` and `console.warn` the page makes.
 */
export class SheetsBarFormulasOrderPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  async goto(workbook: FormulasOrderWorkbook): Promise<void> {
    this.page.on('pageerror', error => this.pageErrors.push(error.message));

    await this.page.goto(
      `/tests/fixtures/demo/sheets-bar-formulas-order.html?theme=${this.theme}&bundle=${this.bundle}&workbook=${workbook}`
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
   * Switches sheets through the API, one name after another, and returns what each
   * `setActiveSheet()` call answered.
   */
  switchTo(...names: string[]): Promise<boolean[]> {
    return this.page.evaluate(sheetNames => sheetNames
      .map(name => window.hot.getPlugin('sheetsBar').setActiveSheet(name)), names);
  }

  renameSheet(name: string, newName: string): Promise<boolean> {
    return this.page.evaluate(([from, to]) => {
      const sheetsBar = window.hot.getPlugin('sheetsBar');
      const sheet = sheetsBar.getSheets().find(descriptor => descriptor.name === from)!;

      return sheetsBar.renameSheet(sheet.id, to);
    }, [name, newName]);
  }

  removeSheet(name: string): Promise<boolean> {
    return this.page.evaluate((sheetName) => {
      const sheetsBar = window.hot.getPlugin('sheetsBar');
      const sheet = sheetsBar.getSheets().find(descriptor => descriptor.name === sheetName)!;

      return sheetsBar.removeSheet(sheet.id);
    }, name);
  }

  addSheet(name: string, data: unknown[][]): Promise<void> {
    return this.page.evaluate(([sheetName, sheetData]) => {
      window.hot.getPlugin('sheetsBar').addSheet(sheetName as string, sheetData as unknown[][]);
    }, [name, data]);
  }

  /**
   * Selects a cell, presses Enter to open its editor, and returns the text the editor shows.
   */
  async openEditor(row: number, col: number): Promise<string> {
    await this.page.evaluate(([r, c]) => window.hot.selectCell(r, c), [row, col]);
    await this.page.keyboard.press('Enter');
    await expect.poll(() => this.page.evaluate(() => window.hot.getActiveEditor()?.isOpened() ?? false)).toBe(true);

    return this.page.evaluate(() => String(window.hot.getActiveEditor()!.getValue()));
  }

  sort(column: number, sortOrder: 'asc' | 'desc'): Promise<void> {
    return this.page.evaluate(([col, order]) => {
      window.hot.getPlugin('columnSorting').sort({ column: col as number, sortOrder: order as 'asc' | 'desc' });
    }, [column, sortOrder]);
  }

  moveColumn(column: number, target: number): Promise<void> {
    return this.page.evaluate(([from, to]) => {
      window.hot.getPlugin('manualColumnMove').moveColumn(from, to);
      window.hot.render();
    }, [column, target]);
  }

  moveRow(row: number, target: number): Promise<void> {
    return this.page.evaluate(([from, to]) => {
      window.hot.getPlugin('manualRowMove').moveRow(from, to);
      window.hot.render();
    }, [row, target]);
  }

  alter(action: 'insert_row_above' | 'remove_row', index: number, amount = 1): Promise<void> {
    return this.page.evaluate(([name, at, count]) => {
      window.hot.alter(name as 'insert_row_above', at as number, count as number);
    }, [action, index, amount]);
  }

  setDataAtCell(row: number, col: number, value: unknown): Promise<void> {
    return this.page.evaluate(([r, c, v]) => {
      window.hot.setDataAtCell(r as number, c as number, v);
    }, [row, col, value]);
  }

  getData(): Promise<unknown[][]> {
    return this.page.evaluate(() => window.hot.getData());
  }

  showFormulas(): Promise<void> {
    return this.page.evaluate(() => window.hot.getPlugin('formulas').showFormulas());
  }

  isShowingFormulas(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.getPlugin('formulas').isShowingFormulas());
  }

  consoleMessages(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { consoleMessages: string[] }).consoleMessages);
  }

  /**
   * A cell of a sheet's own declared data array, so a write into a sheet that is not shown is seen too.
   */
  declaredSheetCell(sheetIndex: number, row: number, col: number): Promise<unknown> {
    return this.page.evaluate(([index, r, c]) => {
      const { workbook } = window as unknown as { workbook: { sheets: Array<{ data: unknown[][] }> } };

      return workbook.sheets[index].data[r][c];
    }, [sheetIndex, row, col]);
  }
}
