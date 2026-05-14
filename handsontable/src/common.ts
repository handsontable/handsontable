/**
 * Common interfaces used across the Handsontable codebase.
 * These interfaces provide type-safe access to Core and Walkontable instances
 * without requiring circular imports.
 */

import { IndexMapper } from './translations';
import type { BasePlugin } from './plugins/base';
import type { PluginTypeMap } from './plugins/types';
import type { WalkontableInstance, WtTable, WtViewport, WtOverlays, DomBindings, WotSelectionManager, OverlayInstance, WtSettings } from './3rdparty/walkontable/src/types';
import type { RangeType } from './core/types';
import type { SelectionTableProps } from './selection/types';

export type { GridSettings, Events } from './core/settings';

export type { RangeType } from './core/types';

export type { OverlayType } from './3rdparty/walkontable/src/types';

/**
 * Represents a cell coordinates object.
 */
export interface CellCoords {
  row: number;
  col: number;
  assign(coords: CellCoords | { row?: number; col?: number }): CellCoords;
  clone(): CellCoords;
  isEqual(coords: CellCoords): boolean;
  isSouthEastOf(testedCoords: CellCoords): boolean;
  isSouthWestOf(testedCoords: CellCoords): boolean;
  isNorthWestOf(testedCoords: CellCoords): boolean;
  isNorthEastOf(testedCoords: CellCoords): boolean;
  normalize(): CellCoords;
  isHeader(): boolean;
  isCell(): boolean;
  add(coords: CellCoords | { row?: number; col?: number }): CellCoords;
  toObject(): { row: number; col: number };
  [key: string]: unknown;
}

/**
 * Represents a cell range object.
 */
export interface CellRange {
  highlight: CellCoords;
  from: CellCoords;
  to: CellCoords;
  getTopStartCorner(): CellCoords;
  getTopEndCorner(): CellCoords;
  getBottomStartCorner(): CellCoords;
  getBottomEndCorner(): CellCoords;
  getTopLeftCorner(): CellCoords;
  getTopRightCorner(): CellCoords;
  getBottomLeftCorner(): CellCoords;
  getBottomRightCorner(): CellCoords;
  getOuterTopStartCorner(): CellCoords;
  getOuterTopEndCorner(): CellCoords;
  getOuterBottomStartCorner(): CellCoords;
  getOuterBottomEndCorner(): CellCoords;
  isValid(wot: object): boolean;
  isSingle(): boolean;
  isSingleCell(): boolean;
  isSingleHeader(): boolean;
  getWidth(): number;
  getHeight(): number;
  getCellsCount(): number;
  includes(cellCoords: CellCoords): boolean;
  includesRange(cellRange: CellRange): boolean;
  isOverlappingHorizontally(cellRange: CellRange): boolean;
  isOverlappingVertically(cellRange: CellRange): boolean;
  isNorthWestOf(cellRange: CellRange | CellCoords): boolean;
  isSouthEastOf(cellRange: CellRange | CellCoords): boolean;
  getDirection(): string;
  setDirection(direction: string): void;
  setHighlight(coords: CellCoords): CellRange;
  setFrom(coords: CellCoords): CellRange;
  setTo(coords: CellCoords): CellRange;
  getHorizontalDirection(): string;
  getVerticalDirection(): string;
  getInlineDirection(): string;
  containsHeaders(): boolean;
  isHeader(): boolean;
  isSingleHeader(): boolean;
  expand(cellCoords: CellCoords): boolean;
  expandByRange(expandingRange: CellRange, insertionDirection?: string | boolean): boolean;
  forAll(callback: (row: number, column: number) => boolean | void): void;
  isEqual(cellRange: CellRange): boolean;
  normalize(): CellRange;
  clone(): CellRange;
  toObject(): { from: { row: number; col: number }; to: { row: number; col: number } };
  [key: string]: unknown;
}

/**
 * Represents a Highlight instance (selection highlight manager).
 */
export interface HighlightInstance {
  getFill(): HighlightSelection;
  getFocus(): HighlightSelection;
  addCustomSelection(options: object): void;
  customSelections: HighlightSelection[];
  createLayeredArea(): HighlightSelection;
  getLayeredAreas(): HighlightSelection[];
  createArea(): HighlightSelection;
  getAreas(): HighlightSelection[];
  setActiveOverlayName(name: string): void;
  isActiveByOverlayName(name: string): boolean;
  useLayerLevel(level: number): HighlightInstance;
  [key: string]: unknown;
}

/**
 * Represents a single highlight selection (Walkontable Selection).
 */
export interface HighlightSelection {
  settings: Record<string, unknown>;
  cellRange: CellRange | null;
  visualCellRange: CellRange | null;
  isEmpty(): boolean;
  getVisualCorners(): number[];
  clear(): HighlightSelection;
  destroy(): void;
  commit(): HighlightSelection;
  add(coords: CellCoords | object): HighlightSelection;
  [key: string]: unknown;
}

/**
 * Represents the selection range container returned by selection.getSelectedRange().
 */
export interface SelectionRangeContainer {
  size(): number;
  peekByIndex(index: number): CellRange;
  current(): CellRange;
  pop(): CellRange;
  clear(): SelectionRangeContainer;
  set(from: CellCoords): SelectionRangeContainer;
  clone(): SelectionRangeContainer;
  map(callback: (range: CellRange) => unknown): SelectionRangeContainer;
  findAll(cellRange: CellRange): { layer: number }[];
  removeLayers(layers: number[]): void;
  [Symbol.iterator](): Iterator<CellRange>;
  [key: string]: unknown;
}

/**
 * Represents the Selection manager.
 */
export interface SelectionManager {
  highlight: HighlightInstance;
  getLayerLevel(): number;
  setRangeStart(coords: CellCoords, ...args: unknown[]): void;
  setRangeStartOnly(coords: CellCoords, ...args: unknown[]): void;
  setRangeEnd(coords: CellCoords, ...args: unknown[]): void;
  isSelected(): boolean;
  isSelectedByAnyHeader(): boolean;
  isSelectedByRowHeader(): boolean;
  isSelectedByColumnHeader(): boolean;
  isSelectedByCorner(): boolean;
  inInSelection(coords: CellCoords): boolean;
  isCellVisible(coords: CellCoords): boolean;
  deselect(): void;
  selectAll(includeHeaders?: boolean, focusPosition?: CellCoords | boolean, options?: Record<string, unknown> | { disableHeadersHighlight?: boolean }): boolean;
  selectRows(start: number, end?: number, focusPosition?: CellCoords | number): boolean;
  selectColumns(start: number, end?: number, focusPosition?: CellCoords | number): boolean;
  getSelectedRange(): SelectionRangeContainer;
  isMultiple(cellRange?: CellRange): boolean;
  isFocusSelectionChanged(): boolean;
  isInProgress(): boolean;
  finish(): void;
  selectCells(selectionRanges: unknown[], keepPreviousSelection?: boolean): boolean;
  transformStart(rowDelta: number, colDelta: number, force?: boolean): void;
  transformEnd(rowDelta: number, colDelta: number): void;
  transformFocus(rowDelta: number, colDelta: number): void;
  getSelectionSource(): string;
  getFocusHighlight(): HighlightSelection;
  setActiveSelectionLayerIndex(index: number): void;
  addLocalHook(name: string, callback: Function): object;
  runLocalHooks(name: string, ...args: unknown[]): void;
  markSource(sourceName: string): void;
  markEndSource(): void;
  refresh(): void;
  exportSelection(): { ranges: unknown[]; [key: string]: unknown };
  importSelection(state: { ranges: unknown[]; [key: string]: unknown }): void;
  tableProps: SelectionTableProps;
  settings: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Represents the View (TableView) instance.
 */
export interface ViewInstance {
  _wt: WalkontableInstance;
  activeWt: WalkontableInstance;
  THEAD: HTMLTableSectionElement;
  TBODY: HTMLTableSectionElement;
  getCellAtCoords(coords: CellCoords, topmost?: boolean): HTMLTableCellElement | null;
  scrollViewport(coords: CellCoords, horizontalSnap?: string, verticalSnap?: string): boolean;
  scrollViewportHorizontally(column: number, snap?: string): boolean;
  scrollViewportVertically(row: number, snap?: string): boolean;
  countRenderableColumnsInRange(columnStart: number, columnEnd: number): number;
  countRenderableRowsInRange(rowStart: number, rowEnd: number): number;
  countNotHiddenRowIndexes(visualIndex: number, incrementBy: number): number;
  countNotHiddenColumnIndexes(visualIndex: number, incrementBy: number): number;
  countRenderableColumns(): number;
  countRenderableRows(): number;
  translateFromRenderableToVisualCoords(coords: { row: number; col: number }): { row: number; col: number };
  translateFromRenderableToVisualIndex(renderableRow: number, renderableColumn: number): [number, number];
  isVisible(): boolean;
  isTextSelectionAllowed(el: HTMLElement): boolean;
  isMainTableNotFullyCoveredByOverlays(): boolean;
  render(): void;
  appendRowHeader(visualRowIndex: number, TH: HTMLTableCellElement): void;
  appendColHeader(visualColumnIndex: number, TH: HTMLTableCellElement, headerLevel?: number, baseHeaderLevel?: number): void;
  getColumnHeadersCount(): number;
  getRowHeadersCount(): number;
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
  maximumVisibleElementWidth(inlineOffset: number): number;
  maximumVisibleElementHeight(topOffset: number): number;
  setLastSize(width: number, height: number): void;
  updateCellHeader(element: HTMLElement, index: number, content: string | number, headerLevel?: number): void;
  getActiveOverlayName(): string;
  countNotHiddenFixedRowsTop(): number;
  getOverlayByName(overlayName: string): object;
  getElementOverlayName(element: HTMLElement): string;
  setTableScrollPosition(position: Record<string, unknown>): void;
  getTableScrollPosition(): { left: number; top: number };
  isMouseDown(): boolean;
  getTableHeight(): number;
  getTableWidth(): number;
  getTotalTableWidth(): number;
  getTotalTableHeight(): number;
  isVerticallyScrollableByWindow(): boolean;
  isHorizontallyScrollableByWindow(): boolean;
  hasVerticalScroll(): boolean;
  hasHorizontalScroll(): boolean;
  getTableOffset(): { top: number; left: number };
  getWorkspaceHeight(): number;
  getWorkspaceWidth(): number;
  getViewportWidth(): number;
  getViewportHeight(): number;
  getRowHeaderWidth(): number;
  getColumnHeaderHeight(): number;
  adjustElementsSize(flush?: boolean): void;
  invalidateColumnWidthCache(): void;
  invalidateRowHeightCache(): void;
  [key: string]: unknown;
}


/**
 * Represents a Shortcut context.
 */
export interface ShortcutContext {
  addShortcut(descriptor: object): void;
  addShortcuts(descriptors: object[], options?: object): void;
  removeShortcutsByGroup(group: string): void;
  removeShortcutsByKeys(keys: string[]): void;
  getShortcuts(keys: string[]): object[];
  hasShortcut(keys: string[]): boolean;
  [key: string]: unknown;
}

/**
 * Represents a Shortcut Manager.
 */
export interface ShortcutManager {
  getContext(name: string): ShortcutContext;
  addContext(name: string): ShortcutContext;
  getOrCreateContext(name: string, scope?: string): ShortcutContext;
  setActiveContextName(name: string): void;
  getActiveContextName(): string;
  isCtrlPressed(): boolean;
  hasEventShortcut(contextName: string, event: KeyboardEvent): boolean;
  destroy(): void;
  [key: string]: unknown;
}

/**
 * Represents a Styles handler.
 */
export interface StylesHandler {
  getStyleForRange(range: object): object;
  getDefaultColumnWidth(): number;
  getDefaultRowHeight(row?: number): number;
  isClassicTheme(): boolean;
  getCSSVariableValue(name: string): string;
  areCellsBorderBox(): boolean;
  [key: string]: unknown;
}

/**
 * Public interface of a Handsontable editor instance (BaseEditor).
 * Defined here to avoid circular imports between common.ts and BaseEditor.
 */
export interface BaseEditorInstance {
  state: string;
  beginEditing(newInitialValue?: unknown, event?: Event): void;
  finishEditing(restoreOriginalValue?: boolean, ctrlDown?: boolean, callback?: Function): void;
  cancelChanges(): void;
  discardEditor(result?: boolean): void;
  getValue(): unknown;
  setValue(value?: unknown): void;
  isOpened(): boolean;
  isWaiting(): boolean;
  isInFullEditMode(): boolean;
  enableFullEditMode(): void;
  focus(): void;
  prepare(row: number, col: number, prop: string | number, td: HTMLTableCellElement, value: unknown, cellProperties: Record<string, unknown>): void;
  refreshValue?(): void;
  _closeAfterDataChange?: boolean;
  [key: string]: unknown;
}

export type { HotInstance } from './core/types';

export type { SelectionTableProps } from './selection/types';
export type { DataAccessObject, ScrollDao } from './tableView';

/**
 * Represents the Focus Manager instance.
 */
export interface FocusManagerInstance {
  getFocusMode(): string;
  setFocusMode(focusMode: string): void;
  getRefocusDelay(): number;
  setRefocusDelay(delay: number): void;
  setRefocusElementGetter(getRefocusElementFunction: () => HTMLElement): void;
  getRefocusElement(): HTMLElement | void;
  focusElement(element: HTMLElement, options?: Record<string, unknown>): void;
  focusOnHighlightedCell(selectedCell?: HTMLTableCellElement | null): void;
  refocusToEditorTextarea(delay?: number): void;
  [key: string]: unknown;
}

/**
 * Represents the Focus Scope Manager instance.
 */
export interface FocusScopeManagerInstance {
  registerScope(scopeId: string, container: HTMLElement, options?: object): void;
  unregisterScope(scopeId: string): void;
  activateScope(scopeId: string, source?: string): void;
  deactivateScope(scopeId: string): void;
  getActiveScopeId(): string | null;
  [key: string]: unknown;
}

/**
 * Represents the Editor Manager instance.
 */
export interface EditorManagerInstance {
  isOpened(): boolean;
  closeEditor(restoreOriginalValue?: boolean, isCtrlPressed?: boolean, callback?: Function): void;
  prepareEditor(): void;
  openEditor(newInitialValue: unknown, event: Event, enableFullEditMode?: boolean): void;
  destroyEditor(revertOriginal?: boolean): void;
  destroy(): void;
  lockEditor(): void;
  unlockEditor(): void;
  moveSelectionAfterEnter(event: Event): void;
  closeEditorAndSaveChanges(isCtrlPressed?: boolean): void;
  closeEditorAndRestoreOriginalValue(isCtrlPressed?: boolean): void;
  getActiveEditor(): BaseEditorInstance | undefined;
  activeEditor: BaseEditorInstance | undefined;
  cellProperties: Record<string, unknown>;
}

/**
 * Represents the DataMap instance used in Core.
 */
export interface DataMapInstance {
  propToCol(prop: string | number): number;
  colToProp(column: number): string | number;
  createRow(index: number | undefined, amount?: number, options?: Record<string, unknown>): Record<string, unknown>;
  createCol(index: number | undefined, amount?: number, options?: Record<string, unknown>): Record<string, unknown>;
  removeRow(index: number, amount: number, source?: string): boolean;
  removeCol(index: number, amount: number, source?: string): boolean;
  spliceCol(column: number, index: number, amount: number, ...elements: unknown[]): unknown;
  spliceRow(row: number, index: number, amount: number, ...elements: unknown[]): unknown;
  get(row: number, prop: string | number): unknown;
  set(row: number, prop: string | number, value: unknown): void;
  getRange(start: CellCoords, end: CellCoords, destination?: number): unknown[][];
  getAll(): unknown[][];
  getLength(): number;
  getSchema(): object;
  getCopyableText(start: CellCoords, end: CellCoords): string;
  getCopyable(row: number, prop: string | number): string;
  createMap(): void;
  destroy(): void;
  colToPropCache: (string | number)[];
  propToColCache: Map<string | number, number>;
  recursiveDuckSchema(object: unknown, lastColumn?: number, prefix?: string): number;
  duckSchema(): object;
  [key: string]: unknown;
}

/**
 * Represents the DataSource instance used in Core.
 */
export interface DataSourceInstance {
  getData(toArray?: boolean): unknown[][] | unknown[];
  getAtColumn(column: number): unknown[];
  getAtCell(row: number, column: number | string): unknown;
  getAtRow(row: number): unknown;
  setAtCell(row: number, column: number | string, value: unknown): void;
  setData(data: unknown): void;
  getByRange(start: CellCoords, end: CellCoords, allowDuplicates?: boolean): unknown[][];
  getCopyable(row: number, prop: string | number): string;
  countRows(): number;
  countFirstRowKeys(): number;
  data: unknown[];
  destroy(): void;
  [key: string]: unknown;
}

export type { GridHelperInstance, ViewportScrollerInstance } from './core/types';

/**
 * Represents a MetaManager instance.
 */
export interface MetaManagerInstance {
  getTableMeta(): Record<string, unknown>;
  getGlobalMeta(): Record<string, unknown>;
  getColumnMeta(column: number): Record<string, unknown>;
  getCellMeta(row: number, column: number, options?: object): Record<string, unknown>;
  setCellMeta(row: number, column: number, key: string, value: unknown): void;
  removeCellMeta(row: number, column: number, key: string): void;
  createRow(index: number | null, amount: number): void;
  createColumn(index: number | null, amount: number): void;
  removeRow(index: number, amount: number): void;
  removeColumn(index: number, amount: number): void;
  clearCellsCache(): void;
  updateCellMeta(row: number, column: number, settings: Record<string, unknown>): void;
  updateColumnMeta(column: number, settings: Record<string, unknown>): void;
  getCellsMeta(): Record<string, unknown>[];
  clearCache(): void;
  addLocalHook(key: string, callback: Function): unknown;
  runLocalHooks(key: string, ...args: unknown[]): void;
  updateGlobalMeta(settings: Record<string, unknown>): void;
  updateTableMeta(settings: Record<string, unknown>): void;
  updateColumnMeta(column: number, settings: Record<string, unknown>): void;
}

