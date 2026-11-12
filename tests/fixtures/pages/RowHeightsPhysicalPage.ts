import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

export type RowHeightsPhysicalMode = 'nested' | 'trim' | 'sort' | 'move' | 'function';

/**
 * Page Object for the `rowHeights` physical-index fixture. Rows are named P, C1, C2 and Q, in that
 * physical order, with heights of 100, 50, 40 and 70 px.
 */
export class RowHeightsPhysicalPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture and wait for the grid to render. `mode` picks what reorders or trims
   * the rows.
   */
  async goto(mode: RowHeightsPhysicalMode): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/row-heights-physical.html?theme=${this.theme}&bundle=${this.bundle}&mode=${mode}`);
    await awaitBundle(this.page);
    await expect(this.cell('P')).toBeVisible();
  }

  /** The first data cell of the row with the given name, via its stable test id. */
  cell(name: string): Locator {
    return this.page.getByTestId(`cell-${name}-0`);
  }

  /** Collapse the children of the parent at a visual row, the way the row header button does. */
  async collapse(row: number): Promise<void> {
    await this.page.evaluate(r => (window as any).hot.getPlugin('nestedRows').collapseParent(r), row);
  }

  /** Expand the children of the parent at a visual row. */
  async expand(row: number): Promise<void> {
    await this.page.evaluate(r => (window as any).hot.getPlugin('nestedRows').expandParent(r), row);
  }

  /** Trim rows by their physical indexes. */
  async trim(physicalRows: number[]): Promise<void> {
    await this.page.evaluate((rows) => {
      const hot = (window as any).hot;

      hot.getPlugin('trimRows').trimRows(rows);
      hot.render();
    }, physicalRows);
  }

  /** Sort by a column, the way a header click does. */
  async sort(column: number, sortOrder: 'asc' | 'desc'): Promise<void> {
    await this.page.evaluate(([col, order]) => {
      (window as any).hot.getPlugin('columnSorting').sort({ column: col, sortOrder: order });
    }, [column, sortOrder] as const);
  }

  /** Move a row through the plugin and re-render, the way a completed drag does. */
  async moveRow(from: number, to: number): Promise<void> {
    await this.page.evaluate(([f, t]) => {
      const hot = (window as any).hot;

      hot.getPlugin('manualRowMove').moveRow(f, t);
      hot.render();
    }, [from, to]);
  }

  /** The row names in the order they are shown. */
  async visibleOrder(): Promise<string[]> {
    return this.page.evaluate(() => (window as any).hot.getDataAtCol(0));
  }

  /**
   * Assert the rendered height of the row with the given name. The height a row declares includes
   * its 1px bottom border, so the cell box can differ from it by a pixel.
   */
  async expectHeight(name: string, height: number): Promise<void> {
    await expect.poll(async() => {
      const box = await this.cell(name).boundingBox();

      return box ? Math.abs(box.height - height) <= 1 : `row ${name} not rendered`;
    }, { message: `row ${name} is ${height}px tall` }).toBe(true);
  }
}
