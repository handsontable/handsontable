import { type Locator, type Page, expect } from '@playwright/test';

export type IncrementalRenderScenario = 'text' | 'always' | 'mixed' | 'frozen-merge' | 'formulas' | 'search';

/**
 * Page Object for the `renderMode` fixture. Every probe reads the grid through the fixture's own
 * globals (`window.hot`, the paint counter, the canonical snapshot), so the specs never depend on
 * DOM structure beyond the `data-testid` the fixture's renderers stamp on each cell.
 */
export class IncrementalRenderPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly scenario: IncrementalRenderScenario;

  constructor(page: Page, theme = 'main', bundle = 'umd', scenario: IncrementalRenderScenario = 'text') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.scenario = scenario;
  }

  /**
   * Opens the fixture and waits for the bundle, the grid, and the first cell.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/incremental-render.html?theme=${this.theme}&bundle=${this.bundle}&scenario=${this.scenario}`
    );

    // Wait for the bundle before the cell. The test id comes from the fixture's renderer, so
    // "cell not found" alone cannot tell a slow bundle apart from a grid that failed to render.
    await this.page.waitForFunction(() => 'Handsontable' in window);
    await this.page.waitForFunction(() => (window as unknown as { htReady?: boolean }).htReady === true);

    // The first cell, wherever it renders: with frozen rows and columns the master table's band can
    // start past row 0, and the cell then exists only in the overlay clones.
    await expect(this.page.getByTestId('cell-0-0').first()).toBeVisible();

    // Settle the rendered band. The init draw runs before the column header height is measured,
    // so it renders one row more than the next draw; that next draw therefore repaints every
    // master cell once (the band is part of a cell's paint stamp). The counts the specs assert
    // start from the settled state.
    await this.run('hot.render();');
    await this.resetPaints();
  }

  /**
   * Returns a data cell of the master table through its fixture-owned test id. Scoped to the
   * master because a frozen row or column is rendered again in the overlay clones, with the same
   * test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Runs grid API calls inside the page. The body is a string of JavaScript that sees `hot`.
   */
  async run(body: string): Promise<void> {
    await this.page.evaluate(`(() => { const hot = window.hot; ${body} })()`);
  }

  /**
   * Evaluates an expression inside the page. The expression sees `hot`.
   */
  async read<T>(expression: string): Promise<T> {
    return this.page.evaluate(`(() => { const hot = window.hot; return (${expression}); })()`) as Promise<T>;
  }

  /**
   * Clears the paint counter.
   */
  async resetPaints(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as { htResetPaints: () => void }).htResetPaints());
  }

  /**
   * Returns the `row,col` keys of every cell painted since the counter was reset, sorted.
   */
  async paintedCells(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { htPaintedCells: () => string[] }).htPaintedCells());
  }

  /**
   * Returns the canonical serialization of the rendered tables.
   */
  async snapshot(): Promise<string> {
    return this.page.evaluate(() => (window as unknown as { htSnapshot: () => string }).htSnapshot());
  }

  /**
   * Asserts that the tables look exactly as they would after a render that paints every cell:
   * takes a snapshot, forces a full repaint through `markAllCellsChanged()`, and compares.
   */
  async expectEqualToFullRepaint(): Promise<void> {
    const rendered = await this.snapshot();

    await this.run('hot.markAllCellsChanged(); hot.render();');

    expect(rendered).toBe(await this.snapshot());
  }
}
