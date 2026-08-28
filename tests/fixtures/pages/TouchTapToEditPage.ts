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
   * A mouse click on a cell, as opposed to `tapCell()`'s touch gesture.
   */
  async clickCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).click();
  }

  /**
   * Dispatch a script-created mouse event on a cell. Without `firesTouchEvents`, the event
   * carries `sourceCapabilities === null`, which forces the engine onto the WebKit/Firefox
   * timing fallback. Passing `firesTouchEvents` stamps the event with a Chromium
   * `InputDeviceCapabilities` object, reproducing what Blink itself attaches to its own
   * synthesized compatibility pairs (`sourceCapabilities.firesTouchEvents === true`) — the
   * branch that only a real `sourceCapabilities` report, not a script-dispatched `null`, can
   * exercise.
   */
  async dispatchMouseEvent(
    row: number,
    col: number,
    type: 'mousedown' | 'mouseup',
    firesTouchEvents?: boolean
  ): Promise<void> {
    await this.cell(row, col).evaluate((td, { eventType, fires }) => {
      interface MouseEventInitWithSourceCapabilities extends MouseEventInit {
        sourceCapabilities?: { firesTouchEvents: boolean };
      }

      const init: MouseEventInitWithSourceCapabilities = { bubbles: true, cancelable: true, button: 0 };

      if (fires !== undefined) {
        init.sourceCapabilities = new window.InputDeviceCapabilities({ firesTouchEvents: fires });
      }

      td.dispatchEvent(new MouseEvent(eventType, init));
    }, { eventType: type, fires: firesTouchEvents });
  }

  /**
   * Dispatch a script-created touch gesture that drifts `dx` pixels before lifting: a
   * `touchstart`, a `touchmove` offset by `dx`, then a `touchend`. These touch events drive
   * Walkontable's 10 px move-threshold path (`LONG_PRESS_MOVE_THRESHOLD`): past that offset the
   * touch path classifies the gesture as a scroll and fires no cell mouse hooks. The mouse pair
   * that follows is dispatched separately, with `dispatchMouseEvent()`, to drive the
   * synthesized-event origin gate.
   */
  async dispatchTouchDrag(row: number, col: number, dx: number): Promise<void> {
    await this.cell(row, col).evaluate((td, dxOffset) => {
      const rect = td.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const touch = (clientX: number) => new Touch({
        identifier: 1,
        target: td,
        clientX,
        clientY: y,
        pageX: clientX + window.scrollX,
        pageY: y + window.scrollY,
      });
      const fire = (type: string, clientX: number, ended: boolean) => td.dispatchEvent(new TouchEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        touches: ended ? [] : [touch(clientX)],
        targetTouches: ended ? [] : [touch(clientX)],
        changedTouches: [touch(clientX)],
      }));

      fire('touchstart', x, false);
      fire('touchmove', x + dxOffset, false);
      fire('touchend', x + dxOffset, true);
    }, dx);
  }

  /**
   * Read one of the fixture's hook counters.
   */
  async hookCount(name: HookCounterName): Promise<number> {
    return this.page.evaluate(counter => window.hookCounts[counter], name);
  }

  /**
   * Assert a hook counter has reached exactly the expected value, then read it once more: the
   * poll returns on the first matching sample, and a duplicate invocation can land a browser task
   * later, so the second read is what makes an over-count fail.
   */
  async expectHookCount(name: HookCounterName, expected: number): Promise<void> {
    await expect.poll(() => this.hookCount(name)).toBe(expected);

    expect(await this.hookCount(name)).toBe(expected);
  }

  /**
   * Wait until the browser has finished the compatibility sequence for the taps performed so far.
   * `click` is the last event the browser synthesizes after a tap, so polling the click counter to
   * its expected value is the settle barrier; the mouse counters are then read with a plain
   * `expect`, which makes them exact rather than first-match assertions.
   */
  async settleOnClicks(expectedClicks: number): Promise<void> {
    await expect.poll(() => this.hookCount('click')).toBe(expectedClicks);
  }

  /**
   * Exact read of a hook counter. Call `settleOnClicks()` first so the browser's synthesized
   * sequence has landed.
   */
  async expectHookCountExactly(name: HookCounterName, expected: number): Promise<void> {
    expect(await this.hookCount(name)).toBe(expected);
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
   * Assert that the given cell is the sole current selection.
   */
  async expectSelectedCell(row: number, col: number): Promise<void> {
    await expect.poll(() => this.page.evaluate(() => window.hot.getSelectedLast())).toEqual([row, col, row, col]);
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
