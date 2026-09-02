import { type Locator, type Page, expect } from '@playwright/test';

interface FiltersPlugin {
  addCondition(column: number, name: string, args: unknown[]): void;
  filter(): void;
}

interface TrimRowsPlugin {
  trimRows(rows: number[]): void;
  untrimRows(rows: number[]): void;
}

interface CopyPastePlugin {
  paste(value: string): void;
}

interface HiddenRowsPlugin {
  hideRows(rows: number[]): void;
}

interface DialogPlugin {
  show(options: Record<string, unknown>): void;
  hide(): void;
}

interface ColumnSortingPlugin {
  sort(config: { column: number; sortOrder: string }): void;
}

interface ManualRowMovePlugin {
  moveRow(row: number, finalIndex: number): void;
}

interface ManualColumnMovePlugin {
  moveColumn(column: number, finalIndex: number): void;
}

interface HandsontableFixture {
  addHook(name: string, callback: (...args: unknown[]) => unknown): void;
  getSelectedRangeActive(): { from: { row: number | null } } | undefined;
  getSelected(): number[][] | undefined;
  selectCells(ranges: number[][]): void;
  selectColumns(
    startColumn: number,
    endColumn?: number,
    focusPosition?: number | { row?: number; col?: number },
  ): boolean;
  selectAll(includeRowHeaders?: boolean, includeColumnHeaders?: boolean): void;
  deselectCell(): void;
  selectRows(row: number): void;
  selection: {
    transformFocus(row: number, col: number): void;
    transformEnd(rowDelta: number, colDelta: number): void;
    isEntireColumnSelected(): boolean;
    getActiveSelectionLayerIndex(): number;
    highlight: {
      getAreas(): Array<{ isEmpty(): boolean; getCorners(): number[] }>;
    };
    exportSelection(): unknown;
    importSelection(state: unknown): void;
  };
  getActiveEditor(): {
    isOpened(): boolean;
    state: string;
    row: number | null;
    col: number | null;
    TEXTAREA?: HTMLTextAreaElement;
    originalValue: unknown;
  } | undefined;
  getSourceData(): unknown[][];
  countSourceRows(): number;
  countRows(): number;
  listen(): void;
  getPlugin(name: string): FiltersPlugin & TrimRowsPlugin & ColumnSortingPlugin & ManualRowMovePlugin
    & ManualColumnMovePlugin & CopyPastePlugin & HiddenRowsPlugin & DialogPlugin;
  populateFromArray(
    row: number, column: number, input: unknown[][], endRow: number | null, endColumn: number | null,
    source?: string
  ): void;
  batch(callback: () => void): void;
  updateData(data: unknown[][]): void;
  runHooks(name: string): void;
  toPhysicalRow(row: number): number;
  alter(action: string, index: number, amount?: number): void;
  scrollViewportTo(options: { row: number; verticalSnap: string }): void;
  getCell(row: number, col: number, topmost?: boolean): HTMLElement | null;
}

interface CacheUpdateState {
  indexesSequenceChanged: boolean;
  trimmedIndexesChanged: boolean;
  hiddenIndexesChanged: boolean;
}

interface RecordingWindow extends Window {
  htChanges: unknown[][];
  htCacheUpdates: { row: CacheUpdateState[]; column: CacheUpdateState[] };
}

interface PageOptions {
  sorting?: boolean;
  scenario?: 'small' | 'tall';
  editor?: 'text' | 'dropdown';
  headers?: boolean;
}

/**
 * Page Object for the fixture that exercises an open editor whose record is removed or moved by a
 * trimming index map (Filters, `trimRows`).
 */
export class EditorTrimmedRowPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly sorting: boolean;
  readonly scenario: string;
  readonly editor: string;
  readonly headers: boolean;
  readonly editorHolder: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd', options: PageOptions = {}) {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.sorting = options.sorting ?? false;
    this.scenario = options.scenario ?? 'small';
    this.editor = options.editor ?? 'text';
    this.headers = options.headers ?? true;
    // The text editor's textarea wrapper. It stays in the DOM permanently and is merely hidden, so
    // its `ht_editor_hidden` class is the only reliable DOM-level "the editor is not on screen".
    this.editorHolder = page.locator('.handsontableInputHolder');
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   */
  async goto(): Promise<void> {
    const query = `theme=${this.theme}&bundle=${this.bundle}` +
      `&sorting=${this.sorting}&scenario=${this.scenario}&editor=${this.editor}` +
      `&headers=${this.headers ? 'on' : 'off'}`;

    await this.page.goto(`/tests/fixtures/demo/editor-trimmed-row.html?${query}`);

    // Wait for the bundle before the cell. The test id comes from the fixture's `afterRenderer`, so
    // "cell not found" alone cannot tell a slow bundle apart from a grid that failed to render.
    await this.page.waitForFunction(() => 'Handsontable' in window);

    await expect(this.cell(0, 0)).toBeVisible();

    // Building the grid already emits a trimming cache update - `loadData` initializes the trimming
    // map, and the fixture's hooks are attached before that. Leaving it in the log would make every
    // `sawTrimmingCacheUpdate()` assertion pass without the case's own trigger ever firing.
    await this.resetCacheUpdateLog();
  }

  /**
   * Empties the recorded index-map cache updates, so what a case asserts afterwards can only have
   * come from that case's own trigger.
   */
  async resetCacheUpdateLog(): Promise<void> {
    await this.page.evaluate(() => {
      const recorder = (window as unknown as RecordingWindow).htCacheUpdates;

      recorder.row.length = 0;
      recorder.column.length = 0;
    });
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Selects a cell, opens its text editor by typing, and leaves the value uncommitted.
   *
   * Typing straight onto a selected cell opens the editor and REPLACES its content. Opening with
   * `Enter` would keep the old value and put the caret after it.
   */
  async openEditorAndType(row: number, col: number, value: string): Promise<void> {
    await this.cell(row, col).click();

    await expect.poll(() => this.selected()).toEqual([[row, col, row, col]]);

    await this.page.keyboard.type(value);

    await expect.poll(() => this.isEditorOpen()).toBe(true);
    await expect.poll(() => this.editorText()).toBe(value);
  }

  /**
   * Filters the given column down to the listed values, exactly as picking them in the dropdown
   * menu's value list would. Driven through the plugin API rather than the menu, because opening
   * the menu is an outside click that closes the editor before the filter ever runs.
   */
  async filterToValues(column: number, values: string[]): Promise<void> {
    await this.page.evaluate(([targetColumn, targetValues]) => {
      const filters = (window as Window & { hot: HandsontableFixture }).hot.getPlugin('filters');

      filters.addCondition(targetColumn as number, 'by_value', [targetValues]);
      filters.filter();
    }, [column, values] as [number, string[]]);
  }

  /**
   * Trims rows through the `trimRows` plugin. Unlike `filter()`, this touches neither the selection
   * nor the render, so nothing commits the open editor as a side effect.
   */
  async trimRows(rows: number[]): Promise<void> {
    await this.page.evaluate((targetRows) => {
      (window as Window & { hot: HandsontableFixture }).hot.getPlugin('trimRows').trimRows(targetRows);
    }, rows);
  }

  /**
   * Untrims rows through the `trimRows` plugin. Called with rows that are not trimmed, this writes
   * the trimming map without changing a single index - the no-op churn that must NOT close an
   * editor. `BooleanMap#setValues()` emits its change event regardless, so the guard's trigger
   * still fires.
   */
  async untrimRows(rows: number[]): Promise<void> {
    await this.page.evaluate((targetRows) => {
      (window as Window & { hot: HandsontableFixture }).hot.getPlugin('trimRows').untrimRows(targetRows);
    }, rows);
  }

  /**
   * Sorts the first column descending, so a visual row index stops equalling its physical one. This
   * is what makes the physical-index resolution in the fix non-vacuous.
   */
  async sortFirstColumnDescending(): Promise<void> {
    await this.page.evaluate(() => {
      (window as Window & { hot: HandsontableFixture }).hot
        .getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
    });
  }

  /**
   * Moves one row through `manualRowMove`. Like sorting, this permutes the visual space and reports
   * `indexesSequenceChanged` - it trims nothing.
   */
  async moveRow(row: number, finalIndex: number): Promise<void> {
    await this.page.evaluate(([target, destination]) => {
      const hot = (window as Window & { hot: HandsontableFixture }).hot;

      hot.getPlugin('manualRowMove').moveRow(target, destination);
      (hot as unknown as { render(): void }).render();
    }, [row, finalIndex] as [number, number]);
  }

  /**
   * Makes every subsequent row insertion fail its `beforeCreateRow` veto, the way Formulas does when
   * HyperFormula rejects the change. The hook fires, nothing is created, and no cache update follows.
   */
  async vetoRowCreation(): Promise<void> {
    await this.page.evaluate(() => {
      (window as Window & { hot: HandsontableFixture }).hot.addHook('beforeCreateRow', () => false);
    });
  }

  /**
   * Selects a range and then moves the FOCUS below its top-start corner, the state Enter or Tab
   * produces inside a multi-cell selection.
   *
   * `Selection#shiftRows()` only shifts a range whose outer top-start corner is at or below the
   * removed row, so a focus parked below that corner is left where it was when rows above it are
   * removed - which is how an editor ends up stranded past the last row with nothing re-preparing it.
   */
  async selectRangeWithFocusAt(range: number[], focusRow: number, focusColumn: number): Promise<void> {
    await this.page.evaluate(([targetRange, row, column]) => {
      const hot = (window as Window & { hot: HandsontableFixture }).hot;

      hot.selectCells([targetRange as number[]]);
      hot.selection.transformFocus(row as number, column as number);
    }, [range, focusRow, focusColumn] as [number[], number, number]);
  }

  /**
   * Selects multiple ranges through the public API, then opens the editor on the active range.
   */
  async selectRangesAndType(ranges: number[][], value: string): Promise<void> {
    await this.page.evaluate((targetRanges) => {
      (window as Window & { hot: HandsontableFixture }).hot.selectCells(targetRanges);
    }, ranges);
    await this.page.keyboard.type(value);

    await expect.poll(() => this.isEditorOpen()).toBe(true);
  }

  /**
   * Selects a complete column with its focus on a data cell, then opens the editor there.
   */
  async selectColumnWithFocusAndType(column: number, focusRow: number, value: string): Promise<void> {
    await this.page.evaluate(([targetColumn, targetRow]) => {
      const hot = (window as Window & { hot: HandsontableFixture }).hot;

      hot.selectColumns(targetColumn as number, targetColumn as number, { row: targetRow as number });
      hot.listen();
    }, [column, focusRow] as [number, number]);
    await this.page.keyboard.type(value);

    await expect.poll(() => this.isEditorOpen()).toBe(true);
  }

  /**
   * Moves one column through `manualColumnMove`, permuting the COLUMN sequence.
   */
  async moveColumn(column: number, finalIndex: number): Promise<void> {
    await this.page.evaluate(([target, destination]) => {
      const hot = (window as Window & { hot: HandsontableFixture }).hot;

      hot.getPlugin('manualColumnMove').moveColumn(target, destination);
      (hot as unknown as { render(): void }).render();
    }, [column, finalIndex] as [number, number]);
  }

  /**
   * Removes columns through `alter()` - the column axis's structural change.
   */
  async removeColumn(column: number, amount = 1): Promise<void> {
    await this.page.evaluate(([target, count]) => {
      (window as Window & { hot: HandsontableFixture }).hot.alter('remove_col', target, count);
    }, [column, amount] as [number, number]);
  }

  /**
   * Replaces the whole data set through `updateData()`, which swaps the physical space without
   * closing an open editor - the path every wrapper takes when its `data` prop changes.
   */
  async updateData(data: unknown[][]): Promise<void> {
    await this.page.evaluate((next) => {
      (window as Window & { hot: HandsontableFixture }).hot.updateData(next);
    }, data);
  }

  /**
   * Fires the public cache-update hook with NO payload, the way any integration calling
   * `hot.runHooks('afterRowSequenceCacheUpdate')` would. Returns the thrown error, or null.
   */
  async fireCacheUpdateHookWithoutPayload(): Promise<string | null> {
    return this.page.evaluate(() => {
      try {
        (window as Window & { hot: HandsontableFixture }).hot.runHooks('afterRowSequenceCacheUpdate');

        return null;
      } catch (error) {
        return String(error);
      }
    });
  }

  /**
   * Returns the VISUAL column the active editor is currently bound to.
   */
  async editorCol(): Promise<number | null> {
    return this.page.evaluate(() => (
      (window as Window & { hot: HandsontableFixture }).hot.getActiveEditor()?.col ?? null
    ));
  }

  /**
   * Inserts rows through `alter()`. A structural change: it renumbers the PHYSICAL space while
   * leaving the editor's visual coordinate valid, which is the opposite of what a trim does.
   */
  async insertRowAbove(row: number, amount = 1): Promise<void> {
    await this.page.evaluate(([target, count]) => {
      (window as Window & { hot: HandsontableFixture }).hot.alter('insert_row_above', target, count);
    }, [row, amount] as [number, number]);
  }

  /**
   * Trims a row from inside `afterRemoveRow`, then removes a row - the nesting that puts an index-map
   * change into the window between `alter()`'s cache update and the selection shift behind it.
   */
  async removeRowTrimmingFrom(removeIndex: number, trimRow: number): Promise<void> {
    await this.page.evaluate(([target, trimmed]) => {
      const hot = (window as Window & { hot: HandsontableFixture }).hot;

      hot.addHook('afterRemoveRow', () => {
        hot.getPlugin('trimRows').trimRows([trimmed as number]);
      });
      hot.alter('remove_row', target as number, 1);
    }, [removeIndex, trimRow] as [number, number]);
  }

  /**
   * Removes a row and filters in ONE synchronous block, with no task boundary between the two -
   * the shape plain application code produces with `hot.alter('remove_row', 1);
   * hot.getPlugin('filters').filter();`. A strand window that outlives `alter()` leaks into the
   * filter, which then commits the stranded editor through its stale coordinates.
   */
  async removeRowThenFilterSameTask(row: number, column: number, values: string[]): Promise<void> {
    await this.page.evaluate(([target, targetColumn, targetValues]) => {
      const hot = (window as Window & { hot: HandsontableFixture }).hot;
      const filters = hot.getPlugin('filters');

      hot.alter('remove_row', target as number, 1);
      filters.addCondition(targetColumn as number, 'by_value', [targetValues]);
      filters.filter();
    }, [row, column, values] as [number, number, string[]]);
  }

  /**
   * Removes a row while a listener on the strand-making cache update itself runs a NESTED
   * `alter()` (amount 0, so it changes nothing but still runs `alter()`'s full selection and
   * tail machinery) and then a trim. The listener runs after the manager marked the editor
   * stranded and before the OUTER removal's own `selection.shiftRows()` - the deepest point a
   * user hook can reach into the protected span.
   */
  async removeRowWithNestedAlterAndTrim(removeIndex: number, trimRow: number): Promise<void> {
    await this.page.evaluate(([target, trimmed]) => {
      const hot = (window as Window & { hot: HandsontableFixture }).hot;
      let fired = false;

      hot.addHook('afterRowSequenceCacheUpdate', (state?: unknown) => {
        const changeSource = (state as { indexesChangeSource?: string } | undefined)?.indexesChangeSource;

        if (fired || changeSource !== 'remove') {
          return;
        }
        fired = true;

        hot.alter('remove_row', 0, 0);
        hot.getPlugin('trimRows').trimRows([trimmed as number]);
      });
      hot.alter('remove_row', target as number, 1);
    }, [removeIndex, trimRow] as [number, number]);
  }

  /**
   * Replaces the data with a SHORTER set and filters in one synchronous block. `updateData()`
   * strands an open editor the same way a removal does - `fitToLength()` renumbers the physical
   * space - so a strand protection that `updateData()` never closes leaks into the filter, which
   * commits through the stranded coordinates and appends records to the fresh data.
   */
  async updateDataThenFilterSameTask(data: unknown[][], column: number, values: string[]): Promise<void> {
    await this.page.evaluate(([nextData, targetColumn, targetValues]) => {
      const hot = (window as Window & { hot: HandsontableFixture }).hot;
      const filters = hot.getPlugin('filters');

      hot.updateData(nextData as unknown[][]);
      filters.addCondition(targetColumn as number, 'by_value', [targetValues]);
      filters.filter();
    }, [data, column, values] as [unknown[][], number, string[]]);
  }

  /**
   * Removes rows through `alter()`. This shifts PHYSICAL indexes, unlike a trimming map, and still
   * emits a trimming-map change - the one way the captured record can go stale without the guard
   * being able to tell.
   */
  async removeRow(row: number, amount = 1): Promise<void> {
    await this.page.evaluate(([target, count]) => {
      (window as Window & { hot: HandsontableFixture }).hot.alter('remove_row', target, count);
    }, [row, amount] as [number, number]);
  }

  /**
   * Scrolls the viewport so the given row is at the top, which un-renders the rows left behind
   * without touching any index map.
   */
  async scrollToRow(row: number): Promise<void> {
    await this.page.evaluate((target) => {
      (window as Window & { hot: HandsontableFixture }).hot
        .scrollViewportTo({ row: target, verticalSnap: 'top' });
    }, row);
  }

  /**
   * Reports whether a visual row still has a rendered `TD`. A row scrolled out of the viewport has
   * none, which is the state `prepareEditor()` refuses to work in.
   */
  async isRowRendered(row: number): Promise<boolean> {
    return this.page.evaluate(
      target => (window as Window & { hot: HandsontableFixture }).hot.getCell(target, 0, true) !== null,
      row,
    );
  }

  /**
   * Returns one value straight from the source data, by PHYSICAL row index. Used where the data set
   * is too large to assert whole.
   */
  async sourceCell(physicalRow: number, col: number): Promise<unknown> {
    return this.page.evaluate(
      ([targetRow, targetCol]) => (window as Window & { hot: HandsontableFixture })
        .hot.getSourceData()[targetRow][targetCol],
      [physicalRow, col] as [number, number],
    );
  }

  /**
   * Types onto the current selection, which opens an editor if none is open, and leaves the value
   * uncommitted.
   */
  async typeOnSelection(value: string): Promise<void> {
    await this.page.keyboard.type(value);
  }

  /**
   * Returns the value the active editor believes it is replacing. `prepareEditor()` reads it from
   * the source data at prepare time, so it reports which record the editor was set up for -
   * independently of where a save would land.
   */
  async editorOriginalValue(): Promise<unknown> {
    return this.page.evaluate(() => (
      (window as Window & { hot: HandsontableFixture }).hot.getActiveEditor()?.originalValue ?? null
    ));
  }

  /**
   * Commits the open edit with Enter, the way a user ends an edit.
   */
  async commitWithEnter(): Promise<void> {
    await this.page.keyboard.press('Enter');
  }

  /**
   * Commits a multi-cell edit with the platform-specific Control or Meta modifier.
   */
  async commitWithCtrlOrMetaEnter(): Promise<void> {
    await this.page.keyboard.press('ControlOrMeta+Enter');
  }

  /**
   * Reports whether the cell editor is open.
   *
   * Read through `getActiveEditor().isOpened()` rather than DOM visibility: `.handsontableInput` is
   * always in the DOM and a closed text editor is merely `opacity: 0`, which Playwright still
   * counts as visible.
   */
  async isEditorOpen(): Promise<boolean> {
    return this.page.evaluate(() => (
      (window as Window & { hot: HandsontableFixture }).hot.getActiveEditor()?.isOpened() === true
    ));
  }

  /**
   * Returns the editor's state machine value, or null when there is no active editor.
   */
  async editorState(): Promise<string | null> {
    return this.page.evaluate(() => (
      (window as Window & { hot: HandsontableFixture }).hot.getActiveEditor()?.state ?? null
    ));
  }

  /**
   * Returns the text held by the editor, whether or not it is currently shown.
   */
  async editorText(): Promise<string | null> {
    return this.page.evaluate(() => (
      (window as Window & { hot: HandsontableFixture }).hot.getActiveEditor()?.TEXTAREA?.value ?? null
    ));
  }

  /**
   * Returns the VISUAL row the active editor is currently bound to. This is the coordinate the save
   * writes through, so it is the direct read of whether a rebind happened.
   */
  async editorRow(): Promise<number | null> {
    return this.page.evaluate(() => (
      (window as Window & { hot: HandsontableFixture }).hot.getActiveEditor()?.row ?? null
    ));
  }

  /**
   * Returns the whole source data set, in physical row order. Stronger than probing single cells:
   * it pins the row count and every untouched record in one assertion.
   */
  async sourceData(): Promise<unknown[][]> {
    return this.page.evaluate(() => (window as Window & { hot: HandsontableFixture }).hot.getSourceData());
  }

  /**
   * Returns the number of records in the source data. The severity of this bug is the growth here:
   * it survives into everything that reads the source data afterwards.
   */
  async sourceRowCount(): Promise<number> {
    return this.page.evaluate(() => (window as Window & { hot: HandsontableFixture }).hot.countSourceRows());
  }

  /**
   * Returns the number of VISIBLE rows, which a trimming map collapses. The append only happens
   * when the editor's visual row is past this count, so a case that means to exercise the append
   * has to pin it.
   */
  async visibleRowCount(): Promise<number> {
    return this.page.evaluate(() => (window as Window & { hot: HandsontableFixture }).hot.countRows());
  }

  /**
   * Returns the physical row a visual row currently maps to.
   */
  async toPhysicalRow(row: number): Promise<number> {
    return this.page.evaluate(
      target => (window as Window & { hot: HandsontableFixture }).hot.toPhysicalRow(target),
      row,
    );
  }

  /**
   * Returns how many changes the grid has committed since it was created.
   */
  async committedChangeCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as RecordingWindow).htChanges.length);
  }

  /**
   * Reports whether an index-map cache update that changed TRIMMED indexes has been recorded on the
   * given axis. Assert this before concluding anything from "the data is intact": without it, a
   * case passes when the guard's trigger never fired at all.
   */
  async sawTrimmingCacheUpdate(axis: 'row' | 'column'): Promise<boolean> {
    return this.page.evaluate(
      target => (window as unknown as RecordingWindow).htCacheUpdates[target]
        .some(state => state.trimmedIndexesChanged),
      axis,
    );
  }

  /**
   * Reports whether an index-map cache update that changed the index SEQUENCE has been recorded on
   * the given axis. This is the flag a sort or a row move raises, and it is separate from the
   * trimming one.
   */
  async sawSequenceCacheUpdate(axis: 'row' | 'column'): Promise<boolean> {
    return this.page.evaluate(
      target => (window as unknown as RecordingWindow).htCacheUpdates[target]
        .some(state => state.indexesSequenceChanged),
      axis,
    );
  }

  /**
   * Returns the grid's current selection.
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as Window & { hot: HandsontableFixture }).hot.getSelected());
  }

  /**
   * Reports whether the active range and its header marker still describe a complete column.
   */
  async isEntireColumnSelected(): Promise<boolean> {
    return this.page.evaluate(() => (
      (window as Window & { hot: HandsontableFixture }).hot.selection.isEntireColumnSelected()
    ));
  }

  /**
   * Returns the corners of area-highlight layers that still contain a drawable range.
   */
  async highlightedAreaCorners(): Promise<number[][]> {
    return this.page.evaluate(() => (
      (window as Window & { hot: HandsontableFixture }).hot.selection.highlight
        .getAreas()
        .filter(area => !area.isEmpty())
        .map(area => area.getCorners())
    ));
  }

  /**
   * Returns the index of the selection layer that owns the focus highlight.
   */
  async activeSelectionLayer(): Promise<number> {
    return this.page.evaluate(() => (
      (window as Window & { hot: HandsontableFixture }).hot.selection.getActiveSelectionLayerIndex()
    ));
  }

  /**
   * Selects a single cell, opening no editor. The selection-versus-trimming cases are about the
   * highlight alone, so nothing here may prepare or open an editor.
   */
  async selectCell(row: number, column: number): Promise<void> {
    await this.page.evaluate(([targetRow, targetColumn]) => {
      (window as Window & { hot: HandsontableFixture }).hot.selectCells([[targetRow, targetColumn,
        targetRow, targetColumn]]);
    }, [row, column] as [number, number]);
  }

  /**
   * Selects a whole column through its header, which anchors the range in the column header and
   * makes its far corner track the grid rather than name a record.
   */
  async selectWholeColumn(column: number): Promise<void> {
    await this.page.evaluate((targetColumn) => {
      (window as Window & { hot: HandsontableFixture }).hot.selectColumns(targetColumn);
    }, column);
  }

  /**
   * Stashes the selection, deselects, and restores it - the round trip `dialog` and
   * `emptyDataState` perform when they take the grid over and hand it back.
   *
   * This is the SELECTION API's own round trip: the exported object goes back in whole. It cannot
   * see a consumer that rebuilds the object field by field on the way in, which is what
   * `roundTripSelectionThroughDialog()` covers.
   */
  async roundTripSelectionThroughExport(): Promise<void> {
    await this.page.evaluate(() => {
      const hot = (window as Window & { hot: HandsontableFixture }).hot;
      const stashed = hot.selection.exportSelection();

      hot.deselectCell();
      hot.selection.importSelection(stashed);
    });
  }

  /**
   * Runs the same round trip through the `dialog` PLUGIN, by opening a dialog and closing it.
   *
   * Worth its own path rather than folding into the export helper above: the plugin does the stash
   * and the restore itself, so this is the only way to catch it handing `importSelection()` a
   * narrower object than the one it exported. It dropped the grid-span flags exactly that way.
   */
  async roundTripSelectionThroughDialog(): Promise<void> {
    await this.page.evaluate(() => {
      const dialog = (window as Window & { hot: HandsontableFixture }).hot.getPlugin('dialog');

      dialog.show({ content: 'stash', animation: false });
      dialog.hide();
    });
  }

  /**
   * Selects everything, the corner-click / Ctrl+A shape. It writes BOTH header-state sets, which is
   * the case the individual header predicates deliberately answer `false` for.
   */
  async selectEverything(): Promise<void> {
    await this.page.evaluate(() => {
      (window as Window & { hot: HandsontableFixture }).hot.selectAll();
    });
  }

  /**
   * Selects a whole row through its header. Anchored in the ROW header, so its COLUMN extent tracks
   * the grid - while its row index still names one particular record.
   */
  async selectWholeRow(row: number): Promise<void> {
    await this.page.evaluate((targetRow) => {
      (window as Window & { hot: HandsontableFixture }).hot.selectRows(targetRow);
    }, row);
  }

  /**
   * Selects several ranges in ONE call, which is what actually produces a multi-layer selection -
   * a second `selectCells()` replaces the first rather than adding to it.
   */
  async selectRanges(ranges: number[][]): Promise<void> {
    await this.page.evaluate((targetRanges) => {
      (window as Window & { hot: HandsontableFixture }).hot.selectCells(targetRanges);
    }, ranges);
  }

  /**
   * Removes a row and trims rows inside one `batch()`. Unlike a sort, an alteration flushes its own
   * cache update even inside a batch, so this produces a structural update followed by a trim-only
   * one - the shape that must not let the structural early return swallow the repair.
   */
  async batchRemoveRowAndTrim(removeIndex: number, trimmedRows: number[]): Promise<void> {
    await this.page.evaluate(([target, rows]) => {
      const hot = (window as Window & { hot: HandsontableFixture }).hot;

      hot.batch(() => {
        hot.alter('remove_row', target as number, 1);
        hot.getPlugin('trimRows').trimRows(rows as number[]);
      });
    }, [removeIndex, trimmedRows] as [number, number[]]);
  }

  /**
   * Sorts and trims inside one `batch()`, which collapses both into a SINGLE index-map cache update
   * carrying `indexesSequenceChanged` and `trimmedIndexesChanged` together. Driving them separately
   * produces two updates and never exercises that pairing.
   */
  async batchSortAndTrim(rows: number[]): Promise<void> {
    await this.page.evaluate((targetRows) => {
      const hot = (window as Window & { hot: HandsontableFixture }).hot;

      hot.batch(() => {
        hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
        hot.getPlugin('trimRows').trimRows(targetRows);
      });
    }, rows);
  }

  /**
   * Hides rows through the `hiddenRows` plugin. A hiding map keeps its rows in the visual space, so
   * this is the control for the trimming cases: the coordinates it produces stay addressable.
   */
  async hideRows(rows: number[]): Promise<void> {
    await this.page.evaluate((targetRows) => {
      (window as Window & { hot: HandsontableFixture }).hot.getPlugin('hiddenRows').hideRows(targetRows);
    }, rows);
  }

  /**
   * Pastes a value through the `copyPaste` plugin, which reads the selection's own corners. This is
   * the user action (Ctrl+V) that turns a stranded highlight into appended records.
   */
  async pasteIntoSelection(value: string): Promise<void> {
    await this.page.evaluate((pasted) => {
      (window as Window & { hot: HandsontableFixture }).hot.getPlugin('copyPaste').paste(pasted);
    }, value);
  }

  /**
   * Writes through the selection's highlight with `populateFromArray`, the path a Ctrl+Enter commit
   * and an autofill take. Reads the corners directly, exactly as the paste does.
   */
  async populateFromSelection(value: string): Promise<void> {
    await this.page.evaluate((written) => {
      const hot = (window as Window & { hot: HandsontableFixture }).hot;
      const selected = hot.getSelected();

      if (!selected) {
        return;
      }

      const [row, column] = selected[0];

      hot.populateFromArray(row, column, [[written]], null, null, 'edit');
    }, value);
  }

  /**
   * Starts counting how often a grid hook fires, so a spec can assert that it ran - or stayed
   * silent - across an index-map update.
   */
  async watchHook(name: string): Promise<void> {
    await this.page.evaluate((hookName) => {
      const target = window as Window & { hot: HandsontableFixture; hookCalls?: Record<string, number> };

      target.hookCalls = target.hookCalls ?? {};
      target.hookCalls[hookName] = 0;

      target.hot.addHook(hookName, () => {
        (window as Window & { hookCalls: Record<string, number> }).hookCalls[hookName] += 1;
      });
    }, name);
  }

  /**
   * Returns how many times a watched hook has fired, or `null` when that name was never watched -
   * never `0`, which would let a misspelled hook name or a missing `watchHook()` call pass as
   * evidence that the hook stayed silent.
   */
  async hookCalls(name: string): Promise<number | null> {
    return this.page.evaluate((hookName) => {
      const counters = (window as Window & { hookCalls?: Record<string, number> }).hookCalls;

      return counters && hookName in counters ? counters[hookName] : null;
    }, name);
  }

  /**
   * Selects the whole grid WITHOUT anchoring in either header, then types to open the editor.
   *
   * The no-header anchoring is what makes this reach the restore at all: a corner anchored in a
   * header has no physical index, so `#hasResolvedPhysicalRange()` rejects that layer and the
   * selection is left to the no-editor repair, which clamps it. This shape carries the
   * grid-tracking flag with resolvable corners, which is the one the restore has to re-pin.
   */
  async selectEverythingWithoutHeaders(): Promise<void> {
    await this.page.evaluate(() => {
      const hot = (window as Window & { hot: HandsontableFixture }).hot;

      hot.selectAll(false, false);
      hot.listen();
    });
  }

  /**
   * Types into whatever the grid has selected, opening the editor. Separate from the selection step
   * because a selection gesture that runs AFTER the typing commits the editor - `transformEnd()`
   * does - which would leave the trim under test with no editor at all.
   */
  async listenAndType(value: string): Promise<void> {
    await this.page.evaluate(() => (window as Window & { hot: HandsontableFixture }).hot.listen());
    await this.page.keyboard.type(value);

    await expect.poll(() => this.isEditorOpen()).toBe(true);
  }

  /**
   * Selects one range and types, without going through the DOM. Used where the range has to be laid
   * exactly, including a range that happens to reach both ends of an axis while still naming
   * records.
   */
  async selectRangeAndType(range: number[], value: string): Promise<void> {
    await this.page.evaluate((targetRange) => {
      const hot = (window as Window & { hot: HandsontableFixture }).hot;

      hot.selectCells([targetRange]);
      hot.listen();
    }, range);
    await this.page.keyboard.type(value);

    await expect.poll(() => this.isEditorOpen()).toBe(true);
  }

  /**
   * Shrinks the active selection's `to` corner, the `Shift+Up` gesture. Used on a grid-tracking
   * selection, whose `…ExtentSpansGrid` flag keeps saying "spans the grid" afterwards - the range
   * itself is the only state that knows it was shrunk.
   */
  async shrinkSelectionUpwards(steps = 1): Promise<void> {
    await this.page.evaluate((rowSteps) => {
      (window as Window & { hot: HandsontableFixture }).hot.selection.transformEnd(-rowSteps, 0);
    }, steps);
  }
}
