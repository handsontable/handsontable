import CellCoords from './3rdparty/walkontable/src/cell/coords';
import CellRange from './3rdparty/walkontable/src/cell/range';
import { ViewportColumnsCalculator } from './3rdparty/walkontable/src/calculator/viewportColumns';
import Core from './core';
import { SelectionController } from './selection';
import {
  ContextMenu,
  PredefinedMenuItemKey as ContextMenuPredefinedMenuItemKey,
  MenuItemConfig as ContextMenuMenuItemConfig,
} from './plugins/contextMenu';
import {
  DropdownMenu,
} from './plugins/dropdownMenu';
import {
  ColumnSorting,
  Config as ColumnSortingConfig,
} from './plugins/columnSorting';
import {
  Filters,
  ColumnConditions as FiltersColumnConditions,
} from './plugins/filters';
import {
  UndoRedo,
  Action as UndoRedoAction,
} from './plugins/undoRedo';
import {
  Settings as MergeCellsSettings,
} from './plugins/mergeCells';
import {
  GridSettings,
  CellProperties,
} from './settings';

import {
  CellValue,
  RowObject,
  CellChange,
  ChangeSource,
  RangeType,
} from './common';

type Bucket = {
  [P in keyof Events]: Array<Events[P]>;
};

interface HookHighlightRowHeaderMeta {
  selectionType: string;
  rowCursor: number;
  selectionHeight: number;
  classNames: string[];
}
interface HookHighlightColumnHeaderMeta {
  selectionType: string;
  columnCursor: number;
  selectionWidth: number;
  classNames: string[];
}

export interface Events {
  afterAddChild?: (parent: RowObject, element: RowObject | undefined, index: number | undefined) => void;
  afterAutofill?: (fillData: CellValue[][], sourceRange: CellRange, targetRange: CellRange, direction: 'up' | 'down' | 'left' | 'right') => void;
  afterBeginEditing?: (row: number, column: number) => void;
  afterCellMetaReset?: () => void;
  afterChange?: (changes: CellChange[] | null, source: ChangeSource) => void;
  afterChangesObserved?: () => void;
  afterColumnCollapse?: (currentCollapsedColumns: number[], destinationCollapsedColumns: number[], collapsePossible: boolean, successfullyCollapsed: boolean) => void;
  afterColumnExpand?: (currentCollapsedColumns: number[], destinationCollapsedColumns: number[], expandPossible: boolean, successfullyExpanded: boolean) => void;
  afterColumnFreeze?: (columnIndex: number, isFreezingPerformed: boolean) => void;
  afterColumnMove?: (movedColumns: number[], finalIndex: number, dropIndex: number | undefined, movePossible: boolean, orderChanged: boolean) => void;
  afterColumnResize?: (newSize: number, column: number, isDoubleClick: boolean) => void;
  afterColumnSort?: (currentSortConfig: ColumnSortingConfig[], destinationSortConfigs: ColumnSortingConfig[]) => void;
  afterColumnUnfreeze?: (columnIndex: number, isUnfreezingPerformed: boolean) => void;
  afterContextMenuDefaultOptions?: (predefinedItems: Array<ContextMenuPredefinedMenuItemKey | ContextMenuMenuItemConfig>) => void;
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
  afterDocumentKeyDown?: (event: KeyboardEvent) => void;
  afterDrawSelection?: (currentRow: number, currentColumn: number, cornersOfSelection: number[], layerLevel?: number) => string | void;
  afterDropdownMenuDefaultOptions?: (predefinedItems: Array<ContextMenuPredefinedMenuItemKey | ContextMenuMenuItemConfig>) => void;
  afterDropdownMenuHide?: (instance: DropdownMenu) => void;
  afterDropdownMenuShow?: (instance: DropdownMenu) => void;
  afterFilter?: (conditionsStack: FiltersColumnConditions[]) => void;
  afterFormulasValuesUpdate?: (changes: object[]) => void;
  afterGetCellMeta?: (row: number, column: number, cellProperties: CellProperties) => void;
  afterGetColHeader?: (column: number, TH: HTMLTableHeaderCellElement, headerLevel: number) => void;
  afterGetColumnHeaderRenderers?: (renderers: Array<(col: number, TH: HTMLTableHeaderCellElement) => void>) => void;
  afterGetRowHeader?: (row: number, TH: HTMLTableHeaderCellElement) => void;
  afterGetRowHeaderRenderers?: (renderers: Array<(row: number, TH: HTMLTableHeaderCellElement) => void>) => void;
  afterHideColumns?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
  afterHideRows?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
  afterInit?: () => void;
  afterLanguageChange?: (languageCode: string) => void;
  afterListen?: () => void;
  afterLoadData?: (sourceData: CellValue[], initialLoad: boolean, source: string | undefined) => void;
  afterMergeCells?: (cellRange: CellRange, mergeParent: MergeCellsSettings, auto: boolean) => void;
  afterModifyTransformEnd?: (coords: CellCoords, rowTransformDir: -1 | 0, colTransformDir: -1 | 0) => void;
  afterModifyTransformStart?: (coords: CellCoords, rowTransformDir: -1 | 0, colTransformDir: -1 | 0) => void;
  afterMomentumScroll?: () => void;
  afterNamedExpressionAdded?: (namedExpressionName: string, changes: object[]) => void;
  afterNamedExpressionRemoved?: (namedExpressionName: string, changes: object[]) => void;
  afterOnCellContextMenu?: (event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  afterOnCellCornerDblClick?: (event: MouseEvent) => void;
  afterOnCellCornerMouseDown?: (event: MouseEvent) => void;
  afterOnCellMouseDown?: (event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  afterOnCellMouseOver?: (event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  afterOnCellMouseOut?: (event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  afterOnCellMouseUp?: (event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  afterPaste?: (data: CellValue[][], coords: RangeType[]) => void;
  afterPluginsInitialized?: () => void;
  afterRedo?: (action: UndoRedoAction) => void;
  afterRedoStackChange?: (undoneActionsBefore: UndoRedoAction[], undoneActionsAfter: UndoRedoAction[]) => void;
  afterRefreshDimensions?: (previousDimensions: object, currentDimensions: object, stateChanged: boolean) => void;
  afterRemoveCellMeta?: (row: number, column: number, key: string, value: any) => void;
  afterRemoveCol?: (index: number, amount: number, physicalColumns: number[], source?: ChangeSource) => void;
  afterRemoveRow?: (index: number, amount: number, physicalRows: number[], source?: ChangeSource) => void;
  afterRender?: (isForced: boolean) => void;
  afterRenderer?: (TD: HTMLTableCellElement, row: number, column: number, prop: string | number, value: string, cellProperties: CellProperties) => void;
  afterRowMove?: (movedRows: number[], finalIndex: number, dropIndex: number | undefined, movePossible: boolean, orderChanged: boolean) => void;
  afterRowResize?: (newSize: number, row: number, isDoubleClick: boolean) => void;
  afterScrollHorizontally?: () => void;
  afterScrollVertically?: () => void;
  afterSelection?: (row: number, column: number, row2: number, column2: number, preventScrolling: { value: boolean }, selectionLayerLevel: number) => void;
  afterSelectionByProp?: (row: number, prop: string, row2: number, prop2: string, preventScrolling: { value: boolean }, selectionLayerLevel: number) => void;
  afterSelectionEnd?: (row: number, column: number, row2: number, column2: number, selectionLayerLevel: number) => void;
  afterSelectionEndByProp?: (row: number, prop: string, row2: number, prop2: string, selectionLayerLevel: number) => void;
  afterSetCellMeta?: (row: number, column: number, key: string, value: any) => void;
  afterSetDataAtCell?: (changes: CellChange[], source?: ChangeSource) => void;
  afterSetDataAtRowProp?: (changes: CellChange[], source?: ChangeSource) => void;
  afterSetSourceDataAtCell?: (changes: CellChange[], source?: ChangeSource) => void;
  afterSheetAdded?: (addedSheetDisplayName: string) => void;
  afterSheetRemoved?: (removedSheetDisplayName: string, changes: object[]) => void;
  afterSheetRenamed?: (oldDisplayName: string, newDisplayName: string) => void;
  afterTrimRow?: (currentTrimConfig: number[], destinationTrimConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
  afterUndo?: (action: UndoRedoAction) => void;
  afterUndoStackChange?: (doneActionsBefore: UndoRedoAction[], doneActionsAfter: UndoRedoAction[]) => void;
  afterUnhideColumns?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
  afterUnhideRows?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
  afterUnlisten?: () => void;
  afterUnmergeCells?: (cellRange: CellRange, auto: boolean) => void;
  afterUntrimRow?: (currentTrimConfig: number[], destinationTrimConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
  afterUpdateData?: (sourceData: CellValue[], initialLoad: boolean, source: string | undefined) => void;
  afterUpdateSettings?: (newSettings: GridSettings) => void;
  afterValidate?: (isValid: boolean, value: CellValue, row: number, prop: string | number, source: ChangeSource) => void | boolean;
  afterViewportColumnCalculatorOverride?: (calc: ViewportColumnsCalculator) => void;
  afterViewportRowCalculatorOverride?: (calc: ViewportColumnsCalculator) => void;
  afterViewRender?: (isForced: boolean) => void;
  beforeAddChild?: (parent: RowObject, element?: RowObject, index?: number) => void;
  beforeAutofill?: (selectionData: CellValue[][], sourceRange: CellRange, targetRange: CellRange, direction: 'up' | 'down' | 'left' | 'right') => CellValue[][] | boolean | void;
  beforeAutofillInsidePopulate?: (index: CellCoords, direction: 'up' | 'down' | 'left' | 'right', input: CellValue[][], deltas: any[]) => void;
  beforeCellAlignment?: (stateBefore: { [row: number]: string[] }, range: CellRange[], type: 'horizontal' | 'vertical',
    alignmentClass: 'htLeft' | 'htCenter' | 'htRight' | 'htJustify' | 'htTop' | 'htMiddle' | 'htBottom') => void;
  beforeChange?: (changes: Array<CellChange | null>, source: ChangeSource) => void | boolean;
  beforeChangeRender?: (changes: CellChange[], source: ChangeSource) => void;
  beforeColumnCollapse?: (currentCollapsedColumn: number[], destinationCollapsedColumns: number[], collapsePossible: boolean) => void | boolean;
  beforeColumnExpand?: (currentCollapsedColumn: number[], destinationCollapsedColumns: number[], expandPossible: boolean) => void | boolean;
  beforeColumnFreeze?: (columnIndex: number, isFreezingPerformed: boolean) => void | boolean;
  beforeColumnMove?: (movedColumns: number[], finalIndex: number, dropIndex: number | undefined, movePossible: boolean) => void | boolean;
  beforeColumnResize?: (newSize: number, column: number, isDoubleClick: boolean) => void | number;
  beforeColumnSort?: (currentSortConfig: ColumnSortingConfig[], destinationSortConfigs: ColumnSortingConfig[]) => void | boolean;
  beforeColumnUnfreeze?: (columnIndex: number, isUnfreezingPerformed: boolean) => void | boolean;
  beforeContextMenuSetItems?: (menuItems: ContextMenuMenuItemConfig[]) => void;
  beforeContextMenuShow?: (context: ContextMenu) => void;
  beforeCopy?: (data: CellValue[][], coords: RangeType[], copiedHeadersCount: { columnHeadersCount: number }) => void | boolean;
  beforeCreateCol?: (index: number, amount: number, source?: ChangeSource) => void | boolean;
  beforeCreateRow?: (index: number, amount: number, source?: ChangeSource) => void | boolean;
  beforeCut?: (data: CellValue[][], coords: RangeType[]) => void | boolean;
  beforeDetachChild?: (parent: RowObject, element: RowObject) => void;
  beforeDrawBorders?: (corners: number[], borderClassName: 'current' | 'area' | 'highlight' | undefined) => void;
  beforeDropdownMenuSetItems?: (menuItems: ContextMenuMenuItemConfig[]) => void;
  beforeDropdownMenuShow?: (instance: DropdownMenu) => void;
  beforeFilter?: (conditionsStack: FiltersColumnConditions[]) => void | boolean;
  beforeGetCellMeta?: (row: number, col: number, cellProperties: CellProperties) => void;
  beforeHideColumns?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean) => void | boolean;
  beforeHideRows?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean) => void | boolean;
  beforeHighlightingColumnHeader?: (column: number, headerLevel: number, highlightMeta: HookHighlightColumnHeaderMeta) => number | void;
  beforeHighlightingRowHeader?: (row: number, headerLevel: number, highlightMeta: HookHighlightRowHeaderMeta) => number | void;
  beforeInit?: () => void;
  beforeInitWalkontable?: (walkontableConfig: object) => void;
  beforeKeyDown?: (event: KeyboardEvent) => void;
  beforeLanguageChange?: (languageCode: string) => void;
  beforeLoadData?: (sourceData: CellValue[], initialLoad: boolean, source: string | undefined) => void;
  beforeMergeCells?: (cellRange: CellRange, auto: boolean) => void;
  beforeOnCellContextMenu?: (event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  beforeOnCellMouseDown?: (event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement, controller: SelectionController) => void;
  beforeOnCellMouseOut?: (event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  beforeOnCellMouseOver?: (event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement, controller: SelectionController) => void;
  beforeOnCellMouseUp?: (event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  beforePaste?: (data: CellValue[][], coords: RangeType[]) => void | boolean;
  beforeRedo?: (action: UndoRedoAction) => void;
  beforeRedoStackChange?: (undoneActions: UndoRedoAction[]) => void;
  beforeRefreshDimensions?: (previousDimensions: object, currentDimensions: object, actionPossible: boolean) => boolean | void;
  beforeRemoveCellClassNames?: () => string[] | void;
  beforeRemoveCellMeta?: (row: number, column: number, key: string, value: any) => void;
  beforeRemoveCol?: (index: number, amount: number, physicalColumns: number[], source?: ChangeSource) => void;
  beforeRemoveRow?: (index: number, amount: number, physicalColumns: number[], source?: ChangeSource) => void;
  beforeRender?: (isForced: boolean) => void;
  beforeRenderer?: (TD: HTMLTableCellElement, row: number, column: number, prop: string | number, value: CellValue, cellProperties: CellProperties) => void;
  beforeRowMove?: (movedRows: number[], finalIndex: number, dropIndex: number | undefined, movePossible: boolean) => void;
  beforeRowResize?: (newSize: number, row: number, isDoubleClick: boolean) => number | void;
  beforeSetCellMeta?: (row: number, col: number, key: string, value: any) => boolean | void;
  beforeSetRangeEnd?: (coords: CellCoords) => void;
  beforeSetRangeStart?: (coords: CellCoords) => void;
  beforeSetRangeStartOnly?: (coords: CellCoords) => void;
  beforeStretchingColumnWidth?: (stretchedWidth: number, column: number) => void | number;
  beforeTouchScroll?: () => void;
  beforeTrimRow?: (currentTrimConfig: number[], destinationTrimConfig: number[], actionPossible: boolean) => void | boolean;
  beforeUndo?: (action: UndoRedoAction) => void;
  beforeUndoStackChange?: (doneActions: UndoRedoAction[], source?: string) => void;
  beforeUnhideColumns?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean) => void | boolean;
  beforeUnhideRows?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean) => void | boolean;
  beforeUnmergeCells?: (cellRange: CellRange, auto: boolean) => void;
  beforeUntrimRow?: (currentTrimConfig: number[], destinationTrimConfig: number[], actionPossible: boolean) => void | boolean;
  beforeUpdateData?: (sourceData: CellValue[], initialLoad: boolean, source: string | undefined) => void;
  beforeValidate?: (value: CellValue, row: number, prop: string | number, source?: ChangeSource) => void;
  beforeValueRender?: (value: CellValue, cellProperties: CellProperties) => void;
  beforeViewRender?: (isForced: boolean, skipRender: { skipRender?: boolean }) => void;
  construct?: () => void;
  init?: () => void;
  modifyAutoColumnSizeSeed?: (seed: string, cellProperties: CellProperties, cellValue: CellValue) => string | void;
  modifyAutofillRange?: (startArea: Array<[number, number, number, number]>, entireArea: Array<[number, number, number, number]>) => void;
  modifyColHeader?: (column: number) => void;
  modifyColumnHeaderHeight?: () => void;
  modifyColumnHeaderValue?: (headerValue: string, visualColumnIndex: number, headerLevel: number) => void | string;
  modifyColWidth?: (width: number, column: number) => void;
  modifyCopyableRange?: (copyableRanges: RangeType[]) => void;
  modifyData?: (row: number, column: number, valueHolder: { value: CellValue }, ioMode: 'get' | 'set') => void;
  modifyGetCellCoords?: (row: number, column: number, topmost: boolean) => void | [number, number] | [number, number, number, number];
  modifyRowData?: (row: number) => void;
  modifyRowHeader?: (row: number) => void;
  modifyRowHeaderWidth?: (rowHeaderWidth: number) => void;
  modifyRowHeight?: (height: number, row: number) => void;
  modifySourceData?: (row: number, column: number, valueHolder: { value: CellValue }, ioMode: 'get' | 'set') => void;
  modifyTransformEnd?: (delta: CellCoords) => void;
  modifyTransformStart?: (delta: CellCoords) => void;
  persistentStateLoad?: (key: string, valuePlaceholder: { value: any }) => void;
  persistentStateReset?: (key: string) => void;
  persistentStateSave?: (key: string, value: any) => void;
}

export class Hooks {
  add<K extends keyof Events>(key: K, callback: Events[K] | Array<Events[K]>, context?: Core): Hooks;
  createEmptyBucket(): Bucket;
  deregister(key: string): void;
  destroy(context?: Core): void;
  getBucket(context?: Core): Bucket;
  getRegistered(): Array<keyof Events>;
  has(key: keyof Events, context?: Core): boolean;
  isDeprecated(key: keyof Events): boolean;
  isRegistered(key: keyof Events): boolean;
  once<K extends keyof Events>(key: K, callback: Events[K] | Array<Events[K]>, context?: Core): void;
  register(key: string): void;
  remove(key: keyof Events, callback: () => void, context?: Core): boolean;
  run(context: Core, key: keyof Events, p1?: any, p2?: any, p3?: any, p4?: any, p5?: any, p6?: any): any;
}
