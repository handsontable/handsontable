import { expect, type Locator, type Page } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page object for the sheet-switch-autosize fixture (fixtures/demo/sheet-switch-autosize.html):
 * a two-sheet formula workbook with AutoColumnSize on, a per-switch measurement counter, and a
 * handle on the shared engine.
 */
export class SheetSwitchAutosizePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigates, waits for the bundle to evaluate, then for the first cell to render. Page errors
   * are collected from the start, so a read that throws inside the grid surfaces as the cause
   * instead of as a bare locator timeout.
   */
  async goto(): Promise<void> {
    this.page.on('pageerror', error => this.pageErrors.push(error.message));

    await this.page.goto(`/tests/fixtures/demo/sheet-switch-autosize.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  tab(index: number): Locator {
    return this.page.getByTestId(`sheet-tab-${index}`);
  }

  /**
   * Switches to the sheet under the given tab and waits until the bar reports it active.
   */
  async clickTab(index: number): Promise<void> {
    await this.tab(index).locator('.ht-sheets-bar__tab-label').click();
    await expect(this.tab(index)).toHaveAttribute('aria-current', 'true');
  }

  /**
   * Zeroes the fixture's count of columns AutoColumnSize measured.
   */
  async resetMeasuredColumns(): Promise<void> {
    await this.page.evaluate(() => {
      window.measuredColumns = 0;
    });
  }

  /**
   * How many columns AutoColumnSize measured since the last reset, across every sweep.
   */
  async measuredColumns(): Promise<number> {
    return this.page.evaluate(() => window.measuredColumns ?? 0);
  }

  async columnCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.countCols());
  }

  async columnWidths(): Promise<number[]> {
    return this.page.evaluate(() => Array.from(
      { length: window.hot.countCols() },
      (_, col) => window.hot.getColWidth(col),
    ));
  }

  /**
   * Replaces the active sheet's data through a plain `loadData()` with values the engine has not
   * seen yet, so the engine's `valuesUpdated` batch reports every cell as changed.
   */
  async loadFreshBudget(): Promise<void> {
    await this.page.evaluate(() => window.loadFreshBudget?.());
  }

  async dataAtCell(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(([r, c]) => window.hot.getDataAtCell(r, c), [row, col]);
  }

  /**
   * Removes the active sheet from the engine directly, the way host code sharing the engine can,
   * without the Formulas plugin being told through its own API.
   */
  async removeActiveSheetFromEngine(): Promise<void> {
    await this.page.evaluate(() => {
      const { sheetName } = window.hot.getPlugin('formulas');

      if (sheetName !== null && window.htEngine) {
        window.htEngine.removeSheet(window.htEngine.getSheetId(sheetName));
      }
    });
  }
}
