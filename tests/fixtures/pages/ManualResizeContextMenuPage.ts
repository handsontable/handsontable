import { type Page, type Locator, expect } from '@playwright/test';
import { dragResizeHandle } from '../gestures';

/**
 * Page Object for the manual resize context-menu fixture (DEV-2708).
 *
 * The handle is revealed the way a user reveals it - by hovering a header in the overlay clone that
 * draws it - and the context menu is opened both with a real right-click and with a synthetic
 * event, because those are the two paths that reach the handler with no `mousedown` handled in
 * between.
 */
export class ManualResizeContextMenuPage {
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
   * its root-element listener, which is why the context-menu handler could be asked to detach a
   * guide that was never attached.
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
   * Hovers a row header, which is what makes the row resize handle appear.
   *
   * @param {number} row The visual row index.
   */
  async hoverRowHeader(row: number): Promise<void> {
    // The pointer is parked outside the grid first, so a second hover over the same header still
    // produces the `mouseover` the plugin listens for.
    await this.page.mouse.move(0, 0);
    await this.grid.locator('.ht_clone_inline_start tbody tr').nth(row).locator('th').hover();
    await expect(this.rowHandle).toBeVisible();
  }

  /**
   * Hovers a column header, which is what makes the column resize handle appear.
   *
   * @param {number} column The visual column index.
   */
  async hoverColumnHeader(column: number): Promise<void> {
    await this.page.mouse.move(0, 0);
    // `nth(column + 1)` skips the corner cell, so index 0 addresses the first data column.
    await this.grid.locator('.ht_clone_top thead tr').first().locator('th').nth(column + 1).hover();
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
   * after the handler's suppression microtask is up to the browser. Park the pointer first whenever
   * a test asserts that the handle stayed detached.
   */
  async parkPointer(): Promise<void> {
    await this.page.mouse.move(0, 0);
  }

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
