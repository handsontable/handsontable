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
  getBottomEndCorner(): { row: number | null, col: number | null };
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
  getPlugin(name: 'formulas'): { getCellType(row: number, col: number): string };
  getPlugin(name: 'undoRedo'): { undo(): void, redo(): void };
  getPlugin(name: 'moveCells'): { moveCellRange(sourceRange: unknown, targetTopLeft: unknown, isCopy?: boolean): boolean };
  getPlugin(name: 'dragToScroll'): { isListening(): boolean };
  getFirstFullyVisibleRow(): number;
  getLastFullyVisibleRow(): number;
  getLastRenderedVisibleRow(): number;
  selectCells(ranges: number[][]): boolean;
  deselectCell(): void;
  getSelectedRangeLast(): FixtureCellRange;
  _createCellCoords(row: number, col: number): unknown;
}

declare global {
  interface Window {
    /** The fixture's live Handsontable instance. */
    hot: FixtureHotInstance;
    /** Rebuilds the formulas fixture grid with the given dataset. */
    initGrid(data: CellValue[][]): boolean;
    /** Rebuilds the selection-features fixture grid with the given setting overrides. */
    initSelectionGrid(overrides?: Record<string, unknown>): boolean;
  }
}
