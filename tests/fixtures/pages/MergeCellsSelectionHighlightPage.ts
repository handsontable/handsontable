import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS } from '../bundle';

interface Highlight {
  row: number;
  col: number;
}

interface SelectionHookCounts {
  afterSelection: number;
  afterSelectionEnd: number;
}

interface HandsontableFixture {
  selectCells(coords: number[][], scrollToCell?: boolean): void;
  selectCell(row: number, column: number, endRow: number, endColumn: number, scrollToCell?: boolean): void;
  getSelected(): number[][] | undefined;
  getSelectedRangeLast(): { highlight: { row: number, col: number } } | undefined;
  getPlugin(name: string): {
    merge(startRow: number, startColumn: number, endRow: number, endColumn: number): void;
    unmerge(startRow: number, startColumn: number, endRow: number, endColumn: number): void;
    mergeSelection(): void;
    unmergeSelection(): void;
  };
}

/**
 * Page object for the merged-cell selection highlight fixture. F2:G3 and B2:D4 start merged.
 */
export class MergeCellsSelectionHighlightPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture and waits until the first cell has rendered.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/merge-cells-selection-highlight.html?theme=${this.theme}&bundle=${this.bundle}`,
    );
    await awaitBundle(this.page);
    await this.page.waitForFunction(() => 'hot' in window, undefined, { polling: BUNDLE_POLLING_MS });
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master overlay, by visual row and column.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * A column header in the top overlay, which is the one a click selects.
   */
  columnHeader(column: number): Locator {
    return this.page.locator('.ht_clone_top').getByTestId(`col-header-${column}`);
  }

  /**
   * The class tokens on a data cell.
   */
  async classNames(row: number, col: number): Promise<string[]> {
    const value = await this.cell(row, col).getAttribute('class');

    return (value ?? '').split(/\s+/).filter(Boolean);
  }

  /**
   * The selection ranges, each `[startRow, startColumn, endRow, endColumn]`.
   */
  async selected(): Promise<number[][]> {
    return this.page.evaluate(() => {
      const { hot } = window as Window & { hot: HandsontableFixture };

      return hot.getSelected() ?? [];
    });
  }

  /**
   * The focused cell of the last selection range.
   */
  async highlight(): Promise<Highlight | null> {
    return this.page.evaluate(() => {
      const { hot } = window as Window & { hot: HandsontableFixture };
      const range = hot.getSelectedRangeLast();

      return range ? { row: range.highlight.row, col: range.highlight.col } : null;
    });
  }

  /**
   * How many times the selection hooks have fired since the grid was created.
   */
  async selectionHookCounts(): Promise<SelectionHookCounts> {
    return this.page.evaluate(() => {
      return (window as Window & { htSelectionHooks: SelectionHookCounts }).htSelectionHooks;
    });
  }

  /**
   * Replaces the selection with the given ranges, without scrolling.
   */
  async selectCells(ranges: number[][]): Promise<void> {
    await this.page.evaluate((coords) => {
      const { hot } = window as Window & { hot: HandsontableFixture };

      hot.selectCells(coords, false);
    }, ranges);
  }

  /**
   * Selects one range, without scrolling.
   */
  async selectCell(row: number, column: number, endRow: number, endColumn: number): Promise<void> {
    await this.page.evaluate(({ row: startRow, column: startColumn, endRow: rangeEndRow, endColumn }) => {
      const { hot } = window as Window & { hot: HandsontableFixture };

      hot.selectCell(startRow, startColumn, rangeEndRow, endColumn, false);
    }, { row, column, endRow, endColumn });
  }

  /**
   * Merges the rectangle through the public `merge()` method.
   */
  async merge(startRow: number, startColumn: number, endRow: number, endColumn: number): Promise<void> {
    await this.page.evaluate((coords) => {
      const { hot } = window as Window & { hot: HandsontableFixture };

      hot.getPlugin('mergeCells').merge(coords.startRow, coords.startColumn, coords.endRow, coords.endColumn);
    }, { startRow, startColumn, endRow, endColumn });
  }

  /**
   * Unmerges the rectangle through the public `unmerge()` method.
   */
  async unmerge(startRow: number, startColumn: number, endRow: number, endColumn: number): Promise<void> {
    await this.page.evaluate((coords) => {
      const { hot } = window as Window & { hot: HandsontableFixture };

      hot.getPlugin('mergeCells').unmerge(coords.startRow, coords.startColumn, coords.endRow, coords.endColumn);
    }, { startRow, startColumn, endRow, endColumn });
  }

  /**
   * Merges the active selection the way the context menu does.
   */
  async mergeSelection(): Promise<void> {
    await this.page.evaluate(() => {
      const { hot } = window as Window & { hot: HandsontableFixture };

      hot.getPlugin('mergeCells').mergeSelection();
    });
  }

  /**
   * Unmerges the active selection the way the context menu does.
   */
  async unmergeSelection(): Promise<void> {
    await this.page.evaluate(() => {
      const { hot } = window as Window & { hot: HandsontableFixture };

      hot.getPlugin('mergeCells').unmergeSelection();
    });
  }

  /**
   * The master overlay's vertical scroll offset.
   */
  async holderScrollTop(): Promise<number> {
    return this.page.locator('.ht_master .wtHolder').evaluate(holder => holder.scrollTop);
  }

  /**
   * Scrolls the master overlay and waits until the offset sticks.
   */
  async scrollHolderTo(top: number): Promise<void> {
    await this.page.locator('.ht_master .wtHolder').evaluate((holder, value) => {
      holder.scrollTop = value;
    }, top);
    await expect.poll(async() => this.holderScrollTop()).toBe(top);
  }
}
