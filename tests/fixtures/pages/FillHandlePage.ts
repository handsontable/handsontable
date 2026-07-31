import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the frozen-panes fill-handle fixture. It exposes the two
 * things the fill-handle specs reason about: reaching the cell at the far edge
 * of the scrollable content, and the master viewport's scrollable size — which
 * must not grow just because a cell was selected.
 */
export class FillHandlePage {
  readonly page: Page;
  readonly theme: string;
  readonly grid: Locator;
  readonly master: Locator;

  readonly lastRow = 39;
  readonly lastColumn = 11;

  constructor(page: Page, theme = 'main') {
    this.page = page;
    this.theme = theme;
    this.grid = page.getByTestId('grid');
    this.master = this.grid.locator('.ht_master');
  }

  /**
   * Navigate and wait for the grid to render (a real DOM condition, no sleep).
   * The active theme is passed as a query param so the fixture loads the
   * matching stylesheet.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/fill-handle-frozen-panes.html?theme=${this.theme}`);
    await expect(this.master).toBeVisible();
  }

  /** The scrollable master holder. */
  holder(): Locator {
    return this.master.locator('.wtHolder');
  }

  /**
   * A data cell in the master overlay, by visual row/column. Scoped to the
   * master because the frozen panes render their cells in overlay clones too.
   */
  cell(row: number, col: number): Locator {
    return this.master.getByTestId(`cell-${row}-${col}`);
  }

  /** Scroll the master viewport to the far end of both axes. */
  async scrollToEnd(): Promise<void> {
    await this.holder().evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
      el.scrollTop = el.scrollHeight;
    });
    await expect(this.cell(this.lastRow, this.lastColumn)).toBeVisible();
  }

  /** Click a cell and wait for it to become the focused one. */
  async selectCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).click();
    await expect(this.cell(row, col)).toHaveClass(/\bcurrent\b/);
  }

  /** The master viewport's scrollable content size. */
  async scrollSize(): Promise<{ width: number, height: number }> {
    return this.holder().evaluate(el => ({ width: el.scrollWidth, height: el.scrollHeight }));
  }
}
