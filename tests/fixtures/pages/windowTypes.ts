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
  getPlugin(name: 'formulas'): { getCellType(row: number, col: number): string };
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
  };
  getPlugin(name: 'dragToScroll'): { isListening(): boolean };
  getPlugin(name: 'selectionHandles'): { isDragActive(): boolean };
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
    /** Rebuilds the formulas fixture grid with the given dataset. */
    initGrid(data: CellValue[][], overrides?: Record<string, unknown>): boolean;
    /** Rebuilds the selection-features fixture grid with the given setting overrides. */
    initSelectionGrid(overrides?: Record<string, unknown>): boolean;
    /** Recorded moveCells hook calls for the current grid instance. */
    moveCellsHookLog: MoveCellsHookRecord[];
    /** Makes the fixture's `beforeMoveCells` listener return `false`. */
    setBeforeMoveCellsVeto(shouldVeto: boolean): boolean;
  }
}
