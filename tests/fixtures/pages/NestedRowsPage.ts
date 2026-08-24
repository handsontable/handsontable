import { type Page, type Locator, expect } from '@playwright/test';

/**
 * One recorded collapse/expand hook call, as captured by the fixture.
 *
 * The index arrays are physical row indexes - a collapsed parent nested inside another
 * collapsed parent is trimmed and has no visual index to report.
 */
export interface NestedRowsHookCall {
  name: string;
  args: unknown[];
}

/**
 * Page Object for the nested-rows public API fixture.
 *
 * Row headers live in the left overlay (`.ht_clone_inline_start`), so the collapse/expand
 * button locator is scoped to it - an unscoped match would also hit the master table copy
 * and fail Playwright's strict mode.
 */
export class NestedRowsPage {
  readonly page: Page;
  readonly theme: string;
  readonly grid: Locator;
  readonly rowHeaderOverlay: Locator;

  constructor(page: Page, theme = 'main') {
    this.page = page;
    this.theme = theme;
    this.grid = page.getByTestId('grid');
    this.rowHeaderOverlay = page.locator('.ht_clone_inline_start');
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   *
   * `block` makes the matching `before*` hook return false, so a spec can cover cancelling
   * without injecting script into the page.
   */
  async goto(options: { block?: 'rowCollapse' | 'rowExpand' } = {}): Promise<void> {
    const block = options.block ? `&block=${options.block}` : '';

    await this.page.goto(`/tests/fixtures/demo/nested-rows.html?theme=${this.theme}${block}`);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** The collapse/expand button in a row header, by visual row index. */
  collapseButton(row: number): Locator {
    return this.rowHeaderOverlay.locator('tbody tr').nth(row).locator('.ht_nestingButton');
  }

  /** How many rows the grid currently shows. Collapsing trims rows, so this shrinks. */
  countRows(): Promise<number> {
    return this.page.evaluate(() => window.hot.countRows());
  }

  /** The text of the first column, top to bottom - what the user actually sees. */
  visibleNames(): Promise<string[]> {
    return this.page.evaluate(() => {
      const rows: string[] = [];

      for (let row = 0; row < window.hot.countRows(); row++) {
        rows.push(String(window.hot.getDataAtCell(row, 0)));
      }

      return rows;
    });
  }

  /** Physical row indexes of the parents that are collapsed right now. */
  collapsedParents(): Promise<number[]> {
    return this.page.evaluate(() => window.hot.getPlugin('nestedRows').getCollapsedParents());
  }

  /** Replace the data with `updateData()`, which is documented to keep the rows' states. */
  async updateData(data: unknown[]): Promise<void> {
    await this.page.evaluate(rows => window.hot.updateData(rows), data);
  }

  /** Replace the data with `loadData()`, which is documented to reset the rows' states. */
  async loadData(data: unknown[]): Promise<void> {
    await this.page.evaluate(rows => window.hot.loadData(rows), data);
  }

  /** Every collapse/expand hook call the fixture has recorded, in order. */
  hookLog(): Promise<NestedRowsHookCall[]> {
    return this.page.evaluate(() => window.hookLog);
  }

  /** Just the names of the recorded hook calls, in firing order. */
  async hookNames(): Promise<string[]> {
    return (await this.hookLog()).map(call => call.name);
  }

  /** Clear the recorded hooks, so an assertion only sees the action under test. */
  async resetHookLog(): Promise<void> {
    await this.page.evaluate(() => {
      window.hookLog.length = 0;
    });
  }

  /**
   * Call one of the plugin's public methods in the page and return its result.
   *
   * Kept generic so the spec reads as the API call it is making, rather than growing one
   * wrapper method per plugin method.
   */
  callPlugin(method: string, ...args: unknown[]): Promise<unknown> {
    return this.page.evaluate(
      ({ method: name, args: methodArgs }) => {
        const plugin = window.hot.getPlugin('nestedRows') as unknown as Record<string, (...a: unknown[]) => unknown>;

        return plugin[name](...methodArgs);
      },
      { method, args }
    );
  }
}
