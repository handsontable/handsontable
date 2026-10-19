import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

type GridName = 'source' | 'target';

/**
 * Page Object for the view-state API fixture: two identical grids, `source` and `target`.
 */
export class ViewStateApiPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture and wait for both grids to render.
   */
  async goto({ pagination = false } = {}): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/view-state-api.html?theme=${this.theme}&bundle=${this.bundle}` +
      `${pagination ? '&pagination=1' : ''}`);
    await awaitBundle(this.page);
    await expect(this.cell('source', 0, 0)).toBeVisible();
    await expect(this.cell('target', 0, 0)).toBeVisible();
  }

  /**
   * A data cell of one grid, by visual position, via its stable test id.
   */
  cell(grid: GridName, row: number, col: number): Locator {
    return this.page.getByTestId(`${grid}-cell-${row}-${col}`);
  }

  /**
   * A column header of one grid, read from its top overlay.
   */
  columnHeader(grid: GridName, col: number): Locator {
    return this.page.getByTestId(grid).locator('.ht_clone_top thead th').nth(col + 1);
  }

  /**
   * Captures the source grid's view state and restores it onto the target grid through JSON,
   * the way an application stores it. Returns the parts the restore skipped.
   */
  async copyViewState(): Promise<unknown[]> {
    return this.page.evaluate(() => {
      const json = JSON.stringify((window as any).source.getPlugin('viewState').getViewState());

      return (window as any).target.getPlugin('viewState').setViewState(JSON.parse(json)).skipped;
    });
  }

  /**
   * Scrolls one grid so the given cell is the first fully visible one.
   */
  async scrollTo(grid: GridName, row: number, col: number): Promise<void> {
    await this.page.evaluate(([name, r, c]) => {
      (window as any)[name].scrollViewportTo({ row: r, col: c, verticalSnap: 'top', horizontalSnap: 'start' });
    }, [grid, row, col] as const);
    await expect(this.cell(grid, row, col)).toBeVisible();
    await expect.poll(() => this.firstVisible(grid)).toEqual({ row, col });
  }

  /**
   * The first fully visible row and column of one grid.
   */
  async firstVisible(grid: GridName): Promise<{ row: number, col: number }> {
    return this.page.evaluate(name => ({
      row: (window as any)[name].getFirstFullyVisibleRow(),
      col: (window as any)[name].getFirstFullyVisibleColumn(),
    }), grid);
  }

  /**
   * Opens a page of one grid through the Pagination plugin.
   */
  async setPage(grid: GridName, page: number): Promise<void> {
    await this.page.evaluate(([name, p]) => {
      (window as any)[name].getPlugin('pagination').setPage(p);
    }, [grid, page] as const);
  }

  /**
   * The current page of one grid.
   */
  async currentPage(grid: GridName): Promise<number> {
    return this.page.evaluate(name => (window as any)[name].getPlugin('pagination').getCurrentPage(), grid);
  }

  /**
   * The selection of one grid, as `getSelected()` reports it.
   */
  async selected(grid: GridName): Promise<number[][] | undefined> {
    return this.page.evaluate(name => (window as any)[name].getSelected(), grid);
  }
}
