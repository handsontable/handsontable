import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import type { Bundle } from '../bundle';

interface RowMoveCall {
  hook: string;
  movedRows: number[];
  finalIndex: number;
  dropIndex: number;
  movePossible: boolean;
  orderChanged: boolean;
}

/**
 * Page Object for the hidden-gap fixture: six rows, with the rows 2 and 3 hidden, so the visible rows
 * are 0, 1, 4 and 5. Cell (row, col) reads `r<row>c<col>` by physical position. Row headers are
 * addressed by their RENDERED position (the hidden rows draw none), which is `0, 1, 2, 3` for the
 * visible rows 0, 1, 4 and 5.
 */
export class ManualRowMoveHiddenGapPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/manual-row-move-hidden-gap.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.firstColumnTexts().first()).toBeVisible();
  }

  /**
   * The row header at a rendered position.
   */
  rowHeader(renderedRow: number): Locator {
    return this.grid.locator('.ht_clone_inline_start tbody th').nth(renderedRow);
  }

  /**
   * The first cell of every rendered row, top to bottom.
   */
  firstColumnTexts(): Locator {
    return this.grid.locator('.ht_master [data-testid^="cell-"][data-testid$="-0"]');
  }

  /**
   * Select the row through the API, press its header, and drag the pointer to the lower or the upper half
   * of another rendered row's header, then release. The pointer is inside the target header, so the plugin
   * resolves the drop index from that row.
   */
  async dragRowHeader(fromRenderedRow: number, toRenderedRow: number, half: 'upper' | 'lower'): Promise<void> {
    // The API selects the row: a header click followed by a press on the same point would read as a double click.
    await this.page.evaluate((r) => {
      const hot = (window as any).hot;

      hot.selectRows(hot.rowIndexMapper.getVisualFromRenderableIndex(r));
    }, fromRenderedRow);
    await expect(this.firstColumnTexts().first()).toBeVisible();

    const source = await this.rowHeader(fromRenderedRow).boundingBox();
    const target = await this.rowHeader(toRenderedRow).boundingBox();

    if (!source || !target) {
      throw new Error('A row header of the drag is not rendered');
    }

    const x = source.x + source.width / 2;
    const targetY = half === 'upper' ? target.y + 3 : target.y + target.height - 3;

    await this.page.mouse.move(x, source.y + source.height / 2);
    await this.page.mouse.down();
    // Travel past the drag tolerance, then land in the requested half of the target header.
    await this.page.mouse.move(x, targetY, { steps: 8 });
    await this.page.mouse.up();
  }

  /**
   * The column header at a rendered position, in the bottom header row.
   */
  columnHeader(renderedColumn: number): Locator {
    // The first cell of the header row is the corner above the row headers.
    return this.grid.locator('.ht_clone_top thead tr:last-child th').nth(renderedColumn + 1);
  }

  /**
   * Select a column through the API, press its header, and drag the pointer to the left or the right half
   * of another rendered column's header, then release.
   */
  async dragColumnHeader(fromRenderedColumn: number, toRenderedColumn: number, half: 'left' | 'right'): Promise<void> {
    await this.page.evaluate((c) => {
      const hot = (window as any).hot;

      hot.selectColumns(hot.columnIndexMapper.getVisualFromRenderableIndex(c));
    }, fromRenderedColumn);
    await expect(this.firstColumnTexts().first()).toBeVisible();

    const source = await this.columnHeader(fromRenderedColumn).boundingBox();
    const target = await this.columnHeader(toRenderedColumn).boundingBox();

    if (!source || !target) {
      throw new Error('A column header of the drag is not rendered');
    }

    const y = source.y + source.height / 2;
    const targetX = half === 'left' ? target.x + 3 : target.x + target.width - 3;

    await this.page.mouse.move(source.x + source.width / 2, y);
    await this.page.mouse.down();
    await this.page.mouse.move(targetX, y, { steps: 8 });
    await this.page.mouse.up();
  }

  /**
   * The physical order of the columns, as the column index mapper holds it.
   */
  async columnSequence(): Promise<number[]> {
    return this.page.evaluate(() => (window as any).hot.columnIndexMapper.getIndexesSequence());
  }

  /**
   * The physical order of the rows, as the row index mapper holds it.
   */
  async rowSequence(): Promise<number[]> {
    return this.page.evaluate(() => (window as any).hot.rowIndexMapper.getIndexesSequence());
  }

  /**
   * Show every hidden row again.
   */
  async showHiddenRows(): Promise<void> {
    await this.page.evaluate(() => {
      const hot = (window as any).hot;

      // `showRows()` takes visual indexes, and the move has changed where the physical rows 2 and 3 sit.
      hot.getPlugin('hiddenRows').showRows([2, 3].map((physicalRow) => hot.toVisualRow(physicalRow)));
      hot.render();
    });
  }

  /**
   * The latest call of the `afterRowMove` hook, or `undefined` before it fired.
   */
  async latestMove(): Promise<RowMoveCall | undefined> {
    return this.page.evaluate(() => (window as any).moveLog.at(-1));
  }
}
