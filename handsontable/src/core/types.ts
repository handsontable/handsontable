/**
 * Core type definitions that don't belong to any single subsystem.
 * Canonical home for HotInstance, RangeType, and internal Core helper types.
 */

import type { HookCallback } from './hooks/bucket';
import type { PluginTypeMap } from '../plugins/types';
import type { BasePlugin } from '../plugins/base';
import type { IndexMapper } from '../translations';
import type CellCoords from '../3rdparty/walkontable/src/cell/coords';
import type CellRange from '../3rdparty/walkontable/src/cell/range';
import type { Events, GridSettings } from './settings';
import type { default as SelectionManager } from '../selection/selection';
import type { default as ViewInstance } from '../tableView';
import type { ShortcutManager } from '../shortcuts/manager';
import type { FocusGridManager as FocusManagerInstance } from '../focusManager/grid';
import type { FocusScopeManager as FocusScopeManagerInstance } from '../focusManager/scopeManager';
import type { LayoutManager } from './layout';
import type { default as EditorManagerInstance } from '../editorManager';
import type { BaseEditor as BaseEditorInstance } from '../editors/baseEditor/baseEditor';
import type { StylesHandler } from '../utils/stylesHandler';
import type { ThemeManager } from '../themes/engine/manager';
import type { BaseRenderer } from '../renderers/baseRenderer';

/**
 * Represents a selection range with start/end row/col coordinates.
 */
export interface RangeType {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

/**
 * Represents the Grid helper used in Core.
 */
export interface GridHelperInstance {
  alter(action: string, index?: number | number[][], amount?: number, source?: string, keepEmptyRows?: boolean): void;
  populateFromArray(
    start: CellCoords, input: unknown[][], end?: CellCoords, source?: string,
    method?: string, direction?: string, deltas?: unknown[]
  ): object | false | undefined;
  adjustRowsAndCols(): void;
  [key: string]: unknown;
}

/**
 * Represents the ViewportScroller used in Core.
 */
export interface ViewportScrollerInstance {
  scrollTo(cellCoords: CellCoords, ...args: unknown[]): void;
  suspend(): void;
  resume(): void;
  skipNextScrollCycle(): void;
  [key: string]: unknown;
}

/**
 * Handsontable Core instance interface.
 * Provides type-safe access to the Core API without requiring circular imports.
 */
export interface HotInstance {
  // Lifecycle & hooks
  addHook<K extends keyof Events>(key: K, callback: Events[K] | Array<Events[K]>, orderIndex?: number): void;
  addHook(key: string, callback: HookCallback | HookCallback[], orderIndex?: number): void;
  addHookOnce<K extends keyof Events>(key: K, callback: Events[K] | Array<Events[K]>, orderIndex?: number): void;
  addHookOnce(key: string, callback: HookCallback | HookCallback[], orderIndex?: number): void;
  removeHook<K extends keyof Events>(key: K, callback: Events[K]): void;
  removeHook(key: string, callback: HookCallback): void;
  runHooks<R = unknown>(name: string, ...args: unknown[]): R;
  hasHook(name: string): boolean;

  // Settings
  getSettings(): GridSettings;
  updateSettings(settings: Partial<GridSettings>, init?: boolean): void;

  // Selection
  selection: SelectionManager;
  getSelectedRange(): CellRange[] | undefined;
  getSelectedRangeActive(): CellRange | undefined;
  getSelectedRangeLast(): CellRange | undefined;
  getSelected(): number[][] | undefined;
  getSelectedActive(): number[] | undefined;
  getSelectedLast(): number[] | undefined;
  getActiveSelectionLayerIndex(): number;
  selectCell(
    row: number, column: number, endRow?: number, endCol?: number, scrollToCell?: boolean, changeListener?: boolean
  ): boolean;
  selectCells(
    selectionRanges?: (number | undefined)[][] | unknown[], scrollToCell?: boolean, changeListener?: boolean
  ): boolean;
  selectColumns(start: number, end?: number, focusPosition?: unknown): boolean;
  selectRows(start: number, end?: number, focusPosition?: unknown): boolean;
  deselectCell(): void;

  // Index mapping
  rowIndexMapper: IndexMapper;
  columnIndexMapper: IndexMapper;
  toPhysicalRow(row: number): number;
  toPhysicalColumn(column: number): number;
  toVisualRow(row: number): number;
  toVisualColumn(column: number): number;
  propToCol(prop: string | number): number;
  colToProp(column: number): string | number;

  // Data access
  getSchema(): unknown[] | Record<string, unknown>;
  getData(row?: number, column?: number, row2?: number, column2?: number): unknown[][];
  getDataAtCell(row: number, column: number): unknown;
  getDataAtCol(column: number): unknown[];
  getDataAtRow(row: number): unknown[];
  getDataAtRowProp(row: number, prop: string): unknown;
  getSourceData(row?: number, column?: number, row2?: number, column2?: number): unknown[] | object[];
  getSourceDataArray(row?: number, column?: number, row2?: number, column2?: number): unknown[][];
  getSourceDataAtCell(row: number, column: number): unknown;
  getSourceDataAtCol(column: number): unknown[];
  getSourceDataAtRow(row: number): unknown;
  getDataType(rowFrom: number, columnFrom: number, rowTo: number, columnTo: number): string;
  getCopyableData(row: number, column: number): string;
  getCopyableSourceData(row: number, column: number): string;
  setDataAtCell(row: number | unknown[][], column?: number | string | null, value?: unknown, source?: string): void;
  setDataAtRowProp(row: number | unknown[][], prop?: string | number, value?: unknown, source?: string): void;
  setSourceDataAtCell(row: number | unknown[][], column?: number | string, value?: unknown, source?: string): void;
  loadData(data: unknown[], source?: string): void;
  updateData(data: unknown[][] | object[], source?: string): void;
  emptySelectedCells(source?: string): void;
  populateFromArray(
    row: number, column: number, input: unknown[][], endRow?: number | null, endCol?: number | null,
    source?: string, method?: string
  ): object | false | undefined;

  // Cell meta
  getCellMeta<M extends object = Record<string, unknown>>(row: number, column: number, options?: object): M;
  getCellMetaAtRow(row: number): Record<string, unknown>[];
  setCellMeta(row: number, column: number, key: string, value: unknown): void;
  setCellMetaObject(row: number, column: number, prop: Record<string, unknown>): void;
  removeCellMeta(row: number, column: number, key: string): void;
  spliceCellsMeta(visualIndex: number, deleteAmount?: number, ...cellMetaRows: unknown[]): void;
  getCellsMeta(): Record<string, unknown>[];
  getColumnMeta(column: number): Record<string, unknown>;
  getCellRenderer(rowOrMeta: number | Record<string, unknown>, column?: number): BaseRenderer;
  getCellEditor(rowOrMeta: number | Record<string, unknown>, column?: number):
    (new (hotInstance: HotInstance) => unknown) & { EDITOR_TYPE?: string };
  getCellValidator(rowOrMeta: number | Record<string, unknown>, column?: number):
    ((value: unknown, callback: (valid: boolean) => void) => void) | RegExp | undefined;
  validateCell(
    value: unknown, cellProperties: Record<string, unknown>, callback: (valid: boolean) => void, source?: string
  ): void;

  // Dimensions
  countRows(): number;
  countCols(): number;
  countSourceRows(): number;
  countSourceCols(): number;
  countRenderedRows(): number;
  countRenderedCols(): number;
  countVisibleRows(): number;
  countVisibleCols(): number;
  countRowHeaders(): number;
  countColHeaders(): number;
  getColWidth(column: number, source?: string): number;
  getRowHeight(row: number, source?: string): number;
  _getColWidthFromSettings(col: number): number | undefined;
  _getRowHeightFromSettings(row: number): number | undefined;
  getColHeader(column?: number, headerLevel?: number): string | string[];
  getRowHeader(row?: number): string | string[];
  hasColHeaders(): boolean;
  hasRowHeaders(): boolean;

  // Alter
  alter(action: string, index?: number | number[][], amount?: number, source?: string, keepEmptyRows?: boolean): void;
  spliceCol(column: number, index: number, amount: number, ...elements: unknown[]): void;
  spliceRow(row: number, index: number, amount: number, ...elements: unknown[]): void;

  // Rendering
  render(): void;
  forceFullRender: boolean;
  batchRender(wrappedOperations: () => unknown): unknown;
  batchExecution(wrappedOperations: () => unknown, forceFlushChanges?: boolean): unknown;
  batch(wrappedOperations: () => unknown): unknown;
  refreshDimensions(): void;
  isRenderSuspended(): boolean;
  suspendRender(): void;
  resumeRender(): void;
  validateCells(callback?: (valid: boolean) => void): void;
  validateRows(rows: number[], callback?: (valid: boolean) => void): void;
  validateColumns(columns: number[], callback?: (valid: boolean) => void): void;
  scrollViewportTo(
    options: {
      row?: number; col?: number; horizontalSnap?: string; verticalSnap?: string; considerHiddenIndexes?: boolean;
    } | number,
    ...args: unknown[]
  ): boolean;
  scrollToFocusedCell(callback?: () => void): boolean;

  // View
  view: ViewInstance;
  getCell(row: number, column: number, topmost?: boolean): HTMLTableCellElement | null;
  getCoords(element: HTMLElement): CellCoords | null;
  getFirstFullyVisibleRow(): number;
  getFirstFullyVisibleColumn(): number;
  getLastFullyVisibleRow(): number;
  getLastFullyVisibleColumn(): number;
  getFirstPartiallyVisibleRow(): number;
  getFirstPartiallyVisibleColumn(): number;
  getLastPartiallyVisibleRow(): number;
  getLastPartiallyVisibleColumn(): number;
  getFirstRenderedVisibleRow(): number;
  getFirstRenderedVisibleColumn(): number;
  getLastRenderedVisibleRow(): number;
  getLastRenderedVisibleColumn(): number;

  // Coordinates factory
  _createCellCoords(row: number | null, column: number | null): CellCoords;
  _createCellRange(
    highlight: { row: number | null; col: number | null } | CellCoords,
    from?: { row: number | null; col: number | null } | CellCoords,
    to?: { row: number | null; col: number | null } | CellCoords
  ): CellRange;

  // Plugins
  getPlugin<K extends keyof PluginTypeMap>(pluginName: K): PluginTypeMap[K];
  getPlugin(pluginName: string): BasePlugin;
  getPluginName(plugin: object): string;

  // Managers
  getShortcutManager(): ShortcutManager;
  getFocusManager(): FocusManagerInstance;
  getFocusScopeManager(): FocusScopeManagerInstance;
  getLayoutManager(): LayoutManager;
  _getEditorManager(): EditorManagerInstance;

  // DOM references
  rootElement: HTMLElement;
  rootDocument: Document;
  rootWindow: Window & typeof globalThis;
  rootPortalElement: HTMLElement;
  rootSlotTopElement: HTMLElement;
  rootGridElement: HTMLElement;
  rootGridContentElement: HTMLElement;
  rootSlotBottomElement: HTMLElement;
  rootOverlaysElement: HTMLElement;
  rootWrapperElement: HTMLElement;
  rootContainer: HTMLElement;
  table: HTMLTableElement;
  container: HTMLElement;

  // State
  guid: string;
  isRtl(): boolean;
  isLtr(): boolean;
  isDestroyed: boolean;
  isListening(): boolean;
  listen(): void;
  unlisten(): void;
  isColumnModificationAllowed(): boolean;
  getDirectionFactor(): number;
  getInitialColumnCount(): number;
  getCurrentThemeName(): string | null;
  getTranslatedPhrase(dictionaryKey: string, extraArguments?: unknown): string;
  getActiveEditor(): BaseEditorInstance | undefined;
  destroyEditor(revertOriginal?: boolean, prepareEditorAfterDestroy?: boolean): void;
  dataType: string;
  getTableHeight(): number;
  getTableWidth(): number;
  getValue(): unknown;

  // Styles
  stylesHandler: StylesHandler;

  // Theme management
  themeManager: ThemeManager | null | undefined;
  useTheme(themeName: string | null): void;

  // Execution control
  suspendExecution(): void;
  resumeExecution(forceFlushChanges?: boolean): void;

  // Index mapper initialization
  initIndexMappers(): void;

  // Empty row/col checks
  countEmptyRows(ending?: boolean): number;
  countEmptyCols(ending?: boolean): number;
  isEmptyRow(row: number): boolean;
  isEmptyCol(column: number): boolean;

  // Internal
  _registerTimeout(callback: Function | ReturnType<typeof setTimeout>, delay?: number): ReturnType<typeof setTimeout>;
  _registerImmediate(handle: Function): void;
  _registerMicrotask(callback: Function): void;
  _clearMicrotasks(): void;
  _clearTimeouts(): void;

  // Lifecycle
  init(): void;
  destroy(): void;
  constructor: Function;

  // Allow additional properties
  [key: string]: unknown;
}
