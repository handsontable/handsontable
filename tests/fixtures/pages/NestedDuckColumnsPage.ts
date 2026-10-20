import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page object for the DEV-3497 fixture: object data with nested properties and no `columns`
 * option. Cells are addressed by `data-testid="cell-<row>-<col>"`.
 */
export class NestedDuckColumnsPage {
  /**
   * The Playwright page the fixture is driven through.
   */
  readonly page: Page;
  /**
   * The active theme, passed through to the fixture URL.
   */
  readonly theme: string;
  /**
   * The active bundle, passed through to the fixture URL.
   */
  readonly bundle: string;

  /**
   * Wires up the page object for one theme/bundle leg.
   */
  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture and wait for the first cell to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/nested-duck-columns.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);

    const initError = await this.page.getByTestId('grid').getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell by visual row and column.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The property each visual column reads, in column order.
   */
  async columnProps(): Promise<unknown[]> {
    return this.page.evaluate(() => {
      const hot = window.hot as unknown as { countCols: () => number, colToProp: (col: number) => unknown };

      return Array.from({ length: hot.countCols() }, (_, col) => hot.colToProp(col));
    });
  }

  /**
   * Edit a cell the way a user does: select it, type, commit with Enter.
   */
  async edit(row: number, col: number, text: string): Promise<void> {
    await this.cell(row, col).click();
    await this.page.keyboard.type(text);
    await this.page.keyboard.press('Enter');
  }

  /**
   * The source row object the grid holds for a row, as plain JSON.
   */
  async sourceRow(row: number): Promise<unknown> {
    return this.page.evaluate((r) => JSON.parse(JSON.stringify((window as unknown as { sourceData: unknown[] }).sourceData[r])), row);
  }
}
