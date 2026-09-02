import { type Page, type Locator, expect } from '@playwright/test';
import { dragResizeHandle } from '../gestures';

/**
 * Base Page Object for the manual resize fixtures.
 *
 * Both resize plugins keep their handle and their guide in the root element and attach them at
 * different moments - the handle on `mouseover` over a header, the guide only once a `mousedown`
 * over the handle reaches the plugin's own listener. Every spec about either element therefore
 * needs the same locators and the same reveal gestures, so they live here rather than in one
 * fixture's page object, where a later fix to a gesture would be missed by the others.
 *
 * A subclass supplies its own `goto()` and whatever its fixture exposes on top.
 */
export abstract class ManualResizePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * The grid container.
   *
   * @returns {Locator}
   */
  get grid(): Locator {
    return this.page.getByTestId('grid');
  }

  /**
   * The row resize handle. It exists in the DOM only while the plugin keeps it attached.
   *
   * @returns {Locator}
   */
  get rowHandle(): Locator {
    return this.grid.locator('.manualRowResizer');
  }

  /**
   * The column resize handle.
   *
   * @returns {Locator}
   */
  get columnHandle(): Locator {
    return this.grid.locator('.manualColumnResizer');
  }

  /**
   * The row resize guide. The plugin attaches it only once a `mousedown` over the handle reaches
   * its root-element listener.
   *
   * @returns {Locator}
   */
  get rowGuide(): Locator {
    return this.grid.locator('.manualRowResizerGuide');
  }

  /**
   * The column resize guide.
   *
   * @returns {Locator}
   */
  get columnGuide(): Locator {
    return this.grid.locator('.manualColumnResizerGuide');
  }

  /**
   * The row header cell in the overlay clone that draws the row resize handle.
   *
   * @param {number} row The visual row index.
   * @returns {Locator}
   */
  rowHeader(row: number): Locator {
    return this.grid.locator('.ht_clone_inline_start tbody tr').nth(row).locator('th');
  }

  /**
   * The column header cell in the overlay clone that draws the column resize handle.
   *
   * @param {number} column The visual column index.
   * @returns {Locator}
   */
  columnHeader(column: number): Locator {
    // `nth(column + 1)` skips the corner cell, so index 0 addresses the first data column.
    return this.grid.locator('.ht_clone_top thead tr').first().locator('th').nth(column + 1);
  }

  /**
   * Hovers a row header, which is what makes the row resize handle appear.
   *
   * @param {number} row The visual row index.
   */
  async hoverRowHeader(row: number): Promise<void> {
    // The pointer is parked outside the grid first, so a second hover over the same header still
    // produces the `mouseover` the plugin listens for.
    await this.parkPointer();
    await this.rowHeader(row).hover();
    await expect(this.rowHandle).toBeVisible();
  }

  /**
   * Hovers a column header, which is what makes the column resize handle appear.
   *
   * @param {number} column The visual column index.
   */
  async hoverColumnHeader(column: number): Promise<void> {
    await this.parkPointer();
    await this.columnHeader(column).hover();
    await expect(this.columnHandle).toBeVisible();
  }

  /**
   * Resizes a row by dragging its resize handle, which is what attaches the resize guide.
   *
   * @param {number} row The visual row index.
   * @param {number} deltaY How far to drag, in CSS pixels.
   */
  async dragRowHandle(row: number, deltaY: number): Promise<void> {
    await this.hoverRowHeader(row);
    await dragResizeHandle(this.page, this.rowHandle, { y: deltaY });
  }

  /**
   * Resizes a column by dragging its resize handle, which is what attaches the resize guide.
   *
   * @param {number} column The visual column index.
   * @param {number} deltaX How far to drag, in CSS pixels.
   */
  async dragColumnHandle(column: number, deltaX: number): Promise<void> {
    await this.hoverColumnHeader(column);
    await dragResizeHandle(this.page, this.columnHandle, { x: deltaX });
  }

  /**
   * Parks the pointer outside the grid.
   *
   * Detaching the handle from UNDER the pointer changes the element the cursor is over, so the
   * browser sends a fresh "mouseover" that re-reveals the handle - and whether that lands before or
   * after a suppression microtask is up to the browser. Park the pointer first whenever a test
   * asserts that the handle stayed detached.
   */
  async parkPointer(): Promise<void> {
    await this.page.mouse.move(0, 0);
  }

  /**
   * Navigate and wait for the fixture's grid to have rendered - a real DOM condition, never a
   * sleep.
   */
  abstract goto(): Promise<void>;
}
