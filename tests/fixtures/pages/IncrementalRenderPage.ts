import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

export type IncrementalRenderScenario =
  'text' | 'always' | 'mixed' | 'frozen-merge' | 'formulas' | 'search' | 'cells-fn' | 'resize' | 'merge-height' | 'comments' |
  'scroll' | 'frozen' | 'merge' | 'mapping';

/**
 * A merged block of the `merge` scenario, as the fixture declares it.
 */
export interface MergedBlock {
  row: number;
  col: number;
  rowspan: number;
  colspan: number;
}

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
    await awaitBundle(this.page);
    await this.page.waitForFunction(() => (window as unknown as { htReady?: boolean }).htReady === true, undefined, { polling: 100 });

    // The first cell, wherever it renders: with frozen rows and columns the master table's band can
    // start past row 0, and the cell then exists only in the overlay clones.
    await expect(this.page.getByTestId('cell-0-0').first()).toBeVisible();

    // Settle the rendered band. The init draw runs before the column header height is measured,
    // so it renders one row more than the next draw. Where the engine cannot keep stationary bands
    // (merged cells), the band is part of a cell's paint stamp and that next draw repaints every
    // master cell once. The counts the specs assert start from the settled state either way.
    await this.run('hot.render();');
    await this.resetPaints();
  }

  /**
   * Returns the merged blocks the `merge` scenario declares.
   */
  async mergedBlocks(): Promise<MergedBlock[]> {
    return this.page.evaluate(() => (window as unknown as { htMergedBlocks: MergedBlock[] }).htMergedBlocks);
  }

  /**
   * Returns the first and last rendered rows of the master table.
   */
  async renderedBand(): Promise<[number, number]> {
    return this.read<[number, number]>('[hot.getFirstRenderedVisibleRow(), hot.getLastRenderedVisibleRow()]');
  }

  /**
   * Scrolls the viewport so that `row` is its first fully visible row, and waits for the draw the
   * scroll event triggers (the fixture counts `afterScrollVertically`, which the engine fires after
   * that draw). Nothing calls `render()` here, because the engine's own scroll-driven draw is the one
   * under test: it is the draw that keeps a row's elements across the move, while an explicit
   * `render()` rebuilds the band. A target whose rows already sit inside the rendered band resolves
   * as a fast draw that paints nothing, so a spec that expects paints must scroll past the band (the
   * `scroll` and `frozen` scenarios render 10 rows past the viewport on each side). A target the
   * viewport already sits at scrolls nothing and fires no draw, so it fails here at once instead of
   * waiting for a draw that never comes.
   */
  async scrollToRow(row: number): Promise<void> {
    const drawsBefore = await this.read<number>('window.htScrollDraws');
    const scrolled = await this.read<boolean>(`hot.scrollViewportTo({ row: ${row}, verticalSnap: 'top' })`);

    if (!scrolled) {
      throw new Error(`scrollToRow(${row}): the viewport did not move, so no scroll draw will follow`);
    }

    await this.page.waitForFunction(
      (before: number) => (window as unknown as { htScrollDraws: number }).htScrollDraws > before,
      drawsBefore,
      { polling: 50 },
    );
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
   * Asserts that every rendered master cell shows the value of its own coordinates: no element holds
   * a row it was recorded for under an earlier row mapping. Narrower than `expectEqualToFullRepaint`
   * on purpose, for a draw that follows a mapping change with no render in between: a plugin's own
   * per-cell state (HiddenRows' marker class) is filled from the meta memo the last host render left,
   * and that memo clears on a host render only, so it waits for the render the plugin documents.
   */
  async expectCellsMatchData(): Promise<void> {
    const mismatches = await this.read<string[]>(`(() => {
      const out = [];
      for (let row = hot.getFirstRenderedVisibleRow(); row <= hot.getLastRenderedVisibleRow(); row++) {
        for (let col = 0; col < hot.countCols(); col++) {
          const td = hot.getCell(row, col, true);
          if (td && td.textContent !== String(hot.getDataAtCell(row, col))) {
            out.push(row + ',' + col + ': ' + td.textContent);
          }
        }
      }
      return out;
    })()`);

    expect(mismatches).toEqual([]);
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
