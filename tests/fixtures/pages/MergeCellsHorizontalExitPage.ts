import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS } from '../bundle';

interface Highlight {
  row: number;
  col: number;
}

/**
 * Page Object for the DEV-102 fixture: a grid with the one-column merge B2:B4, driven by real
 * arrow keys to check which row the selection keeps when it leaves the merge sideways.
 */
export class MergeCellsHorizontalExitPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * The opened context menu (not a submenu).
   */
  get contextMenu(): Locator {
    return this.page.locator('.htContextMenu.handsontable:not([class*="Sub_"])');
  }

  /**
   * Opens the fixture for a given merge scenario and waits for the first cell to render.
   *
   * @param {string} scenario One of `default`, `multi`, `hidden-top`, `rtl`.
   */
  async goto(scenario = 'default'): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/merge-cells-horizontal-exit.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&scenario=${scenario}`,
    );
    // Wait for the bundle and the grid the fixture builds against the test budget, not the 10s
    // `expect` timeout: dist/handsontable.js is ~6 MB and every worker pulls its own copy, so a cold
    // or busy server outlasts `toBeVisible()` and flakes the first render (see fixtures/bundle.ts).
    await awaitBundle(this.page);
    await this.page.waitForFunction(() => 'hot' in window, undefined, { polling: BUNDLE_POLLING_MS });
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A single data cell, by visual row/column, through its fixture-stamped test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Clicks a cell to select it.
   */
  async selectCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).click();
  }

  /**
   * Presses a sequence of real keys against the focused grid.
   */
  async pressKeys(...keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.page.keyboard.press(key);
    }
  }

  /**
   * Opens the context menu by right-clicking a cell and waits until it is visible.
   */
  async openContextMenu(row: number, col: number): Promise<void> {
    await this.cell(row, col).click({ button: 'right' });
    await expect(this.contextMenu).toBeVisible();
  }

  /**
   * Returns the highlighted (focused) cell of the last selection layer.
   */
  async highlight(): Promise<Highlight | null> {
    return this.page.evaluate(() => (window as unknown as { htHighlight(): Highlight | null }).htHighlight());
  }
}
