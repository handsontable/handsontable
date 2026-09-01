import { type Page, type Locator, expect } from '@playwright/test';
import { dragResizeHandle } from '../gestures';

/**
 * Page Object for the manual resize vs size option fixture (issue #4371).
 *
 * Sizes are read from the overlay clones that draw the headers - the row heights from the
 * inline-start clone, the column widths from the top clone - because those are the cells the reader
 * actually sees. The drags are driven through the real resize handle the plugins reveal on hover,
 * so the stored size is produced the way a user produces it.
 */
export class ManualResizeSizeOptionResetPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * The grid container carrying the given test id.
   *
   * @param {string} testId The container's test id.
   * @returns {Locator}
   */
  grid(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * The rendered heights of the row header cells, in CSS pixels.
   *
   * @param {string} [testId='rows'] The grid's test id.
   * @returns {Promise<number[]>}
   */
  async rowHeights(testId = 'rows'): Promise<number[]> {
    return this.grid(testId).locator('.ht_clone_inline_start tbody tr')
      .evaluateAll(rows => rows.map(row => Math.round(row.getBoundingClientRect().height)));
  }

  /**
   * The rendered widths of the column header cells, in CSS pixels. The corner cell is dropped, so
   * index 0 is the first data column.
   *
   * @param {string} [testId='cols'] The grid's test id.
   * @returns {Promise<number[]>}
   */
  async colWidths(testId = 'cols'): Promise<number[]> {
    const widths = await this.grid(testId).locator('.ht_clone_top thead tr').first().locator('th')
      .evaluateAll(cells => cells.map(cell => Math.round(cell.getBoundingClientRect().width)));

    return widths.slice(1);
  }

  /**
   * Resizes a row by dragging its resize handle, the way a user does.
   *
   * @param {number} row The visual row index.
   * @param {number} deltaY How far to drag, in CSS pixels.
   * @param {string} [testId='rows'] The grid's test id.
   */
  async dragRowHandle(row: number, deltaY: number, testId = 'rows'): Promise<void> {
    const header = this.grid(testId).locator('.ht_clone_inline_start tbody tr').nth(row).locator('th');

    await header.hover();

    const handle = this.grid(testId).locator('.manualRowResizer');

    await expect(handle).toBeVisible();

    await dragResizeHandle(this.page, handle, { y: deltaY });
  }

  /**
   * Resizes a column by dragging its resize handle, the way a user does.
   *
   * @param {number} column The visual column index.
   * @param {number} deltaX How far to drag, in CSS pixels.
   * @param {string} [testId='cols'] The grid's test id.
   */
  async dragColumnHandle(column: number, deltaX: number, testId = 'cols'): Promise<void> {
    // `nth(column + 1)` skips the corner cell, so index 0 addresses the first data column.
    const header = this.grid(testId).locator('.ht_clone_top thead tr').first().locator('th')
      .nth(column + 1);

    await header.hover();

    const handle = this.grid(testId).locator('.manualColumnResizer');

    await expect(handle).toBeVisible();

    await dragResizeHandle(this.page, handle, { x: deltaX });
  }

  /**
   * Applies settings to one grid.
   *
   * @param {string} name The grid's key in the fixture's `grids` object.
   * @param {object} settings The settings to apply.
   */
  async applySettings(name: string, settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(
      ([gridName, newSettings]) => (window as unknown as {
        applySettings: (name: string, settings: Record<string, unknown>) => void
      }).applySettings(gridName as string, newSettings as Record<string, unknown>),
      [name, settings] as [string, Record<string, unknown>]
    );
  }

  /**
   * Calls a method on one grid's resize plugin and repaints, the way the guides tell users to.
   *
   * @param {string} name The grid's key in the fixture's `grids` object.
   * @param {string} plugin The plugin name.
   * @param {string} method The method to call.
   * @param {Array} args The arguments to pass.
   */
  async callPluginMethod(
    name: string, plugin: string, method: string, args: unknown[] = []
  ): Promise<void> {
    await this.page.evaluate(
      ([gridName, pluginName, methodName, methodArgs]) => (window as unknown as {
        callPluginMethod: (n: string, p: string, m: string, a: unknown[]) => void
      }).callPluginMethod(
        gridName as string, pluginName as string, methodName as string, methodArgs as unknown[]
      ),
      [name, plugin, method, args] as [string, string, string, unknown[]]
    );
  }

  /**
   * Navigate and wait for every grid to have rendered - a real DOM condition, never a sleep.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/manual-resize-size-option-reset.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    for (const testId of [
      'rows', 'cols', 'rows-array', 'rows-empty-array', 'rows-auto', 'cols-array',
      'cols-empty-array',
    ]) {
      await expect(this.grid(testId).locator('.ht_clone_inline_start')).toBeVisible();
      await expect(this.grid(testId).locator('.ht_clone_top')).toBeVisible();
      // The clones exist before their rows are laid out, and every test either drags a header or
      // measures one, so wait for the body rows themselves.
      await expect(this.grid(testId).locator('.ht_clone_inline_start tbody tr')).toHaveCount(5);
    }
  }
}
