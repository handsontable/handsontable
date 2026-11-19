import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the
// full instance type, and narrowing it here would be a TS2430 conflict. Every access is cast.
interface FixtureWindow {
  hot: {
    getData(): unknown[][];
    getShortcutManager(): {
      getContext(name: string): { addShortcut(shortcut: Record<string, unknown>): void } | undefined,
    };
    getSelectedRangeActive(): { highlight: { row: number, col: number } } | undefined;
    getSelectedRange(): unknown[] | undefined;
    addHook(name: string, callback: (...args: unknown[]) => void): void;
    getSelectedRangeLast(): { from: { row: number, col: number }, to: { row: number, col: number } } | undefined;
    selectCell(row: number, col: number): boolean;
  };
}

/**
 * Page Object for the fixture with a checkbox column next to a text column and `navigableHeaders`
 * on, which Space has to toggle from a selected header (DEV-928).
 */
export class CheckboxHeaderSpacePage {
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
    await this.page.goto(`/tests/fixtures/demo/checkbox-header-space.html?theme=${this.theme}&bundle=${this.bundle}`);
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
   * Returns a column header cell (the corner cell is skipped).
   */
  columnHeader(col: number): Locator {
    return this.page.locator('.ht_clone_top thead tr:last-child th').nth(col + 1);
  }

  /**
   * Returns the corner cell above the row headers.
   */
  corner(): Locator {
    return this.page.locator('.ht_clone_top_inline_start_corner thead th').first();
  }

  /**
   * Returns a row header cell.
   */
  rowHeader(row: number): Locator {
    return this.page.locator('.ht_clone_inline_start tbody tr th').nth(row);
  }

  /**
   * Counts every `afterChange` the grid fires from now on, in `window.changeCount`.
   */
  async countChanges(): Promise<void> {
    await this.page.evaluate(() => {
      const win = window as unknown as FixtureWindow & { changeCount: number };

      win.changeCount = 0;
      win.hot.addHook('afterChange', (changes) => {
        if (changes) {
          win.changeCount += 1;
        }
      });
    });
  }

  /**
   * Registers a grid Space shortcut of its own and counts its calls in `window.spaceCalls`. The key reaches it
   * only when the checkbox shortcut lets the key through.
   */
  async countSpaceShortcutCalls(): Promise<void> {
    await this.page.evaluate(() => {
      const win = window as unknown as FixtureWindow & { spaceCalls: number };

      win.spaceCalls = 0;
      win.hot.getShortcutManager().getContext('grid')?.addShortcut({
        keys: [['Space']],
        callback: () => {
          win.spaceCalls += 1;
        },
        group: 'spaceProbe',
      });
    });
  }

  /**
   * Returns how many times the shortcut of `countSpaceShortcutCalls()` ran.
   */
  async spaceShortcutCalls(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { spaceCalls: number }).spaceCalls);
  }

  /**
   * Returns how many `afterChange` calls `countChanges()` has seen.
   */
  async changeCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { changeCount: number }).changeCount);
  }

  /**
   * Returns the coordinates of the focused cell of the active selection layer, and how many layers there are.
   */
  async focus(): Promise<{ row: number, col: number, layers: number } | null> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as FixtureWindow;
      const highlight = hot.getSelectedRangeActive()?.highlight;

      return highlight ? { row: highlight.row, col: highlight.col, layers: hot.getSelectedRange()?.length ?? 0 } : null;
    });
  }

  /**
   * Returns the whole source data, as the grid holds it.
   */
  async data(): Promise<unknown[][]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getData());
  }

  /**
   * Selects a cell through the API, header coordinates (a negative row or column) included.
   */
  async selectCell(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => (window as unknown as FixtureWindow).hot.selectCell(r, c), [row, col]);
  }
}
