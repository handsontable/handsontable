import { type Page, type Locator, expect } from '@playwright/test';

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
   * Opens the fixture and waits for the first cell to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/merge-cells-horizontal-exit.html?theme=${this.theme}&bundle=${this.bundle}`,
    );
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
   * Returns the highlighted (focused) cell of the last selection layer.
   */
  async highlight(): Promise<Highlight | null> {
    return this.page.evaluate(() => (window as unknown as { htHighlight(): Highlight | null }).htHighlight());
  }
}
