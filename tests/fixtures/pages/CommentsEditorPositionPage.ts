import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * Page Object for the comment editor position fixture (DEV-3207): an RTL grid wider than the
 * window, so the window scrolls horizontally. The page itself is RTL (`rtl`, the window scroll is
 * zero or negative) or LTR (`ltr`, an RTL grid on an LTR page, whose window scroll is positive).
 *
 * The editor is opened through the plugin API instead of a hover. `locator.hover()` scrolls the
 * target into view, which would move the very scroll position a spec sets up on purpose.
 */
export class CommentsEditorPositionPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly pageDirection: 'rtl' | 'ltr';

  constructor(page: Page, theme = 'main', bundle = 'umd', pageDirection: 'rtl' | 'ltr' = 'rtl') {
    this.pageDirection = pageDirection;
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
      `/tests/fixtures/demo/comments-editor-position.html?theme=${this.theme}&bundle=${this.bundle}&page=${this.pageDirection}`
    );
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
  }

  /**
   * Scrolls the window so the cell's left edge lands `distance` px from the viewport's left edge,
   * and waits until the grid has rendered the cell there.
   *
   * The window scroll drives which columns Walkontable renders, so the cell does not exist until
   * the scroll is near it. The first jump is an estimate from the grid's layout (the row header
   * width is not known), good enough to render the cell; a second jump uses the measured position.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {number} distance The wanted distance from the viewport's left edge, in px.
   */
  async scrollCellToViewportLeft(row: number, col: number, distance: number): Promise<void> {
    await this.page.evaluate(({ c, wanted }) => {
      const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;
      const gridRight = grid.getBoundingClientRect().right + window.scrollX;
      const estimatedLeft = gridRight - (c + 1) * 100 - 50;

      window.scrollTo(estimatedLeft - wanted, 0);
    }, { c: col, wanted: distance });

    await expect(this.cell(row, col)).toBeAttached();

    await this.page.evaluate(({ testId, wanted }) => {
      const cell = document.querySelector(`[data-testid="${testId}"]`) as HTMLElement;
      const documentLeft = cell.getBoundingClientRect().left + window.scrollX;

      window.scrollTo(documentLeft - wanted, 0);
    }, { testId: `cell-${row}-${col}`, wanted: distance });

    await expect.poll(async() => (await this.cell(row, col).boundingBox())?.x).toBeCloseTo(distance, 0);
  }

  /**
   * Scrolls the window to its start position (`scrollX` 0).
   */
  async scrollToStart(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => this.page.evaluate(() => window.scrollX)).toBe(0);
  }

  /**
   * The column of the rendered cell in the row that lies nearest to the viewport's left edge
   * without crossing it.
   *
   * @param {number} row The visual row index.
   * @returns {Promise<number>}
   */
  async columnNearestViewportLeft(row: number): Promise<number> {
    return this.page.evaluate((r) => {
      let best = { col: -1, left: Infinity };

      document.querySelectorAll(`[data-testid^="cell-${r}-"]`).forEach((td) => {
        const { left } = td.getBoundingClientRect();

        if (left >= 0 && left < best.left) {
          best = { col: Number(td.getAttribute('data-testid')!.split('-')[2]), left };
        }
      });

      return best.col;
    }, row);
  }

  /**
   * The window's horizontal scroll position and its scrollable range, to assert which scroll
   * state a test is in.
   *
   * @returns {Promise<{ scrollX: number, max: number }>}
   */
  async scrollState(): Promise<{ scrollX: number, max: number }> {
    return this.page.evaluate(() => ({
      scrollX: window.scrollX,
      max: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
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
