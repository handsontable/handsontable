import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the nested-parent removal fixture (DEV-56).
 *
 * Row headers are rendered in the left overlay (`.ht_clone_inline_start`), so the header locator is
 * scoped to that overlay inside the grid – an unscoped match would also hit the master table's copy
 * and fail Playwright's strict mode, and a match on the whole page could pick up a second grid (the
 * context menu is itself a Handsontable instance).
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
    this.rowHeaderOverlay = this.grid.locator('.ht_clone_inline_start');
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
   * The first column as the browser has actually PAINTED it, top to bottom.
   *
   * This is the assertion that matches what was reported – a rendered blank row. Reading the data
   * layer instead would miss a regression that leaves removed rows on screen, because `#onFilterData`
   * sets `#skipRender` and redraws stay suppressed until the `#onAfterRemoveRow` timeout clears it.
   */
  renderedNames(): Promise<string[]> {
    return this.page.evaluate(() => {
      const rows = document.querySelectorAll('#grid .ht_master tbody tr');

      return Array.from(rows).map((row) => {
        const firstCell = row.querySelector('td');

        return firstCell ? firstCell.textContent ?? '' : '';
      });
    });
  }

  /**
   * The first column read from the data layer, top to bottom.
   *
   * A row the plugin failed to remove has no source row behind it, so it reads back as the string
   * `'null'` here. Paired with {@link NestedRowsRemoveParentPage#renderedNames} this separates "the
   * data is wrong" from "the paint is stale".
   */
  dataNames(): Promise<string[]> {
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
   * FLATTENED tree, one entry per row at every depth – not the top-level objects.
   *
   * This is the other half of the bug. The source data and the row index maps are kept in step by
   * two different mechanisms: removing the parent object drops its whole subtree from the data,
   * while the maps only lose the rows this plugin listed. So the data was always right and the row
   * count was too high – pairing the two numbers is what shows that.
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
   * Remove rows through the API, for the cases where the gesture is not what is under test.
   *
   * @param {number} row Visual row index.
   * @param {number} [amount] How many rows to remove.
   */
  async removeRow(row: number, amount = 1): Promise<void> {
    await this.page.evaluate(
      ({ visualRow, count }) => window.hot.alter('remove_row', visualRow, count),
      { visualRow: row, count: amount });
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

  /**
   * Pushes a child straight into the live source tree and renders, WITHOUT re-caching.
   *
   * This is the shape that makes the flatten cache and the tree disagree: `render()` is not one of
   * the calls that runs `rewriteCache()`. An app that mutates the data it was handed and repaints
   * lands here, so a removal must not read the subtree's size from the live tree.
   *
   * @param {number} row Physical row index of the parent to push into.
   * @param {string} name Value for the new child's `name` property.
   */
  async pushChildWithoutRecaching(row: number, name: string): Promise<void> {
    await this.page.evaluate(({ parentRow, childName }) => {
      const source = window.hot.getSourceData() as Array<{ __children?: unknown[] }>;
      const children = source[parentRow]?.__children;

      if (Array.isArray(children)) {
        children.push({ name: childName });
      }

      window.hot.render();
    }, { parentRow: row, childName: name });
  }
}
