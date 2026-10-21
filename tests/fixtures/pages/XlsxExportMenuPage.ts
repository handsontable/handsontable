import { type Page, type Locator, type Download } from '@playwright/test';
import { awaitBundle } from '../bundle';
import './windowTypes';

/**
 * Page object for the Export > To Excel fixture (`xlsx-export-menu.html`): a grid with
 * `exportFile` and the context menu on, whose xlsx engine the `engine` query param picks. The page
 * loads ExcelJS on both legs.
 */
export class XlsxExportMenuPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly engine: 'exceljs' | 'native';

  constructor(page: Page, theme = 'main', bundle = 'umd', engine: 'exceljs' | 'native' = 'exceljs') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.engine = engine;
  }

  /** Open the fixture and wait for the bundle. */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/xlsx-export-menu.html?theme=${this.theme}&bundle=${this.bundle}&engine=${this.engine}`);
    await awaitBundle(this.page);
  }

  /**
   * Count the worksheets ExcelJS creates from now on (read with `addWorksheetCalls()`). The file a
   * spec reads back looks the same whichever engine wrote it, so only this tells the legs apart.
   */
  async countExcelJsWorksheets(): Promise<void> {
    await this.page.evaluate(() => {
      const w = window as unknown as Record<string, any>;
      const { prototype } = w.ExcelJS.Workbook;
      const addWorksheet = prototype.addWorksheet;

      w.addWorksheetCalls = 0;
      prototype.addWorksheet = function(...args: unknown[]) {
        w.addWorksheetCalls += 1;

        return addWorksheet.apply(this, args);
      };
    });
  }

  /** How many worksheets ExcelJS created since `countExcelJsWorksheets()`. */
  async addWorksheetCalls(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as Record<string, any>).addWorksheetCalls);
  }

  /** Select whole rows through `selectRows()`. */
  async selectRows(fromRow: number, toRow: number): Promise<void> {
    await this.page.evaluate(([from, to]) => window.hot.selectRows(from, to), [fromRow, toRow]);
  }

  /**
   * A cell of a frozen row, as the user sees it: the copy in the top overlay clone. Every row the
   * fixture's `fixedRowsTop` covers renders there as well as in the master.
   */
  frozenCell(row: number, col: number): Locator {
    return this.page.locator('.ht_clone_top').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Right-click a frozen cell, open the Export submenu, and click To Excel. Resolves with the
   * download it starts. Right-click a cell inside the selection, or the click replaces it.
   */
  async exportToExcelFromFrozenCell(row: number, col: number): Promise<Download> {
    await this.frozenCell(row, col).click({ button: 'right' });
    await this.page.locator('.htContextMenu td', { hasText: 'Export' }).hover();

    const toExcel = this.page.locator('.htContextMenuSub_Export td', { hasText: 'To Excel' });
    const [download] = await Promise.all([this.page.waitForEvent('download'), toExcel.click()]);

    return download;
  }
}
