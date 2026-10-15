import { type Page, type Locator, expect } from '@playwright/test';
import type { Bundle } from '../bundle';
import { awaitBundle } from '../bundle';
import './windowTypes';

/**
 * Page Object for the Formulas object-rows fixture (GitHub #13852): object rows read through
 * `columns` with nested paths, one declared column without `data`, and a fill handle to drag.
 */
export class FormulasObjectColumnsPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly fillHandle: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    // The handle of a single-cell selection.
    this.fillHandle = page.locator('.ht_master .wtBorder.current.corner');
  }

  /** Navigate to the fixture and wait until the grid and the formulas engine are up. */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/formulas-object-columns.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toHaveText('Row 1');
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** The visual column that reads the `extra.<index>` path. */
  extraColumn(index: number): number {
    // `name` and the column without `data` come first.
    return index + 2;
  }

  /** Select a single cell through the API, which keeps the pointer free for the drag that follows. */
  async selectCell(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      window.hot.selectCell(r, c);
    }, [row, col]);
    await expect(this.fillHandle).toBeVisible();

    // The handle exists before the selection border is laid out, as a 2x2 box at the grid's corner,
    // and a press on it there arms nothing. Wait for it to sit on the end corner of the selected cell.
    await expect.poll(async() => {
      const cell = await this.cell(row, col).boundingBox();
      const handle = await this.fillHandle.boundingBox();

      if (!cell || !handle) {
        return false;
      }

      return Math.abs(handle.x + handle.width / 2 - (cell.x + cell.width)) <= 8 &&
        Math.abs(handle.y + handle.height / 2 - (cell.y + cell.height)) <= 8;
    }, { message: 'the fill handle never moved onto the selected cell' }).toBe(true);
  }

  /** Drag the fill handle of the selected cell onto `(row, col)` with a real pointer. */
  async dragFillHandleTo(row: number, col: number): Promise<void> {
    const handle = await this.fillHandle.boundingBox();
    const target = await this.cell(row, col).boundingBox();

    if (!handle || !target) {
      throw new Error('the fill handle or the target cell is not rendered');
    }

    await this.page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 6 });
    await this.page.mouse.up();
  }

  /** `getSourceDataArray()`, the array the engine sheet is built from. */
  async sourceDataArray(): Promise<unknown[][]> {
    return this.page.evaluate(() => window.hot.getSourceDataArray());
  }

  /** The number of columns the grid declares. */
  async countCols(): Promise<number> {
    return this.page.evaluate(() => window.hot.countCols());
  }
}
