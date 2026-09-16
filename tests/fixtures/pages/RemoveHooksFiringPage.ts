import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import type { RemoveHookRecord } from './windowTypes';

/**
 * Page object for DEV-2523: how often `beforeRemoveRow`/`afterRemoveRow` and their column
 * counterparts fire when the removed rows or columns are not one solid block.
 *
 * `alter()` folds the selection into runs of neighboring indexes and deletes one run at a time,
 * so the hooks fire once per run rather than once per selected row. The gestures below are the
 * reported ones – Ctrl/Cmd-clicking headers, then "Remove rows" from the context menu – so the
 * assertions describe what a user actually triggers, not just what the API accepts.
 */
export class RemoveHooksFiringPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /** Navigate to the fixture and wait for the bundle and first cell. */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/remove-hooks-firing.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A data cell addressed by its current visual row and column. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** The row header of a visual row, in the inline-start overlay that renders them. */
  rowHeader(row: number): Locator {
    return this.grid.locator('.ht_clone_inline_start tbody tr').nth(row).locator('th').first();
  }

  /**
   * The column header of a visual column. The corner cell occupies the first `th` of the
   * header row whenever `rowHeaders` is on, so the data columns start one further along.
   */
  columnHeader(col: number): Locator {
    return this.grid.locator('.ht_clone_top thead tr').first().locator('th').nth(col + 1);
  }

  /**
   * Select whole rows the way the report describes: a plain click opens the selection, a
   * Ctrl/Cmd-click adds each further row as its own range. Neighboring rows stay separate
   * ranges here, which is exactly what `alter()` then folds back into runs.
   */
  async ctrlSelectRows(rows: number[]): Promise<void> {
    for (const [position, row] of rows.entries()) {
      await this.rowHeader(row).click(position === 0 ? {} : { modifiers: ['ControlOrMeta'] });
    }
  }

  /** The column equivalent of `ctrlSelectRows`. */
  async ctrlSelectColumns(columns: number[]): Promise<void> {
    for (const [position, col] of columns.entries()) {
      await this.columnHeader(col).click(position === 0 ? {} : { modifiers: ['ControlOrMeta'] });
    }
  }

  /**
   * Open the context menu on a header and run one of the remove commands. The labels are
   * pluralized by the item itself, so both forms are accepted.
   */
  async removeViaContextMenu(header: Locator, command: 'rows' | 'columns'): Promise<void> {
    await header.click({ button: 'right' });

    const menu = this.page.locator('.htContextMenu.handsontable').locator('visible=true');

    await expect(menu).toBeVisible();

    const label = command === 'rows' ? /^Remove rows?$/ : /^Remove columns?$/;

    await menu.locator('.ht_master td').filter({ hasText: label }).click();
    await expect(menu).toBeHidden();
  }

  /** Every recorded hook call, in firing order. */
  hookLog(): Promise<RemoveHookRecord[]> {
    return this.page.evaluate(() => window.removeHookLog);
  }

  /** The recorded calls for one hook, in firing order. */
  async callsFor(hook: RemoveHookRecord['hook']): Promise<RemoveHookRecord[]> {
    return (await this.hookLog()).filter(entry => entry.hook === hook);
  }

  /** The first column of every remaining row, which identifies the rows that survived. */
  remainingRowIds(): Promise<string[]> {
    return this.page.evaluate(() => {
      const ids: string[] = [];

      for (let row = 0; row < window.hot.countRows(); row++) {
        ids.push(String(window.hot.getDataAtCell(row, 0)));
      }

      return ids;
    });
  }

  /** The first row of every remaining column, which identifies the columns that survived. */
  remainingColumnIds(): Promise<string[]> {
    return this.page.evaluate(() => {
      const ids: string[] = [];

      for (let col = 0; col < window.hot.countCols(); col++) {
        ids.push(String(window.hot.getDataAtCell(0, col)));
      }

      return ids;
    });
  }

  /** Run `alter()` directly, for the `[[index, amount], ...]` array form the public API documents. */
  alter(action: string, index: number[][], source: string): Promise<void> {
    return this.page.evaluate(
      (args: { action: string, index: number[][], source: string }) => {
        window.hot.alter(args.action, args.index, 1, args.source);
      },
      { action, index, source }
    );
  }

  /** Run `alter()` with a plain start index and a count, the other form the public API takes. */
  alterWithAmount(action: string, index: number, amount: number, source: string): Promise<void> {
    return this.page.evaluate(
      (args: { action: string, index: number, amount: number, source: string }) => {
        window.hot.alter(args.action, args.index, args.amount, args.source);
      },
      { action, index, amount, source }
    );
  }

  /** Rebuild the grid with extra settings, clearing the log. Used for the sorted case. */
  rebuild(overrides: Record<string, unknown>): Promise<boolean> {
    return this.page.evaluate(
      (settings: Record<string, unknown>) => window.initRemoveHooksGrid(settings),
      overrides
    );
  }

  /** Sort a column through the plugin, so visual and physical row indexes stop matching. */
  async sortByColumn(column: number, sortOrder: 'asc' | 'desc'): Promise<void> {
    await this.page.evaluate(
      (config: { column: number, sortOrder: 'asc' | 'desc' }) => {
        window.hot.getPlugin('columnSorting').sort(config);
      },
      { column, sortOrder }
    );
  }

  /**
   * Make the fixture's `beforeRemoveRow` replace the live `physicalRows` array with this list.
   * Pass `null` to leave the array alone.
   */
  setBeforeRemoveRowRewrite(physicalRows: number[] | null): Promise<boolean> {
    return this.page.evaluate(
      (rows: number[] | null) => window.setBeforeRemoveRowRewrite(rows),
      physicalRows
    );
  }
}
