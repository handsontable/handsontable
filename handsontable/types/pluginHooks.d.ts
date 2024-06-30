import { ExportedChange } from 'hyperformula';
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
  Config as ColumnSortingConfig,
} from './plugins/columnSorting';
import {
  ColumnConditions as FiltersColumnConditions,
} from './plugins/filters';
import {
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
  OverlayType,
} from './common';

type Bucket = {
  [P in keyof Events]: Array<Events[P]>;
};

interface HookHighlightRowHeaderMeta {
  selectionType: string;
  rowCursor: number;
  selectionHeight: number;
}
interface HookHighlightColumnHeaderMeta {
  selectionType: string;
  columnCursor: number;
  selectionWidth: number;
}

export interface Events {
  afterAddChild?: (this: Core, parent: RowObject, element: RowObject | undefined, index: number | undefined) => void;
  afterAutofill?: (this: Core, fillData: CellValue[][], sourceRange: CellRange, targetRange: CellRange, direction: 'up' | 'down' | 'left' | 'right') => void;
  afterBeginEditing?: (this: Core, row: number, column: number) => void;
  afterCellMetaReset?: (this: Core, ) => void;
  afterChange?: (this: Core, changes: CellChange[] | null, source: ChangeSource) => void;
  afterChangesObserved?: (this: Core, ) => void;
  afterColumnCollapse?: (this: Core, currentCollapsedColumns: number[], destinationCollapsedColumns: number[], collapsePossible: boolean, successfullyCollapsed: boolean) => void;
  afterColumnExpand?: (this: Core, currentCollapsedColumns: number[], destinationCollapsedColumns: number[], expandPossible: boolean, successfullyExpanded: boolean) => void;
  afterColumnFreeze?: (this: Core, columnIndex: number, isFreezingPerformed: boolean) => void;
  afterColumnMove?: (this: Core, movedColumns: number[], finalIndex: number, dropIndex: number | undefined, movePossible: boolean, orderChanged: boolean) => void;
  afterColumnResize?: (this: Core, newSize: number, column: number, isDoubleClick: boolean) => void;
  afterColumnSequenceChange?: (this: Core, source: 'init' | 'move' | 'insert' | 'remove' | 'update') => void;
  afterColumnSort?: (this: Core, currentSortConfig: ColumnSortingConfig[], destinationSortConfigs: ColumnSortingConfig[]) => void;
  afterColumnUnfreeze?: (this: Core, columnIndex: number, isUnfreezingPerformed: boolean) => void;
  afterContextMenuDefaultOptions?: (this: Core, predefinedItems: Array<ContextMenuPredefinedMenuItemKey | ContextMenuMenuItemConfig>) => void;
  afterContextMenuHide?: (this: Core, context: ContextMenu) => void;
  afterContextMenuShow?: (this: Core, context: ContextMenu) => void;
  afterCopy?: (this: Core, data: CellValue[][], coords: RangeType[], copiedHeadersCount: { columnHeadersCount: number }) => void;
  afterCopyLimit?: (this: Core, selectedRows: number, selectedColumns: number, copyRowsLimit: number, copyColumnsLimit: number) => void;
  afterCreateCol?: (this: Core, index: number, amount: number, source?: ChangeSource) => void;
  afterCreateRow?: (this: Core, index: number, amount: number, source?: ChangeSource) => void;
  afterCut?: (this: Core, data: CellValue[][], coords: RangeType[]) => void;
  afterDeselect?: (this: Core, ) => void;
  afterDestroy?: (this: Core, ) => void;
  afterDetachChild?: (this: Core, parent: RowObject, element: RowObject) => void;
  afterDocumentKeyDown?: (this: Core, event: KeyboardEvent) => void;
  afterDrawSelection?: (this: Core, currentRow: number, currentColumn: number, cornersOfSelection: number[], layerLevel?: number) => string | void;
  afterDropdownMenuDefaultOptions?: (this: Core, predefinedItems: Array<ContextMenuPredefinedMenuItemKey | ContextMenuMenuItemConfig>) => void;
  afterDropdownMenuHide?: (this: Core, instance: DropdownMenu) => void;
  afterDropdownMenuShow?: (this: Core, instance: DropdownMenu) => void;
  afterFilter?: (this: Core, conditionsStack: FiltersColumnConditions[]) => void;
  afterFormulasValuesUpdate?: (this: Core, changes: ExportedChange[]) => void;
  afterGetCellMeta?: (this: Core, row: number, column: number, cellProperties: CellProperties) => void;
  afterGetColHeader?: (this: Core, column: number, TH: HTMLTableHeaderCellElement, headerLevel: number) => void;
  afterGetColumnHeaderRenderers?: (this: Core, renderers: Array<(column: number, TH: HTMLTableHeaderCellElement) => void>) => void;
  afterGetRowHeader?: (this: Core, row: number, TH: HTMLTableHeaderCellElement) => void;
  afterGetRowHeaderRenderers?: (this: Core, renderers: Array<(row: number, TH: HTMLTableHeaderCellElement) => void>) => void;
  afterHideColumns?: (this: Core, currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
  afterHideRows?: (this: Core, currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
  afterInit?: (this: Core, ) => void;
  afterLanguageChange?: (this: Core, languageCode: string) => void;
  afterListen?: (this: Core, ) => void;
  afterLoadData?: (this: Core, sourceData: CellValue[], initialLoad: boolean, source: string | undefined) => void;
  afterMergeCells?: (this: Core, cellRange: CellRange, mergeParent: MergeCellsSettings, auto: boolean) => void;
  afterModifyTransformEnd?: (this: Core, coords: CellCoords, rowTransformDir: -1 | 0, colTransformDir: -1 | 0) => void;
  afterModifyTransformFocus?: (this: Core, coords: CellCoords, rowTransformDir: -1 | 0, colTransformDir: -1 | 0) => void;
  afterModifyTransformStart?: (this: Core, coords: CellCoords, rowTransformDir: -1 | 0, colTransformDir: -1 | 0) => void;
  afterMomentumScroll?: (this: Core, ) => void;
  afterNamedExpressionAdded?: (this: Core, namedExpressionName: string, changes: ExportedChange[]) => void;
  afterNamedExpressionRemoved?: (this: Core, namedExpressionName: string, changes: ExportedChange[]) => void;
  afterOnCellContextMenu?: (this: Core, event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  afterOnCellCornerDblClick?: (this: Core, event: MouseEvent) => void;
  afterOnCellCornerMouseDown?: (this: Core, event: MouseEvent) => void;
  afterOnCellMouseDown?: (this: Core, event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  afterOnCellMouseOut?: (this: Core, event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  afterOnCellMouseOver?: (this: Core, event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  afterOnCellMouseUp?: (this: Core, event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  afterPaste?: (this: Core, data: CellValue[][], coords: RangeType[]) => void;
  afterPluginsInitialized?: (this: Core, ) => void;
  afterRedo?: (this: Core, action: UndoRedoAction) => void;
  afterRedoStackChange?: (this: Core, undoneActionsBefore: UndoRedoAction[], undoneActionsAfter: UndoRedoAction[]) => void;
  afterRefreshDimensions?: (this: Core, previousDimensions: { width: number, height: number }, currentDimensions: { width: number, height: number }, stateChanged: boolean) => void;
  afterRemoveCellMeta?: (this: Core, row: number, column: number, key: string, value: any) => void;
  afterRemoveCol?: (this: Core, index: number, amount: number, physicalColumns: number[], source?: ChangeSource) => void;
  afterRemoveRow?: (this: Core, index: number, amount: number, physicalRows: number[], source?: ChangeSource) => void;
  afterRender?: (this: Core, isForced: boolean) => void;
  afterRenderer?: (this: Core, TD: HTMLTableCellElement, row: number, column: number, prop: string | number, value: string, cellProperties: CellProperties) => void;
  afterRowMove?: (this: Core, movedRows: number[], finalIndex: number, dropIndex: number | undefined, movePossible: boolean, orderChanged: boolean) => void;
  afterRowResize?: (this: Core, newSize: number, row: number, isDoubleClick: boolean) => void;
  afterRowSequenceChange?: (this: Core, source: 'init' | 'move' | 'insert' | 'remove' | 'update') => void;
  afterScrollHorizontally?: (this: Core, ) => void;
  afterScrollVertically?: (this: Core, ) => void;
  afterScroll?: (this: Core, ) => void;
  afterSelectColumns?: (this: Core, from: CellCoords, to: CellCoords, highlight: CellCoords) => void;
  afterSelection?: (this: Core, row: number, column: number, row2: number, column2: number, preventScrolling: { value: boolean }, selectionLayerLevel: number) => void;
  afterSelectionByProp?: (this: Core, row: number, prop: string, row2: number, prop2: string, preventScrolling: { value: boolean }, selectionLayerLevel: number) => void;
  afterSelectionEnd?: (this: Core, row: number, column: number, row2: number, column2: number, selectionLayerLevel: number) => void;
  afterSelectionEndByProp?: (this: Core, row: number, prop: string, row2: number, prop2: string, selectionLayerLevel: number) => void;
  afterSelectionFocusSet?: (this: Core, row: number, column: number, preventScrolling: { value: boolean }) => void;
  afterSelectRows?: (this: Core, from: CellCoords, to: CellCoords, highlight: CellCoords) => void;
  afterSetCellMeta?: (this: Core, row: number, column: number, key: string, value: any) => void;
  afterSetDataAtCell?: (this: Core, changes: CellChange[], source?: ChangeSource) => void;
  afterSetDataAtRowProp?: (this: Core, changes: CellChange[], source?: ChangeSource) => void;
  afterSetSourceDataAtCell?: (this: Core, changes: CellChange[], source?: ChangeSource) => void;
  afterSheetAdded?: (this: Core, addedSheetDisplayName: string) => void;
  afterSheetRemoved?: (this: Core, removedSheetDisplayName: string, changes: ExportedChange[]) => void;
  afterSheetRenamed?: (this: Core, oldDisplayName: string, newDisplayName: string) => void;
  afterTrimRow?: (this: Core, currentTrimConfig: number[], destinationTrimConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
  afterUndo?: (this: Core, action: UndoRedoAction) => void;
  afterUndoStackChange?: (this: Core, doneActionsBefore: UndoRedoAction[], doneActionsAfter: UndoRedoAction[]) => void;
  afterUnhideColumns?: (this: Core, currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
  afterUnhideRows?: (this: Core, currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
  afterUnlisten?: (this: Core, ) => void;
  afterUnmergeCells?: (this: Core, cellRange: CellRange, auto: boolean) => void;
  afterUntrimRow?: (this: Core, currentTrimConfig: number[], destinationTrimConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
  afterUpdateData?: (this: Core, sourceData: CellValue[], initialLoad: boolean, source: string | undefined) => void;
  afterUpdateSettings?: (this: Core, newSettings: GridSettings) => void;
  afterValidate?: (this: Core, isValid: boolean, value: CellValue, row: number, prop: string | number, source: ChangeSource) => void | boolean;
  afterViewportColumnCalculatorOverride?: (this: Core, calc: ViewportColumnsCalculator) => void;
  afterViewportRowCalculatorOverride?: (this: Core, calc: ViewportColumnsCalculator) => void;
  afterViewRender?: (this: Core, isForced: boolean) => void;
  beforeAddChild?: (this: Core, parent: RowObject, element?: RowObject, index?: number) => void;
  beforeAutofill?: (this: Core, selectionData: CellValue[][], sourceRange: CellRange, targetRange: CellRange, direction: 'up' | 'down' | 'left' | 'right') => CellValue[][] | boolean | void;
  beforeBeginEditing?: (this: Core, row: number, column: number, initialValue: any, event: MouseEvent | KeyboardEvent, fullEditMode: boolean) => boolean | void;
  beforeCellAlignment?: (this: Core, stateBefore: { [row: number]: string[] }, range: CellRange[], type: 'horizontal' | 'vertical',
    alignmentClass: 'htLeft' | 'htCenter' | 'htRight' | 'htJustify' | 'htTop' | 'htMiddle' | 'htBottom') => void;
  beforeChange?: (this: Core, changes: Array<CellChange | null>, source: ChangeSource) => void | boolean;
  beforeChangeRender?: (this: Core, changes: CellChange[], source: ChangeSource) => void;
  beforeColumnCollapse?: (this: Core, currentCollapsedColumn: number[], destinationCollapsedColumns: number[], collapsePossible: boolean) => void | boolean;
  beforeColumnExpand?: (this: Core, currentCollapsedColumn: number[], destinationCollapsedColumns: number[], expandPossible: boolean) => void | boolean;
  beforeColumnFreeze?: (this: Core, columnIndex: number, isFreezingPerformed: boolean) => void | boolean;
  beforeColumnMove?: (this: Core, movedColumns: number[], finalIndex: number, dropIndex: number | undefined, movePossible: boolean) => void | boolean;
  beforeColumnResize?: (this: Core, newSize: number, column: number, isDoubleClick: boolean) => void | number;
  beforeColumnSort?: (this: Core, currentSortConfig: ColumnSortingConfig[], destinationSortConfigs: ColumnSortingConfig[]) => void | boolean;
  beforeColumnWrap?: (this: Core, isActionInterrupted: { value: boolean }, newCoords: CellCoords, isColumnFlipped: boolean) => void;
  beforeColumnUnfreeze?: (this: Core, columnIndex: number, isUnfreezingPerformed: boolean) => void | boolean;
  beforeContextMenuSetItems?: (this: Core, menuItems: ContextMenuMenuItemConfig[]) => void;
  beforeContextMenuShow?: (this: Core, context: ContextMenu) => void;
  beforeCopy?: (this: Core, data: CellValue[][], coords: RangeType[], copiedHeadersCount: { columnHeadersCount: number }) => void | boolean;
  beforeCreateCol?: (this: Core, index: number, amount: number, source?: ChangeSource) => void | boolean;
  beforeCreateRow?: (this: Core, index: number, amount: number, source?: ChangeSource) => void | boolean;
  beforeCut?: (this: Core, data: CellValue[][], coords: RangeType[]) => void | boolean;
  beforeDetachChild?: (this: Core, parent: RowObject, element: RowObject) => void;
  beforeDrawBorders?: (this: Core, corners: number[], borderClassName: 'current' | 'area' | 'highlight' | undefined) => void;
  beforeDropdownMenuSetItems?: (this: Core, menuItems: ContextMenuMenuItemConfig[]) => void;
  beforeDropdownMenuShow?: (this: Core, instance: DropdownMenu) => void;
  beforeFilter?: (this: Core, conditionsStack: FiltersColumnConditions[]) => void | boolean;
  beforeGetCellMeta?: (this: Core, row: number, column: number, cellProperties: CellProperties) => void;
  beforeHideColumns?: (this: Core, currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean) => void | boolean;
  beforeHideRows?: (this: Core, currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean) => void | boolean;
  beforeHighlightingColumnHeader?: (this: Core, column: number, headerLevel: number, highlightMeta: HookHighlightColumnHeaderMeta) => number | void;
  beforeHighlightingRowHeader?: (this: Core, row: number, headerLevel: number, highlightMeta: HookHighlightRowHeaderMeta) => number | void;
  beforeInit?: (this: Core, ) => void;
  beforeInitWalkontable?: (this: Core, walkontableConfig: object) => void;
  beforeKeyDown?: (this: Core, event: KeyboardEvent) => void;
  beforeLanguageChange?: (this: Core, languageCode: string) => void;
  beforeLoadData?: (this: Core, sourceData: CellValue[], initialLoad: boolean, source: string | undefined) => void;
  beforeMergeCells?: (this: Core, cellRange: CellRange, auto: boolean) => void;
  beforeOnCellContextMenu?: (this: Core, event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  beforeOnCellMouseDown?: (this: Core, event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement, controller: SelectionController) => void;
  beforeOnCellMouseOut?: (this: Core, event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  beforeOnCellMouseOver?: (this: Core, event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement, controller: SelectionController) => void;
  beforeOnCellMouseUp?: (this: Core, event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  beforePaste?: (this: Core, data: CellValue[][], coords: RangeType[]) => void | boolean;
  beforeRedo?: (this: Core, action: UndoRedoAction) => void;
  beforeRedoStackChange?: (this: Core, undoneActions: UndoRedoAction[]) => void;
  beforeRefreshDimensions?: (this: Core, previousDimensions: { width: number, height: number }, currentDimensions: { width: number, height: number }, actionPossible: boolean) => boolean | void;
  beforeRemoveCellClassNames?: (this: Core, ) => string[] | void;
  beforeRemoveCellMeta?: (this: Core, row: number, column: number, key: string, value: any) => void;
  beforeRemoveCol?: (this: Core, index: number, amount: number, physicalColumns: number[], source?: ChangeSource) => void;
  beforeRemoveRow?: (this: Core, index: number, amount: number, physicalColumns: number[], source?: ChangeSource) => void;
  beforeRender?: (this: Core, isForced: boolean) => void;
  beforeRenderer?: (this: Core, TD: HTMLTableCellElement, row: number, column: number, prop: string | number, value: CellValue, cellProperties: CellProperties) => void;
  beforeRowMove?: (this: Core, movedRows: number[], finalIndex: number, dropIndex: number | undefined, movePossible: boolean) => void;
  beforeRowResize?: (this: Core, newSize: number, row: number, isDoubleClick: boolean) => number | void;
  beforeRowWrap?: (this: Core, isActionInterrupted: { value: boolean }, newCoords: CellCoords, isRowFlipped: boolean) => void;
  beforeSelectColumns?: (this: Core, from: CellCoords, to: CellCoords, highlight: CellCoords) => void;
  beforeSelectionFocusSet?: (this: Core, coords: CellCoords) => void;
  beforeSelectionHighlightSet?: (this: Core, ) => void;
  beforeSelectRows?: (this: Core, from: CellCoords, to: CellCoords, highlight: CellCoords) => void;
  beforeSetCellMeta?: (this: Core, row: number, column: number, key: string, value: any) => boolean | void;
  beforeSetRangeEnd?: (this: Core, coords: CellCoords) => void;
  beforeSetRangeStart?: (this: Core, coords: CellCoords) => void;
  beforeSetRangeStartOnly?: (this: Core, coords: CellCoords) => void;
  beforeStretchingColumnWidth?: (this: Core, stretchedWidth: number, column: number) => void | number;
  beforeTouchScroll?: (this: Core, ) => void;
  beforeTrimRow?: (this: Core, currentTrimConfig: number[], destinationTrimConfig: number[], actionPossible: boolean) => void | boolean;
  beforeUndo?: (this: Core, action: UndoRedoAction) => void;
  beforeUndoStackChange?: (this: Core, doneActions: UndoRedoAction[], source?: string) => void;
  beforeUnhideColumns?: (this: Core, currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean) => void | boolean;
  beforeUnhideRows?: (this: Core, currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean) => void | boolean;
  beforeUnmergeCells?: (this: Core, cellRange: CellRange, auto: boolean) => void;
  beforeUntrimRow?: (this: Core, currentTrimConfig: number[], destinationTrimConfig: number[], actionPossible: boolean) => void | boolean;
  beforeUpdateData?: (this: Core, sourceData: CellValue[], initialLoad: boolean, source: string | undefined) => void;
  beforeValidate?: (this: Core, value: CellValue, row: number, prop: string | number, source?: ChangeSource) => void;
  beforeValueRender?: (this: Core, value: CellValue, cellProperties: CellProperties) => void;
  beforeViewportScrollVertically?: (this: Core, visualRow: number) => number | boolean;
  beforeViewportScrollHorizontally?: (this: Core, visualColumn: number) => number | boolean;
  beforeViewportScroll?: (this: Core, ) => void;
  beforeViewRender?: (this: Core, isForced: boolean, skipRender: { skipRender?: boolean }) => void;
  construct?: (this: Core, ) => void;
  init?: (this: Core, ) => void;
  modifyAutoColumnSizeSeed?: (this: Core, seed: string, cellProperties: CellProperties, cellValue: CellValue) => string | void;
  modifyAutofillRange?: (this: Core, startArea: Array<[number, number, number, number]>, entireArea: Array<[number, number, number, number]>) => void;
  modifyColHeader?: (this: Core, column: number) => void;
  modifyColumnHeaderHeight?: (this: Core, ) => void;
  modifyColumnHeaderValue?: (this: Core, headerValue: string, visualColumnIndex: number, headerLevel: number) => void | string;
  modifyColWidth?: (this: Core, width: number, column: number) => void;
  modifyCopyableRange?: (this: Core, copyableRanges: RangeType[]) => void;
  modifyFiltersMultiSelectValue?: (this: Core, value: string, meta: CellProperties) => void | CellValue;
  modifyFocusedElement?: (this: Core, row: number, column: number, focusedElement: HTMLElement) => void | HTMLElement;
  modifyData?: (this: Core, row: number, column: number, valueHolder: { value: CellValue }, ioMode: 'get' | 'set') => void;
  modifyFocusOnTabNavigation?: (this: Core, tabActivationDir: 'from_above' | 'from_below', visualCoords: CellCoords) => void;
  modifyGetCellCoords?: (this: Core, row: number, column: number, topmost: boolean) => void | [number, number] | [number, number, number, number];
  modifyRowData?: (this: Core, row: number) => void;
  modifyRowHeader?: (this: Core, row: number) => void;
  modifyRowHeaderWidth?: (this: Core, rowHeaderWidth: number) => void;
  modifyRowHeight?: (this: Core, height: number, row: number) => void | number;
  modifyRowHeightByOverlayName?: (this: Core, height: number, row: number, overlayType: OverlayType) => void | number;
  modifySourceData?: (this: Core, row: number, column: number, valueHolder: { value: CellValue }, ioMode: 'get' | 'set') => void;
  modifyTransformEnd?: (this: Core, delta: CellCoords) => void;
  modifyTransformFocus?: (this: Core, delta: CellCoords) => void;
  modifyTransformStart?: (this: Core, delta: CellCoords) => void;
  persistentStateLoad?: (this: Core, key: string, valuePlaceholder: { value: any }) => void;
  persistentStateReset?: (this: Core, key: string) => void;
  persistentStateSave?: (this: Core, key: string, value: any) => void;
}

export class Hooks {
  add<K extends keyof Events>(key: K, callback: Events[K] | Array<Events[K]>, context?: Core, orderIndex?: number): Hooks;
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
