import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the fixture that sets `wordWrap: false` with a custom `noWordWrapClassName`
 * (DEV-239).
 */
export class NoWordWrapClassNamePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture and waits for the bundle and the first data cell.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/no-word-wrap-class-name.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Sets the `wordWrap` meta of a cell and renders the grid.
   */
  async setWordWrap(row: number, col: number, wordWrap: boolean): Promise<void> {
    await this.page.evaluate(([r, c, value]) => {
      window.hot.setCellMeta(r as number, c as number, 'wordWrap', value);
      window.hot.render();
    }, [row, col, wordWrap]);
  }
}
