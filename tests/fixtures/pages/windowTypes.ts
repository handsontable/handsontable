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
 * The slice of the Handsontable instance API the fixture-driving evaluate
 * callbacks use, so the in-page calls stay typed without importing the core
 * types into the test tier.
 */
export interface FixtureHotInstance {
  getDataAtCell(row: number, col: number): CellValue;
  getSourceDataAtCell(row: number, col: number): CellValue;
  setDataAtCell(row: number, col: number, value: CellValue): void;
  getCellMeta(row: number, col: number): { className?: string, readOnly?: boolean };
  getPlugin(name: 'formulas'): {
    getCellType(row: number, col: number): string,
    indexSyncer: { isPerformingUndoRedo(): boolean },
  };
  getPlugin(name: 'undoRedo'): {
    undo(): void,
    redo(): void,
    isUndoAvailable(): boolean,
    isRedoAvailable(): boolean,
    doneActions: unknown[],
  };
  getPlugin(name: 'moveCells'): {
    moveCellRange(sourceRange: unknown, targetTopLeft: unknown, isCopy?: boolean): boolean,
    isDragActive(): boolean,
    enablePlugin(): void,
    disablePlugin(): void,
  };
  getPlugin(name: 'dragToScroll'): { isListening(): boolean };
  getPlugin(name: 'nestedRows'): {
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
      addChild(parent: object): void,
    },
  };
  getPlugin(name: 'selectionHandles'): {
    isDragActive(): boolean,
    enablePlugin(): void,
    disablePlugin(): void,
  };
  getActiveEditor(): {
    isOpened(): boolean,
    beginEditing(): void,
    finishEditing(restoreOriginalValue?: boolean): void,
  } | undefined;
  render(): void;
  listen(): void;
  getFirstFullyVisibleRow(): number;
  getLastFullyVisibleRow(): number;
  getLastRenderedVisibleRow(): number;
  scrollViewportTo(options: { row?: number, col?: number, verticalSnap?: string }): boolean;
  selectCells(ranges: number[][]): boolean;
  selectColumns(fromCol: number, toCol: number): boolean;
  deselectCell(): void;
  getSelectedRangeLast(): FixtureCellRange;
  getSelectedRange(): FixtureCellRange[];
  addHook(name: string, callback: () => void): void;
  addHookOnce(name: string, callback: () => unknown): void;
  getSelectedLast(): number[];
  countRows(): number;
  toVisualRow(row: number): number | null;
  toPhysicalRow(row: number): number | null;
  selectCell(row: number, col: number): boolean;
  loadData(data: unknown[]): void;
  updateData(data: unknown[]): void;
  updateSettings(settings: Record<string, unknown>): void;
  countCols(): number;
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

declare global {
  interface Window {
    /** The fixture's live Handsontable instance. */
    hot: FixtureHotInstance;
    /** The Handsontable constructor loaded by the fixture — exposes the global hooks bucket. */
    Handsontable: {
      hooks: {
        add(key: string, callback: (...args: unknown[]) => unknown): void;
      };
    };
    /** Rebuilds the formulas fixture grid with the given dataset. */
    initGrid(data: CellValue[][], overrides?: Record<string, unknown>): boolean;
    /** Rebuilds the selection-features fixture grid with the given setting overrides. */
    initSelectionGrid(overrides?: Record<string, unknown>): boolean;
    /** Recorded moveCells hook calls for the current grid instance. */
    moveCellsHookLog: MoveCellsHookRecord[];
    /** Recorded NestedRows collapse/expand hook calls, in firing order. */
    hookLog: { name: string, args: unknown[] }[];
    /** Makes the fixture's `beforeMoveCells` listener return `false`. */
    setBeforeMoveCellsVeto(shouldVeto: boolean): boolean;
  }
}
