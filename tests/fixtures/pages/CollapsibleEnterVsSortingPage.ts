import { type Locator, type Page, expect } from '@playwright/test';
import { assertKnownBundle, awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';

export type SortingPlugin = 'columnSorting' | 'multiColumnSorting';

/**
 * Page Object for the collapsible-enter-vs-sorting fixture: a grid with nested headers where the
 * bottom-most header row holds a collapsible group ("E", columns 4-5) next to plain sortable headers.
 */
export class CollapsibleEnterVsSortingPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly sorting: SortingPlugin;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd', sorting: SortingPlugin = 'columnSorting') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.sorting = sorting;
  }

  async goto(): Promise<void> {
    assertKnownBundle(this.bundle, 'constructor(page, theme, bundle, sorting)');
    await this.page.goto(
      `/tests/fixtures/demo/collapsible-enter-vs-sorting.html?theme=${this.theme}&bundle=${this.bundle}&sorting=${this.sorting}`
    );
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.page.locator('.ht_clone_top .collapsibleIndicator').first()).toBeVisible();
  }

  /**
   * Put the selection on a header cell and press the real Enter key. `row` is -1 for the bottom-most header
   * row, -2 for the one above it.
   */
  async pressEnterOnHeader(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      const hot = (window as any).hot;

      hot.selectCell(r, c);
      hot.listen();
    }, [row, col]);
    await this.page.keyboard.press('Enter');
  }

  /**
   * The cells of the first data row in the master table, so a test can see which columns are drawn.
   */
  firstRowCells(): Locator {
    return this.page.locator('.ht_master tbody tr').first().locator('td');
  }

  /**
   * Visual indexes of the columns currently hidden by a collapsed group.
   */
  async collapsedColumns(): Promise<number[]> {
    return this.page.evaluate(() => (window as any).hot.getPlugin('collapsibleColumns').getCollapsedColumns());
  }

  /**
   * The active sort configuration of the sorting plugin under test.
   */
  async sortConfig(): Promise<Array<{ column: number, sortOrder: string }>> {
    return this.page.evaluate(
      (key) => (window as any).hot.getPlugin(key).getSortConfig(),
      this.sorting,
    );
  }

  /**
   * Turn the sorting plugin on or off. Turning it on registers its `Enter` shortcut again.
   */
  async setSorting(enabled: boolean): Promise<void> {
    await this.page.evaluate(([key, value]) => {
      (window as any).hot.updateSettings({ [key as string]: value });
    }, [this.sorting, enabled]);
  }

  /**
   * Turn CollapsibleColumns on or off. Turning it on registers its `Enter` shortcut again.
   */
  async setCollapsible(enabled: boolean): Promise<void> {
    await this.page.evaluate((value) => {
      (window as any).hot.updateSettings({ collapsibleColumns: value });
    }, enabled);
  }
}
