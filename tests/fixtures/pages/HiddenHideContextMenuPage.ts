import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the DEV-164 fixture: the HiddenRows / HiddenColumns "Hide" context-menu items.
 *
 * The behaviour under test lives entirely in each item's `hidden()` callback, so the queries here
 * are about menu presence, not geometry: set the hidden state through the plugin API, open the
 * context menu on the top-left corner (a whole-table select-all), and count the matching entries.
 */
export class HiddenHideContextMenuPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly menu: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.menu = page.locator('.htContextMenu.handsontable');
  }

  /**
   * Navigate to the fixture, wait for the bundle, and rethrow a constructor failure as itself so a
   * broken build reads as its own error rather than as a menu that never opened.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/hidden-hide-context-menu.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Grid failed to initialize: ${initError}`);
    }

    await expect(this.page.getByTestId('cell-0-0')).toBeVisible();
  }

  /**
   * Hide the given visual rows (plugin API), leaving the columns visible.
   *
   * @param {number[]} rows Visual row indexes to hide.
   */
  async hideRows(rows: number[]): Promise<void> {
    await this.page.evaluate(indexes => (window as any).hideRows(indexes), rows);
  }

  /**
   * Hide the given visual columns (plugin API), leaving the rows visible.
   *
   * @param {number[]} columns Visual column indexes to hide.
   */
  async hideColumns(columns: number[]): Promise<void> {
    await this.page.evaluate(indexes => (window as any).hideColumns(indexes), columns);
  }

  /**
   * Trim the given visual rows (a trimming map — removes them from the DOM without the HiddenRows
   * plugin hiding anything). Used to reach `renderable === 0 && nothing hidden`.
   *
   * @param {number[]} rows Visual row indexes to trim.
   */
  async trimRows(rows: number[]): Promise<void> {
    await this.page.evaluate(indexes => (window as any).trimRows(indexes), rows);
  }

  /**
   * Replace the data with an empty set: no rows, no columns, headers still rendered, nothing hidden
   * by either plugin. Reaches `renderable === 0 && nothing hidden` on both axes at once.
   */
  async loadEmpty(): Promise<void> {
    await this.page.evaluate(() => (window as any).loadEmpty());
  }

  /**
   * Right-click the top-left corner. This is the whole-table select-all the ticket is about: the
   * corner mousedown resolves to `selectAll(true, true)`, so `isSelectedByCorner()` is true when
   * the menu opens.
   */
  async openCornerMenu(): Promise<void> {
    await this.grid.locator('.ht_clone_top_inline_start_corner thead th').first().click({ button: 'right' });
    await expect(this.menu).toBeVisible();
  }

  /**
   * Right-click a row header — the non-corner `isSelectedByRowHeader()` path. The header is picked
   * by visual row, so it must be a currently visible (rendered) row.
   *
   * @param {number} row Visual row index whose header to right-click.
   */
  async openRowHeaderMenu(row: number): Promise<void> {
    // The header cell is stamped on both the master table and the frozen clone; the visible one is
    // in the inline-start overlay, so scope there rather than picking the hidden master copy.
    await this.grid.locator('.ht_clone_inline_start').getByTestId(`rowheader-${row}`).click({ button: 'right' });
    await expect(this.menu).toBeVisible();
  }

  /**
   * Right-click a column header — the non-corner `isSelectedByColumnHeader()` path.
   *
   * @param {number} col Visual column index whose header to right-click.
   */
  async openColumnHeaderMenu(col: number): Promise<void> {
    // The visible column header lives in the top overlay clone, not the master table.
    await this.grid.locator('.ht_clone_top').getByTestId(`colheader-${col}`).click({ button: 'right' });
    await expect(this.menu).toBeVisible();
  }

  /**
   * A retrying locator for the menu entry whose label matches `label` exactly. Anchored regexes
   * (`/^Hide rows?$/`) match the singular and plural forms without matching a "Show" item or any
   * future entry that merely contains the words. Assert with `toHaveCount()` so the check retries
   * while the menu settles.
   *
   * @param {RegExp} label Exact-match pattern for the entry's text.
   * @returns {Locator}
   */
  item(label: RegExp): Locator {
    return this.menu.locator('td').filter({ hasText: label });
  }

  /**
   * Whether the current selection is a whole-table corner select-all. A precondition for the
   * corner tests: without it, a "Hide" item reading 0 could mean the right-click stopped producing
   * a corner selection (the first `hidden()` gate), not the behavior under test.
   *
   * @returns {Promise<boolean>}
   */
  async isCornerSelected(): Promise<boolean> {
    return this.page.evaluate(() => (window as any).hot.selection.isSelectedByCorner());
  }
}
