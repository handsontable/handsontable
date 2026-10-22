import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';

/**
 * Page Object for the grid whose `alter()` hooks can be made to call `hot.render()`.
 */
export class AlterRenderInHookHeadersPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/alter-render-in-hook-headers.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master overlay, by visual row and column.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The rendered column headers, in screen order. The fixture has row headers, so the first cell of the
   * header row is the corner above them and is left out.
   */
  colHeaders(): Locator {
    return this.grid.locator('.ht_clone_top thead th:not(:first-child)');
  }

  /**
   * The rendered row headers, in screen order.
   */
  rowHeaders(): Locator {
    return this.grid.locator('.ht_clone_inline_start tbody th');
  }

  /**
   * Make every listener of `hookName` call `hot.render()`, the way a plugin or an application does.
   */
  async renderFromHook(hookName: 'afterCreateCol' | 'afterRemoveCol' | 'afterCreateRow' | 'afterRemoveRow'):
  Promise<void> {
    await this.page.evaluate((name) => {
      const hot = (window as any).hot;

      hot.addHook(name, () => hot.render());
    }, hookName);
  }

  /**
   * Run `hot.alter()` in the page.
   */
  async alter(action: string, index: number, amount = 1): Promise<void> {
    await this.page.evaluate(([a, i, n]) => (window as any).hot.alter(a, i, n), [action, index, amount] as const);
  }

  /**
   * The column labels the API reports, in visual order.
   */
  async apiColHeaders(): Promise<string[]> {
    return this.page.evaluate(() => {
      const hot = (window as any).hot;

      return Array.from({ length: hot.countCols() }, (_, col) => hot.getColHeader(col));
    });
  }

  /**
   * The row labels the API reports for every row, in visual order.
   */
  async apiRowHeaders(): Promise<string[]> {
    return this.page.evaluate(() => {
      const hot = (window as any).hot;

      return Array.from({ length: hot.countRows() }, (_, row) => String(hot.getRowHeader(row)));
    });
  }

  /**
   * The visual column of the current selection.
   */
  async selectedColumn(): Promise<number> {
    return this.page.evaluate(() => (window as any).hot.getSelectedLast()[1]);
  }
}
