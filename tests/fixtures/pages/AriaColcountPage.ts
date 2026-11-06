import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

type HotWindow = Window & {
  hot: {
    updateSettings(settings: Record<string, unknown>): void;
    loadData(data: unknown[][]): void;
    alter(action: string, index: number, amount?: number): void;
    countCols(): number;
  };
  buildGrid(extraSettings?: Record<string, unknown>): void;
};

/**
 * Page Object for the aria-colcount fixture.
 *
 * The state under test is the `aria-colcount` attribute of the grid's root element, which the
 * fixture stamps with `data-testid="grid-root"` after every build.
 */
export class AriaColcountPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly grid: Locator;
  readonly root: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.root = page.getByTestId('grid-root');
  }

  /**
   * Navigate to the fixture and wait for the default grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/aria-colcount.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await this.expectBuilt();
  }

  /**
   * Rebuilds the grid with extra settings merged over the fixture defaults.
   *
   * @param {object} extraSettings JSON-serializable settings.
   */
  async rebuild(extraSettings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(
      settings => (window as unknown as HotWindow).buildGrid(settings),
      extraSettings
    );
    await this.expectBuilt();
  }

  /**
   * Calls `updateSettings()` on the grid.
   *
   * @param {object} settings JSON-serializable settings.
   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(
      nextSettings => (window as unknown as HotWindow).hot.updateSettings(nextSettings),
      settings
    );
  }

  /**
   * Replaces the data with a generated dataset through `loadData()`.
   *
   * @param {number} rows The number of rows.
   * @param {number} columns The number of columns.
   */
  async loadData(rows: number, columns: number): Promise<void> {
    await this.page.evaluate(([rowCount, columnCount]) => {
      const data = Array.from({ length: rowCount }, (_, row) =>
        Array.from({ length: columnCount }, (__, column) => `${row}-${column}`));

      (window as unknown as HotWindow).hot.loadData(data);
    }, [rows, columns]);
  }

  /**
   * Calls `alter()` on the grid.
   *
   * @param {string} action The alter action, for example `insert_col_start`.
   * @param {number} index The visual index the action starts at.
   * @param {number} amount How many columns to add or remove.
   */
  async alter(action: string, index: number, amount = 1): Promise<void> {
    await this.page.evaluate(
      ([alterAction, alterIndex, alterAmount]) =>
        (window as unknown as HotWindow).hot.alter(alterAction as string, alterIndex as number, alterAmount as number),
      [action, index, amount] as const
    );
  }

  /**
   * The number of data columns the grid reports.
   */
  async countCols(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.countCols());
  }

  /**
   * Waits until the grid root carries the expected `aria-colcount`.
   *
   * @param {number} expected The expected column count, row-header columns included.
   */
  async expectColcount(expected: number): Promise<void> {
    await expect(this.root).toHaveAttribute('aria-colcount', String(expected));
  }

  /**
   * Fails loud on a constructor throw, then waits for the rendered root.
   */
  private async expectBuilt(): Promise<void> {
    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.root).toBeVisible();
  }
}
