import { expect, type Locator, type Page } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page object for the nested-rows-sheet-switch fixture (fixtures/demo/nested-rows-sheet-switch.html):
 * a two-sheet workbook with NestedRows on, one tree per sheet.
 */
export class NestedRowsSheetSwitchPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly rowHeaderOverlay: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.rowHeaderOverlay = page.locator('.ht_clone_inline_start');
  }

  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/nested-rows-sheet-switch.html?theme=${this.theme}&bundle=${this.bundle}`);
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
   * The collapse/expand button in a row header, by visual row index. Scoped to the row header
   * overlay, since the master table carries a copy of every header too.
   */
  collapseButton(row: number): Locator {
    return this.rowHeaderOverlay.locator('tbody tr').nth(row).locator('.ht_nestingButton');
  }

  /**
   * Switches to the sheet under the given tab and waits until the bar reports it active.
   */
  async clickTab(index: number): Promise<void> {
    await this.tab(index).locator('.ht-sheets-bar__tab-label').click();
    await expect(this.tab(index)).toHaveAttribute('aria-current', 'true');
  }

  /**
   * The first column of every row the grid shows, read in one evaluation.
   */
  async visibleNames(): Promise<unknown[]> {
    return this.page.evaluate(() => window.hot.getData().map(row => row[0]));
  }
}
