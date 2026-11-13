import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the array `colHeaders` fixture, whose columns are moved before a column is
 * inserted or removed.
 */
export class ColHeadersInsertAfterMovePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/col-headers-insert-after-move.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master overlay, by visual row and column.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The rendered column headers, in screen order.
   */
  headers(): Locator {
    return this.grid.locator('.ht_clone_top thead th');
  }

  /**
   * Move a column through the ManualColumnMove plugin and re-render, the way a completed drag does.
   */
  async moveColumn(from: number, to: number): Promise<void> {
    await this.page.evaluate(([f, t]) => {
      const hot = (window as any).hot;

      hot.getPlugin('manualColumnMove').moveColumn(f, t);
      hot.render();
    }, [from, to]);
  }

  /**
   * Right-click a cell and pick an item of the context menu by its label.
   */
  async pickContextMenuItem(row: number, col: number, label: string): Promise<void> {
    await this.cell(row, col).click({ button: 'right' });

    const item = this.page.locator('.htContextMenu td').filter({ hasText: new RegExp(`^\\s*${label}\\s*$`) });

    await expect(item).toBeVisible();
    await item.click();
  }
}
