import { expect } from '@playwright/test';
import { ManualResizePage } from './ManualResizePage';

/**
 * Page Object for the manual resize teardown fixture (DEV-2719).
 *
 * The reveal gestures come from `ManualResizePage`; what this fixture adds is the ability to turn
 * a resize plugin off through `updateSettings()`, to destroy the grid, and to read back the two
 * things an orphaned handle was observed to break - the selection a header click should have made,
 * and the row height a drag should have applied.
 */
export class ManualResizeTeardownPage extends ManualResizePage {
  /**
   * Sets one of the two resize options through `updateSettings()`, which is what runs the
   * plugin's `disablePlugin()` (and, for a truthy value, its re-initialization).
   *
   * @param {'manualRowResize'|'manualColumnResize'} option The option to set.
   * @param {boolean|number[]} value The value to set.
   */
  async setResizeOption(
    option: 'manualRowResize' | 'manualColumnResize', value: boolean | number[]
  ): Promise<void> {
    await this.page.evaluate(([optionName, optionValue]) => (window as unknown as {
      setResizeOption: (name: string, val: boolean | number[]) => void
    }).setResizeOption(optionName as string, optionValue as boolean | number[]), [option, value]);
  }

  /**
   * Destroys the grid, leaving the host container in place.
   */
  async destroyGrid(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as {
      destroyGrid: () => void
    }).destroyGrid());
  }

  /**
   * Destroys one resize plugin while the grid stays alive, which is the only way to observe the
   * plugin's own `destroy()` - a grid-level destroy empties the container before it reaches the
   * plugins. The grid must not be touched afterwards.
   *
   * @param {'manualRowResize'|'manualColumnResize'} pluginName The plugin to destroy.
   */
  async destroyResizePlugin(
    pluginName: 'manualRowResize' | 'manualColumnResize'
  ): Promise<void> {
    await this.page.evaluate(name => (window as unknown as {
      destroyResizePlugin: (n: string) => void
    }).destroyResizePlugin(name), pluginName);
  }

  /**
   * The current selection, as `getSelected()` reports it.
   *
   * @returns {Promise<number[][] | undefined>}
   */
  async selectedRange(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as {
      selectedRange: () => number[][] | undefined
    }).selectedRange());
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
   * Navigate and wait for the grid to have rendered - a real DOM condition, never a sleep.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/manual-resize-teardown.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    // The `document.write`-injected bundle and the block that builds the grid are separate scripts,
    // so wait for the bundle itself before anything asserts on the grid. `waitForFunction` polls
    // against the test budget, which `expect` does not - and `dist/handsontable.js` is large enough
    // that a cold server outlasts the `expect` timeout.
    await this.page.waitForFunction(() => 'Handsontable' in window);

    await expect(this.grid.locator('.ht_clone_top')).toBeVisible();
    await expect(this.grid.locator('.ht_clone_inline_start')).toBeVisible();
    // The clones exist before their rows are laid out, and every test hovers a header, so wait for
    // the body rows themselves.
    await expect(this.grid.locator('.ht_clone_inline_start tbody tr')).toHaveCount(5);
  }
}
