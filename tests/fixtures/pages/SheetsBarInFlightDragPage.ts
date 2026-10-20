import { expect, type Locator } from '@playwright/test';
import { SheetsBarInFlightWorkPage } from './SheetsBarInFlightWorkPage';

/**
 * The `drags` workbook of the sheets-bar-in-flight-work fixture, driven with the real pointer: every
 * gesture starts on 'Alpha' and is still held when the test switches to 'Beta' through the API.
 */
export class SheetsBarInFlightDragPage extends SheetsBarInFlightWorkPage {
  async goto(): Promise<void> {
    await super.goto('drags');
  }

  /**
   * Moves the pointer to the center of an element.
   */
  async #pointAt(element: Locator): Promise<void> {
    const box = await element.boundingBox();

    if (!box) {
      throw new Error('The target element is not rendered.');
    }

    await this.page.mouse.move(box.x + (box.width / 2), box.y + (box.height / 2));
  }

  /**
   * Presses the center of an element and moves the pointer to the center of a cell, in two steps, without
   * releasing.
   */
  async #dragFromTo(element: Locator, target: Locator): Promise<void> {
    await this.#pointAt(element);
    await this.page.mouse.down();
    await this.#pointAt(this.cell(1, 1));
    await this.#pointAt(target);
  }

  /**
   * Starts moving the selected cell by its selection border, held over a cell.
   */
  async startCellMove(toRow: number, toCol: number): Promise<void> {
    await this.selectCell(0, 0);
    await this.#dragFromTo(this.page.locator('.ht_master .wtMoveZone:visible').first(), this.cell(toRow, toCol));
  }

  /**
   * Selects a row by its header and starts dragging it, held over another row's header.
   */
  async startRowMove(fromRow: number, toRow: number): Promise<void> {
    const header = (row: number) => this.page.locator('.ht_clone_inline_start .htCore tbody tr').nth(row).locator('th');

    await header(fromRow).click();
    await this.#dragFromTo(header(fromRow), header(toRow));
  }

  /**
   * Starts resizing a column by its resize handle, held over a cell to its inline end.
   */
  async startColumnResize(column: number): Promise<void> {
    await this.page.mouse.move(0, 0);
    await this.page.locator('.ht_clone_top .htCore thead th').nth(column + 1).hover();

    const handle = this.page.locator('.manualColumnResizer');

    await expect(handle).toBeVisible();
    await this.#dragFromTo(handle, this.cell(0, column + 1));
  }

  /**
   * Selects a cell and starts dragging its fill handle, held over another cell.
   */
  async startFill(toRow: number, toCol: number): Promise<void> {
    await this.selectCell(0, 0);
    await this.#dragFromTo(this.page.locator('.ht_master .wtBorder.corner:visible').first(), this.cell(toRow, toCol));
  }

  /**
   * Starts dragging the top freeze bar, held over a row.
   */
  async startFreezeDrag(toRow: number): Promise<void> {
    await this.#dragFromTo(
      this.page.locator('.ht-freeze-bar--top:not(.ht-freeze-bar--segment)'),
      this.cell(toRow, 0),
    );
  }

  /**
   * Keeps dragging: moves the held pointer through one cell to another.
   */
  async continueDrag(throughRow: number, throughCol: number, toRow: number, toCol: number): Promise<void> {
    await this.#pointAt(this.cell(throughRow, throughCol));
    await this.#pointAt(this.cell(toRow, toCol));
  }

  /**
   * Releases the held pointer button.
   */
  async release(): Promise<void> {
    await this.page.mouse.up();
  }

  /**
   * The values of a column of the sheet the grid shows, in visual order.
   */
  visualColumn(col: number): Promise<unknown[]> {
    return this.page.evaluate(c => window.hot.getDataAtCol(c), col);
  }

  /**
   * The width of a column of the sheet the grid shows.
   */
  columnWidth(col: number): Promise<number> {
    return this.page.evaluate(c => window.hot.getColWidth(c), col);
  }

  /**
   * The number of rows frozen at the top of the sheet the grid shows.
   */
  frozenTopRows(): Promise<number> {
    return this.page.evaluate(() => window.hot.getPlugin('freezeBar').getFreezeCount('top'));
  }
}
