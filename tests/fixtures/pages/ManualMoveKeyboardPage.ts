import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

type MoveRecord = {
  axis: 'column' | 'row';
  columns?: number[];
  rows?: number[];
  finalIndex: number;
  dropIndex: number | undefined;
  orderChanged: boolean;
};

type HotWindow = Window & {
  hot: {
    getDataAtRow(row: number): unknown[];
    getDataAtCol(col: number): unknown[];
    getSelected(): number[][] | undefined;
    selectCell(row: number, col: number, endRow?: number, endCol?: number): boolean;
    selectCells(ranges: number[][]): boolean;
    updateSettings(settings: Record<string, unknown>): void;
    getPlugin(name: 'undoRedo'): { isUndoAvailable(): boolean };
    getSelectedRangeActive(): { highlight: { row: number; col: number } } | undefined;
    addHook(name: string, callback: (...args: unknown[]) => unknown): void;
  };
  moves: MoveRecord[];
  vetoed: number;
  buildGrid(extraSettings?: Record<string, unknown>): void;
};

/**
 * Page Object for the fixture of moving columns and rows without a drag: the keyboard move and the menu items.
 */
export class ManualMoveKeyboardPage {
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
   * Navigates to the fixture and waits for the default grid.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/manual-move-keyboard.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await this.expectBuilt();
  }

  /**
   * Rebuilds the grid with extra settings merged over the fixture defaults.
   *
   * @param {object} extraSettings JSON-serializable settings.
   */
  async rebuild(extraSettings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(settings => (window as unknown as HotWindow).buildGrid(settings), extraSettings);
    await this.expectBuilt();
  }

  /**
   * Calls `updateSettings()` on the grid.
   *
   * @param {object} settings JSON-serializable settings.
   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(nextSettings => (window as unknown as HotWindow).hot.updateSettings(nextSettings), settings);
  }

  /**
   * Makes every `beforeColumnMove` and `beforeRowMove` refuse the move.
   */
  async vetoMoves(): Promise<void> {
    await this.page.evaluate(() => {
      const win = window as unknown as HotWindow;
      const veto = () => {
        win.vetoed += 1;

        return false;
      };

      win.vetoed = 0;
      win.hot.addHook('beforeColumnMove', veto);
      win.hot.addHook('beforeRowMove', veto);
    });
  }

  /**
   * Reads how many moves `vetoMoves()` refused.
   */
  async vetoedCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as HotWindow).vetoed);
  }

  /**
   * Tells whether the grid has an undo step.
   */
  async isUndoAvailable(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.getPlugin('undoRedo').isUndoAvailable());
  }

  /**
   * Reads the focus of the active selection layer.
   */
  async focus(): Promise<{ row: number; col: number } | undefined> {
    return this.page.evaluate(() => {
      const highlight = (window as unknown as HotWindow).hot.getSelectedRangeActive()?.highlight;

      return highlight ? { row: highlight.row, col: highlight.col } : undefined;
    });
  }

  /**
   * Reads the values of the first row, which name the columns in their order (`A1`, `B1`, ...).
   */
  async columnOrder(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.getDataAtRow(0));
  }

  /**
   * Reads the values of the first column, which name the rows in their order (`A1`, `A2`, ...).
   */
  async rowOrder(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.getDataAtCol(0));
  }

  /**
   * Reads the selection as `getSelected()` returns it.
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.getSelected());
  }

  /**
   * Reads the moves the grid reported through `afterColumnMove` and `afterRowMove`.
   */
  async moves(): Promise<MoveRecord[]> {
    return this.page.evaluate(() => (window as unknown as HotWindow).moves);
  }

  /**
   * Selects ranges through the API.
   *
   * @param {number[][]} ranges The ranges, `[row, col, row2, col2]` each.
   */
  async selectCells(ranges: number[][]): Promise<void> {
    await this.page.evaluate(nextRanges => (window as unknown as HotWindow).hot.selectCells(nextRanges), ranges);
  }

  /**
   * Returns a data cell of the master table.
   *
   * @param {number} row The rendered row.
   * @param {number} col The rendered column.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master tbody tr').nth(row).locator('td').nth(col);
  }

  /**
   * Returns the header of a rendered column, in the top overlay.
   *
   * @param {number} col The rendered column.
   */
  columnHeader(col: number): Locator {
    // the first header cell of the row is the corner above the row headers
    return this.grid.locator('.ht_clone_top thead tr:last-child th').nth(col + 1);
  }

  /**
   * Returns the label of a rendered column's header. A press on the middle of a header can land on the dropdown
   * menu button, which opens the menu instead of selecting the column.
   *
   * @param {number} col The rendered column.
   */
  columnHeaderLabel(col: number): Locator {
    return this.columnHeader(col).locator('.colHeader');
  }

  /**
   * Returns the header of a rendered row, in the inline-start overlay.
   *
   * @param {number} row The rendered row.
   */
  rowHeader(row: number): Locator {
    return this.grid.locator('.ht_clone_inline_start tbody tr').nth(row).locator('th');
  }

  /**
   * Returns the polite live region of the announcer.
   */
  politeRegion(): Locator {
    return this.page.locator('[role="status"][aria-live="polite"]');
  }

  /**
   * Returns an item of the open context menu by its text.
   *
   * @param {string} text The text of the item.
   */
  contextMenuItem(text: string): Locator {
    return this.page.locator('.htContextMenu .htCore td').filter({ hasText: new RegExp(`^${text}$`) });
  }

  /**
   * Returns an item of the open dropdown menu by its text.
   *
   * @param {string} text The text of the item.
   */
  dropdownMenuItem(text: string): Locator {
    return this.page.locator('.htDropdownMenu .htCore td').filter({ hasText: new RegExp(`^${text}$`) });
  }

  /**
   * Returns the dropdown menu button of a rendered column's header.
   *
   * @param {number} col The rendered column.
   */
  dropdownButton(col: number): Locator {
    return this.columnHeader(col).locator('.changeType');
  }

  /**
   * Waits until the grid is built, and fails with the constructor's error when it threw.
   */
  async expectBuilt(): Promise<void> {
    await expect(this.grid).not.toHaveAttribute('data-init-error');
    await expect(this.page.getByTestId('grid-root')).toBeVisible();
  }
}
