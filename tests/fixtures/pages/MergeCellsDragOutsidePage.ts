import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS } from '../bundle';

type Selection = [number, number, number, number];

/**
 * Page Object for the merge drag fixture: a grid with a merged band the pointer is dragged past while
 * it is outside the grid, to check which cell the selection follows.
 */
export class MergeCellsDragOutsidePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture for a merge scenario and waits for the first cell to render.
   *
   * @param {string} scenario `vertical` (a column band over rows 3-8) or `horizontal` (a row band over
   * columns A-C).
   */
  async goto(scenario = 'vertical'): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/merge-cells-drag-outside.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&scenario=${scenario}`,
    );
    // Wait against the test budget, not the `expect` timeout (see fixtures/bundle.ts).
    await awaitBundle(this.page);
    await this.page.waitForFunction(
      () => 'hot' in window || 'htBuildError' in window,
      undefined,
      { polling: BUNDLE_POLLING_MS },
    );

    const buildError = await this.page.evaluate(() => (window as { htBuildError?: string }).htBuildError ?? null);

    if (buildError !== null) {
      throw new Error(`Handsontable constructor threw in the fixture:\n${buildError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A single data cell, by visual row/column, through its fixture-stamped test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Presses the mouse on a cell, then moves the pointer out of the grid: past its right edge at the height
   * of the given row, or past its bottom edge at the width of the given column. A row is located through its
 * last column and a column through its last row: the merged band of a scenario holds no cell of its own there.
   */
  async dragOut(from: { row: number, col: number }, to: { side: 'right', row: number } | { side: 'bottom', col: number }) {
    const start = (await this.cell(from.row, from.col).boundingBox())!;
    const grid = (await this.page.getByTestId('grid').boundingBox())!;

    await this.page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
    await this.page.mouse.down();

    if (to.side === 'right') {
      const target = (await this.cell(to.row, 4).boundingBox())!;

      await this.page.mouse.move(grid.x + grid.width + 80, target.y + target.height / 2, { steps: 6 });
    } else {
      const target = (await this.cell(9, to.col).boundingBox())!;

      await this.page.mouse.move(target.x + target.width / 2, grid.y + grid.height + 80, { steps: 6 });
    }
  }

  /**
   * Presses the mouse on a cell, then moves the pointer to the center of another cell of the grid.
   */
  async dragWithin(from: { row: number, col: number }, to: { row: number, col: number }): Promise<void> {
    const start = (await this.cell(from.row, from.col).boundingBox())!;
    const target = (await this.cell(to.row, to.col).boundingBox())!;

    await this.page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 4 });
  }

  /**
   * Starts counting the pointer-to-cell lookups of the table: the lookup reads the first partially visible row
   * of the viewport, and nothing else on the pointer path does.
   */
  async countLookups(): Promise<void> {
    await this.page.evaluate(() => {
      const win = window as unknown as {
        hot: { view: { _wt: { wtScroll: { getFirstPartiallyVisibleRow(): number } } } },
        htLookups: number,
      };
      const { wtScroll } = win.hot.view._wt;
      const original = wtScroll.getFirstPartiallyVisibleRow.bind(wtScroll);

      win.htLookups = 0;
      wtScroll.getFirstPartiallyVisibleRow = () => {
        win.htLookups += 1;

        return original();
      };
    });
  }

  /**
   * The number of lookups since `countLookups()`.
   */
  async lookups(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { htLookups: number }).htLookups);
  }

  /**
   * Moves the held pointer to the center of a cell of the grid.
   */
  async moveTo(cell: { row: number, col: number }): Promise<void> {
    const target = (await this.cell(cell.row, cell.col).boundingBox())!;

    await this.page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 4 });
  }

  /**
   * Moves the held pointer past the right edge of the grid, at the height of a row.
   */
  async moveOutRight(row: number): Promise<void> {
    const grid = (await this.page.getByTestId('grid').boundingBox())!;
    const target = (await this.cell(row, 4).boundingBox())!;

    await this.page.mouse.move(grid.x + grid.width + 80, target.y + target.height / 2, { steps: 4 });
  }

  /**
   * Releases the mouse button.
   */
  async release(): Promise<void> {
    await this.page.mouse.up();
  }

  /**
   * The last selection as `[fromRow, fromCol, toRow, toCol]`.
   */
  async selected(): Promise<Selection | undefined> {
    return this.page.evaluate(() =>
      (window as unknown as { hot: { getSelectedLast(): Selection | undefined } }).hot.getSelectedLast());
  }
}
