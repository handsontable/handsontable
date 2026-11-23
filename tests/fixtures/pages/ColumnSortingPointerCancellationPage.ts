import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

type Variant = 'column' | 'multi' | 'nested';

/**
 * Page Object for the column-sorting-pointer-cancellation fixture.
 *
 * Column headers are rendered into several overlay layers, so every header locator is scoped to the
 * top overlay, and every header is addressed by its text (`A`, `Group 2`).
 */
export class ColumnSortingPointerCancellationPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly headerOverlay: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.headerOverlay = page.locator('.ht_clone_top');
  }

  /**
   * Navigate to the fixture and wait for the grid to render. `variant` picks the sorting plugin and
   * the header layout.
   */
  async goto(variant: Variant = 'column'): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/column-sorting-pointer-cancellation.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&variant=${variant}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** A header by its text, scoped to the top overlay so the match is unambiguous. */
  header(name: string): Locator {
    return this.headerOverlay.getByTestId(`header-${name.replace(/\s+/g, '-')}`);
  }

  /** The clickable sorting label inside a header. */
  sortLabel(name: string): Locator {
    return this.header(name).locator('span.colHeader');
  }

  /** How many times the grid has sorted since it loaded. */
  async sortCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { sortCount: number }).sortCount);
  }

  /** The sort configuration of the plugin the variant runs. */
  async sortConfig(): Promise<Array<{ column: number, sortOrder: string }>> {
    return this.page.evaluate(() => {
      const hot = (window as unknown as { hot: any }).hot;
      const plugin = hot.getPlugin('multiColumnSorting').enabled ? 'multiColumnSorting' : 'columnSorting';

      return hot.getPlugin(plugin).getSortConfig();
    });
  }

  /** The first column, top to bottom. */
  async firstColumn(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { hot: any }).hot.getDataAtCol(0));
  }

  /** The centre of a locator's box. */
  async centreOf(locator: Locator): Promise<{ x: number, y: number }> {
    await expect(locator).toBeVisible();

    const box = await locator.boundingBox();

    if (box === null) {
      throw new Error('The element has no bounding box');
    }

    return { x: box.x + (box.width / 2), y: box.y + (box.height / 2) };
  }

  /** Move to the sorting label of a header and hold the left button there. */
  async pressLabel(name: string): Promise<void> {
    const point = await this.centreOf(this.sortLabel(name));

    await this.page.mouse.move(point.x, point.y);
    await this.page.mouse.down();
  }

  /** Move to the centre of a locator and release the button there. */
  async releaseOver(locator: Locator): Promise<void> {
    const point = await this.centreOf(locator);

    await this.page.mouse.move(point.x, point.y, { steps: 5 });
    await this.page.mouse.up();
  }

  /** Move well below the grid, where there is no cell, and release the button there. */
  async releaseOutsideTheGrid(): Promise<void> {
    const viewport = this.page.viewportSize();
    const point = await this.centreOf(this.header('A'));

    await this.page.mouse.move(point.x, (viewport?.height ?? 600) - 20, { steps: 8 });
    await this.page.mouse.up();
  }

  /** Tap the sorting label of a header with a finger. Needs `hasTouch`. */
  async tapLabel(name: string): Promise<void> {
    const point = await this.centreOf(this.sortLabel(name));

    await this.page.touchscreen.tap(point.x, point.y);
  }

  /** Focus the header of a column with the keyboard (a cell, then ArrowUp) and press Enter, the keyboard way to sort. */
  async sortFromKeyboard(col: number): Promise<void> {
    await this.cell(0, col).click();
    await this.page.keyboard.press('ArrowUp');
    await this.page.keyboard.press('Enter');
  }
}
