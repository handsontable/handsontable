import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the `colWidths` physical-index fixture.
 */
export class ColWidthsPhysicalPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture and wait for the grid to render. `form` picks the array or the
   * function form of `colWidths`.
   */
  async goto(form: 'array' | 'function' = 'array'): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/col-widths-physical.html?theme=${this.theme}&bundle=${this.bundle}&form=${form}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** Move a column through the plugin and re-render, the way a completed drag does. */
  async moveColumn(from: number, to: number): Promise<void> {
    await this.page.evaluate(([f, t]) => {
      const hot = (window as any).hot;

      hot.getPlugin('manualColumnMove').moveColumn(f, t);
      hot.render();
    }, [from, to]);
  }

  /** Assert the rendered width of the cell at a visual position. */
  async expectWidth(col: number, width: number): Promise<void> {
    await expect.poll(async() => (await this.cell(0, col).boundingBox())?.width).toBeCloseTo(width, 0);
  }

  /** Assert the horizontal distance between the left edges of two visual columns' cells. */
  async expectOffset(fromCol: number, toCol: number, distance: number): Promise<void> {
    await expect.poll(async() => {
      const from = await this.cell(0, fromCol).boundingBox();
      const to = await this.cell(0, toCol).boundingBox();

      return to && from ? Math.round(to.x - from.x) : null;
    }).toBe(distance);
  }
}
