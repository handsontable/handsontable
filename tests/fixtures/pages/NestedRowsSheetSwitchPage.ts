import { expect, type Page } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { NestedRowsPage } from './NestedRowsPage';
import { SheetsBarPage } from './SheetsBarPage';

/**
 * Page object for the nested-rows-sheet-switch fixture (fixtures/demo/nested-rows-sheet-switch.html):
 * a two-sheet workbook with NestedRows on, one tree per sheet. The row header and data probes come
 * from `NestedRowsPage` and the tab strip from `SheetsBarPage`, so the three stay in step.
 */
export class NestedRowsSheetSwitchPage extends NestedRowsPage {
  readonly bundle: string;
  readonly sheetsBar: SheetsBarPage;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    super(page, theme);
    this.bundle = bundle;
    this.sheetsBar = new SheetsBarPage(page, theme, bundle);
  }

  override async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/nested-rows-sheet-switch.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Switches to the sheet under the given tab and waits until the bar reports it active.
   */
  async switchToSheet(index: number): Promise<void> {
    await this.sheetsBar.clickTab(index);
    await this.sheetsBar.expectActiveTab(index);
  }
}
