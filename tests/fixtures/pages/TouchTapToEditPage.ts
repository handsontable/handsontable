import { type Page, type Locator, expect } from '@playwright/test';
import type { HookCounterName } from './windowTypes';

/**
 * Page Object for the DEV-2687 touch tap-to-edit fixture. The spec using it must run
 * with a desktop user agent and `hasTouch: true` (the iPad-with-desktop-UA setup that
 * makes Walkontable register both touch and mouse listeners).
 */
export class TouchTapToEditPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly contextMenu: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.contextMenu = page.locator('.htContextMenu.handsontable');
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/touch-tap-to-edit.html?theme=${this.theme}&bundle=${this.bundle}`);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A single data cell, by visual row/column, via its stable test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Tap a cell with a touch gesture. Chromium follows the tap with a synthesized
   * mousedown/mouseup/click sequence, exactly like iPad Safari does.
   */
  async tapCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).tap();
  }

  /**
   * Dispatch a script-created mouse event on a cell. Such events carry
   * `sourceCapabilities === null`, which forces the engine onto the timing fallback
   * used on WebKit and Firefox.
   */
  async dispatchMouseEvent(row: number, col: number, type: 'mousedown' | 'mouseup'): Promise<void> {
    await this.cell(row, col).evaluate((td, eventType) => {
      td.dispatchEvent(new MouseEvent(eventType, { bubbles: true, cancelable: true, button: 0 }));
    }, type);
  }

  /**
   * Read one of the fixture's hook counters.
   */
  async hookCount(name: HookCounterName): Promise<number> {
    return this.page.evaluate(counter => window.hookCounts[counter], name);
  }

  /**
   * Assert a hook counter has reached exactly the expected value (a duplicate invocation lands
   * synchronously with the tap, so it would already push the count past the value on the first
   * read).
   */
  async expectHookCount(name: HookCounterName, expected: number): Promise<void> {
    await expect.poll(() => this.hookCount(name)).toBe(expected);
  }

  /**
   * Whether the active cell editor is currently open (the engine's own state, not DOM visibility —
   * the `.handsontableInput` textarea is always rendered, off-screen when closed).
   */
  async isEditorOpen(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.getActiveEditor()?.isOpened() ?? false);
  }

  async expectEditorOpen(): Promise<void> {
    await expect.poll(() => this.isEditorOpen()).toBe(true);
  }

  async expectEditorClosed(): Promise<void> {
    await expect.poll(() => this.isEditorOpen()).toBe(false);
  }

  /**
   * Number of rows currently in the grid.
   */
  async rowCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.countRows());
  }

  /**
   * Open the context menu on a cell with a mouse right-click and wait for it.
   */
  async openContextMenu(row: number, col: number): Promise<void> {
    await this.cell(row, col).click({ button: 'right' });
    await expect(this.contextMenu).toBeVisible();
  }

  /**
   * Tap a context-menu entry by its visible label.
   */
  async tapContextMenuItem(label: string): Promise<void> {
    await this.contextMenu.getByText(label, { exact: true }).tap();
  }
}
