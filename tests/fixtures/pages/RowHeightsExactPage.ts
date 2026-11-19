import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Settings the fixture accepts. `rowHeightsFromArray` becomes a `rowHeights` function that reads the
 * array by visual row, because a function cannot cross the Playwright boundary.
 */
export type RowHeightsExactSettings = Record<string, unknown> & {
  rowHeightsFromArray?: Array<number | undefined>;
  rowCount?: number;
};

/**
 * Page Object for the exact-row-heights fixture (`rowHeights` and `minRowHeights`).
 */
export class RowHeightsExactPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Load the fixture and build the grid with the given settings.
   */
  async goto(settings: RowHeightsExactSettings = {}): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/row-heights-exact.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await this.mount(settings);
  }

  /**
   * Destroy the grid and build a new one with the given settings.
   */
  async mount(settings: RowHeightsExactSettings = {}): Promise<void> {
    await this.page.evaluate((s) => (window as any).mountGrid(s), settings);
    // Not cell (0, 0): a case can hide that row.
    await expect(this.page.locator('.ht_master tbody td').first()).toBeVisible();
  }

  /**
   * Call `updateSettings` on the live grid.
   */
  async update(settings: RowHeightsExactSettings): Promise<void> {
    await this.page.evaluate((s) => (window as any).updateGrid(s), settings);
  }

  /**
   * Updates the settings with rendering suspended, scrolls to a row (a scroll draws the rows that come
   * into view, which a suspended render does not stop) and returns the heights of the master rows
   * painted by then, before rendering resumes.
   */
  async rowHeightsOfScrollDrawWhileSuspended(settings: RowHeightsExactSettings, row: number): Promise<number[]> {
    return this.page.evaluate(async([s, r]) => {
      const { hot } = window as any;
      const frame = () => new Promise(resolve => requestAnimationFrame(resolve));

      hot.suspendRender();
      hot.updateSettings(s);
      hot.scrollViewportTo({ row: r, verticalSnap: 'bottom' });

      // The scroll event draws the rows that come into view on a later frame.
      await frame();
      await frame();

      const heights = [...document.querySelectorAll('.ht_master tbody tr')]
        .map(tr => tr.getBoundingClientRect().height);

      hot.resumeRender();

      return heights;
    }, [settings, row] as [RowHeightsExactSettings, number]);
  }

  /**
   * A data cell of the master table, by visual row and column, via its stable test id. Frozen rows
   * and columns render the same cell again in an overlay clone, so the locator is scoped to the master.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The row-height-mode marker class and clip wrapper state of a body row of the master table.
   */
  masterRow(row: number): Locator {
    return this.page.locator('.ht_master tbody tr').nth(row);
  }

  /**
   * The height of every rendered body row of the master table, in pixels.
   */
  async masterRowHeights(): Promise<number[]> {
    return this.page.evaluate(() => [...document.querySelectorAll('.ht_master tbody tr')]
      .map(tr => tr.getBoundingClientRect().height));
  }

  /**
   * The height of every row header cell, in pixels. Row headers live in the inline-start overlay.
   */
  async rowHeaderHeights(): Promise<number[]> {
    return this.page.evaluate(() => [...document.querySelectorAll('.ht_clone_inline_start tbody th')]
      .map(th => th.getBoundingClientRect().height));
  }

  /**
   * What `hot.getRowHeight()` answers for the given visual rows.
   */
  async getRowHeights(rows: number[]): Promise<Array<number | undefined>> {
    return this.page.evaluate((r) => r.map(row => (window as any).hot.getRowHeight(row)), rows);
  }

  /**
   * Whether a data cell's content is clipped: the cell holds the `htCellClip` wrapper and the
   * wrapper's content is taller than the wrapper.
   */
  async isCellClipped(row: number, col: number): Promise<boolean> {
    return this.cell(row, col).evaluate((td) => {
      const clip = td.querySelector('.htCellClip');

      return clip !== null && clip.scrollHeight > clip.clientHeight;
    });
  }

  /**
   * The number of `htCellClip` wrappers in the master table.
   */
  async clipWrapperCount(): Promise<number> {
    return this.page.locator('.ht_master .htCellClip').count();
  }

  /**
   * Polls until the master rows have the given heights.
   */
  async expectMasterRowHeights(heights: number[]): Promise<void> {
    await expect.poll(() => this.masterRowHeights()).toEqual(heights);
  }

  /**
   * The theme's default row height, which a row with no height of its own renders at.
   */
  async defaultRowHeight(): Promise<number> {
    return this.page.evaluate(() => (window as any).hot.stylesHandler.getDefaultRowHeight());
  }

  /**
   * The height of a master cell's box, read in the same task as the lookup. Rows are recycled across
   * draws, so a node resolved in one round trip can be another row in the next.
   */
  async cellHeight(row: number, col: number): Promise<number | null> {
    return this.page.evaluate(([r, c]) => {
      const td = document.querySelector(`.ht_master [data-testid="cell-${r}-${c}"]`);

      return td === null ? null : td.getBoundingClientRect().height;
    }, [row, col]);
  }

  /**
   * Scrolls the grid so the visual row is the last one in view.
   */
  async scrollToRow(row: number): Promise<void> {
    await this.page.evaluate((r) => (window as any).hot.scrollViewportTo({ row: r, verticalSnap: 'bottom' }), row);
  }

  /**
   * The visual index of the last row the viewport shows fully.
   */
  async lastFullyVisibleRow(): Promise<number> {
    return this.page.evaluate(() => (window as any).hot.getLastFullyVisibleRow());
  }
}
