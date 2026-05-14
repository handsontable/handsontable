/**
 * Common interfaces used across the Handsontable codebase.
 * These interfaces provide type-safe access to Core and Walkontable instances
 * without requiring circular imports.
 */

import { IndexMapper } from './translations';
import type { HookCallback } from './core/hooks/bucket';
import type { CellCoords as WalkontableCellCoords, CellRange as WalkontableCellRange } from './3rdparty/walkontable/src';
import type { CellChange, ChangeSource, RowObject, CellValue } from './settings';
import type { ColumnConditions } from './plugins/filters';
import type { PredefinedMenuItemKey, MenuItemConfig, ContextMenu } from './plugins/contextMenu';
import type { DropdownMenu } from './plugins/dropdownMenu';
import type { ColumnSortingConfig } from './plugins/columnSorting';
import type { UndoRedoAction } from './plugins/undoRedo';
import type { DataProviderBeforeFetchParameters, DataProviderQueryParameters, DataProviderFetchResult, RowMutationPayload, DataProvider, DataProviderConfig } from './plugins/dataProvider';
import type { BasePlugin } from './plugins/base';
import type { PluginTypeMap } from './plugins/types';

/**
 * Grid settings interface representing all possible Handsontable configuration options.
 * Derived from the metaSchema factory in dataMap/metaManager/metaSchema.ts.
 */
export interface GridSettings {
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
  comments?: boolean | object | object[];
  contextMenu?: boolean | object | string[];
  customBorders?: boolean | object[];
  dialog?: boolean | object;
  dataProvider?: DataProviderConfig;
  dragToScroll?: boolean | { interval?: { min?: number; max?: number }; rampDistance?: number };
  dropdownMenu?: boolean | object | string[];
  emptyDataState?: boolean | object;
  filters?: boolean | object;
  formulas?: boolean | { engine: unknown; sheetName?: string; [key: string]: unknown };
  hiddenColumns?: boolean | object;
  hiddenRows?: boolean | object;
  loading?: boolean | object;
  manualColumnFreeze?: boolean;
  manualColumnMove?: boolean | number[];
  manualColumnResize?: boolean | number[];
  manualRowMove?: boolean | number[];
  manualRowResize?: boolean | number[];
  mergeCells?: boolean | object | object[];
  nestedHeaders?: unknown[][];
  nestedRows?: boolean;
  pagination?: boolean | object;
  search?: boolean | object;
  trimRows?: boolean | number[];

  // Checkbox
  checkedTemplate?: unknown;
  uncheckedTemplate?: unknown;

  // Date
  correctFormat?: boolean;
  dateFormat?: string | Intl.DateTimeFormatOptions;
  datePickerConfig?: {
    firstDay?: number;
    showWeekNumber?: boolean;
    numberOfMonths?: number;
    disableDayFn?: (date: Date) => boolean;
    [key: string]: unknown;
  };
  defaultDate?: string;

  // Password
  hashLength?: number;
  hashRevealDelay?: number;
  hashSymbol?: string;

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

  // Empty checks
  isEmptyCol?: (col: number) => boolean;
  isEmptyRow?: (row: number) => boolean;

  // Layout
  ariaTags?: boolean;
  layoutDirection?: 'inherit' | 'ltr' | 'rtl';
  licenseKey?: string;
  preventOverflow?: boolean | string;
  preventWheel?: boolean;

  // State
  initialState?: Record<string, unknown>;

  // Hook callbacks
  afterAddChild?: (parent: RowObject, element: RowObject | undefined, index: number | undefined) => void;
  afterAutofill?: (fillData: CellValue[][], sourceRange: WalkontableCellRange, targetRange: WalkontableCellRange, direction: 'up' | 'down' | 'left' | 'right') => void;
  afterBeginEditing?: (row: number, column: number) => void;
  afterCellMetaReset?: () => void;
  afterChange?: (changes: CellChange[] | null, source: ChangeSource) => void;
  afterChangesObserved?: () => void;
  afterColumnCollapse?: (currentCollapsedColumns: number[], destinationCollapsedColumns: number[], collapsePossible: boolean, successfullyCollapsed: boolean) => void;
  afterColumnExpand?: (currentCollapsedColumns: number[], destinationCollapsedColumns: number[], expandPossible: boolean, successfullyExpanded: boolean) => void;
  afterColumnFreeze?: (columnIndex: number, isFreezingPerformed: boolean) => void;
  afterColumnMove?: (movedColumns: number[], finalIndex: number, dropIndex: number | undefined, movePossible: boolean, orderChanged: boolean) => void;
  afterColumnResize?: (newSize: number, column: number, isDoubleClick: boolean) => void;
  afterColumnSequenceChange?: (source: ChangeSource) => void;
  afterColumnSequenceCacheUpdate?: (indexesChangesState: { indexesSequenceChanged: boolean; trimmedIndexesChanged: boolean; hiddenIndexesChanged: boolean }) => void;
  afterColumnSort?: (currentSortConfig: ColumnSortingConfig[], destinationSortConfigs: ColumnSortingConfig[]) => void;
  afterColumnUnfreeze?: (columnIndex: number, isFreezingPerformed: boolean) => void;
  afterContextMenuDefaultOptions?: (predefinedItems: Array<PredefinedMenuItemKey | MenuItemConfig>) => void;
  afterContextMenuHide?: (context: ContextMenu) => void;
  afterContextMenuShow?: (context: ContextMenu) => void;
  afterCopy?: (data: CellValue[][], coords: RangeType[], copiedHeadersCount: { columnHeadersCount: number }) => void;
  afterCopyLimit?: (selectedRows: number, selectedColumns: number, copyRowsLimit: number, copyColumnsLimit: number) => void;
  afterCreateCol?: (index: number, amount: number, source?: ChangeSource) => void;
  afterCreateRow?: (index: number, amount: number, source?: ChangeSource) => void;
  afterCut?: (data: CellValue[][], coords: RangeType[]) => void;
  afterDeselect?: () => void;
  afterDestroy?: () => void;
  afterDetachChild?: (parent: RowObject, element: RowObject) => void;
  afterDialogFocus?: (focusSource: 'tab_from_above' | 'tab_from_below' | 'click' | 'show') => void;
  afterDialogHide?: () => void;
  afterDialogShow?: () => void;
  afterDocumentKeyDown?: (event: KeyboardEvent) => void;
  afterDrawSelection?: (currentRow: number, currentColumn: number, cornersOfSelection: number[], layerLevel?: number) => string | void;
  afterDropdownMenuDefaultOptions?: (predefinedItems: Array<PredefinedMenuItemKey | MenuItemConfig>) => void;
  afterDropdownMenuHide?: (instance: DropdownMenu) => void;
  afterDropdownMenuShow?: (instance: DropdownMenu) => void;
  afterEmptyDataStateHide?: () => void;
  afterEmptyDataStateShow?: () => void;
  afterFilter?: (conditionsStack: ColumnConditions[]) => void;
  afterFormulasValuesUpdate?: (changes: unknown[]) => void;
  afterGetCellMeta?: (row: number, column: number, cellProperties: Record<string, unknown>) => void;
  afterGetColHeader?: (column: number, TH: HTMLTableHeaderCellElement, headerLevel: number) => void;
  afterGetColumnHeaderRenderers?: (renderers: Array<(...args: unknown[]) => unknown>) => void;
  afterGetRowHeader?: (row: number, TH: HTMLTableHeaderCellElement) => void;
  afterGetRowHeaderRenderers?: (renderers: Array<(...args: unknown[]) => unknown>) => void;
  afterHideColumns?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
  afterHideRows?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
  afterInit?: () => void;
  afterLanguageChange?: (languageCode: string) => void;
  afterListen?: () => void;
  afterLoadData?: (sourceData: unknown[], initialLoad: boolean, source: ChangeSource | undefined) => void;
  afterLoadingHide?: () => void;
  afterLoadingShow?: () => void;
  afterMergeCells?: (cellRange: WalkontableCellRange, mergeParent: { row: number; col: number; rowspan: number; colspan: number }, auto: boolean) => void;
  afterModifyTransformEnd?: (coords: WalkontableCellCoords, rowTransformDir: number, colTransformDir: number) => void;
  afterModifyTransformFocus?: (coords: WalkontableCellCoords, rowTransformDir: number, colTransformDir: number) => void;
  afterModifyTransformStart?: (coords: WalkontableCellCoords, rowTransformDir: number, colTransformDir: number) => void;
  afterMomentumScroll?: () => void;
  afterNamedExpressionAdded?: (namedExpressionName: string, changes: unknown[]) => void;
  afterNamedExpressionRemoved?: (namedExpressionName: string, changes: unknown[]) => void;
  afterNotificationHide?: (id: string) => void;
  afterNotificationShow?: (id: string, options: { id: string; variant: 'info' | 'success' | 'warning' | 'error'; duration: number; position: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'; closable: boolean; actions: Array<{ label: string; type?: 'primary' | 'secondary'; callback: () => void }>; title?: string; message?: string | HTMLElement }) => void;
  afterOnCellContextMenu?: (event: MouseEvent, coords: WalkontableCellCoords, TD: HTMLTableCellElement) => void;
  afterOnCellCornerDblClick?: (event: MouseEvent) => void;
  afterOnCellCornerMouseDown?: (event: MouseEvent) => void;
  afterOnCellMouseDown?: (event: MouseEvent, coords: WalkontableCellCoords, TD: HTMLTableCellElement) => void;
  afterOnCellMouseOut?: (event: MouseEvent, coords: WalkontableCellCoords, TD: HTMLTableCellElement) => void;
  afterOnCellMouseOver?: (event: MouseEvent, coords: WalkontableCellCoords, TD: HTMLTableCellElement) => void;
  afterOnCellMouseUp?: (event: MouseEvent, coords: WalkontableCellCoords, TD: HTMLTableCellElement) => void;
  afterPageChange?: (oldPage: number, newPage: number) => void;
  afterPageCounterVisibilityChange?: (isVisible: boolean) => void;
  afterPageNavigationVisibilityChange?: (isVisible: boolean) => void;
  afterPageSizeChange?: (oldPageSize: number | 'auto', newPageSize: number | 'auto') => void;
  afterPageSizeVisibilityChange?: (isVisible: boolean) => void;
  afterPaste?: (data: CellValue[][], coords: RangeType[]) => void;
  afterPluginsInitialized?: () => void;
  afterRedo?: (action: UndoRedoAction) => void;
  afterRedoStackChange?: (undoneActionsBefore: UndoRedoAction[], undoneActionsAfter: UndoRedoAction[]) => void;
  afterRefreshDimensions?: (previousDimensions: { width: number; height: number }, currentDimensions: { width: number; height: number }, stateChanged: boolean) => void;
  afterRemoveCellMeta?: (row: number, column: number, key: string, value: unknown) => void;
  afterRemoveCol?: (index: number, amount: number, physicalColumns: number[], source?: ChangeSource) => void;
  afterRemoveRow?: (index: number, amount: number, physicalRows: number[], source?: ChangeSource) => void;
  afterRender?: (isForced: boolean) => void;
  afterRenderer?: (TD: HTMLTableCellElement, row: number, column: number, prop: string | number, value: CellValue, cellProperties: Record<string, unknown>) => void;
  afterRowMove?: (movedRows: number[], finalIndex: number, dropIndex: number | undefined, movePossible: boolean, orderChanged: boolean) => void;
  afterRowResize?: (newSize: number, row: number, isDoubleClick: boolean) => void;
  afterRowSequenceChange?: (source: ChangeSource) => void;
  afterRowSequenceCacheUpdate?: (indexesChangesState: { indexesSequenceChanged: boolean; trimmedIndexesChanged: boolean; hiddenIndexesChanged: boolean }) => void;
  afterRowsMutation?: (operation: string, payload: RowMutationPayload) => void;
  afterRowsMutationError?: (operation: string, error: Error, payload: RowMutationPayload) => void;
  afterScroll?: () => void;
  afterScrollHorizontally?: () => void;
  afterScrollVertically?: () => void;
  afterSelectAll?: (from: WalkontableCellCoords, to: WalkontableCellCoords, highlight?: WalkontableCellCoords) => void;
  afterSelectColumns?: (from: WalkontableCellCoords, to: WalkontableCellCoords, highlight: WalkontableCellCoords) => void;
  afterSelection?: (row: number, column: number, row2: number, column2: number, preventScrolling: { value: boolean }, selectionLayerLevel: number) => void;
  afterSelectionByProp?: (row: number, prop: string, row2: number, prop2: string, preventScrolling: { value: boolean }, selectionLayerLevel: number) => void;
  afterSelectionEnd?: (row: number, column: number, row2: number, column2: number, selectionLayerLevel: number) => void;
  afterSelectionEndByProp?: (row: number, prop: string, row2: number, prop2: string, selectionLayerLevel: number) => void;
  afterSelectionFocusSet?: (row: number, column: number, preventScrolling: { value: boolean }) => void;
  afterSelectRows?: (from: WalkontableCellCoords, to: WalkontableCellCoords, highlight: WalkontableCellCoords) => void;
  afterSetCellMeta?: (row: number, column: number, key: string, value: unknown) => void;
  afterSetDataAtCell?: (changes: CellChange[], source?: ChangeSource) => void;
  afterSetDataAtRowProp?: (changes: CellChange[], source?: ChangeSource) => void;
  afterSetSourceDataAtCell?: (changes: CellChange[], source?: ChangeSource) => void;
  afterSetTheme?: (themeName: string | boolean | undefined, firstRun: boolean) => void;
  afterSheetAdded?: (addedSheetDisplayName: string) => void;
  afterSheetRemoved?: (removedSheetDisplayName: string, changes: unknown[]) => void;
  afterSheetRenamed?: (oldDisplayName: string, newDisplayName: string) => void;
  afterTrimRow?: (currentTrimConfig: number[], destinationTrimConfig?: number[], actionPossible?: boolean, stateChanged?: boolean) => void;
  afterUndo?: (action: UndoRedoAction) => void;
  afterUndoStackChange?: (doneActionsBefore: UndoRedoAction[], doneActionsAfter: UndoRedoAction[]) => void;
  afterUnhideColumns?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
  afterUnhideRows?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
  afterUnlisten?: () => void;
  afterUnmergeCells?: (cellRange: WalkontableCellRange, auto: boolean) => void;
  afterUntrimRow?: (currentTrimConfig: number[], destinationTrimConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
  afterUpdateData?: (sourceData: unknown[], initialLoad: boolean, source: ChangeSource | undefined) => void;
  afterUpdateSettings?: (newSettings: Partial<GridSettings>) => void;
  afterValidate?: (isValid: boolean, value: CellValue, row: number, prop: string | number, source: ChangeSource) => void | boolean;
  afterDataProviderFetch?: (result: DataProviderFetchResult) => void;
  afterDataProviderFetchAbort?: (queryParameters: DataProviderQueryParameters, reason?: Error) => void;
  afterDataProviderFetchError?: (error: Error, queryParameters: DataProviderQueryParameters) => void;
  afterViewportColumnCalculatorOverride?: (calc: { startColumn: number; endColumn: number; [key: string]: unknown }) => void;
  afterViewportRowCalculatorOverride?: (calc: { startRow: number; endRow: number; [key: string]: unknown }) => void;
  afterViewRender?: (isForced: boolean) => void;
  beforeAddChild?: (parent: RowObject, element?: RowObject, index?: number) => void;
  beforeAlter?: (action: string, index: number | Array<[number, number]>, amount: number, source?: ChangeSource, keepEmptyRows?: boolean) => boolean | void;
  beforeAutofill?: (selectionData: CellValue[][], sourceRange: WalkontableCellRange, targetRange: WalkontableCellRange, direction: 'up' | 'down' | 'left' | 'right') => CellValue[][] | void;
  beforeBeginEditing?: (row: number, column: number, initialValue: CellValue, event: { preventDefault(): void; [key: string]: unknown }, fullEditMode: boolean) => boolean | void;
  beforeCellAlignment?: (stateBefore: Record<string, string>, range: WalkontableCellRange[], type: string, alignmentClass: string) => void;
  beforeChange?: (changes: (CellChange | null)[], source: ChangeSource) => void | boolean;
  beforeChangeRender?: (changes: CellChange[], source: ChangeSource) => void;
  beforeColumnCollapse?: (currentCollapsedColumn: number[], destinationCollapsedColumns: number[], collapsePossible: boolean) => void | boolean;
  beforeColumnExpand?: (currentCollapsedColumn: number[], destinationCollapsedColumns: number[], expandPossible: boolean) => void | boolean;
  beforeColumnFreeze?: (columnIndex: number, isFreezingPerformed: boolean) => void | boolean;
  beforeColumnMove?: (movedColumns: number[], finalIndex: number, dropIndex: number | undefined, movePossible: boolean) => void | boolean;
  beforeColumnResize?: (newSize: number, column: number, isDoubleClick: boolean) => void | number;
  beforeColumnSort?: (currentSortConfig: ColumnSortingConfig[], destinationSortConfigs: ColumnSortingConfig[]) => void | boolean;
  beforeColumnUnfreeze?: (columnIndex: number, isUnfreezingPerformed: boolean) => void | boolean;
  beforeColumnWrap?: (isActionInterrupted: { value: boolean }, newCoords: WalkontableCellCoords, isColumnFlipped: boolean) => void;
  beforeCompositionStart?: (event: CompositionEvent) => void;
  beforeContextMenuSetItems?: (menuItems: Array<PredefinedMenuItemKey | MenuItemConfig>) => void;
  beforeContextMenuShow?: (context: ContextMenu) => void;
  beforeCopy?: (data: CellValue[][], coords: RangeType[], copiedHeadersCount: { columnHeadersCount: number }) => void | boolean;
  beforeCreateCol?: (index: number, amount: number, source?: ChangeSource) => void | boolean;
  beforeCreateRow?: (index: number, amount: number, source?: ChangeSource) => void | boolean;
  beforeCut?: (data: CellValue[][], coords: RangeType[]) => void | boolean;
  beforeDataProviderFetch?: (queryParameters: DataProviderBeforeFetchParameters) => boolean | void;
  beforeDetachChild?: (parent: RowObject, element: RowObject) => void;
  beforeDialogHide?: () => void;
  beforeDialogShow?: () => void;
  beforeDrawBorders?: (corners: number[], borderClassName: string | undefined) => void;
  beforeDropdownMenuSetItems?: (menuItems: any[]) => void;
  beforeDropdownMenuShow?: (instance: any) => void;
  beforeEmptyDataStateHide?: () => void;
  beforeEmptyDataStateShow?: () => void;
  beforeFilter?: (conditionsStack: ColumnConditions[], previousConditionsStack: ColumnConditions[]) => void | boolean;
  beforeGetCellMeta?: (row: number, column: number, cellProperties: Record<string, unknown>) => void;
  beforeHeightChange?: (height: number | string) => number | string;
  beforeHideColumns?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean) => void | boolean;
  beforeHideRows?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean) => void | boolean;
  beforeHighlightingColumnHeader?: (column: number, headerLevel: number, highlightMeta: { selectionType: string; columnCursor: number; selectionWidth: number }) => number | void;
  beforeHighlightingRowHeader?: (row: number, headerLevel: number, highlightMeta: { selectionType: string; rowCursor: number; selectionHeight: number }) => number | void;
  beforeInit?: () => void;
  beforeInitWalkontable?: (walkontableConfig: object) => void;
  beforeKeyDown?: (event: KeyboardEvent) => void;
  beforeLanguageChange?: (languageCode: string) => void;
  beforeLoadData?: (sourceData: unknown[], initialLoad: boolean, source: ChangeSource | undefined) => void;
  beforeLoadingHide?: () => boolean | void;
  beforeLoadingShow?: () => boolean | void;
  beforeMergeCells?: (cellRange: WalkontableCellRange, auto: boolean) => void;
  beforeNotificationHide?: (id: string) => boolean | void;
  beforeNotificationShow?: (options: { id: string; variant: 'info' | 'success' | 'warning' | 'error'; duration: number; position: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'; closable: boolean; actions: Array<{ label: string; type?: 'primary' | 'secondary'; callback: () => void }>; title?: string; message?: string | HTMLElement }) => boolean | void;
  beforeOnCellContextMenu?: (event: MouseEvent, coords: WalkontableCellCoords, TD: HTMLTableCellElement) => void;
  beforeOnCellMouseDown?: (event: MouseEvent, coords: WalkontableCellCoords, TD: HTMLTableCellElement, controller: { preventDefault: boolean }) => void;
  beforeOnCellMouseOut?: (event: MouseEvent, coords: WalkontableCellCoords, TD: HTMLTableCellElement) => void;
  beforeOnCellMouseOver?: (event: MouseEvent, coords: WalkontableCellCoords, TD: HTMLTableCellElement, controller: { preventDefault: boolean }) => void;
  beforeOnCellMouseUp?: (event: MouseEvent, coords: WalkontableCellCoords, TD: HTMLTableCellElement) => void;
  beforePageChange?: (oldPage: number, newPage: number) => void | boolean;
  beforePageSizeChange?: (oldPageSize: number | 'auto', newPageSize: number | 'auto') => void | boolean;
  beforePaste?: (data: CellValue[][], coords: RangeType[]) => void | boolean;
  beforeRedo?: (action: UndoRedoAction) => void;
  beforeRedoStackChange?: (undoneActions: UndoRedoAction[]) => void;
  beforeRefreshDimensions?: (previousDimensions: { width: number; height: number }, currentDimensions: { width: number; height: number }, actionPossible: boolean) => boolean | void;
  beforeRemoveCellClassNames?: () => string[] | void;
  beforeRemoveCellMeta?: (row: number, column: number, key: string, value: unknown) => void;
  beforeRemoveCol?: (index: number, amount: number, physicalColumns: number[], source?: ChangeSource) => void;
  beforeRemoveRow?: (index: number, amount: number, physicalRows: number[], source?: ChangeSource) => void;
  beforeRender?: (isForced: boolean) => void;
  beforeRenderer?: (TD: HTMLTableCellElement, row: number, column: number, prop: string | number, value: CellValue, cellProperties: Record<string, unknown>) => void;
  beforeRowMove?: (movedRows: number[], finalIndex: number, dropIndex: number | undefined, movePossible: boolean) => void | boolean;
  beforeRowResize?: (newSize: number, row: number, isDoubleClick: boolean) => number | void;
  beforeRowsMutation?: (operation: string, payload: RowMutationPayload) => void | boolean;
  beforeRowWrap?: (isActionInterrupted: { value: boolean }, newCoords: WalkontableCellCoords, isRowFlipped: boolean) => void;
  beforeSelectAll?: (from: WalkontableCellCoords, to: WalkontableCellCoords, highlight?: WalkontableCellCoords) => void;
  beforeSelectColumns?: (from: WalkontableCellCoords, to: WalkontableCellCoords, highlight: WalkontableCellCoords) => void;
  beforeSelectionFocusSet?: (coords: WalkontableCellCoords) => void;
  beforeSelectionHighlightSet?: () => void;
  beforeSelectRows?: (from: WalkontableCellCoords, to: WalkontableCellCoords, highlight: WalkontableCellCoords) => void;
  beforeSetCellMeta?: (row: number, column: number, key: string, value: unknown) => boolean | void;
  beforeSetRangeEnd?: (coords: WalkontableCellCoords) => void;
  beforeSetRangeStart?: (coords: WalkontableCellCoords) => void;
  beforeSetRangeStartOnly?: (coords: WalkontableCellCoords) => void;
  beforeStretchingColumnWidth?: (stretchedWidth: number, column: number) => void | number;
  beforeTouchScroll?: () => void;
  beforeTrimRow?: (currentTrimConfig: number[], destinationTrimConfig: number[], actionPossible: boolean) => void | boolean;
  beforeUndo?: (action: UndoRedoAction) => void;
  beforeUndoStackChange?: (doneActions: UndoRedoAction[], source?: string) => void;
  beforeUnhideColumns?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean) => void | boolean;
  beforeUnhideRows?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean) => void | boolean;
  beforeUnmergeCells?: (cellRange: WalkontableCellRange, auto: boolean) => void;
  beforeUntrimRow?: (currentTrimConfig: number[], destinationTrimConfig: number[], actionPossible: boolean) => void | boolean;
  beforeUpdateData?: (sourceData: unknown[], initialLoad: boolean, source: ChangeSource | undefined) => void;
  beforeValidate?: (value: CellValue, row: number, prop: string | number, source?: ChangeSource) => void;
  beforeValueRender?: (value: CellValue, cellProperties: Record<string, unknown>) => void;
  beforeViewportScroll?: () => void;
  beforeViewportScrollHorizontally?: (visualColumn: number, snapping: 'auto' | 'start' | 'end') => number | boolean | null;
  beforeViewportScrollVertically?: (visualRow: number, snapping: 'auto' | 'top' | 'bottom') => number | boolean | null;
  beforeViewRender?: (isForced: boolean, skipRender: { skipRender?: boolean }) => void;
  beforeWidthChange?: (width: number | string) => number | string;
  construct?: () => void;
  dialogFocusNextElement?: () => void;
  dialogFocusPreviousElement?: () => void;
  hasExternalDataSource?: () => boolean | void;
  init?: () => void;
  modifyAutoColumnSizeSeed?: (seed: string, cellProperties: Record<string, unknown>, cellValue: CellValue) => string | void;
  modifyAutofillRange?: (entireArea: [number, number, number, number], startArea: [number, number, number, number]) => [number, number, number, number] | void;
  modifyColHeader?: (column: number) => void;
  modifyColumnHeaderHeight?: () => void;
  modifyColumnHeaderValue?: (headerValue: string, visualColumnIndex: number, headerLevel: number) => void | string;
  modifyColWidth?: (width: number, column: number, source?: string) => void | number;
  modifyCopyableRange?: (copyableRanges: RangeType[]) => void;
  modifyData?: (row: number, column: number, valueHolder: { value: CellValue }, ioMode: 'get' | 'set') => void;
  modifyFiltersMultiSelectValue?: (value: string, meta: Record<string, unknown>) => void | string;
  modifyFocusedElement?: (row: number, column: number, focusedElement: HTMLElement) => void | HTMLElement;
  modifyFocusOnTabNavigation?: (tabActivationDir: string, visualCoords: WalkontableCellCoords) => void;
  modifyGetCellCoords?: (row: number, column: number, topmost: boolean, source: string | undefined) => void | [number, number] | [number, number, number, number];
  modifyGetCoordsElement?: (row: number, column: number) => void | [number, number];
  modifyRowData?: (row: number) => void;
  modifyRowHeader?: (row: number) => void;
  modifyRowHeaderWidth?: (rowHeaderWidth: number) => void | number;
  modifyRowHeight?: (height: number, row: number, source?: string) => void | number;
  modifyRowHeightByOverlayName?: (height: number, row: number, overlayType: string) => void | number;
  modifySourceData?: (row: number, column: number, valueHolder: { value: CellValue }, ioMode: 'get' | 'set') => void;
  modifyTransformEnd?: (delta: WalkontableCellCoords) => void;
  modifyTransformFocus?: (delta: WalkontableCellCoords) => void;
  modifyTransformStart?: (delta: WalkontableCellCoords) => void;

  // Allow additional plugin-specific keys
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Extracts all hook callback keys from GridSettings.
 * Used to derive the Events type for addHook/removeHook generics.
 */
type HookKey = { [K in keyof GridSettings]-?: NonNullable<GridSettings[K]> extends (...args: any[]) => any ? K : never }[keyof GridSettings]; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Map of all Handsontable hook names to their typed callback signatures.
 * Use with addHook/addHookOnce/removeHook for IDE autocomplete and compile-time safety.
 */
export type Events = Required<Pick<GridSettings, HookKey>>;

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
 * Overlay type names used by Walkontable.
 */
export type OverlayType = 'inline_start' | 'top' | 'top_inline_start_corner' | 'bottom' |
  'bottom_inline_start_corner' | 'master';

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
  getCell(coords: CellCoords, topmost?: boolean): HTMLTableCellElement | number;
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
  invalidateColumnWidthCache(): void;
  invalidateRowHeightCache(): void;
  rowHeightCache: { ensureBuilt(): void; invalidate(): void };
  columnWidthCache: { ensureBuilt(): void; invalidate(): void };
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
  setDataAtCell(row: number | unknown[][], column?: number | null, value?: unknown, source?: string): void;
  setDataAtRowProp(row: number | unknown[][], prop?: string | number, value?: unknown, source?: string): void;
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
  suspendRender(): void;
  resumeRender(): void;
  validateCells(callback?: (valid: boolean) => void): void;
  validateRows(rows: number[], callback?: (valid: boolean) => void): void;
  validateColumns(columns: number[], callback?: (valid: boolean) => void): void;
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
  getFirstPartiallyVisibleRow(): number;
  getFirstPartiallyVisibleColumn(): number;
  getLastPartiallyVisibleRow(): number;
  getLastPartiallyVisibleColumn(): number;
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
  getPlugin<K extends keyof PluginTypeMap>(pluginName: K): PluginTypeMap[K];
  getPlugin(pluginName: string): BasePlugin;
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
  getActiveEditor(): BaseEditorInstance | undefined;
  destroyEditor(revertOriginal?: boolean, prepareEditorAfterDestroy?: boolean): void;
  dataType: string;
  getTableHeight(): number;
  getTableWidth(): number;
  getValue(): unknown;

  // Styles
  stylesHandler: StylesHandler;

  // Internal
  _registerTimeout(callback: Function | ReturnType<typeof setTimeout>, delay?: number): ReturnType<typeof setTimeout>;
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

