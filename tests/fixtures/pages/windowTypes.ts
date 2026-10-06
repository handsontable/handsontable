/**
 * Shared in-page (browser context) type surface for the e2e fixtures.
 *
 * The fixtures expose the live Handsontable instance as `window.hot` plus a
 * per-fixture `init*` rebuild helper. This module is the single home of the
 * `Window` augmentation so every page object sees one consistent declaration
 * (TypeScript merges `interface Window` declarations — two files declaring
 * `hot` with different types would conflict).
 */

export type CellValue = string | number | null;

interface FixtureCellRange {
  getTopStartCorner(): { row: number | null, col: number | null };
  getBottomEndCorner(): { row: number | null, col: number | null };
  highlight: { row: number | null, col: number | null };
}

/**
 * One entry of a sort config, as both sorting plugins take and return it.
 */
export interface FixtureSortConfig {
  column: number;
  sortOrder: 'asc' | 'desc';
}

/**
 * The slice of the Handsontable instance API the fixture-driving evaluate
 * callbacks use, so the in-page calls stay typed without importing the core
 * types into the test tier.
 */
export interface FixtureHotInstance {
  getDataAtCell(row: number, col: number): CellValue;
  getData(): CellValue[][];
  getDataAtCol(col: number): CellValue[];
  getDataAtRow(row: number): CellValue[];
  getSourceDataAtCell(row: number, col: number): CellValue;
  getSourceData(): unknown[];
  setDataAtCell(row: number, col: number, value: CellValue): void;
  setCellMeta(row: number, col: number, key: string, value: unknown): void;
  getCellMeta(row: number, col: number): { className?: string, readOnly?: boolean };
  getPlugin(name: 'formulas'): {
    getCellType(row: number, col: number): string,
    sheetId: number | null,
    sheetName: string | null,
    /** DEV-207: `showFormulas()`/`hideFormulas()`/`isShowingFormulas()` toggle. */
    showFormulas(): void,
    hideFormulas(): void,
    isShowingFormulas(): boolean,
    // The engine itself, so a spec can ask HyperFormula what it holds rather than inferring it
    // from the grid - which is the whole point when the two have drifted apart (DEV-2978).
    engine: {
      getSheetDimensions(sheetId: number): { width: number, height: number },
      getSheetSerialized(sheetId: number): unknown[][],
    } | null,
  };
  getPlugin(name: 'undoRedo'): {
    undo(): void,
    redo(): void,
    isUndoAvailable(): boolean,
    isRedoAvailable(): boolean,
    doneActions: unknown[],
    ignoreNewActions: boolean,
  };
  getPlugin(name: 'moveCells'): {
    moveCellRange(sourceRange: unknown, targetTopLeft: unknown, isCopy?: boolean): boolean,
    isDragActive(): boolean,
    enablePlugin(): void,
    disablePlugin(): void,
  };
  getPlugin(name: 'manualRowMove'): {
    moveRows(rows: number[], finalIndex: number): boolean,
  };
  getPlugin(name: 'manualColumnMove'): {
    moveColumns(columns: number[], finalIndex: number): boolean,
  };
  getPlugin(name: 'hiddenRows'): {
    hideRows(rows: number[]): void,
    showRows(rows: number[]): void,
    isHidden(row: number): boolean,
    getHiddenRows(): number[],
  };
  getPlugin(name: 'trimRows'): {
    trimRows(rows: number[]): void,
    untrimRows(rows: number[]): void,
  };
  getPlugin(name: 'manualColumnFreeze'): {
    freezeColumn(column: number): void,
    unfreezeColumn(column: number): void,
  };
  getPlugin(name: 'manualColumnResize'): {
    setManualSize(column: number, width: number): void,
  };
  getPlugin(name: 'manualRowResize'): {
    setManualSize(row: number, height: number): void,
  };
  getPlugin(name: 'collapsibleColumns'): {
    collapseSection(coords: { row: number, col: number }): void,
    expandSection(coords: { row: number, col: number }): void,
  };
  getPlugin(name: 'customBorders'): {
    setBorders(ranges: number[][], border: Record<string, unknown>): void,
    getBorders(ranges?: number[][]): unknown[],
  };
  getPlugin(name: 'comments'): {
    setCommentAtCell(row: number, column: number, value: string): void,
    getCommentAtCell(row: number, column: number): string | undefined,
    showAtCell(row: number, column: number): boolean,
    focusEditor(): void,
  };
  getPlugin(name: 'pagination'): {
    setPage(page: number): void,
    getCurrentPage(): number,
  };
  getPlugin(name: 'mergeCells'): {
    mergedCellsCollection: {
      mergedCells: { row: number, col: number, rowspan: number, colspan: number }[],
    },
  };
  getPlugin(name: 'filters'): {
    addCondition(column: number, name: string, args: unknown[]): void,
    clearConditions(column?: number): void,
    filter(): void,
    exportConditions(): unknown[],
  };
  /**
   * Both sorting plugins expose the same `sort()` signature - `MultiColumnSorting` extends
   * `ColumnSorting` and only widens what an array of configs means - so one overload covers
   * a fixture that swaps between them. The `column` is a VISUAL index.
   */
  getPlugin(name: 'columnSorting' | 'multiColumnSorting'): {
    sort(sortConfig?: FixtureSortConfig | FixtureSortConfig[]): void,
    getSortConfig(): FixtureSortConfig[],
    clearSort(): void,
  };
  getPlugin(name: 'dragToScroll'): { isListening(): boolean };
  getPlugin(name: 'autofill'): { mouseDownOnCellCorner: boolean };
  getPlugin(name: 'multipleSelectionHandles'): {
    isDragged(): boolean;
    enabled: boolean;
    isEnabled(): boolean;
  };
  getPlugin(name: 'nestedRows'): {
    enabled: boolean,
    collapseAll(): void,
    expandAll(): void,
    collapseParent(row: number): boolean,
    expandParent(row: number): boolean,
    toggleParent(row: number): boolean,
    getCollapsedParents(): number[],
    isParentCollapsed(row: number): boolean,
    isParent(row: number): boolean,
    getRowLevel(row: number): number | null,
    getRowParent(row: number): number | null,
    countChildren(row: number, recursive?: boolean): number,
    expandToRow(row: number): boolean,
    expandToLevel(level: number): void,
    // Private, but a spec needs it: the header width the plugin asked for has no public getter, and
    // a grid at the default width is exactly the defect worth pinning (DEV-2938).
    headersUI: {
      rowHeaderWidthCache: number | null,
    } | null,
    // Private, but a spec needs it: there is no public API for the stash window that add child,
    // detach child, remove row and row move open around themselves.
    collapsingUI: {
      collapsedRowsStash: {
        stash(): void,
        applyStash(): void,
      },
    },
    dataManager: {
      getDataObject(row: number): object | null,
      getRawSourceData(): unknown[],
      addChild(parent: object): void,
    },
  };
  getPlugin(name: 'selectionHandles'): {
    isDragActive(): boolean,
    enablePlugin(): void,
    disablePlugin(): void,
  };
  getPlugin(name: 'emptyDataState'): {
    isVisible(): boolean,
  };
  getPlugin(name: 'dialog'): {
    show(options: { content: string }): void,
  };
  getFocusScopeManager(): {
    getActiveScopeId(): string | null,
  };
  getShortcutManager(): {
    getActiveContextName(): string,
  };
  runHooks(name: string, ...args: unknown[]): unknown;
  countRenderedRows(): number;
  countRenderedCols(): number;
  getActiveEditor(): {
    isOpened(): boolean,
    beginEditing(): void,
    finishEditing(restoreOriginalValue?: boolean): void,
    /** The `<td>` currently being edited. Throws once the grid is destroyed. */
    getEditedCell(): HTMLTableCellElement,
    /**
     * The list's own sub-grid, on the `handsontable` / `autocomplete` / `dropdown` family. Read by
     * `DropdownEditorClipPage#startListHeightWriteRecorder()` to record its height writes.
     */
    htEditor?: {
      updateSettings(settings: Record<string, unknown>, ...rest: unknown[]): void,
    },
    /** Whether that family's list is rendered above the edited cell. */
    isFlippedVertically?: boolean,
    /** The multiselect editor keeps its own flip state on this controller instead. */
    dropdownController?: { isFlippedVertically(): boolean },
    isFlippedHorizontally?: boolean,
  } | undefined;
  isRtl(): boolean;
  render(): void;
  listen(): void;
  view: {
    isVerticallyScrollableByWindow(): boolean,
    isHorizontallyScrollableByWindow(): boolean,
    getViewportHeight(): number,
    countRenderableColumns(): number,
  };
  /** The grid's own root `<div>` – a child of the container passed to the constructor. */
  rootElement: HTMLElement;
  /** The element the constructor received; the root wrapper is appended into it. */
  rootContainer: HTMLElement;
  /** `.ht-root-wrapper` – the flex column holding the slots, the grid box and the overlays layer. */
  rootWrapperElement: HTMLElement;
  /** `.ht-slot-bottom` – the bottom layout slot (pagination bar, sheets bar, license notification). */
  rootSlotBottomElement: HTMLElement;
  getFirstFullyVisibleRow(): number;
  getLastFullyVisibleRow(): number;
  getFirstFullyVisibleColumn(): number;
  getLastFullyVisibleColumn(): number;
  getLastPartiallyVisibleRow(): number;
  getLastPartiallyVisibleColumn(): number;
  getLastRenderedVisibleRow(): number;
  getRowHeight(row: number): number | undefined;
  getColWidth(col: number): number;
  scrollViewportTo(options: { row?: number, col?: number, verticalSnap?: string, horizontalSnap?: string }): boolean;
  selectCells(ranges: number[][]): boolean;
  selectColumns(fromCol: number, toCol: number): boolean;
  deselectCell(): void;
  getSelectedRangeLast(): FixtureCellRange;
  getSelectedRange(): FixtureCellRange[];
  getSelectedRangeActive(): FixtureCellRange | undefined;
  getSelected(): number[][] | undefined;
  addHook(
    name: 'beforeSetCellMeta',
    callback: (row: number, column: number, key: string, value: unknown) => boolean | undefined,
  ): void;
  addHook(name: string, callback: () => void): void;
  removeHook(name: string, callback: () => void): void;
  addHookOnce(name: string, callback: () => unknown): void;
  getSelectedLast(): number[];
  /** The visual coordinates of a rendered cell element, or `null` when the element is not a cell of this grid. */
  getCoords(element: Element | null): { row: number, col: number } | null;
  countRows(): number;
  countEmptyRows(ending?: boolean): number;
  isEmptyRow(row: number): boolean;
  isEmptyCol(col: number): boolean;
  toVisualRow(row: number): number | null;
  toPhysicalRow(row: number): number | null;
  selectCell(row: number, col: number): boolean;
  loadData(data: unknown[]): void;
  updateData(data: unknown[]): void;
  updateSettings(settings: Record<string, unknown>): void;
  getSettings(): { fixedColumnsStart?: number, [key: string]: unknown };
  alter(action: string, index?: number | number[][], amount?: number, source?: string): void;
  countCols(): number;
  getSettings(): { fixedColumnsStart?: number };
  rowIndexMapper: { getIndexesSequence(): number[] };
  columnIndexMapper: { getIndexesSequence(): number[] };
  _createCellCoords(row: number, col: number): unknown;
  _createCellRange(highlight: unknown, from: unknown, to: unknown): unknown;
}

/**
 * One recorded `beforeMoveCells` / `afterMoveCells` call. `target` is a `[row, col]` pair for
 * `beforeMoveCells` (which receives the top-left coords) and a four-corner range for `afterMoveCells`.
 */
export interface MoveCellsHookRecord {
  hook: 'beforeMoveCells' | 'afterMoveCells';
  source: number[];
  target: number[];
  isCopy: boolean;
}

/**
 * One recorded remove-row or remove-column hook call from the DEV-2523 firing-pattern fixture.
 * `physicalIndexes` covers both halves, since the hooks name the argument `physicalRows` for
 * rows and `physicalColumns` for columns while passing the same shape.
 */
export interface RemoveHookRecord {
  hook: 'beforeRemoveRow' | 'afterRemoveRow' | 'beforeRemoveCol' | 'afterRemoveCol';
  index: number;
  amount: number;
  physicalIndexes: number[];
  source?: string;
}

/**
 * Hook counters the DEV-2687 touch tap-to-edit fixture exposes on `window.hookCounts`.
 */
export type HookCounterName =
  'beforeOnCellMouseDown' | 'beforeOnCellMouseUp' | 'afterBeginEditing' | 'afterCreateRow' | 'click';

declare global {
  interface Window {
    /** The fixture's live Handsontable instance. */
    hot: FixtureHotInstance;
    /** Undo fixture: how many vetoed meta writes the listener `UndoGridPage#vetoMetaWrites()` adds saw. */
    metaWriteAttempts: number;
    /** `dropdown-editor-clip` fixture: rebuilds the grid, optionally inside a named parent layout. */
    initDropdownClipGrid(settings?: Record<string, unknown>, containerClass?: string): boolean;
    /** `dropdown-editor-clip` fixture: the option set fed to the editor under test. */
    htDropdownOptions: string[];
    /** DEV-2938 / DEV-2978 fixtures: everything the page logged through `console.error`, in order. */
    consoleErrors?: string[];
    /** DEV-2978 fixture: how many `setSheetContent` calls the bound engine has taken since the last reset. */
    sheetWriteCount?: number;
    /**
     * DEV-2978 fixture, `sheet-switch` scenario, and the DEV-2905 fixture: the shared HyperFormula
     * instance the grid and the spec both address, so a spec can read a sheet the grid is not
     * currently bound to, or remove the bound one.
     */
    htEngine?: {
      getSheetId(name: string): number,
      getSheetSerialized(sheetId: number): unknown[][],
      /** DEV-2905 fixture: removes a sheet behind the Formulas plugin's back. */
      removeSheet(sheetId: number): unknown,
    };
    /** DEV-2905 fixture: how many columns AutoColumnSize measured since the last reset, across every sweep. */
    measuredColumns?: number;
    /** DEV-2905 fixture: reloads the active sheet through `loadData()` with values the engine has not seen. */
    loadFreshBudget?(): void;
    /** DEV-2938 fixture: the very array passed to the constructor, kept to prove writes reach it. */
    sourceData?: unknown[];
    /** DEV-2938 fixture: how many times the grid has drawn since it was built. */
    renderCount?: number;
    /** DEV-2917 fixture: the message of a throw the fixture's own grid build caught, if any. */
    htFixtureError?: string;
    /**
     * DEV-2917: `defaultPrevented` of the last `keydown` seen at the window, or `null` when none
     * reached it. Written by a bubble-phase listener, so it reads the verdict of every handler below.
     */
    htLastKeyDefaultPrevented: boolean | null;
    /** #5833 fixture: the "getter" grid – constructor rows with a non-configurable derived getter. */
    hotGetter: FixtureHotInstance;
    /** #5833 fixture: the "accessor" grid – the docs' function-data-source pattern (function `columns[].data`). */
    hotAccessor: FixtureHotInstance;
    /** The Handsontable constructor loaded by the fixture — exposes the global hooks bucket. */
    Handsontable: {
      hooks: {
        add(key: string, callback: (...args: unknown[]) => unknown): void;
      };
    };
    /**
     * Rebuilds the formulas fixture grid with the given dataset, or – the width-window-scroll
     * fixture's overload – rebuilds its grid with setting overrides and an optional parent width.
     */
    initGrid(data: CellValue[][], overrides?: Record<string, unknown>): boolean;
    initGrid(overrides?: Record<string, unknown>, containerWidth?: string): boolean;
    /** `afterScrollVertically` calls since the last rebuild (width-window-scroll fixture). */
    verticalScrollCount: number;
    /**
     * Wheel events recorded by `WidthWindowScrollPage#watchWheelEvents()`, with the
     * `defaultPrevented` each one carried once the grid's own handler had run.
     */
    wheelLog: { deltaX: number, deltaY: number, defaultPrevented: boolean }[];
    /** Rebuilds the root-size-options fixture grid with setting overrides and a parent layout class. */
    initRootSizeGrid(overrides?: Record<string, unknown>, containerClass?: string, wrapperClass?: string): boolean;
    /**
     * Rebuilds the bottom-slot sizing fixture grid (DEV-2848): `variant` picks the CSS layout,
     * `plugin` the bottom-slot bar; both default to the page's query params. `overrides` are grid
     * options applied last.
     */
    initSlotGrid(variant?: string, plugin?: string, overrides?: Record<string, unknown>): boolean;
    /**
     * Rebuilds the side layout slots fixture grid with `cols` columns, grid option overrides, and
     * an optional `'auto'` container height.
     */
    initSideSlotGrid(options?: {
      cols?: number,
      overrides?: Record<string, unknown>,
      containerHeight?: 'fixed' | 'auto',
      sizeOptions?: 'fill' | 'unset',
      documentDir?: 'ltr' | 'rtl',
      hostLayout?: 'fixed' | 'inline-block' | 'flex',
      widthFunction?: number,
    }): boolean;
    /**
     * Side layout slots fixture: registers a panel and returns the root's inline width read in the same task.
     */
    addSidePanelAndReadRootWidth(side: 'start' | 'end', key: string, width: number): string;
    /**
     * Side layout slots fixture: shows a notification toast that stays until closed.
     */
    showToast(): boolean;
    /**
     * Side layout slots fixture: draws since the last rebuild.
     */
    htRenderCount: number;
    /**
     * Side layout slots fixture: calls of the `width` function since the last rebuild.
     */
    htWidthCalls: number;
    /**
     * Side layout slots fixture: registers a fixed-width panel into the `start` or `end` slot.
     */
    addSidePanel(side: 'start' | 'end', key: string, width: number, contentHeight?: number, weight?: number): boolean;
    /**
     * Side layout slots fixture: registers a panel sized by a CSS class only.
     */
    addClassPanel(side: 'start' | 'end', key: string, className: string): boolean;
    /**
     * Side layout slots fixture: sets the grid container's inline width.
     */
    resizeSideSlotContainer(width: number): boolean;
    /**
     * Side layout slots fixture: registers a click-counting button into the `top` slot.
    addTopButton(key: string): boolean;
    /**
     * Side layout slots fixture: appends a click-counting button into a registered side panel.
     */
    addPanelButton(panelKey: string, key: string): boolean;
    /**
     * Side layout slots fixture: clicks per button key.
     */
    slotButtonClicks: Record<string, number>;
    /**
     * Side layout slots fixture: unregisters a panel from its slot.
     */
    removeSidePanel(side: 'start' | 'end', key: string): boolean;
    /** Rebuilds the selection-features fixture grid with the given setting overrides. */
    initSelectionGrid(overrides?: Record<string, unknown>): boolean;
    /** Rebuilds the undo and redo fixture grid (`undo-grid.html`) with the given setting overrides. */
    initUndoGrid(overrides?: Record<string, unknown>): boolean;
    /** Rebuilds the mobile drag-to-scroll fixture grid with the given setting overrides. */
    initMobileGrid(overrides?: Record<string, unknown>): boolean;
    /** Rebuilds the fragmentSelection fixture grid with the given setting overrides. */
    initFragmentSelectionGrid(overrides?: Record<string, unknown>): boolean;
    /** Rebuilds the GH #5069 nested-`dataSchema` + `minSpareRows` fixture grid. */
    initNestedSchemaGrid(overrides?: Record<string, unknown>): boolean;
    /** Rebuilds the GH #7553 invalid-mark fixture grid with the given setting overrides. */
    initInvalidMarkGrid(overrides?: Record<string, unknown>): boolean;
    /** Releases the oldest pending validator callback; false when none was waiting (#7553 fixture). */
    resolveValidation(): boolean;
    /** How many validator callbacks are waiting to be released (#7553 fixture). */
    pendingValidationCount(): number;
    /** Rebuilds the `maxLength` fixture grid (`max-length.html`) with the given setting overrides. */
    initMaxLengthGrid(overrides?: Record<string, unknown>): boolean;
    /** The constructor failure the `maxLength` fixture captured, or `null` when the grid was built. */
    fixtureError: string | null;
    /** Rebuilds the GH #5983 sorting-a-filtered-grid-with-`minSpareRows` fixture grid. */
    initSortingSpareRowsGrid(overrides?: Record<string, unknown>): boolean;
    /**
     * Rebuilds the DEV-59 sorting-with-`fixedRowsTop`/`fixedRowsBottom` fixture grid.
     */
    initSortingFixedRowsGrid(overrides?: Record<string, unknown>): boolean;
    /** Rebuilds the DEV-1198 multiselect open-left fixture grid. */
    initMultiselectOpenLeftGrid(overrides?: Record<string, unknown>): boolean;
    /**
     * Rebuilds the DEV-2524 filtering-with-`fixedRowsTop`/`fixedRowsBottom` fixture grid.
     */
    initFiltersFixedRowsGrid(overrides?: Record<string, unknown>): boolean;
    /**
     * Rebuilds the DEV-3056 `filters.availableConditions` fixture grid.
     */
    initFiltersAvailableConditionsGrid(overrides?: Record<string, unknown>): boolean;
    /** Returns the text the browser currently reports as selected (fragmentSelection fixture). */
    readTextSelection(): string;
    /** Drops any existing text selection (fragmentSelection fixture). */
    clearTextSelection(): boolean;
    /** Reports whether a selection border, a cell, or neither is under a point (fragmentSelection fixture). */
    elementUnder(x: number, y: number): string;
    /** Resets the count of mouse moves that landed on a selection border (fragmentSelection fixture). */
    resetBorderMoveCount(): boolean;
    /** Returns how many mouse moves landed on a selection border since the reset (fragmentSelection fixture). */
    getBorderMoveCount(): number;
    /**
     * Resets the count of mouse moves that landed on a header (fragmentSelection fixture).
     */
    resetHeaderMoveCount(): boolean;
    /**
     * Returns how many mouse moves landed on a header since the reset (fragmentSelection fixture).
     */
    getHeaderMoveCount(): number;
    /**
     * Forgets the latest `mouseup` (fragmentSelection fixture).
     */
    resetLastMouseUp(): boolean;
    /**
     * Whether the latest `mouseup` landed off the grid; `null` when none has since the reset
     * (fragmentSelection fixture).
     */
    wasLastMouseUpOffGrid(): boolean | null;
    /** Recorded moveCells hook calls for the current grid instance. */
    moveCellsHookLog: MoveCellsHookRecord[];
    /** Names of the public selection hooks fired on the selection-features fixture grid. */
    selectionHookLog: string[];
    /** Renderer calls that painted a cell of the selection-features fixture grid. */
    cellPaintCount: number;
    /** Recorded NestedRows collapse/expand hook calls, in firing order. */
    hookLog: { name: string, args: unknown[] }[];
    /** Recorded remove-row/remove-column hook arguments from the DEV-2523 firing fixture. */
    removeHookLog: RemoveHookRecord[];
    /** Rebuilds the DEV-2523 firing fixture grid with the given setting overrides. */
    initRemoveHooksGrid(overrides?: Record<string, unknown>): boolean;
    /** Makes the fixture's `beforeRemoveRow` rewrite `physicalRows` to this list (DEV-2523). */
    setBeforeRemoveRowRewrite(physicalRows: number[] | null): boolean;
    /** Recorded remove-row hook arguments from the DEV-30 nested undo fixture. */
    removeLog: {
      hook: 'beforeRemoveRow' | 'afterRemoveRow';
      index: number;
      amount: number;
      physicalRows: number[];
      source?: string;
    }[];
    /**
     * Physical rows a HOST `beforeRemoveRow` listener (declared in the constructor settings) saw on
     * each call, in firing order - the DEV-3092 remove-parent fixture's `updatePlugin()` regression
     * case, where NestedRows' own listener has to keep running ahead of this one even after it is
     * cleared and re-registered by an `updateSettings()` call.
     */
    hostBeforeRemoveRowLog?: number[][];
    /** Makes the fixture's `beforeMoveCells` listener return `false`. */
    setBeforeMoveCellsVeto(shouldVeto: boolean): boolean;
    /** Makes the fixture's `beforeRowMove` listener return `false`. */
    setBeforeRowMoveVeto(shouldVeto: boolean): boolean;
    /** Makes the fixture's `beforeColumnMove` listener return `false`. */
    setBeforeColumnMoveVeto(shouldVeto: boolean): boolean;
    /** Per-hook invocation counters of the touch tap-to-edit fixture (DEV-2687). */
    hookCounts: Record<HookCounterName, number>;
    /**
     * Builds a grid whose init aborts inside `updateSettings()` and returns the message it threw
     * with, or `null` when it unexpectedly succeeded (DEV-2874 fixture).
     */
    abortGridInit(): string | null;
    /** Starts counting the healthy grid's `getIfMouseWasDraggedOutside()` calls (DEV-2874 fixture). */
    instrumentDragOutsideCheck(): boolean;
    /** How many drag-outside measurements the healthy grid has taken since instrumentation. */
    dragOutsideCheckCount: number;
    /** DEV-1159: `Element.prototype.scrollIntoView` calls since the oversized-cell counter reset. */
    htScrollIntoViewCount: number;
    /** DEV-1159: last `scrollIntoView` argument after the counter reset. */
    htScrollIntoViewLastArgs: ScrollIntoViewOptions | boolean | undefined;
    /**
     * DEV-1159: dispatches mousedown/mouseup/click on a master cell. Installed
     * with the `scrollIntoView` spy so last-partial clicks can read the index
     * and fire the events in one evaluate.
     */
    dispatchMasterCellMouseClick: (row: number, col: number) => void;
    /**
     * Chromium-only InputDeviceCapabilities constructor, used to stamp synthetic mouse events
     * with their origin (DEV-2687).
     */
    InputDeviceCapabilities: new (init: { firesTouchEvents: boolean }) => { firesTouchEvents: boolean };
  }
}
