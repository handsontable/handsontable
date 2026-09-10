import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the nested-parent removal fixture (DEV-56).
 *
 * Row headers are rendered in the left overlay (`.ht_clone_inline_start`), so the header locator is
 * scoped to it - an unscoped match would also hit the master table's copy and fail Playwright's
 * strict mode.
 */
export class NestedRowsRemoveParentPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly rowHeaderOverlay: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.rowHeaderOverlay = page.locator('.ht_clone_inline_start');
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/nested-rows-remove-parent.html?theme=${this.theme}&bundle=${this.bundle}`);
    // The bundle first, or a slow leg fails pointing at a missing cell instead of the real cause.
    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A single data cell in the master overlay, by visual row/column.
   *
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The row header of one visual row.
   *
   * @param {number} row Visual row index.
   */
  rowHeader(row: number): Locator {
    return this.rowHeaderOverlay.locator('tbody tr').nth(row).locator('th').first();
  }

  /**
   * The text of the first column, top to bottom - what the user actually sees.
   *
   * A row the plugin failed to remove has no source row behind it, so it reads back as the string
   * `'null'` here. That is the whole symptom of DEV-56, which is why the assertions compare names
   * rather than only counting rows.
   */
  visibleNames(): Promise<string[]> {
    return this.page.evaluate(() => {
      const rows: string[] = [];

      for (let row = 0; row < window.hot.countRows(); row++) {
        rows.push(String(window.hot.getDataAtCell(row, 0)));
      }

      return rows;
    });
  }

  /**
   * How many rows the grid currently shows. Collapsing trims rows, so this shrinks.
   */
  countRows(): Promise<number> {
    return this.page.evaluate(() => window.hot.countRows());
  }

  /**
   * How many rows the source data still holds. On a nested-rows grid `getSourceData()` returns the
   * FLATTENED tree, one entry per row at every depth - not the top-level objects.
   *
   * This is the other half of the bug. The source data and the row index maps are kept in step by
   * two different mechanisms: removing the parent object drops its whole subtree from the data,
   * while the maps only lose the rows this plugin listed. So the data was always right and the row
   * count was too high - pairing the two numbers is what shows that.
   */
  sourceRowCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.getSourceData().length);
  }

  /**
   * Remove one row the way a user does it: right-click its row header, then pick "Remove row".
   *
   * @param {number} row Visual row index.
   */
  async removeRowViaContextMenu(row: number): Promise<void> {
    await this.rowHeader(row).click({ button: 'right' });

    const menu = this.page.locator('.htContextMenu:visible').last();

    await expect(menu).toBeVisible();
    await menu.getByText('Remove row', { exact: true }).click();
    await expect(menu).toBeHidden();
  }

  /**
   * Remove one row through the API, for the cases where the gesture is not what is under test.
   *
   * @param {number} row Visual row index.
   */
  async removeRow(row: number): Promise<void> {
    await this.page.evaluate(visualRow => window.hot.alter('remove_row', visualRow), row);
  }

  /**
   * Collapse one parent through the plugin's public API.
   *
   * @param {number} row Visual row index of the parent.
   */
  async collapseParent(row: number): Promise<void> {
    await this.page.evaluate(
      visualRow => window.hot.getPlugin('nestedRows').collapseParent(visualRow), row);
  }
}
