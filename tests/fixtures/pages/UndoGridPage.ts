import { type Page, type Locator, expect } from '@playwright/test';
import type { CellValue, FixtureSortConfig } from './windowTypes';
import { dragFillHandle, dragResizeHandle } from '../gestures';
import { awaitBundle } from '../bundle';

/**
 * The summary types `initSummaryGrid()` can build.
 */
export type SummaryType = 'sum' | 'min' | 'custom';

/**
 * Page Object for the undo and redo fixture
 * (tests/fixtures/demo/undo-grid.html).
 *
 * The fixture's data is `<column letter><row number>` over a 6x7 grid (cell (0, 0) reads `A1`), so
 * every value names the record it belongs to. Tests express intent (`removeColumns`, `undo`,
 * `rowValues`); the `window.hot` driving lives here.
 */
export class UndoGridPage {
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
    await this.page.goto(`/tests/fixtures/demo/undo-grid.html?theme=${this.theme}&bundle=${this.bundle}`);
    // A cold server under parallel workers can take longer than the 10s `expect` timeout to deliver
    // the bundle; `awaitBundle()` polls against the test budget instead.
    await awaitBundle(this.page);
    await expect(this.page.getByTestId('cell-0-0')).toBeVisible();
  }

  /**
   * Rebuild the grid with the default settings merged with the given overrides - a fresh instance
   * per test.
   */
  async initGrid(overrides: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate(settings => window.initUndoGrid(settings), overrides);
    await expect(this.page.getByTestId('cell-0-0')).toBeVisible();
  }

  /**
   * Rebuild the grid with a ColumnSummary of the first column, written into the last row (row 4). The
   * grid is built in the page, because a summary's `customFunction` and a cell validator are functions.
   *
   * @param type The summary type. `custom` writes the text `computed`.
   * @param options.numeric Makes the first column `numeric`.
   * @param options.validator Gives the first column a custom validator that accepts every value.
   */
  async initSummaryGrid(
    type: SummaryType, { numeric = false, validator = false }: { numeric?: boolean, validator?: boolean } = {}
  ): Promise<void> {
    await this.page.evaluate(([summaryType, isNumeric, hasValidator]) => {
      const firstColumn: Record<string, unknown> = {};

      if (isNumeric) {
        firstColumn.type = 'numeric';
      }

      if (hasValidator) {
        firstColumn.validator = (value: unknown, callback: (valid: boolean) => void) => callback(true);
      }

      window.initUndoGrid({
        data: [[1, 'a'], [2, 'b'], [3, 'c'], [4, 'd'], [null, null]],
        columns: [firstColumn, {}],
        columnSummary: [{
          sourceColumn: 0,
          destinationRow: 4,
          destinationColumn: 0,
          type: summaryType,
          forceNumeric: true,
          customFunction: () => 'computed',
        }],
      });
    }, [type, numeric, validator] as const);
    await expect(this.grid.locator('.ht_master tbody td').first()).toBeVisible();
  }

  /**
   * Remove `amount` columns starting at a visual column, as one undoable step.
   */
  async removeColumns(visualColumn: number, amount: number): Promise<void> {
    await this.page.evaluate(([column, count]) => window.hot.alter('remove_col', column, count), [visualColumn, amount]);
  }

  /**
   * Remove `amount` rows starting at a visual row, as one undoable step.
   */
  async removeRows(visualRow: number, amount: number): Promise<void> {
    await this.page.evaluate(([row, count]) => window.hot.alter('remove_row', row, count), [visualRow, amount]);
  }

  /**
   * Sort the grid by one visual column.
   */
  async sort(config: FixtureSortConfig): Promise<void> {
    await this.page.evaluate(sortConfig => window.hot.getPlugin('columnSorting').sort(sortConfig), config);
  }

  /**
   * The current sort config of the ColumnSorting plugin.
   */
  async sortConfig(): Promise<FixtureSortConfig[]> {
    return this.page.evaluate(() => window.hot.getPlugin('columnSorting').getSortConfig());
  }

  /**
   * Write a cell value through the grid and wait for it to land, producing one undoable edit.
   */
  async setCell(visualRow: number, visualColumn: number, value: CellValue): Promise<void> {
    await this.page.evaluate(([row, column, newValue]) => new Promise<void>((resolve) => {
      window.hot.addHookOnce('afterChange', () => resolve());
      window.hot.setDataAtCell(row, column, newValue);
    }), [visualRow, visualColumn, value] as const);
  }

  /**
   * Hide rows through the HiddenRows plugin API.
   */
  async hideRows(visualRows: number[]): Promise<void> {
    await this.page.evaluate((rows) => {
      window.hot.getPlugin('hiddenRows').hideRows(rows);
      window.hot.render();
    }, visualRows);
  }

  /**
   * Show hidden rows through the HiddenRows plugin API.
   */
  async showRows(visualRows: number[]): Promise<void> {
    await this.page.evaluate((rows) => {
      window.hot.getPlugin('hiddenRows').showRows(rows);
      window.hot.render();
    }, visualRows);
  }

  /**
   * Trim rows through the TrimRows plugin API.
   */
  async trimRows(physicalRows: number[]): Promise<void> {
    await this.page.evaluate((rows) => {
      window.hot.getPlugin('trimRows').trimRows(rows);
      window.hot.render();
    }, physicalRows);
  }

  /**
   * Freeze a column through the ManualColumnFreeze plugin API.
   */
  async freezeColumn(visualColumn: number): Promise<void> {
    await this.page.evaluate((column) => {
      window.hot.getPlugin('manualColumnFreeze').freezeColumn(column);
      window.hot.render();
    }, visualColumn);
  }

  /**
   * Set a column width through the ManualColumnResize plugin API.
   */
  async resizeColumn(visualColumn: number, width: number): Promise<void> {
    await this.page.evaluate(([column, newWidth]) => {
      window.hot.getPlugin('manualColumnResize').setManualSize(column, newWidth);
      window.hot.render();
    }, [visualColumn, width]);
  }

  /**
   * Resize a column the way a user does: hover its header, then drag the resize handle that
   * appears. The drag moves the pointer in several steps.
   */
  async dragColumnResizeHandle(visualColumn: number, deltaX: number): Promise<void> {
    const handle = this.grid.locator('.manualColumnResizer');

    // Park the pointer first, so hovering the header produces the `mouseover` the plugin reacts to.
    await this.page.mouse.move(0, 0);
    // `nth(column + 1)` skips the corner cell.
    await this.grid.locator('.ht_clone_top thead tr').first().locator('th').nth(visualColumn + 1).hover();
    await expect(handle).toBeVisible();
    await dragResizeHandle(this.page, handle, { x: deltaX });
  }

  /**
   * Drag a column resize handle with the button held while `whileHeld` runs, halfway through the
   * drag. The pointer moves in several steps, like `dragColumnResizeHandle()`.
   */
  async dragColumnResizeHandleWhile(
    visualColumn: number, deltaX: number, whileHeld: () => Promise<void>
  ): Promise<void> {
    const handle = this.grid.locator('.manualColumnResizer');

    await this.page.mouse.move(0, 0);
    // `nth(column + 1)` skips the corner cell.
    await this.grid.locator('.ht_clone_top thead tr').first().locator('th').nth(visualColumn + 1).hover();
    await expect(handle).toBeVisible();

    const box = await handle.boundingBox();

    if (!box) {
      throw new Error('The resize handle has no layout box.');
    }

    const startX = box.x + (box.width / 2);
    const startY = box.y + (box.height / 2);

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + (deltaX / 2), startY);
    await whileHeld();
    await this.page.mouse.move(startX + deltaX, startY);
    await this.page.mouse.up();
  }

  /**
   * Autosize a column the way a user does: hover its header, then double-click the resize handle.
   * The autosize runs from a timer after the second press, so wait for the width to change.
   */
  async doubleClickColumnResizeHandle(visualColumn: number): Promise<void> {
    const handle = this.grid.locator('.manualColumnResizer');

    await this.page.mouse.move(0, 0);
    // `nth(column + 1)` skips the corner cell.
    await this.grid.locator('.ht_clone_top thead tr').first().locator('th').nth(visualColumn + 1).hover();
    await expect(handle).toBeVisible();
    await handle.dblclick();
  }

  /**
   * Set a row height through the ManualRowResize plugin API.
   */
  async resizeRow(visualRow: number, height: number): Promise<void> {
    await this.page.evaluate(([row, newHeight]) => {
      window.hot.getPlugin('manualRowResize').setManualSize(row, newHeight);
      window.hot.render();
    }, [visualRow, height]);
  }

  /**
   * The height of a visual row, or `undefined` when nothing sets it.
   */
  async rowHeight(visualRow: number): Promise<number | undefined> {
    return this.page.evaluate(row => window.hot.getRowHeight(row), visualRow);
  }

  /**
   * Select a range and drag the fill handle onto a cell, the way a user drag-fills.
   */
  async fillSelectionTo(range: [number, number, number, number], visualRow: number, visualColumn: number): Promise<void> {
    await this.page.evaluate((cellRange) => {
      window.hot.selectCells([cellRange]);
    }, range);
    await dragFillHandle(this.page, this.grid.locator('.ht_master .wtBorder.corner:visible'), this.cell(visualRow, visualColumn));
  }

  /**
   * The width of a visual column.
   */
  async columnWidth(visualColumn: number): Promise<number> {
    return this.page.evaluate(column => window.hot.getColWidth(column), visualColumn);
  }

  /**
   * Collapse a header group through the CollapsibleColumns plugin API.
   */
  async collapseHeaderGroup(headerLevel: number, visualColumn: number): Promise<void> {
    await this.page.evaluate(([row, col]) => {
      window.hot.getPlugin('collapsibleColumns').collapseSection({ row, col });
    }, [headerLevel, visualColumn]);
  }

  /**
   * The collapse buttons of the column headers, in the top overlay.
   */
  collapseButtons(): Locator {
    return this.grid.locator('.ht_clone_top .collapsibleIndicator');
  }

  /**
   * The number of columns that are not hidden.
   */
  async renderableColumnCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.view.countRenderableColumns());
  }

  /**
   * Collapse a parent row through the NestedRows plugin API.
   */
  async collapseParentRow(visualRow: number): Promise<void> {
    await this.page.evaluate(row => window.hot.getPlugin('nestedRows').collapseParent(row), visualRow);
  }

  /**
   * Whether a visual row is a collapsed parent.
   */
  async isParentRowCollapsed(visualRow: number): Promise<boolean> {
    return this.page.evaluate(row => window.hot.getPlugin('nestedRows').isParentCollapsed(row), visualRow);
  }

  /**
   * The number of visible rows.
   */
  async rowCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.countRows());
  }

  /**
   * Add a border to a range through the CustomBorders plugin API.
   */
  async setTopBorder(range: [number, number, number, number]): Promise<void> {
    await this.page.evaluate((cellRange) => {
      window.hot.getPlugin('customBorders').setBorders([cellRange], { top: { width: 2, color: 'red' } });
    }, range);
  }

  /**
   * From now on, veto every `beforeSetCellMeta` write of a meta key and count the attempts.
   */
  async vetoMetaWrites(key: string): Promise<void> {
    await this.page.evaluate((metaKey) => {
      window.metaWriteAttempts = 0;
      window.hot.addHook('beforeSetCellMeta', (row, column, name) => {
        if (name !== metaKey) {
          return undefined;
        }

        window.metaWriteAttempts += 1;

        return false;
      });
    }, key);
  }

  /**
   * How many meta writes the `vetoMetaWrites()` listener saw.
   */
  async metaWriteAttempts(): Promise<number> {
    return this.page.evaluate(() => window.metaWriteAttempts);
  }

  /**
   * The number of cells the CustomBorders plugin holds a border for.
   */
  async borderCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.getPlugin('customBorders').getBorders().length);
  }

  /**
   * Set a cell comment through the Comments plugin API.
   */
  async setComment(visualRow: number, visualColumn: number, value: string): Promise<void> {
    await this.page.evaluate(([row, column, text]) => {
      window.hot.getPlugin('comments').setCommentAtCell(row, column, text);
    }, [visualRow, visualColumn, value] as const);
  }

  /**
   * The comment of a cell, or `undefined` when it has none.
   */
  async comment(visualRow: number, visualColumn: number): Promise<string | undefined> {
    return this.page.evaluate(([row, column]) => (
      window.hot.getPlugin('comments').getCommentAtCell(row, column)
    ), [visualRow, visualColumn]);
  }

  /**
   * The `comment` cell meta of a cell, or `undefined` when it has none.
   */
  async commentMeta(visualRow: number, visualColumn: number): Promise<unknown> {
    return this.page.evaluate(([row, column]) => (
      window.hot.getCellMeta(row, column).comment
    ), [visualRow, visualColumn]);
  }

  /**
   * Open the comment editor of a cell and put the keyboard focus into it.
   */
  async openCommentEditor(visualRow: number, visualColumn: number): Promise<void> {
    await this.page.evaluate(([row, column]) => {
      const comments = window.hot.getPlugin('comments');

      comments.showAtCell(row, column);
      comments.focusEditor();
    }, [visualRow, visualColumn]);
    await expect(this.commentTextArea()).toBeFocused();
  }

  /**
   * The comment editor's text area.
   */
  commentTextArea(): Locator {
    return this.page.locator('.htCommentTextArea');
  }

  /**
   * Set the page through the Pagination plugin API.
   */
  async setPage(page: number): Promise<void> {
    await this.page.evaluate(pageNumber => window.hot.getPlugin('pagination').setPage(pageNumber), page);
  }

  /**
   * The current page of the Pagination plugin.
   */
  async currentPage(): Promise<number> {
    return this.page.evaluate(() => window.hot.getPlugin('pagination').getCurrentPage());
  }

  /**
   * A rendered cell, by its visual coordinates.
   */
  cell(visualRow: number, visualColumn: number): Locator {
    return this.page.getByTestId(`cell-${visualRow}-${visualColumn}`);
  }

  /**
   * Whether a visual row is hidden by the HiddenRows plugin.
   */
  async isRowHidden(visualRow: number): Promise<boolean> {
    return this.page.evaluate(row => window.hot.getPlugin('hiddenRows').isHidden(row), visualRow);
  }

  /**
   * The number of frozen columns at the start.
   */
  async frozenColumnCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.getSettings().fixedColumnsStart ?? 0);
  }

  /**
   * Select a range and merge it with the `Ctrl`+`M` shortcut, the way a user does.
   */
  async mergeWithShortcut(range: [number, number, number, number]): Promise<void> {
    await this.page.evaluate((cellRange) => {
      window.hot.selectCells([cellRange]);
    }, range);
    await this.page.keyboard.press('Control+m');
  }

  /**
   * The merged areas as `[row, col, rowspan, colspan]`, sorted by position.
   */
  async merges(): Promise<number[][]> {
    return this.page.evaluate(() => window.hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells
      .map(({ row, col, rowspan, colspan }) => [row, col, rowspan, colspan])
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]));
  }

  /**
   * Undo with the keyboard shortcut: `Cmd`+`Z` on macOS, `Ctrl`+`Z` elsewhere.
   */
  async undoWithKeyboard(): Promise<void> {
    await this.page.keyboard.press('ControlOrMeta+z');
  }

  /**
   * The value of a cell, by its visual coordinates.
   */
  async cellValue(visualRow: number, visualColumn: number): Promise<CellValue> {
    return this.page.evaluate(([row, column]) => window.hot.getDataAtCell(row, column), [visualRow, visualColumn]);
  }

  /**
   * Whether the undo stack holds a step.
   */
  async isUndoAvailable(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.getPlugin('undoRedo').isUndoAvailable());
  }

  /**
   * The number of steps on the undo stack.
   */
  async undoStackSize(): Promise<number> {
    return this.page.evaluate(() => window.hot.getPlugin('undoRedo').doneActions.length);
  }

  /**
   * Undo the last step.
   */
  async undo(): Promise<void> {
    await this.page.evaluate(() => window.hot.getPlugin('undoRedo').undo());
  }

  /**
   * Redo the last undone step.
   */
  async redo(): Promise<void> {
    await this.page.evaluate(() => window.hot.getPlugin('undoRedo').redo());
  }

  /**
   * The values of a visual row, in visual column order.
   */
  async rowValues(visualRow: number): Promise<CellValue[]> {
    return this.page.evaluate(row => window.hot.getDataAtRow(row), visualRow);
  }

  /**
   * The values of a visual column, in visual row order.
   */
  async columnValues(visualColumn: number): Promise<CellValue[]> {
    return this.page.evaluate(column => window.hot.getDataAtCol(column), visualColumn);
  }

  /**
   * The number of visible columns.
   */
  async columnCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.countCols());
  }

  /**
   * The number of rows in the source data, trimmed ones included.
   */
  async sourceRowCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.getSourceData().length);
  }
}
