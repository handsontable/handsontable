import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the in-cell widget fixture (DEV-1619 follow-up).
 *
 * The grid lives in the light DOM; two cells host self-managed widgets the way
 * custom renderers embed web components. The `widget-keep-focus` button keeps
 * the browser focus where it is (mousedown default prevented), the
 * `widget-text` element renders selectable text inside its own open shadow
 * root. The fixture also exposes a light-DOM input used to park the focus
 * outside the grid.
 */
export class WidgetCellGridPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly outsideInput: Locator;
  readonly keepFocusWidget: Locator;
  readonly textWidget: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.outsideInput = page.getByTestId('outside-input');
    this.keepFocusWidget = page.getByTestId('widget-keep-focus');
    this.textWidget = page.getByTestId('widget-text');
  }

  /**
   * Navigate to the fixture and wait for the grid to render. Waits on a real
   * DOM condition (first cell visible) — web-first, no readiness flags.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/widget-cell.html?theme=${this.theme}&bundle=${this.bundle}`);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** The grid's current selection as `[startRow, startCol, endRow, endCol]` (fixture probe). */
  async selected(): Promise<number[][] | null> {
    return this.page.evaluate(() => (window as any).__hotProbe.selected());
  }

  /**
   * Select cell A1 programmatically without switching the keyboard listener,
   * then park the browser focus in the outside input (fixture probe) — the
   * pattern of an app that drives the selection while an external form field
   * keeps the focus.
   */
  async selectAndParkFocusOutside(): Promise<void> {
    await this.page.evaluate(() => (window as any).__hotProbe.selectAndParkFocusOutside());
  }

  /** Start recording whether the next `copy` event reaches the window with its default prevented (fixture probe). */
  async armCopyProbe(): Promise<void> {
    await this.page.evaluate(() => (window as any).__hotProbe.armCopyProbe());
  }

  /** Whether the recorded `copy` event had its default prevented; `null` until one fires (fixture probe). */
  async lastCopyDefaultPrevented(): Promise<boolean | null> {
    return this.page.evaluate(() => (window as any).__hotProbe.lastCopyDefaultPrevented());
  }
}
