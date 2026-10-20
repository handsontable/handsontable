import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS } from '../bundle';

interface Highlight {
  row: number;
  col: number;
}

interface SelectionHookCounts {
  beforeSetRangeStart: number;
  beforeSetRangeStartOnly: number;
  beforeSetRangeEnd: number;
  beforeSelectionHighlightSet: number;
  beforeSelectionFocusSet: number;
  afterSelection: number;
  afterSelectionByProp: number;
  afterSelectionFocusSet: number;
  afterSelectionEnd: number;
  afterSelectionEndByProp: number;
  afterIsMultipleSelection: number;
  afterDeselect: number;
}

interface EditorState {
  opened: boolean;
  value: string;
}

interface HandsontableFixture {
  selectCells(coords: number[][], scrollToCell?: boolean): void;
  selectCell(row: number, column: number, endRow: number, endColumn: number, scrollToCell?: boolean): void;
  getSelected(): number[][] | undefined;
  getSelectedRangeLast(): { highlight: { row: number, col: number } } | undefined;
  getDataAtCell(row: number, column: number): unknown;
  getActiveEditor(): { isOpened(): boolean, getValue(): string };
  addHook(name: string, callback: () => void): void;
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
   * The opacity of the cell's selection fill, painted on its `::before`.
   */
  async fillOpacity(row: number, col: number): Promise<string> {
    return this.cell(row, col).evaluate(element => getComputedStyle(element, '::before').opacity);
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
   * Opens the editor on the current highlight. Enter moves inside a multi-cell range, so this
   * presses F2, the shortcut that opens the editor there.
   */
  async openEditor(): Promise<void> {
    await this.page.keyboard.press('F2');
    await expect.poll(() => this.editorState()).toMatchObject({ opened: true });
  }

  /**
   * The value stored at a cell.
   */
  async dataAt(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(({ row: cellRow, col: cellColumn }) => {
      const { hot } = window as Window & { hot: HandsontableFixture };

      return hot.getDataAtCell(cellRow, cellColumn);
    }, { row, col });
  }

  /**
   * Whether the active editor is open, and the value it holds.
   */
  async editorState(): Promise<EditorState> {
    return this.page.evaluate(() => {
      const { hot } = window as Window & { hot: HandsontableFixture };
      const editor = hot.getActiveEditor();

      return { opened: editor.isOpened(), value: editor.getValue() };
    });
  }

  /**
   * From the next `afterSelection`, calls `merge()` or `unmerge()` on the same rectangle.
   * Stops after a handful of calls so a loop ends as a failed assertion instead of a hung page.
   */
  async callAgainFromAfterSelection(
    method: 'merge' | 'unmerge',
    startRow: number,
    startColumn: number,
    endRow: number,
    endColumn: number,
  ): Promise<void> {
    await this.page.evaluate(({ method: name, startRow: row, startColumn: column, endRow: lastRow, endColumn: lastColumn }) => {
      const { hot } = window as Window & { hot: HandsontableFixture };
      let calls = 0;

      (window as Window & { htReentryCalls: number }).htReentryCalls = 0;
      hot.addHook('afterSelection', () => {
        calls += 1;
        (window as Window & { htReentryCalls: number }).htReentryCalls = calls;

        if (calls > 6) {
          return;
        }

        hot.getPlugin('mergeCells')[name](row, column, lastRow, lastColumn);
      });
    }, { method, startRow, startColumn, endRow, endColumn });
  }

  /**
   * How many times the re-entry hook installed by {@link callAgainFromAfterSelection} ran.
   */
  async reentryCalls(): Promise<number> {
    return this.page.evaluate(() => (window as Window & { htReentryCalls: number }).htReentryCalls);
  }

  /**
   * Merges the active selection through `mergeSelection()`.
   */
  async mergeSelection(): Promise<void> {
    await this.page.evaluate(() => {
      const { hot } = window as Window & { hot: HandsontableFixture };

      hot.getPlugin('mergeCells').mergeSelection();
    });
  }

  /**
   * Unmerges the active selection through `unmergeSelection()`.
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
