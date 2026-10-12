import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the comment editor position fixture (DEV-3207): an RTL page whose grid is wider
 * than the window, so the window scrolls horizontally.
 *
 * The editor is opened through the plugin API instead of a hover. `locator.hover()` scrolls the
 * target into view, which would move the very scroll position a spec sets up on purpose.
 */
export class CommentsEditorPositionPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * The comment editor's outer element.
   *
   * @returns {Locator}
   */
  get editor(): Locator {
    return this.page.locator('.htComments');
  }

  /**
   * A grid cell, by visual coordinates.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Locator}
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Opens the fixture and waits for the bundle.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/comments-editor-position.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);
  }

  /**
   * Scrolls the window so the cell's left edge lands `distance` px from the viewport's left edge,
   * and waits until the grid has rendered the cell there.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {number} distance The wanted distance from the viewport's left edge, in px.
   */
  async scrollCellToViewportLeft(row: number, col: number, distance: number): Promise<void> {
    // Jump to the far inline end first, so the cell is rendered and can be measured.
    await this.page.evaluate(() => window.scrollTo(-1e6, 0));
    await expect(this.cell(row, col)).toBeAttached();

    await this.page.evaluate(({ testId, wanted }) => {
      const cell = document.querySelector(`[data-testid="${testId}"]`) as HTMLElement;
      const documentLeft = cell.getBoundingClientRect().left + window.scrollX;

      window.scrollTo(documentLeft - wanted, 0);
    }, { testId: `cell-${row}-${col}`, wanted: distance });

    await expect.poll(async() => (await this.cell(row, col).boundingBox())?.x).toBeCloseTo(distance, 0);
  }

  /**
   * Whether the window is scrolled part of the way: away from both ends of the RTL scroll range.
   *
   * @returns {Promise<boolean>}
   */
  async isScrolledPartOfTheWay(): Promise<boolean> {
    return this.page.evaluate(() => {
      const { scrollX } = window;
      const { scrollWidth, clientWidth } = document.documentElement;

      return scrollX < 0 && scrollX > -(scrollWidth - clientWidth);
    });
  }

  /**
   * Opens the comment editor of a cell through the plugin API.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  async showEditorAt(row: number, col: number): Promise<void> {
    await this.page.evaluate(({ r, c }) => {
      (window as any).hot.getPlugin('comments').showAtCell(r, c);
    }, { r: row, c: col });

    await expect(this.editor).toBeVisible();
  }
}
