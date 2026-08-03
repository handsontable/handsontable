import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the "nested table in a cell" fixture (issue #4363).
 *
 * Selectors live here so specs read as intent. Data cells are addressed by the
 * stable `data-testid` the fixture renderer stamps; the row-header locator is
 * scoped to the inline-start overlay clone because header cells are duplicated
 * across overlays (the overlay-clone gotcha the authoring skill calls out).
 */
export class NestedTablePage {
  readonly page: Page;
  readonly theme: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main') {
    this.page = page;
    this.theme = theme;
    this.grid = page.getByTestId('grid');
  }

  /** Navigate to the fixture and wait for a real render (host cell visible). */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/nested-table.html?theme=${this.theme}`);
    await expect(this.hostCell()).toBeVisible();
    await expect(this.nestedCell()).toBeVisible();
  }

  /** The grid data cell (visual row/col) in the master overlay. */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /** The cell (0, 1) that hosts the user's nested `<table>`. */
  hostCell(): Locator {
    return this.cell(0, 1);
  }

  /** A `<td>` inside the user's nested table (never a grid cell). */
  nestedCell(): Locator {
    return this.page.locator('.ht_master').getByTestId('nested-cell');
  }

  /** The row-header `<th>` for a visual row, read from the inline-start overlay clone. */
  rowHeader(row: number): Locator {
    return this.page
      .locator('.ht_clone_inline_start .htCore tbody tr')
      .nth(row)
      .locator('th[role="rowheader"]');
  }

  /** Read a computed style property off a locator's element. */
  async computedStyle(locator: Locator, property: string): Promise<string> {
    return locator.evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop), property);
  }

  /** The vertical gap (px) between a row header's bottom edge and its data row's bottom edge. */
  async rowHeaderBottomGap(row: number): Promise<number> {
    const header = await this.rowHeader(row).boundingBox();
    const dataCell = await this.cell(row, 1).boundingBox();

    if (!header || !dataCell) {
      throw new Error(`Missing bounding box for row ${row}`);
    }

    return Math.abs((header.y + header.height) - (dataCell.y + dataCell.height));
  }
}
