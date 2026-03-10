/**
 * Common interfaces used across the Handsontable codebase.
 * These interfaces provide type-safe access to Core and Walkontable instances
 * without requiring circular imports.
 */

import { IndexMapper } from './translations';
import type { HookCallback } from './core/hooks/bucket';

/**
 * Grid settings interface representing all possible Handsontable configuration options.
 * Derived from the metaSchema factory in dataMap/metaManager/metaSchema.ts.
 */
export interface GridSettings {
  // Internal
  _automaticallyAssignedMetaProps?: Set<string>;

  // Appearance
  activeHeaderClassName?: string;
  className?: string | string[];
  commentedCellClassName?: string;
  currentColClassName?: string;
  currentHeaderClassName?: string;
  currentRowClassName?: string;
  headerClassName?: string | string[];
  invalidCellClassName?: string;
  noWordWrapClassName?: string;
  placeholderCellClassName?: string;
  readOnlyCellClassName?: string;
  tableClassName?: string | string[];
  themeName?: string;

  // Dimensions
  width?: number | string | (() => number | string);
  height?: number | string | (() => number | string);
  colWidths?: number | number[] | string | ((column: number) => number | string) | Array<number | string>;
  rowHeights?: number | number[] | string | ((row: number) => number | string) | Array<number | string>;
  rowHeaderWidth?: number | number[];
  columnHeaderHeight?: number | number[];
  minRowHeights?: number | string | number[] | ((index: number) => number);
  maxRows?: number;
  maxCols?: number;
  minRows?: number;
  minCols?: number;
  minSpareCols?: number;
  minSpareRows?: number;
  startCols?: number;
  startRows?: number;
  stretchH?: 'none' | 'all' | 'last';

  // Data
  data?: unknown[][] | object[];
  dataSchema?: object | Function;
  dataDotNotation?: boolean;
  columns?: Record<string, any>[] | ((column: number) => Record<string, any>);
  cell?: object[];
  cells?: (row: number, column: number, prop: string | number) => object;
  source?: unknown[] | ((query: string, callback: Function) => void);
  type?: string;

  // Editing
  allowEmpty?: boolean;
  allowHtml?: boolean;
  allowInsertColumn?: boolean;
  allowInsertRow?: boolean;
  allowInvalid?: boolean;
  allowRemoveColumn?: boolean;
  allowRemoveRow?: boolean;
  copyable?: boolean;
  copyPaste?: boolean | object;
  editor?: string | Function | boolean;
  enterBeginsEditing?: boolean;
  enterMoves?: { col: number; row: number } | ((event: KeyboardEvent) => { col: number; row: number });
  fillHandle?: boolean | string | { autoInsertRow?: boolean; direction?: string };
  imeFastEdit?: boolean;
  readOnly?: boolean;
  skipColumnOnPaste?: boolean;
  skipRowOnPaste?: boolean;
  tabMoves?: { row: number; col: number } | ((event: KeyboardEvent) => { row: number; col: number });
  trimWhitespace?: boolean;
  undo?: boolean;
  validator?: string | RegExp | Function;
  wordWrap?: boolean;

  // Rendering
  renderer?: string | Function;
  valueFormatter?: Function;
  valueGetter?: Function;
  valueSetter?: Function;
  placeholder?: string | number;
  renderAllRows?: boolean;
  renderAllColumns?: boolean;
  viewportColumnRenderingOffset?: number | 'auto';
  viewportRowRenderingOffset?: number | 'auto';
  viewportColumnRenderingThreshold?: number | 'auto';
  viewportRowRenderingThreshold?: number | 'auto';
  observeDOMVisibility?: boolean;
  textEllipsis?: boolean;

  // Selection & navigation
  disableVisualSelection?: boolean | string | string[];
  fragmentSelection?: boolean | string;
  navigableHeaders?: boolean;
  outsideClickDeselects?: boolean | ((target: HTMLElement, coords?: CellCoords) => boolean);
  selectionMode?: 'single' | 'range' | 'multiple';
  tabNavigation?: boolean;
  autoWrapCol?: boolean;
  autoWrapRow?: boolean;

  // Fixed / frozen
  fixedColumnsLeft?: number;
  fixedColumnsStart?: number;
  fixedRowsBottom?: number;
  fixedRowsTop?: number;

  // Headers
  colHeaders?: boolean | string[] | ((column: number) => string);
  rowHeaders?: boolean | string[] | ((row: number) => string);

  // Sorting
  columnSorting?: boolean | object;
  multiColumnSorting?: boolean | object;
  sortByRelevance?: boolean;

  // Plugins
  autoColumnSize?: boolean | object;
  autoRowSize?: boolean | object;
  bindRowsWithHeaders?: boolean | string;
  collapsibleColumns?: boolean | object[];
  columnSummary?: object[] | (() => object[]);
  comments?: boolean | object[];
  contextMenu?: boolean | object | string[];
  customBorders?: boolean | object[];
  dialog?: boolean | object;
  dragToScroll?: boolean;
  dropdownMenu?: boolean | object | string[];
  emptyDataState?: boolean | object;
  filters?: boolean;
  formulas?: boolean | { engine: unknown; sheetName?: string; [key: string]: unknown };
  hiddenColumns?: boolean | object;
  hiddenRows?: boolean | object;
  loading?: boolean | object;
  manualColumnFreeze?: boolean;
  manualColumnMove?: boolean | number[];
  manualColumnResize?: boolean | number[];
  manualRowMove?: boolean | number[];
  manualRowResize?: boolean | number[];
  mergeCells?: boolean | object[];
  nestedHeaders?: unknown[][];
  nestedRows?: boolean;
  pagination?: boolean | object;
  persistentState?: boolean;
  search?: boolean | object;
  trimRows?: boolean | number[];

  // Checkbox
  checkedTemplate?: unknown;
  uncheckedTemplate?: unknown;

  // Date
  correctFormat?: boolean;
  dateFormat?: string;
  timeFormat?: string;
  datePickerConfig?: object;
  defaultDate?: string;

  // Formatting
  filter?: boolean;
  filteringCaseSensitive?: boolean;
  label?: object;
  locale?: string;
  language?: string;
  numericFormat?: object;
  selectOptions?: string[] | number[] | object[] | Record<string, string> | ((visualRow: number, visualColumn: number, prop: string | number) => string[] | Record<string, string>);
  strict?: boolean;
  title?: string;
  trimDropdown?: boolean;
  visibleRows?: number;

  // Layout
  ariaTags?: boolean;
  layoutDirection?: 'inherit' | 'ltr' | 'rtl';
  licenseKey?: string;
  preventOverflow?: boolean | string;
  preventWheel?: boolean;

  // State
  initialState?: Record<string, unknown>;

  // Allow additional plugin-specific keys
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

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
  [key: string]: unknown;
}

/**
 * Represents Walkontable selection manager.
 */
export interface WotSelectionManager {
  getBorderInstances(selection: object): object[];
  getFocusSelection(): { cellRange: CellRange | null; settings: Record<string, unknown>; [key: string]: unknown } | null;
  getAreaSelection(): { cellRange: CellRange | null; settings: Record<string, unknown>; [key: string]: unknown } | null;
  setActiveOverlay(activeWot: WalkontableInstance): WotSelectionManager;
  render(fastDraw: boolean): void;
  [key: string]: unknown;
}

/**
 * Represents a Walkontable instance.
 */
export interface WalkontableInstance {
  wtTable: WtTable;
  wtViewport: WtViewport;
  wtOverlays: WtOverlays;
  wtSettings: WtSettings;
  selectionManager: WotSelectionManager;
  cloneSource: WalkontableInstance;
  drawn: boolean;
  domBindings: DomBindings;
  rootDocument: Document;
  rootWindow: Window & typeof globalThis;
  eventManager: Record<string, Function>;
  activeOverlayName: string;
  wtEvent: Record<string, unknown>;
  drawInterrupted: boolean;
  guid: string;
  createCellCoords(row: number, column: number): CellCoords;
  createCellRange(highlight: CellCoords, from: CellCoords, to: CellCoords): CellRange;
  getSetting(key: string, ...args: unknown[]): unknown;
  update(key: string, value: unknown): WalkontableInstance;
  draw(fastDraw?: boolean): WalkontableInstance;
  scrollViewport(coords: CellCoords | { row: number; col: number }, snapToTop?: boolean | string, snapToRight?: boolean | string, snapToBottom?: boolean, snapToLeft?: boolean): boolean;
  scrollViewportHorizontally(column: number, snapping?: string): boolean;
  scrollViewportVertically(row: number, snapping?: string): boolean;
  getCell(coords: CellCoords | { row: number; col: number }, topmost?: boolean): HTMLTableCellElement | number;
  getOverlayName(): string;
  getOverlayByName(name: string): WalkontableInstance | null;
  exportSettingsAsClassNames(): string[];
  hasSetting(key: string): boolean;
  destroy(): void;
  wtScroll: WtScroll;
  [key: string]: unknown;
}

/**
 * Represents Walkontable scroll manager.
 */
export interface WtScroll {
  getFirstVisibleRow(): number;
  getLastVisibleRow(): number;
  getFirstVisibleColumn(): number;
  getLastVisibleColumn(): number;
  getFirstPartiallyVisibleRow(): number;
  getLastPartiallyVisibleRow(): number;
  getFirstPartiallyVisibleColumn(): number;
  getLastPartiallyVisibleColumn(): number;
  [key: string]: unknown;
}

/**
 * Represents Walkontable table (wtTable).
 */
export interface WtTable {
  TABLE: HTMLTableElement;
  THEAD: HTMLTableSectionElement;
  TBODY: HTMLTableSectionElement;
  holder: HTMLElement;
  hider: HTMLElement;
  spreader: HTMLElement;
  wtRootElement: HTMLElement;
  bordersHolder: HTMLElement;
  name: string;
  getCell(coords: CellCoords): HTMLTableCellElement | number;
  getCoords(element: HTMLElement): CellCoords;
  getColumnHeader(col: number, level?: number): HTMLElement | undefined;
  getRowHeader(row: number, level?: number): HTMLElement | undefined;
  getColumnHeaders(column?: number): Function[] | HTMLTableCellElement[];
  getColumnHeadersCount(): number;
  getRowHeaders(row?: number): Function[] | HTMLTableCellElement[];
  getRowHeadersCount(): number;
  getRenderedRowsCount(): number;
  getRenderedColumnsCount(): number;
  getVisibleRowsCount(): number;
  getVisibleColumnsCount(): number;
  getFirstRenderedRow(): number;
  getFirstRenderedColumn(): number;
  getLastRenderedRow(): number;
  getLastRenderedColumn(): number;
  getFirstVisibleRow(): number;
  getFirstVisibleColumn(): number;
  getLastVisibleRow(): number;
  getLastVisibleColumn(): number;
  getFirstPartiallyVisibleRow(): number;
  getFirstPartiallyVisibleColumn(): number;
  getLastPartiallyVisibleRow(): number;
  getLastPartiallyVisibleColumn(): number;
  isRowBeforeRenderedRows(row: number): boolean;
  isRowAfterRenderedRows(row: number): boolean;
  isColumnBeforeRenderedColumns(column: number): boolean;
  isColumnAfterRenderedColumns(column: number): boolean;
  isVisible(): boolean;
  hasDefinedSize(): boolean;
  isAriaEnabled(): boolean;
  tableOffset: { top: number; left: number };
  renderedRowToSource(row: number): number;
  renderedColumnToSource(column: number): number;
  columnFilter: { sourceToRendered(index: number): number; renderedToSource(index: number): number; [key: string]: unknown };
  rowFilter: { sourceToRendered(index: number): number; renderedToSource(index: number): number; [key: string]: unknown };
  getTotalWidth(): number;
  getTotalHeight(): number;
  getWidth(): number;
  getHeight(): number;
  getRowHeight(sourceRow: number): number;
  getColumnWidth(sourceColumn: number): number;
  getColumnHeaderHeight(level: number): number;
  draw(fastDraw?: boolean): unknown;
  alignOverlaysWithTrimmingContainer(): void;
  holderOffset: { top: number; left: number } | number;
  [key: string]: unknown;
}

/**
 * Represents Walkontable viewport.
 */
export interface WtViewport {
  columnsRenderCalculator: ViewportCalculator;
  columnsVisibleCalculator: ViewportCalculator;
  columnsPartiallyVisibleCalculator: ViewportCalculator;
  rowsRenderCalculator: ViewportCalculator;
  rowsVisibleCalculator: ViewportCalculator;
  rowsPartiallyVisibleCalculator: ViewportCalculator;
  getWorkspaceWidth(): number;
  getWorkspaceHeight(): number;
  getViewportWidth(): number;
  getViewportHeight(): number;
  getRowHeaderWidth(): number;
  getColumnHeaderHeight(): number;
  hasOversizedColumnHeadersMarked: Record<string, boolean>;
  oversizedRows: Record<number, number | undefined>;
  oversizedColumnHeaders: Record<number, number | undefined>;
  createCalculators(fastDraw?: boolean): boolean;
  createVisibleCalculators(): void;
  isHorizontallyScrollableByWindow(): boolean;
  isVerticallyScrollableByWindow(): boolean;
  hasVerticalScroll(): boolean;
  hasHorizontalScroll(): boolean;
  getWorkspaceOffset(): { top: number; left: number };
  resetHasOversizedColumnHeadersMarked(): void;
  [key: string]: unknown;
}

/**
 * Represents a viewport calculator result.
 */
export interface ViewportCalculator {
  startRow: number | null;
  endRow: number | null;
  startColumn: number | null;
  endColumn: number | null;
  startPosition: number;
  count: number;
  rowStartOffset: number;
  rowEndOffset: number;
  columnStartOffset: number;
  columnEndOffset: number;
  isVisibleInTrimmingContainer: boolean;
  [key: string]: unknown;
}

/**
 * Represents Walkontable overlays.
 */
export interface WtOverlays {
  topOverlay: OverlayInstance;
  bottomOverlay: OverlayInstance;
  inlineStartOverlay: OverlayInstance;
  topInlineStartCornerOverlay: OverlayInstance;
  bottomInlineStartCornerOverlay: OverlayInstance;
  adjustElementsSize(force?: boolean): void;
  applyToDOM(): void;
  updateMainScrollableElements(): void;
  refreshAll(): void;
  beforeDraw(): void;
  afterDraw(): void;
  refresh(fastDraw?: boolean): void;
  expandHiderVerticallyBy(heightDelta: number): void;
  expandHiderHorizontallyBy(widthDelta: number): void;
  syncOverlayTableClassNames(): void;
  scrollableElement: HTMLElement | Window;
  getParentOverlay(element: HTMLElement): { wtTable: WtTable; wtViewport: WtViewport; [key: string]: unknown } | null;
  destroy(): void;
  [key: string]: unknown;
}

/**
 * Represents an overlay instance.
 */
export interface OverlayInstance {
  clone: WalkontableInstance | null;
  mainTableScrollableElement: HTMLElement | Window;
  needFullRender: boolean;
  type: string;
  getScrollPosition(): number;
  getTableParentOffset(): number;
  trimmingContainer: HTMLElement;
  destroy(): void;
  refresh(fastDraw?: boolean): void;
  applyToDOM(): void;
  adjustElementsSize(): void;
  resetFixedPosition(): boolean;
  holder: HTMLElement | Window;
  getRelativeCellPosition(element: HTMLElement, row: number, col: number): { start: number; top: number };
  getOverlayOffset(): number;
  scrollTo(sourceIndex: number, snapToBottom?: boolean): boolean;
  sumCellSizes(from: number, to: number): number;
  hasRenderingStateChanged(): boolean;
  updateStateOfRendering(phase: string): void;
  updateMainScrollableElement(): void;
  reset(): void;
  onScroll(): void;
  shouldBeRendered(): boolean;
  getRelativeCellPosition(element: HTMLElement, rowIndex: number, columnIndex: number): { top: number; start: number } | undefined;
  [key: string]: unknown;
}

/**
 * Represents DOM bindings.
 */
export interface DomBindings {
  rootDocument: Document;
  rootWindow: Window;
  rootElement: HTMLElement;
  rootTable: HTMLTableElement;
  [key: string]: unknown;
}

/**
 * Represents Walkontable settings.
 */
export interface WtSettings {
  getSetting(key: string, ...args: unknown[]): unknown;
  getSettingPure(key: string): unknown;
  update(key: string, value: unknown): void;
  has(key: string): boolean;
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
  getOrCreateContext(name: string): ShortcutContext;
  setActiveContextName(name: string): void;
  getActiveContextName(): string;
  isCtrlPressed(): boolean;
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
 * Handsontable Core instance interface.
 * Provides type-safe access to the Core API without requiring circular imports.
 */
export interface HotInstance {
  // Lifecycle & hooks
  addHook(name: string, callback: HookCallback | HookCallback[], orderIndex?: number): void;
  addHookOnce(name: string, callback: HookCallback | HookCallback[], orderIndex?: number): void;
  removeHook(name: string, callback: HookCallback): void;
  runHooks(name: string, ...args: unknown[]): unknown;
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
  selectCell(row: number, column: number, endRow?: number, endCol?: number, scrollToCell?: boolean, changeListener?: boolean): boolean;
  selectCells(selectionRanges: unknown[], scrollToCell?: boolean, changeListener?: boolean): boolean;
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
  getData(row?: number, column?: number, row2?: number, column2?: number): unknown[][];
  getDataAtCell(row: number, column: number): unknown;
  getDataAtCol(column: number): unknown[];
  getDataAtRowProp(row: number, prop: string): unknown;
  getSourceData(row?: number, column?: number, row2?: number, column2?: number): unknown[] | object[];
  getSourceDataArray(row?: number, column?: number, row2?: number, column2?: number): unknown[][];
  getSourceDataAtCell(row: number, column: number): unknown;
  getSourceDataAtCol(column: number): unknown[];
  getSourceDataAtRow(row: number): unknown;
  getDataType(rowFrom: number, columnFrom: number, rowTo: number, columnTo: number): string;
  getCopyableData(row: number, column: number): string;
  getCopyableSourceData(row: number, column: number): string;
  setDataAtCell(row: number | unknown[][], column?: number | null, value?: unknown, source?: string): void;
  setSourceDataAtCell(row: number | unknown[][], column?: number | string, value?: unknown, source?: string): void;
  loadData(data: unknown[], source?: string): void;
  updateData(data: unknown[][] | object[], source?: string): void;
  emptySelectedCells(source?: string): void;
  populateFromArray(row: number, column: number, input: unknown[][], endRow?: number, endCol?: number, source?: string, method?: string): object | undefined;

  // Cell meta
  getCellMeta(row: number, column: number, options?: object): Record<string, unknown>;
  getCellMetaAtRow(row: number): Record<string, unknown>[];
  setCellMeta(row: number, column: number, key: string, value: unknown): void;
  setCellMetaObject(row: number, column: number, prop: Record<string, unknown>): void;
  removeCellMeta(row: number, column: number, key: string): void;
  spliceCellsMeta(visualIndex: number, deleteAmount?: number, ...cellMetaRows: unknown[]): void;
  getCellsMeta(): Record<string, unknown>[];
  getColumnMeta(column: number): Record<string, unknown>;
  getCellRenderer(rowOrMeta: number | Record<string, unknown>, column?: number): Function;
  getCellEditor(rowOrMeta: number | Record<string, unknown>, column?: number): Function;
  getCellValidator(rowOrMeta: number | Record<string, unknown>, column?: number): Function | RegExp | undefined;
  validateCell(value: unknown, cellProperties: Record<string, unknown>, callback: Function, source?: string): void;

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
  batchRender(wrappedOperations: Function): unknown;
  batchExecution(wrappedOperations: Function, forceFlushChanges?: boolean): unknown;
  batch(wrappedOperations: Function): unknown;
  refreshDimensions(): void;
  isRenderSuspended(): boolean;
  scrollViewportTo(options: { row?: number; col?: number; horizontalSnap?: string; verticalSnap?: string; considerHiddenIndexes?: boolean } | number, ...args: unknown[]): boolean;
  scrollToFocusedCell(callback?: Function): void;

  // View
  view: ViewInstance;
  getCell(row: number, column: number, topmost?: boolean): HTMLTableCellElement | null;
  getCoords(element: HTMLElement): CellCoords | null;
  getFirstFullyVisibleRow(): number;
  getFirstFullyVisibleColumn(): number;
  getLastFullyVisibleRow(): number;
  getLastFullyVisibleColumn(): number;
  getFirstRenderedVisibleRow(): number;
  getFirstRenderedVisibleColumn(): number;
  getLastRenderedVisibleRow(): number;
  getLastRenderedVisibleColumn(): number;

  // Coordinates factory
  _createCellCoords(row: number, column: number): CellCoords;
  _createCellRange(highlight: CellCoords, from?: CellCoords, to?: CellCoords): CellRange;

  // Undo/Redo
  undo(): void;
  redo(): void;
  clearUndo(): void;
  isUndoAvailable(): boolean;
  isRedoAvailable(): boolean;
  undoRedo: object;

  // Plugins
  getPlugin(pluginName: string): any; // eslint-disable-line @typescript-eslint/no-explicit-any
  getPluginName(plugin: object): string;

  // Managers
  getShortcutManager(): ShortcutManager;
  getFocusManager(): FocusManagerInstance;
  getFocusScopeManager(): FocusScopeManagerInstance;
  _getEditorManager(): EditorManagerInstance;

  // DOM references
  rootElement: HTMLElement;
  rootDocument: Document;
  rootWindow: Window & typeof globalThis;
  rootPortalElement: HTMLElement;
  rootGridElement: HTMLElement;
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
  getActiveEditor(): Record<string, unknown>;
  destroyEditor(revertOriginal?: boolean, prepareEditorAfterDestroy?: boolean): void;
  dataType: string;
  getTableHeight(): number;
  getTableWidth(): number;
  getValue(): unknown;

  // Styles
  stylesHandler: StylesHandler;

  // Internal
  _registerTimeout(callback: Function | ReturnType<typeof setTimeout>, delay?: number): void;
  _registerImmediate(handle: Function): void;

  // Lifecycle
  init(): void;
  destroy(): void;
  constructor: Function;

  // Allow additional properties
  [key: string]: unknown;
}

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
 * Interface for DataAccessObject used in Walkontable.
 */
export interface DataAccessObject {
  wot: WalkontableInstance;
  wtTable: WtTable;
  wtViewport: WtViewport;
  wtOverlays: WtOverlays;
  domBindings: DomBindings;
  cloneSource: WalkontableInstance;
  selectionManager: WotSelectionManager;
  drawn: boolean;
  parentTableOffset: { top: number; left: number } | number;
  topOverlayTrimmingContainer: HTMLElement | Window;
  inlineStartOverlayTrimmingContainer: HTMLElement | Window;
  topScrollPosition: number;
  topParentOffset: number;
  inlineStartScrollPosition: number;
  inlineStartParentOffset: number;
  topOverlay: OverlayInstance;
  bottomOverlay: OverlayInstance;
  inlineStartOverlay: OverlayInstance;
  workspaceWidth: number;
  [key: string]: unknown;
}

/**
 * Scroll data access object.
 */
export interface ScrollDao {
  drawn: boolean;
  topOverlay: OverlayInstance;
  inlineStartOverlay: OverlayInstance;
  wtTable: WtTable;
  wtViewport: WtViewport;
  wtSettings: WtSettings;
  rootWindow: Window & typeof globalThis;
  totalRows: number;
  totalColumns: number;
  fixedRowsTop: number;
  fixedRowsBottom: number;
  fixedColumnsStart: number;
  [key: string]: unknown;
}

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
  activateScope(scopeId: string): void;
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
  getActiveEditor(): {
    isInFullEditMode: () => boolean;
    state: string;
    focus: () => void;
    refreshValue?: () => void;
    _closeAfterDataChange?: boolean;
    isOpened?: () => boolean;
    isWaiting?: () => boolean;
  } | undefined;
  activeEditor: {
    focus: () => void;
    refreshValue?: () => void;
    _closeAfterDataChange?: boolean;
    isOpened?: () => boolean;
    isWaiting?: () => boolean;
  } | undefined;
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

/**
 * Represents the Grid helper used in Core.
 */
export interface GridHelperInstance {
  alter(action: string, index?: number | number[][], amount?: number, source?: string, keepEmptyRows?: boolean): void;
  populateFromArray(start: CellCoords, input: unknown[][], end?: CellCoords, source?: string, method?: string, direction?: string, deltas?: unknown[]): object | undefined;
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

/**
 * Represents a border position settings (top, start, bottom, end, corner).
 */
export interface BorderPositionSettings {
  hide?: boolean;
  color?: string;
  width?: number;
  style?: string;
  [key: string]: unknown;
}

/**
 * Represents border instance settings passed to the Border constructor.
 */
export interface BorderInstanceSettings {
  border?: {
    width?: number;
    color?: string;
    cornerVisible?: boolean | ((...args: unknown[]) => boolean);
    style?: string;
    [key: string]: unknown;
  };
  className?: string;
  layerLevel?: number;
  top?: BorderPositionSettings;
  start?: BorderPositionSettings;
  bottom?: BorderPositionSettings;
  end?: BorderPositionSettings;
  corner?: BorderPositionSettings;
  [key: string]: unknown;
}

/**
 * Represents the corner default style object.
 */
export interface CornerDefaultStyle {
  width: number | string;
  height: number | string;
  borderWidth: number | string;
  borderStyle: string;
  borderColor: string;
  [key: string]: unknown;
}

/**
 * Represents the selection handles for mobile border selection.
 */
export interface SelectionHandles {
  top: HTMLDivElement;
  topHitArea: HTMLDivElement;
  bottom: HTMLDivElement;
  bottomHitArea: HTMLDivElement;
  styles: {
    top: CSSStyleDeclaration;
    topHitArea: CSSStyleDeclaration;
    bottom: CSSStyleDeclaration;
    bottomHitArea: CSSStyleDeclaration;
    [key: string]: CSSStyleDeclaration;
  };
  [key: string]: unknown;
}

/**
 * Represents CSS-like style properties.
 */
export interface BorderSettings {
  width?: number;
  color?: string;
  cornerVisible?: boolean | Function;
  hide?: boolean;
  className?: string;
  [key: string]: unknown;
}
