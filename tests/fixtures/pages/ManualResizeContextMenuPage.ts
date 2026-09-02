import { type Locator, expect } from '@playwright/test';
import { ManualResizePage } from './ManualResizePage';

/**
 * Page Object for the manual resize context-menu fixture (DEV-2708).
 *
 * The handle is revealed the way a user reveals it - by hovering a header in the overlay clone that
 * draws it, which `ManualResizePage` spells out - and the context menu is opened both with a real
 * right-click and with a synthetic event, because those are the two paths that reach the handler
 * with no `mousedown` handled in between.
 */
export class ManualResizeContextMenuPage extends ManualResizePage {
  /**
   * Right-clicks an element with a real pointer, the way a user opens a context menu.
   *
   * @param {Locator} target The element to right-click.
   */
  async rightClick(target: Locator): Promise<void> {
    // Playwright's own click, not `mouse.down`/`mouse.up`, so its actionability and hit-target
    // checks apply: a handle covered by another element on one theme leg then fails loudly instead
    // of being pressed through the cover.
    await target.click({ button: 'right' });
  }

  /**
   * Dispatches a synthetic "contextmenu" on an element. A long-press shim, an automation harness or
   * any host-page code that opens its own menu reaches the plugin this way, with no `mousedown`
   * having been handled first.
   *
   * @param {Locator} target The element to dispatch the event on.
   */
  async dispatchContextMenu(target: Locator): Promise<void> {
    await target.evaluate(element => element.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    ));
  }

  /**
   * How many "contextmenu" events have reached the document since the fixture loaded. A real
   * right-click asserts this so the test cannot stay green while covering nothing, should the
   * gesture ever stop producing the event.
   *
   * @returns {Promise<number>}
   */
  async contextMenuEventCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as {
      contextMenuEvents: number
    }).contextMenuEvents);
  }

  /**
   * Installs host-page code that stops every `mousedown` from reaching the grid.
   */
  async swallowMousedown(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as {
      swallowMousedown: () => void
    }).swallowMousedown());
  }

  /**
   * Navigate and wait for the grid to have rendered - a real DOM condition, never a sleep.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/manual-resize-contextmenu.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    await expect(this.grid.locator('.ht_clone_top')).toBeVisible();
    await expect(this.grid.locator('.ht_clone_inline_start')).toBeVisible();
    // The clones exist before their rows are laid out, and every test hovers a header, so wait for
    // the body rows themselves.
    await expect(this.grid.locator('.ht_clone_inline_start tbody tr')).toHaveCount(5);
  }
}
