import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

type HotWindow = Window & {
  hot: {
    getSelected(): number[][] | undefined;
    countRows(): number;
  };
  buildGrid(extraSettings?: Record<string, unknown>): void;
};

/**
 * Page Object for `fixtures/demo/tab-moves-vertical.html`: a grid between a "Before grid" and an
 * "After grid" text input, built with the settings a spec passes.
 */
export class TabMovesVerticalPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly grid: Locator;
  readonly beforeInput: Locator;
  readonly afterInput: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.beforeInput = page.getByRole('textbox', { name: 'Before grid' });
    this.afterInput = page.getByRole('textbox', { name: 'After grid' });
  }

  /**
   * Opens the fixture and builds the grid with the settings merged over the fixture defaults.
   *
   * @param {object} settings JSON-serializable settings.
   */
  async goto(settings: Record<string, unknown>): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/tab-moves-vertical.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await this.page.evaluate(extraSettings => (window as unknown as HotWindow).buildGrid(extraSettings), settings);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError !== null) {
      throw new Error(`The tab-moves-vertical fixture failed to build the grid: ${initError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A cell of the master table, by visual coordinates.
   *
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   * @returns {Locator}
   */
  cell(row: number, column: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${column}`);
  }

  /**
   * Presses a key a number of times, one press at a time.
   *
   * @param {string} key The key or chord to press.
   * @param {number} [times] How many presses.
   */
  async press(key: string, times = 1): Promise<void> {
    for (let press = 0; press < times; press++) {
      // eslint-disable-next-line no-await-in-loop
      await this.page.keyboard.press(key);
    }
  }

  /**
   * The grid's selection, as `getSelected()` returns it.
   *
   * @returns {Promise<number[][] | undefined>}
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.getSelected());
  }

  /**
   * The number of rows the grid has.
   *
   * @returns {Promise<number>}
   */
  async countRows(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.countRows());
  }
}
