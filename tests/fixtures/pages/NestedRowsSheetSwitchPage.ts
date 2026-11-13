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
  readonly sheetsBar: SheetsBarPage;

  readonly fixture: 'nested-rows-sheet-switch' | 'nested-rows-sheet-blank-keys';

  constructor(
    page: Page,
    theme = 'main',
    bundle = 'umd',
    fixture: 'nested-rows-sheet-switch' | 'nested-rows-sheet-blank-keys' = 'nested-rows-sheet-switch',
  ) {
    super(page, theme, bundle);
    this.sheetsBar = new SheetsBarPage(page, theme, bundle);
    this.fixture = fixture;
  }

  override async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/${this.fixture}.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** Whether the NestedRows plugin reports itself as running. */
  isPluginEnabled(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.getPlugin('nestedRows').enabled);
  }

  /** What the grid currently holds for the `nestedRows` setting. */
  nestedRowsSetting(): Promise<unknown> {
    return this.page.evaluate(() => window.hot.getSettings().nestedRows);
  }

  /**
   * Whether every source row of the shown sheet is an object, the only row shape NestedRows takes.
   */
  sourceRowsAreObjects(): Promise<boolean> {
    return this.page.evaluate(() => {
      const rows = window.hot.getSourceData();

      return rows.length > 0 && rows.every(row => row !== null && typeof row === 'object' && !Array.isArray(row));
    });
  }

  /**
   * Opens the fixture with an `activeSheet` no sheet holds, so the grid opens on the first sheet.
   */
  async gotoWithOutOfRangeActiveSheet(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/${this.fixture}.html?theme=${this.theme}&bundle=${this.bundle}&activeSheet=out-of-range`
    );
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * The keys of the shown sheet's first source row, which the grid reads its columns from when
   * neither `columns` nor `dataSchema` is set.
   */
  firstSourceRowKeys(): Promise<string[]> {
    return this.page.evaluate(() => Object.keys(window.hot.getSourceDataAtRow(0) ?? {}));
  }

  /**
   * How many columns the grid shows.
   */
  countCols(): Promise<number> {
    return this.page.evaluate(() => window.hot.countCols());
  }

  /**
   * Switches to the sheet under the given tab and waits until the bar reports it active.
   */
  async switchToSheet(index: number): Promise<void> {
    await this.sheetsBar.clickTab(index);
    await this.sheetsBar.expectActiveTab(index);
  }
}
