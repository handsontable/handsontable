import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Which of the fixture's two grids a call addresses.
 */
export type GridName = 'top' | 'bottom';

type TwoGridsWindow = Record<'hotTop' | 'hotBottom', {
  getSelected(): number[][] | undefined,
  getDataAtCell(row: number, column: number): unknown,
  isListening(): boolean,
  rootElement: HTMLElement,
}>;

/**
 * Page Object for `fixtures/demo/two-grids.html`: two grids, each below a text input.
 *
 * What a spec reads from it is page-level state the screenshots of the cross-browser visual suite
 * used to stand in for: which element has the focus, which grid holds a selection and listens to
 * the keyboard, and what a paste wrote.
 */
export class TwoGridsPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture and waits for both grids to have rendered their first cell.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/two-grids.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);

    for (const name of ['top', 'bottom'] as GridName[]) {
      // eslint-disable-next-line no-await-in-loop
      const initError = await this.grid(name).getAttribute('data-init-error');

      if (initError !== null) {
        throw new Error(`The two-grids fixture failed to build the ${name} grid: ${initError}`);
      }

      // eslint-disable-next-line no-await-in-loop
      await expect(this.cell(name, 0, 0)).toBeVisible();
    }
  }

  /**
   * A grid's container.
   *
   * @param {GridName} name Which grid.
   * @returns {Locator}
   */
  grid(name: GridName): Locator {
    return this.page.getByTestId(`grid-${name}`);
  }

  /**
   * The input above a grid.
   *
   * @param {GridName} name Which grid the input sits above.
   * @returns {Locator}
   */
  input(name: GridName): Locator {
    return this.page.getByTestId(`input-${name}`);
  }

  /**
   * A cell of a grid's master table, by visual coordinates.
   *
   * @param {GridName} name Which grid.
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   * @returns {Locator}
   */
  cell(name: GridName, row: number, column: number): Locator {
    return this.grid(name).locator('.ht_master').getByTestId(`cell-${row}-${column}`);
  }

  /**
   * A column header of a grid, in the top overlay that takes a click on it.
   *
   * @param {GridName} name Which grid.
   * @param {number} column The visual column index.
   * @returns {Locator}
   */
  columnHeader(name: GridName, column: number): Locator {
    return this.grid(name).locator('.ht_clone_top').getByTestId(`col-header-${column}`);
  }

  /**
   * Presses Tab, or Shift+Tab, a number of times, one key press at a time.
   *
   * @param {'Tab' | 'Shift+Tab'} key The key to press.
   * @param {number} [times] How many presses.
   */
  async press(key: 'Tab' | 'Shift+Tab', times = 1): Promise<void> {
    for (let press = 0; press < times; press++) {
      // eslint-disable-next-line no-await-in-loop
      await this.page.keyboard.press(key);
    }
  }

  /**
   * What holds the page's focus: one of the fixture's two inputs, one of its two grids (any
   * element inside the grid's root, which is where the grid parks the focus it takes), or `other`.
   *
   * @returns {Promise<string>}
   */
  async focusOwner(): Promise<string> {
    return this.page.evaluate(() => {
      const active = document.activeElement;

      if (active === null) {
        return 'other';
      }

      const testId = active.getAttribute('data-testid');

      if (testId === 'input-top' || testId === 'input-bottom') {
        return testId;
      }

      const grid = active.closest('[data-testid^="grid-"]');

      return grid ? (grid.getAttribute('data-testid') as string) : 'other';
    });
  }

  /**
   * A grid's selection and whether it listens to the keyboard, read in one evaluate.
   *
   * @param {GridName} name Which grid.
   * @returns {Promise<{ selected: number[][] | undefined, listening: boolean }>}
   */
  async gridState(name: GridName): Promise<{ selected: number[][] | undefined, listening: boolean }> {
    return this.page.evaluate((key) => {
      const hot = (window as unknown as TwoGridsWindow)[key];

      return { selected: hot.getSelected(), listening: hot.isListening() };
    }, name === 'top' ? 'hotTop' : 'hotBottom' as 'hotTop' | 'hotBottom');
  }

  /**
   * The value a grid holds at visual coordinates.
   *
   * @param {GridName} name Which grid.
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   * @returns {Promise<unknown>}
   */
  async dataAt(name: GridName, row: number, column: number): Promise<unknown> {
    return this.page.evaluate(([key, r, c]) => (window as unknown as TwoGridsWindow)[key].getDataAtCell(r, c),
      [name === 'top' ? 'hotTop' : 'hotBottom', row, column] as ['hotTop' | 'hotBottom', number, number]);
  }

  /**
   * Makes a column read-only through its header's context menu, the way the visual spec did.
   *
   * @param {GridName} name Which grid.
   * @param {number} column The visual column index.
   */
  async makeColumnReadOnly(name: GridName, column: number): Promise<void> {
    await this.columnHeader(name, column).click({ button: 'right' });

    // Each grid keeps its own context menu container, so the item is looked up across both, and
    // "the menu closed" is no visible menu at all. The item is a checkbox entry: it shows a tick
    // once the column is read-only.
    const item = this.page.locator('.htContextMenu').getByRole('menuitemcheckbox', { name: 'Read only' });

    await expect(item).toBeVisible();
    await item.click();
    await expect(this.page.locator('.htContextMenu:visible')).toHaveCount(0);
  }

  /**
   * The text in the system clipboard.
   *
   * @returns {Promise<string>}
   */
  async clipboardText(): Promise<string> {
    return this.page.evaluate(() => navigator.clipboard.readText());
  }
}
