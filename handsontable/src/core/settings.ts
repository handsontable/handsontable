/**
 * GridSettings interface and Events type — the central Handsontable configuration contract.
 * Moved here from common.ts as part of the common.ts decomposition.
 */

import type {
  CellCoords as WalkontableCellCoords,
  CellRange as WalkontableCellRange,
} from '../3rdparty/walkontable/src';
import type { CellChange, ChangeSource, RowObject, CellValue, CellProperties, ColumnSettings } from '../settings';
import type { ColumnConditions } from '../plugins/filters';
import type { PredefinedMenuItemKey, MenuItemConfig, ContextMenu } from '../plugins/contextMenu';
import type { DropdownMenu } from '../plugins/dropdownMenu';
import type { ColumnSortingConfig } from '../plugins/columnSorting';
import type { UndoRedoAction } from '../plugins/undoRedo';
import type {
  DataProviderBeforeFetchParameters,
  DataProviderQueryParameters,
  DataProviderFetchResult,
  RowMutationPayload,
  DataProviderConfig,
} from '../plugins/dataProvider';
import type { RangeType, HotInstance } from './types';

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
  dataSchema?: object | ((rowIndex: number) => Record<string, unknown>);
  dataDotNotation?: boolean;
  columns?: ColumnSettings[] | ((column: number) => ColumnSettings);
  cell?: object[];
  cells?: (row: number, column: number, prop: string | number) => object;
  source?: unknown[] | ((query: string, callback: (items: unknown[]) => void) => void);
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
  editor?: string | (new (...args: unknown[]) => unknown) | boolean;
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
  validator?: string | RegExp | ((value: unknown, callback: (valid: boolean) => void) => void);
  wordWrap?: boolean;

  // Rendering
  renderer?: string | ((hotInstance: HotInstance, td: HTMLTableCellElement, row: number, col: number,
    prop: string | number, value: CellValue, cellProperties: CellProperties) => HTMLTableCellElement | void);
  valueFormatter?: (value: CellValue, cellProperties: CellProperties) => CellValue;
  valueGetter?: (value: CellValue, visualRow: number, visualCol: number, cellMeta: CellProperties) => CellValue;
  valueSetter?: (value: CellValue, visualRow: number, visualCol: number, cellMeta: CellProperties) => CellValue;
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
  outsideClickDeselects?: boolean | ((target: HTMLElement, coords?: WalkontableCellCoords) => boolean);
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

  // Date / Time
  dateFormat?: Intl.DateTimeFormatOptions;
  timeFormat?: Intl.DateTimeFormatOptions;
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
  selectOptions?: string[] | number[] | object[] | Record<string, string>
    | ((visualRow: number, visualColumn: number, prop: string | number) => string[] | Record<string, string>);
  strict?: boolean;
  title?: string;
  trimDropdown?: boolean;
  visibleRows?: number;

  // Empty checks
  isEmptyCol?: (col: number) => boolean;
  isEmptyRow?: (row: number) => boolean;

  // Layout
  ariaTags?: boolean;
  layout?: {
    beforeGrid?: string[];
    afterGrid?: string[];
    overlays?: string[];
  };
  layoutDirection?: 'inherit' | 'ltr' | 'rtl';
  licenseKey?: string;
  preventOverflow?: boolean | string;
  preventWheel?: boolean;

  // Security
  sanitizer?: (html: string, ...args: any[]) => string; // eslint-disable-line @typescript-eslint/no-explicit-any

  // State
  initialState?: Record<string, unknown>;

  // Hook callbacks
  afterAddChild?: (parent: RowObject, element: RowObject | undefined, index: number | undefined) => void;
  afterAutofill?: (fillData: CellValue[][], sourceRange: WalkontableCellRange, targetRange: WalkontableCellRange,
    direction: 'up' | 'down' | 'left' | 'right') => void;
  afterBeginEditing?: (row: number, column: number) => void;
  afterCellMetaReset?: () => void;
  afterChange?: (changes: CellChange[] | null, source: ChangeSource) => void;
  afterChangesObserved?: () => void;
  afterColumnCollapse?: (currentCollapsedColumns: number[], destinationCollapsedColumns: number[],
    collapsePossible: boolean, successfullyCollapsed: boolean) => void;
  afterColumnExpand?: (currentCollapsedColumns: number[], destinationCollapsedColumns: number[],
    expandPossible: boolean, successfullyExpanded: boolean) => void;
  afterColumnFreeze?: (columnIndex: number, isFreezingPerformed: boolean) => void;
  afterColumnMove?: (movedColumns: number[], finalIndex: number, dropIndex: number | undefined,
    movePossible: boolean, orderChanged: boolean) => void;
  afterColumnResize?: (newSize: number, column: number, isDoubleClick: boolean) => void;
  afterColumnSequenceChange?: (source: ChangeSource) => void;
  afterColumnSequenceCacheUpdate?: (indexesChangesState: {
    indexesSequenceChanged: boolean; trimmedIndexesChanged: boolean; hiddenIndexesChanged: boolean;
  }) => void;
  afterColumnSort?: (currentSortConfig: ColumnSortingConfig[], destinationSortConfigs: ColumnSortingConfig[]) => void;
  afterColumnUnfreeze?: (columnIndex: number, isFreezingPerformed: boolean) => void;
  afterContextMenuDefaultOptions?: (predefinedItems: Array<PredefinedMenuItemKey | MenuItemConfig>)
    => void;
  afterContextMenuHide?: (context: ContextMenu) => void;
  afterContextMenuShow?: (context: ContextMenu) => void;
  afterCopy?: (data: CellValue[][], coords: RangeType[], copiedHeadersCount: { columnHeadersCount: number })
    => void;
  afterCopyLimit?: (selectedRows: number, selectedColumns: number, copyRowsLimit: number,
    copyColumnsLimit: number) => void;
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
  afterDrawSelection?: (currentRow: number, currentColumn: number, cornersOfSelection: number[],
    layerLevel?: number) => string | void;
  afterDropdownMenuDefaultOptions?: (predefinedItems: Array<PredefinedMenuItemKey | MenuItemConfig>)
    => void;
  afterDropdownMenuHide?: (instance: DropdownMenu) => void;
  afterDropdownMenuShow?: (instance: DropdownMenu) => void;
  afterEmptyDataStateHide?: () => void;
  afterEmptyDataStateShow?: () => void;
  afterFilter?: (conditionsStack: ColumnConditions[]) => void;
  afterFormulasValuesUpdate?: (changes: unknown[]) => void;
  afterGetCellMeta?: (row: number, column: number, cellProperties: CellProperties) => void;
  afterGetColHeader?: (column: number, TH: HTMLTableHeaderCellElement, headerLevel: number) => void;
  afterGetColumnHeaderRenderers?: (renderers: Array<(...args: unknown[]) => unknown>) => void;
  afterGetRowHeader?: (row: number, TH: HTMLTableHeaderCellElement) => void;
  afterGetRowHeaderRenderers?: (renderers: Array<(...args: unknown[]) => unknown>) => void;
  afterHideColumns?: (currentHideConfig: number[], destinationHideConfig: number[],
    actionPossible: boolean, stateChanged: boolean) => void;
  afterHideRows?: (currentHideConfig: number[], destinationHideConfig: number[],
    actionPossible: boolean, stateChanged: boolean) => void;
  afterInit?: () => void;
  afterLanguageChange?: (languageCode: string) => void;
  afterListen?: () => void;
  afterLoadData?: (sourceData: unknown[], initialLoad: boolean, source: ChangeSource | undefined) => void;
  afterLoadingHide?: () => void;
  afterLoadingShow?: () => void;
  afterMergeCells?: (cellRange: WalkontableCellRange,
    mergeParent: { row: number; col: number; rowspan: number; colspan: number }, auto: boolean) => void;
  afterModifyTransformEnd?: (coords: WalkontableCellCoords, rowTransformDir: number, colTransformDir: number) => void;
  afterModifyTransformFocus?: (coords: WalkontableCellCoords, rowTransformDir: number, colTransformDir: number) => void;
  afterModifyTransformStart?: (coords: WalkontableCellCoords, rowTransformDir: number, colTransformDir: number) => void;
  afterMomentumScroll?: () => void;
  afterNamedExpressionAdded?: (namedExpressionName: string, changes: unknown[]) => void;
  afterNamedExpressionRemoved?: (namedExpressionName: string, changes: unknown[]) => void;
  afterNotificationHide?: (id: string) => void;
  afterNotificationShow?: (id: string, options: {
    id: string;
    variant: 'info' | 'success' | 'warning' | 'error';
    duration: number;
    position: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
    closable: boolean;
    actions: Array<{ label: string; type?: 'primary' | 'secondary'; callback: () => void }>;
    title?: string;
    message?: string | HTMLElement;
  }) => void;
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
  afterRefreshDimensions?: (previousDimensions: { width: number; height: number },
    currentDimensions: { width: number; height: number }, stateChanged: boolean) => void;
  afterRemoveCellMeta?: (row: number, column: number, key: string, value: unknown) => void;
  afterRemoveCol?: (index: number, amount: number, physicalColumns: number[], source?: ChangeSource) => void;
  afterRemoveRow?: (index: number, amount: number, physicalRows: number[], source?: ChangeSource) => void;
  afterRender?: (isForced: boolean) => void;
  afterRenderer?: (TD: HTMLTableCellElement, row: number, column: number, prop: string | number,
    value: CellValue, cellProperties: CellProperties) => void;
  afterRowMove?: (movedRows: number[], finalIndex: number, dropIndex: number | undefined,
    movePossible: boolean, orderChanged: boolean) => void;
  afterRowResize?: (newSize: number, row: number, isDoubleClick: boolean) => void;
  afterRowSequenceChange?: (source: ChangeSource) => void;
  afterRowSequenceCacheUpdate?: (indexesChangesState: {
    indexesSequenceChanged: boolean; trimmedIndexesChanged: boolean; hiddenIndexesChanged: boolean;
  }) => void;
  afterRowsMutation?: (operation: string, payload: RowMutationPayload) => void;
  afterRowsMutationError?: (operation: string, error: Error, payload: RowMutationPayload) => void;
  afterScroll?: () => void;
  afterScrollHorizontally?: () => void;
  afterScrollVertically?: () => void;
  afterSelectAll?: (from: WalkontableCellCoords, to: WalkontableCellCoords, highlight?: WalkontableCellCoords) => void;
  afterSelectColumns?: (from: WalkontableCellCoords, to: WalkontableCellCoords,
    highlight: WalkontableCellCoords) => void;
  afterSelection?: (row: number, column: number, row2: number, column2: number,
    preventScrolling: { value: boolean }, selectionLayerLevel: number) => void;
  afterSelectionByProp?: (row: number, prop: string, row2: number, prop2: string,
    preventScrolling: { value: boolean }, selectionLayerLevel: number) => void;
  afterSelectionEnd?: (row: number, column: number, row2: number, column2: number,
    selectionLayerLevel: number) => void;
  afterSelectionEndByProp?: (row: number, prop: string, row2: number, prop2: string,
    selectionLayerLevel: number) => void;
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
  afterTrimRow?: (currentTrimConfig: number[], destinationTrimConfig?: number[],
    actionPossible?: boolean, stateChanged?: boolean) => void;
  afterUndo?: (action: UndoRedoAction) => void;
  afterUndoStackChange?: (doneActionsBefore: UndoRedoAction[], doneActionsAfter: UndoRedoAction[])
    => void;
  afterUnhideColumns?: (currentHideConfig: number[], destinationHideConfig: number[],
    actionPossible: boolean, stateChanged: boolean) => void;
  afterUnhideRows?: (currentHideConfig: number[], destinationHideConfig: number[],
    actionPossible: boolean, stateChanged: boolean) => void;
  afterUnlisten?: () => void;
  afterUnmergeCells?: (cellRange: WalkontableCellRange, auto: boolean) => void;
  afterUntrimRow?: (currentTrimConfig: number[], destinationTrimConfig: number[],
    actionPossible: boolean, stateChanged: boolean) => void;
  afterUpdateData?: (sourceData: unknown[], initialLoad: boolean, source: ChangeSource | undefined) => void;
  afterUpdateSettings?: (newSettings: Partial<GridSettings>) => void;
  afterValidate?: (isValid: boolean, value: CellValue, row: number, prop: string | number,
    source: ChangeSource) => void | boolean;
  afterDataProviderFetch?: (result: DataProviderFetchResult) => void;
  afterDataProviderFetchAbort?: (queryParameters: DataProviderQueryParameters, reason?: Error) => void;
  afterDataProviderFetchError?: (error: Error, queryParameters: DataProviderQueryParameters) => void;
  afterViewportColumnCalculatorOverride?: (calc: {
    startColumn: number; endColumn: number; [key: string]: unknown;
  }) => void;
  afterViewportRowCalculatorOverride?: (calc: {
    startRow: number; endRow: number; [key: string]: unknown;
  }) => void;
  afterViewRender?: (isForced: boolean) => void;
  beforeAddChild?: (parent: RowObject, element?: RowObject, index?: number) => void;
  beforeAlter?: (action: string, index: number | Array<[number, number]>, amount: number,
    source?: ChangeSource, keepEmptyRows?: boolean) => boolean | void;
  beforeAutofill?: (selectionData: CellValue[][], sourceRange: WalkontableCellRange,
    targetRange: WalkontableCellRange, direction: 'up' | 'down' | 'left' | 'right') => CellValue[][] | void;
  beforeBeginEditing?: (row: number, column: number, initialValue: CellValue,
    event: { preventDefault(): void; [key: string]: unknown }, fullEditMode: boolean) => boolean | void;
  beforeCellAlignment?: (stateBefore: Record<string, string>, range: WalkontableCellRange[],
    type: string, alignmentClass: string) => void;
  beforeChange?: (changes: (CellChange | null)[], source: ChangeSource) => void | boolean;
  beforeChangeRender?: (changes: CellChange[], source: ChangeSource) => void;
  beforeColumnCollapse?: (currentCollapsedColumn: number[], destinationCollapsedColumns: number[],
    collapsePossible: boolean) => void | boolean;
  beforeColumnExpand?: (currentCollapsedColumn: number[], destinationCollapsedColumns: number[],
    expandPossible: boolean) => void | boolean;
  beforeColumnFreeze?: (columnIndex: number, isFreezingPerformed: boolean) => void | boolean;
  beforeColumnMove?: (movedColumns: number[], finalIndex: number, dropIndex: number | undefined,
    movePossible: boolean) => void | boolean;
  beforeColumnResize?: (newSize: number, column: number, isDoubleClick: boolean) => void | number | false;
  beforeColumnSort?: (currentSortConfig: ColumnSortingConfig[],
    destinationSortConfigs: ColumnSortingConfig[]) => void | boolean;
  beforeColumnUnfreeze?: (columnIndex: number, isUnfreezingPerformed: boolean) => void | boolean;
  beforeColumnWrap?: (isActionInterrupted: { value: boolean }, newCoords: WalkontableCellCoords,
    isColumnFlipped: boolean) => void;
  beforeCompositionStart?: (event: CompositionEvent) => void;
  beforeContextMenuSetItems?: (menuItems: Array<PredefinedMenuItemKey | MenuItemConfig>)
    => void;
  beforeContextMenuShow?: (context: ContextMenu) => void;
  beforeCopy?: (data: CellValue[][], coords: RangeType[], copiedHeadersCount: { columnHeadersCount: number })
    => void | boolean;
  beforeCreateCol?: (index: number, amount: number, source?: ChangeSource) => void | boolean;
  beforeCreateRow?: (index: number, amount: number, source?: ChangeSource) => void | boolean;
  beforeCut?: (data: CellValue[][], coords: RangeType[]) => void | boolean;
  beforeDataProviderFetch?: (queryParameters: DataProviderBeforeFetchParameters) => boolean | void;
  beforeDetachChild?: (parent: RowObject, element: RowObject) => void;
  beforeDialogHide?: () => void;
  beforeDialogShow?: () => void;
  beforeDrawBorders?: (corners: number[], borderClassName: string | undefined) => void;
  beforeDropdownMenuSetItems?: (menuItems: Array<PredefinedMenuItemKey | MenuItemConfig>) => void;
  beforeDropdownMenuShow?: (instance: DropdownMenu) => void;
  beforeEmptyDataStateHide?: () => void;
  beforeEmptyDataStateShow?: () => void;
  beforeFilter?: (conditionsStack: ColumnConditions[], previousConditionsStack: ColumnConditions[])
    => void | boolean;
  beforeGetCellMeta?: (row: number, column: number, cellProperties: CellProperties) => void;
  beforeHeightChange?: (height: number | string) => number | string;
  beforeHideColumns?: (currentHideConfig: number[], destinationHideConfig: number[],
    actionPossible: boolean) => void | boolean;
  beforeHideRows?: (currentHideConfig: number[], destinationHideConfig: number[],
    actionPossible: boolean) => void | boolean;
  beforeHighlightingColumnHeader?: (column: number, headerLevel: number,
    highlightMeta: { selectionType: string; columnCursor: number; selectionWidth: number }) => number | void;
  beforeHighlightingRowHeader?: (row: number, headerLevel: number,
    highlightMeta: { selectionType: string; rowCursor: number; selectionHeight: number }) => number | void;
  beforeInit?: () => void;
  beforeInitWalkontable?: (walkontableConfig: object) => void;
  beforeKeyDown?: (event: KeyboardEvent) => void;
  beforeLanguageChange?: (languageCode: string) => void;
  beforeLoadData?: (sourceData: unknown[], initialLoad: boolean, source: ChangeSource | undefined) => void;
  beforeLoadingHide?: () => boolean | void;
  beforeLoadingShow?: () => boolean | void;
  beforeMergeCells?: (cellRange: WalkontableCellRange, auto: boolean) => void;
  beforeNotificationHide?: (id: string) => boolean | void;
  beforeNotificationShow?: (options: {
    id: string;
    variant: 'info' | 'success' | 'warning' | 'error';
    duration: number;
    position: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
    closable: boolean;
    actions: Array<{ label: string; type?: 'primary' | 'secondary'; callback: () => void }>;
    title?: string;
    message?: string | HTMLElement;
  }) => boolean | void;
  beforeOnCellContextMenu?: (event: MouseEvent, coords: WalkontableCellCoords, TD: HTMLTableCellElement) => void;
  beforeOnCellMouseDown?: (event: MouseEvent, coords: WalkontableCellCoords, TD: HTMLTableCellElement,
    controller: { preventDefault: boolean }) => void;
  beforeOnCellMouseOut?: (event: MouseEvent, coords: WalkontableCellCoords, TD: HTMLTableCellElement) => void;
  beforeOnCellMouseOver?: (event: MouseEvent, coords: WalkontableCellCoords, TD: HTMLTableCellElement,
    controller: { preventDefault: boolean }) => void;
  beforeOnCellMouseUp?: (event: MouseEvent, coords: WalkontableCellCoords, TD: HTMLTableCellElement) => void;
  beforePageChange?: (oldPage: number, newPage: number) => void | boolean;
  beforePageSizeChange?: (oldPageSize: number | 'auto', newPageSize: number | 'auto') => void | boolean;
  beforePaste?: (data: CellValue[][], coords: RangeType[]) => void | boolean;
  beforeRedo?: (action: UndoRedoAction) => void;
  beforeRedoStackChange?: (undoneActions: UndoRedoAction[]) => void;
  beforeRefreshDimensions?: (previousDimensions: { width: number; height: number },
    currentDimensions: { width: number; height: number }, actionPossible: boolean) => boolean | void;
  beforeRemoveCellClassNames?: () => string[] | void;
  beforeRemoveCellMeta?: (row: number, column: number, key: string, value: unknown) => void;
  beforeRemoveCol?: (index: number, amount: number, physicalColumns: number[], source?: ChangeSource) => void;
  beforeRemoveRow?: (index: number, amount: number, physicalRows: number[], source?: ChangeSource) => void;
  beforeRender?: (isForced: boolean) => void;
  beforeRenderer?: (TD: HTMLTableCellElement, row: number, column: number, prop: string | number,
    value: CellValue, cellProperties: CellProperties) => void;
  beforeRowMove?: (movedRows: number[], finalIndex: number, dropIndex: number | undefined,
    movePossible: boolean) => void | boolean;
  beforeRowResize?: (newSize: number, row: number, isDoubleClick: boolean) => number | void | false;
  beforeRowsMutation?: (operation: string, payload: RowMutationPayload) => void | boolean;
  beforeRowWrap?: (isActionInterrupted: { value: boolean }, newCoords: WalkontableCellCoords,
    isRowFlipped: boolean) => void;
  beforeSelectAll?: (from: WalkontableCellCoords, to: WalkontableCellCoords,
    highlight?: WalkontableCellCoords) => void;
  beforeSelectColumns?: (from: WalkontableCellCoords, to: WalkontableCellCoords,
    highlight: WalkontableCellCoords) => void;
  beforeSelectionFocusSet?: (coords: WalkontableCellCoords) => void;
  beforeSelectionHighlightSet?: () => void;
  beforeSelectRows?: (from: WalkontableCellCoords, to: WalkontableCellCoords,
    highlight: WalkontableCellCoords) => void;
  beforeSetCellMeta?: (row: number, column: number, key: string, value: unknown) => boolean | void;
  beforeSetRangeEnd?: (coords: WalkontableCellCoords) => void;
  beforeSetRangeStart?: (coords: WalkontableCellCoords) => void;
  beforeSetRangeStartOnly?: (coords: WalkontableCellCoords) => void;
  beforeStretchingColumnWidth?: (stretchedWidth: number, column: number) => void | number;
  beforeTouchScroll?: () => void;
  beforeTrimRow?: (currentTrimConfig: number[], destinationTrimConfig: number[],
    actionPossible: boolean) => void | boolean;
  beforeUndo?: (action: UndoRedoAction) => void;
  beforeUndoStackChange?: (doneActions: UndoRedoAction[], source?: string) => void;
  beforeUnhideColumns?: (currentHideConfig: number[], destinationHideConfig: number[],
    actionPossible: boolean) => void | boolean;
  beforeUnhideRows?: (currentHideConfig: number[], destinationHideConfig: number[],
    actionPossible: boolean) => void | boolean;
  beforeUnmergeCells?: (cellRange: WalkontableCellRange, auto: boolean) => void;
  beforeUntrimRow?: (currentTrimConfig: number[], destinationTrimConfig: number[],
    actionPossible: boolean) => void | boolean;
  beforeUpdateData?: (sourceData: unknown[], initialLoad: boolean, source: ChangeSource | undefined) => void;
  beforeValidate?: (value: CellValue, row: number, prop: string | number, source?: ChangeSource) => void;
  beforeValueRender?: (value: CellValue, cellProperties: CellProperties) => void;
  beforeViewportScroll?: () => void;
  beforeViewportScrollHorizontally?: (visualColumn: number, snapping: 'auto' | 'start' | 'end')
    => number | boolean | null;
  beforeViewportScrollVertically?: (visualRow: number, snapping: 'auto' | 'top' | 'bottom') => number | boolean | null;
  beforeViewRender?: (isForced: boolean, skipRender: { skipRender?: boolean }) => void;
  beforeWidthChange?: (width: number | string) => number | string;
  construct?: () => void;
  dialogFocusNextElement?: () => void;
  dialogFocusPreviousElement?: () => void;
  hasExternalDataSource?: () => boolean | void;
  init?: () => void;
  modifyAutoColumnSizeSeed?: (seed: string, cellProperties: CellProperties,
    cellValue: CellValue) => string | void;
  modifyAutofillRange?: (entireArea: [number, number, number, number],
    startArea: [number, number, number, number]) => [number, number, number, number] | void;
  modifyColHeader?: (column: number) => void;
  modifyColumnHeaderHeight?: () => void;
  modifyColumnHeaderValue?: (headerValue: string, visualColumnIndex: number, headerLevel: number) => void | string;
  modifyColWidth?: (width: number, column: number, source?: string) => void | number;
  modifyCopyableRange?: (copyableRanges: RangeType[]) => void;
  modifyData?: (row: number, column: number, valueHolder: { value: CellValue }, ioMode: 'get' | 'set') => void;
  modifyFiltersMultiSelectValue?: (value: string, meta: CellProperties) => void | string;
  modifyFocusedElement?: (row: number, column: number, focusedElement: HTMLElement) => void | HTMLElement;
  modifyFocusOnTabNavigation?: (tabActivationDir: string, visualCoords: WalkontableCellCoords) => void;
  modifyGetCellCoords?: (row: number, column: number, topmost: boolean, source: string | undefined)
    => void | [number, number] | [number, number, number, number];
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
type HookKey = {
  [K in keyof GridSettings]-?: NonNullable<GridSettings[K]> extends (...args: any[]) => any ? K : never; // eslint-disable-line @typescript-eslint/no-explicit-any
}[keyof GridSettings];

/**
 * Map of all Handsontable hook names to their typed callback signatures.
 * Use with addHook/addHookOnce/removeHook for IDE autocomplete and compile-time safety.
 */
export type Events = Required<Pick<GridSettings, HookKey>>;

/**
 * Resolves the typed callback signature for a specific hook name.
 * Use as the type of private hook-handler fields in plugins to enable direct passing
 * to addHook without as-Function wrapper casts.
 *
 * @example
 * #onAfterRender: Hook<'afterRender'> = () => { ... };
 * this.addHook('afterRender', this.#onAfterRender);
 */
export type Hook<K extends keyof Events> = Events[K];
