/**
 * Internal types for the Selection module.
 */

import type { IndexMapper } from '../translations';
import type { default as CellCoords } from '../3rdparty/walkontable/src/cell/coords';
import type { default as CellRange } from '../3rdparty/walkontable/src/cell/range';
import type { ShortcutManager } from '../shortcuts/manager';

/**
 * Interface for table properties passed to the Selection module.
 */
export interface SelectionTableProps {
  createCellCoords(row: number, column: number): CellCoords;
  createCellRange(highlight: CellCoords, from: CellCoords, to: CellCoords): CellRange;
  countRows(): number;
  countCols(): number;
  countRowHeaders(): number;
  countColHeaders(): number;
  countRenderableRows(): number;
  countRenderableColumns(): number;
  countRenderableRowsInRange(startRow: number, endRow: number): number;
  countRenderableColumnsInRange(startColumn: number, endColumn: number): number;
  rowIndexMapper: IndexMapper;
  columnIndexMapper: IndexMapper;
  propToCol(prop: string | number): number;
  isEditorOpened(): boolean;
  isPluginEnabled(pluginName: string): boolean;
  isDisabledCellSelection(row: number, column: number): boolean;
  visualToRenderableCoords(coords: CellCoords): { row: number | null; col: number | null };
  renderableToVisualCoords(coords: CellCoords): CellCoords;
  getShortcutManager(): ShortcutManager;
  findFirstNonHiddenRenderableRow(from: number, to: number): number | null;
  findFirstNonHiddenRenderableColumn(from: number, to: number): number | null;
  navigableHeaders(): boolean;
  fixedRowsBottom(): number;
  minSpareRows(): number;
  minSpareCols(): number;
  autoWrapRow(): boolean;
  autoWrapCol(): boolean;
  [key: string]: unknown;
}

/**
 * Subset of grid settings consumed by the Selection module.
 */
export interface SelectionSettings {
  currentHeaderClassName?: string;
  activeHeaderClassName?: string;
  currentRowClassName?: string;
  currentColClassName?: string;
  navigableHeaders?: boolean;
  fixedRowsBottom?: number;
  minSpareRows?: number;
  minSpareCols?: number;
  autoWrapRow?: boolean;
  autoWrapCol?: boolean;
  selectionMode?: 'single' | 'range' | 'multiple';
  disableVisualSelection?: boolean | string | string[];
  fillHandle?: unknown;
  selectionHandles?: boolean;
  moveCells?: boolean;
  [key: string]: unknown;
}

/**
 * Optional focus position used by selectAll/selectColumns/selectRows.
 */
export interface SelectionFocusPosition {
  row?: number;
  col?: number;
}

/**
 * The whole selection state, as `Selection#exportSelection()` returns it. Declared once and
 * consumed by every stash-and-restore consumer (`dialog` and `emptyDataState` both are), because
 * a consumer that restates the shape drifts from it: enumerating the fields by hand is what
 * dropped `rowExtentSpansGrid`/`columnExtentSpansGrid` from the `dialog` restore, and a dropped
 * flag turns the next trim's clamp into a deselect with nothing to report it.
 */
export interface SelectionState {
  ranges: CellRange[];
  activeRange: CellRange | undefined;
  activeSelectionLayer: number;
  selectedByRowHeader: number[];
  selectedByColumnHeader: number[];
  disableHeadersHighlight: boolean;
  rowExtentSpansGrid: number[];
  columnExtentSpansGrid: number[];
}

/**
 * The state `Selection#importSelection()` accepts. Derived from {@link SelectionState} rather than
 * restated, so the two cannot drift apart.
 *
 * It differs on two points. `activeRange` is required, because the import reads its highlight. The
 * two grid-span arrays stay optional, because the method has always defaulted them and the
 * export/import pair is documented for external callers, who may hand back an older shape.
 */
export type ImportedSelectionState =
  Omit<SelectionState, 'activeRange' | 'rowExtentSpansGrid' | 'columnExtentSpansGrid'>
  & Partial<Pick<SelectionState, 'rowExtentSpansGrid' | 'columnExtentSpansGrid'>>
  & { activeRange: CellRange };
