import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

type Variant = 'column' | 'multi' | 'nested';

interface GotoOptions {
  dir?: 'ltr' | 'rtl';
  /** Freezes the first two columns, which an overlay clone then draws. */
  frozen?: boolean;
  /** With `frozen`: scrolls the grid sideways until the last column is in view. */
  scrolled?: boolean;
  shadow?: boolean;
}

/** How many columns the fixture freezes with `frozen`. */
const FROZEN_COLUMNS = 2;

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
  /** Draws the headers of the frozen columns. */
  readonly frozenHeaderOverlay: Locator;
  /** Draws the body cells of the frozen columns. */
  readonly frozenBodyOverlay: Locator;
  private frozen = false;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.headerOverlay = page.locator('.ht_clone_top');
    this.frozenHeaderOverlay = page.locator('.ht_clone_top_inline_start_corner');
    this.frozenBodyOverlay = page.locator('.ht_clone_inline_start');
  }

  /**
   * Navigate to the fixture and wait for the grid to render. `variant` picks the sorting plugin and
   * the header layout.
   */
  async goto(variant: Variant = 'column', options: GotoOptions = {}): Promise<void> {
    const dir = options.dir ?? 'ltr';
    const frozen = options.frozen ? 'on' : 'off';
    const shadow = options.shadow ? 'on' : 'off';

    await this.page.goto(
      `/tests/fixtures/demo/column-sorting-pointer-cancellation.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&variant=${variant}&dir=${dir}&frozen=${frozen}&shadow=${shadow}`);
    await awaitBundle(this.page);

    this.frozen = options.frozen === true;
    await expect(this.cell(0, 0)).toBeVisible();

    if (options.scrolled) {
      await this.page.evaluate(() => {
        (window as unknown as { hot: any }).hot.scrollViewportTo({ row: 0, col: 3 });
      });
      await expect.poll(() => this.horizontalScroll()).toBeGreaterThan(0);
    }
  }

  /**
   * A single data cell, by visual row/column. A cell of a frozen column is drawn by its overlay clone,
   * and the master holds a hidden copy of it, so it is looked up there.
   */
  cell(row: number, col: number): Locator {
    const scope = this.frozen && col < FROZEN_COLUMNS ? this.frozenBodyOverlay : this.page;

    return scope.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * A header by its text, scoped to the overlay that draws it so the match is unambiguous: the clone of
   * the frozen columns for `A` and `B` of a frozen grid, the top overlay for every other header.
   */
  header(name: string): Locator {
    const frozenHeader = this.frozen && ['A', 'B'].includes(name);
    const overlay = frozenHeader ? this.frozenHeaderOverlay : this.headerOverlay;

    return overlay.getByTestId(`header-${name.replace(/\s+/g, '-')}`);
  }

  /** How far the grid is scrolled sideways. */
  async horizontalScroll(): Promise<number> {
    return this.page.evaluate(
      () => Math.abs((window as unknown as { hot: any }).hot.view._wt.wtTable.holder.scrollLeft));
  }

  /** Whether the grid reads as right to left: the instance, and the element it sits in. */
  async isRtl(): Promise<boolean> {
    return this.page.evaluate(() => {
      const hot = (window as unknown as { hot: any }).hot;

      return hot.isRtl() === true && getComputedStyle(hot.rootElement).direction === 'rtl';
    });
  }

  /** Whether the grid's root lives inside a shadow root. */
  async isInShadowRoot(): Promise<boolean> {
    return this.page.evaluate(
      () => (window as unknown as { hot: any }).hot.rootElement.getRootNode() instanceof ShadowRoot);
  }

  /** Whether the element sits inside the overlay clone with the class, not in the master table. */
  async isInOverlay(locator: Locator, overlayClass: string): Promise<boolean> {
    return locator.evaluate((element, className) => element.closest(`.${className}`) !== null, overlayClass);
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

  /** Move to the centre of any element and hold the left button there. */
  async pressOn(locator: Locator): Promise<void> {
    const point = await this.centreOf(locator);

    await this.page.mouse.move(point.x, point.y);
    await this.page.mouse.down();
  }

  /** Press and release on the centre of the same element, a click with the real pointer. */
  async clickOn(locator: Locator): Promise<void> {
    await this.pressOn(locator);
    await this.releaseOver(locator);
  }

  /** Sets the header labels, which may carry markup. */
  async setColHeaders(labels: string[]): Promise<void> {
    await this.page.evaluate((colHeaders) => {
      (window as unknown as { hot: any }).hot.updateSettings({ colHeaders });
    }, labels);
  }

  /** Move to the sorting label of a header and hold the left button there. */
  async pressLabel(name: string): Promise<void> {
    await this.pressOn(this.sortLabel(name));
  }

  /** Tap the centre of any element with a finger. Needs `hasTouch`. */
  async tapOn(locator: Locator): Promise<void> {
    const point = await this.centreOf(locator);

    await this.page.touchscreen.tap(point.x, point.y);
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
