import { expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { ManualResizePage } from './ManualResizePage';

/**
 * A resize hook call, as the fixture records it.
 */
export type ResizeHookCall = {
  hook: 'afterRowResize' | 'afterColumnResize',
  newSize: number,
  index: number,
  isDoubleClick: boolean,
};

/**
 * Page Object for the manual resize drag-interruption fixture (DEV-2719, fourth trap).
 *
 * The locators and the reveal gestures come from `ManualResizePage`. What this fixture adds is the
 * ability to hold a drag OPEN across an `updateSettings()` call, and to read back the resize hooks
 * the release did or did not fire.
 *
 * The shared `dragResizeHandle` gesture cannot be used here: it presses, moves and releases in one
 * call, so there is no moment at which the plugin is mid-drag and the test can act. `startDrag()`
 * and `releaseDrag()` are that same gesture split in two, and they keep its "several moves" rule -
 * both plugins track a drag through `mousemove`, and a single jump can be swallowed as a click.
 */
export class ManualResizeDragInterruptionPage extends ManualResizePage {
  /**
   * Presses the row resize handle and moves the pointer WITHOUT releasing, leaving the plugin
   * mid-drag.
   *
   * @param {number} row The visual row index.
   * @param {number} deltaY How far to drag, in CSS pixels.
   */
  async startRowDrag(row: number, deltaY: number): Promise<void> {
    await this.hoverRowHeader(row);
    await this.#startDrag(this.rowHandle, { y: deltaY });
  }

  /**
   * Presses the column resize handle and moves the pointer WITHOUT releasing.
   *
   * @param {number} column The visual column index.
   * @param {number} deltaX How far to drag, in CSS pixels.
   */
  async startColumnDrag(column: number, deltaX: number): Promise<void> {
    await this.hoverColumnHeader(column);
    await this.#startDrag(this.columnHandle, { x: deltaX });
  }

  /**
   * Releases the pointer, ending whichever drag is open.
   */
  async releaseDrag(): Promise<void> {
    await this.page.mouse.up();
  }

  /**
   * Presses a handle and moves the pointer to the target offset, leaving the button DOWN.
   *
   * @param {import('@playwright/test').Locator} handle The handle to press.
   * @param {{x?: number, y?: number}} delta How far to move, in CSS pixels.
   */
  async #startDrag(
    handle: import('@playwright/test').Locator, delta: { x?: number, y?: number }
  ): Promise<void> {
    const box = await handle.boundingBox();

    if (!box) {
      throw new Error('The resize handle has no layout box.');
    }

    const startX = box.x + (box.width / 2);
    const startY = box.y + (box.height / 2);
    const deltaX = delta.x ?? 0;
    const deltaY = delta.y ?? 0;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    // Two moves rather than one, for the same reason the shared gesture makes them: the plugins
    // track the drag through `mousemove`, and a single jump can be swallowed as a click.
    await this.page.mouse.move(startX + (deltaX / 2), startY + (deltaY / 2));
    await this.page.mouse.move(startX + deltaX, startY + deltaY);
  }

  /**
   * Re-states a resize option through `updateSettings()`, carrying the plugin's own key - the call
   * that makes `BasePlugin` run the `disablePlugin(); enablePlugin();` cycle.
   *
   * @param {'manualRowResize'|'manualColumnResize'} option The option to re-state.
   * @param {boolean|number[]} value The value to set.
   */
  async restateResizeOption(
    option: 'manualRowResize' | 'manualColumnResize', value: boolean | number[]
  ): Promise<void> {
    await this.page.evaluate(([optionName, optionValue]) => (window as unknown as {
      restateResizeOption: (name: string, val: boolean | number[]) => void
    }).restateResizeOption(optionName as string, optionValue as boolean | number[]), [option, value]);
  }

  /**
   * The runtime `enabled` flag `afterMouseDownTimeout()` reads through `owner.isActive()`.
   *
   * @param {'manualRowResize'|'manualColumnResize'} pluginName The plugin to query.
   * @returns {Promise<boolean>}
   */
  async isResizePluginActive(
    pluginName: 'manualRowResize' | 'manualColumnResize'
  ): Promise<boolean> {
    return this.page.evaluate(name => (window as unknown as {
      isResizePluginActive: (n: string) => boolean
    }).isResizePluginActive(name), pluginName);
  }

  /**
   * Updates a setting belonging to neither resize plugin, so neither re-initializes.
   */
  async updateUnrelatedOption(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as {
      updateUnrelatedOption: () => void
    }).updateUnrelatedOption());
  }

  /**
   * Every resize hook the grid has fired since the last clear, in order.
   *
   * @returns {Promise<ResizeHookCall[]>}
   */
  async resizeHooks(): Promise<ResizeHookCall[]> {
    return this.page.evaluate(() => (window as unknown as {
      resizeHooks: () => ResizeHookCall[]
    }).resizeHooks());
  }

  /**
   * Empties the hook log.
   */
  async clearResizeHooks(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as {
      clearResizeHooks: () => void
    }).clearResizeHooks());
  }

  /**
   * The rendered height of a visual row.
   *
   * @param {number} row The visual row index.
   * @returns {Promise<number>}
   */
  async renderedRowHeight(row: number): Promise<number> {
    return this.page.evaluate(visualRow => (window as unknown as {
      renderedRowHeight: (r: number) => number
    }).renderedRowHeight(visualRow), row);
  }

  /**
   * The rendered width of a visual column.
   *
   * @param {number} column The visual column index.
   * @returns {Promise<number>}
   */
  async renderedColumnWidth(column: number): Promise<number> {
    return this.page.evaluate(visualColumn => (window as unknown as {
      renderedColumnWidth: (c: number) => number
    }).renderedColumnWidth(visualColumn), column);
  }

  /**
   * Navigate and wait for the grid to have rendered - a real DOM condition, never a sleep.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/manual-resize-drag-interruption.html`
      + `?theme=${this.theme}&bundle=${this.bundle}`
    );

    await awaitBundle(this.page);

    await expect(this.grid.locator('.ht_clone_top')).toBeVisible();
    await expect(this.grid.locator('.ht_clone_inline_start')).toBeVisible();
    // The clones exist before their rows are laid out, and every test hovers a header, so wait for
    // the body rows themselves.
    await expect(this.grid.locator('.ht_clone_inline_start tbody tr')).toHaveCount(5);
  }
}
