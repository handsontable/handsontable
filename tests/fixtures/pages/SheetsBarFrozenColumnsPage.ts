import { expect, type Locator, type Page } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { SheetsBarPage } from './SheetsBarPage';

/**
 * Page object for the sheets-bar-frozen-columns fixture (fixtures/demo/sheets-bar-frozen-columns.html):
 * a two-sheet workbook, a 30x5 sheet that freezes nothing and a 30x9 sheet that freezes its first
 * two columns. The tab strip comes from `SheetsBarPage`, so the two stay in step.
 */
export class SheetsBarFrozenColumnsPage {
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

    await this.page.goto(`/tests/fixtures/demo/sheets-bar-frozen-columns.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);

    await expect(
      this.cell(0, 0),
      this.pageErrors.length > 0 ? `the fixture page threw: ${this.pageErrors.join(' | ')}` : undefined,
    ).toBeVisible();
  }

  /**
   * A data cell by visual row and column, as drawn in the master table. A frozen column is
   * drawn in the master too, under its clone in the inline-start overlay.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Switches to the sheet under the given tab and waits until the bar reports it active.
   */
  async switchToSheet(index: number): Promise<void> {
    await this.sheetsBar.clickTab(index);
    await this.sheetsBar.expectActiveTab(index);
  }

  selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => window.hot.getSelected());
  }

  /**
   * Switches sheets through the API and returns the selection hooks the switch fired, in order.
   */
  selectionHooksOfSwitch(name: string): Promise<string[]> {
    return this.page.evaluate((sheetName) => {
      const fired: string[] = [];
      const hookNames = ['afterDeselect', 'afterSelection', 'afterSelectionEnd'] as const;
      const listeners = hookNames.map((hookName) => {
        const listener = () => {
          fired.push(hookName);
        };

        window.hot.addHook(hookName, listener);

        return [hookName, listener] as const;
      });

      try {
        window.hot.getPlugin('sheetsBar').setActiveSheet(sheetName);
      } finally {
        listeners.forEach(([hookName, listener]) => window.hot.removeHook(hookName, listener));
      }

      return fired;
    }, name);
  }

  /**
   * Switches sheets through the API, returning the message of an error the call threw, or `null`.
   */
  setActiveSheet(name: string): Promise<string | null> {
    return this.page.evaluate((sheetName) => {
      try {
        window.hot.getPlugin('sheetsBar').setActiveSheet(sheetName);

        return null;
      } catch (error) {
        return (error as Error).message;
      }
    }, name);
  }
}
