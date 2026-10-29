import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface MoveHookCall {
  hook: string;
  movePossible: boolean;
  orderChanged?: boolean;
}

/**
 * Page Object for the manual move fixture: a 6x6 grid with physical row 1 and column 1 trimmed, where
 * cell (row, col) reads `r<row>c<col>` by physical position.
 */
export class ManualMoveTrimmedPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/manual-move-trimmed.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master overlay, by visual row and column.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The row header of a visual row.
   */
  rowHeader(row: number): Locator {
    return this.grid.locator('.ht_clone_inline_start tbody th').nth(row);
  }

  /**
   * The first cell of every rendered row, top to bottom.
   */
  firstColumnTexts(): Locator {
    return this.grid.locator('.ht_master [data-testid^="cell-"][data-testid$="-0"]');
  }

  /**
   * Make the row hook untrim every row, as an application that shows the hidden rows after a move.
   */
  async untrimRowsAfterRowMove(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).untrimRowsAfterRowMove = true;
    });
  }

  /**
   * Select a row through its header, then press and release the pointer on that same header without
   * moving it: the grab-and-release gesture that drops the row back where it was.
   */
  async grabRowHeaderAndRelease(row: number): Promise<void> {
    // The API selects the row: a header click followed by a press on the same point would read as a double click.
    await this.page.evaluate((r) => (window as any).hot.selectRows(r), row);
    await expect(this.firstColumnTexts().first()).toBeVisible();

    const header = this.rowHeader(row);
    const box = await header.boundingBox();

    if (!box) {
      throw new Error(`Row header ${row} is not rendered`);
    }

    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.up();
  }

  /**
   * Move a column through the plugin API, the way a completed header drag does.
   */
  async dragColumn(column: number, dropIndex: number): Promise<void> {
    await this.page.evaluate(([c, d]) => {
      const hot = (window as any).hot;

      hot.getPlugin('manualColumnMove').dragColumn(c, d);
      hot.render();
    }, [column, dropIndex]);
  }

  /**
   * Remove the fixture's trimming map from the column axis, which shows every column again.
   */
  async untrimColumns(): Promise<void> {
    await this.page.evaluate(() => {
      const hot = (window as any).hot;

      hot.columnIndexMapper.unregisterMap('fixture-trim');
      hot.render();
    });
  }

  /**
   * The visual order of the column index mapper, as physical indexes.
   */
  async columnSequence(): Promise<number[]> {
    return this.page.evaluate(() => (window as any).hot.columnIndexMapper.getIndexesSequence());
  }

  /**
   * The text of the first row of the grid, left to right.
   */
  firstRowTexts(): Locator {
    return this.grid.locator('.ht_master tbody tr:first-child td');
  }

  /**
   * The latest call of a move hook (`afterRowMove`, `afterColumnMove`, ...), or `undefined` before it fired.
   */
  async latestHookCall(hook: string): Promise<MoveHookCall | undefined> {
    return this.page.evaluate(
      (name) => (window as any).moveLog.filter((call: MoveHookCall) => call.hook === name).at(-1),
      hook
    );
  }
}
