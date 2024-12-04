import { ExportedChange } from 'hyperformula';
import CellCoords from '../../3rdparty/walkontable/src/cell/coords';
import CellRange from '../../3rdparty/walkontable/src/cell/range';
import { ViewportColumnsCalculator } from '../../3rdparty/walkontable/src/calculator/viewportColumns';
import Core from '../../core';
import { SelectionController } from '../../selection';
import {
  ContextMenu,
  PredefinedMenuItemKey as ContextMenuPredefinedMenuItemKey,
  MenuItemConfig as ContextMenuMenuItemConfig,
} from '../../plugins/contextMenu';
import {
  DropdownMenu,
} from '../../plugins/dropdownMenu';
import {
  Config as ColumnSortingConfig,
} from '../../plugins/columnSorting';
import {
  ColumnConditions as FiltersColumnConditions,
} from '../../plugins/filters';
import {
  Action as UndoRedoAction,
} from '../../plugins/undoRedo';
import {
  Settings as MergeCellsSettings,
} from '../../plugins/mergeCells';
import {
  GridSettings,
  CellProperties,
} from '../../settings';

import {
  CellValue,
  RowObject,
  CellChange,
  ChangeSource,
  RangeType,
  OverlayType,
} from '../../common';

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
  afterColumnSequenceChange?: (source: 'init' | 'move' | 'insert' | 'remove' | 'update') => void;
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
  afterFormulasValuesUpdate?: (changes: ExportedChange[]) => void;
  afterGetCellMeta?: (row: number, column: number, cellProperties: CellProperties) => void;
  afterGetColHeader?: (column: number, TH: HTMLTableHeaderCellElement, headerLevel: number) => void;
  afterGetColumnHeaderRenderers?: (renderers: Array<(column: number, TH: HTMLTableHeaderCellElement) => void>) => void;
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
  afterModifyTransformFocus?: (coords: CellCoords, rowTransformDir: -1 | 0, colTransformDir: -1 | 0) => void;
  afterModifyTransformStart?: (coords: CellCoords, rowTransformDir: -1 | 0, colTransformDir: -1 | 0) => void;
  afterMomentumScroll?: () => void;
  afterNamedExpressionAdded?: (namedExpressionName: string, changes: ExportedChange[]) => void;
  afterNamedExpressionRemoved?: (namedExpressionName: string, changes: ExportedChange[]) => void;
  afterOnCellContextMenu?: (event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  afterOnCellCornerDblClick?: (event: MouseEvent) => void;
  afterOnCellCornerMouseDown?: (event: MouseEvent) => void;
  afterOnCellMouseDown?: (event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  afterOnCellMouseOut?: (event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  afterOnCellMouseOver?: (event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  afterOnCellMouseUp?: (event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement) => void;
  afterPaste?: (data: CellValue[][], coords: RangeType[]) => void;
  afterPluginsInitialized?: () => void;
  afterRedo?: (action: UndoRedoAction) => void;
  afterRedoStackChange?: (undoneActionsBefore: UndoRedoAction[], undoneActionsAfter: UndoRedoAction[]) => void;
  afterRefreshDimensions?: (previousDimensions: { width: number, height: number }, currentDimensions: { width: number, height: number }, stateChanged: boolean) => void;
  afterRemoveCellMeta?: (row: number, column: number, key: string, value: any) => void;
  afterRemoveCol?: (index: number, amount: number, physicalColumns: number[], source?: ChangeSource) => void;
  afterRemoveRow?: (index: number, amount: number, physicalRows: number[], source?: ChangeSource) => void;
  afterRender?: (isForced: boolean) => void;
  afterRenderer?: (TD: HTMLTableCellElement, row: number, column: number, prop: string | number, value: string, cellProperties: CellProperties) => void;
  afterRowMove?: (movedRows: number[], finalIndex: number, dropIndex: number | undefined, movePossible: boolean, orderChanged: boolean) => void;
  afterRowResize?: (newSize: number, row: number, isDoubleClick: boolean) => void;
  afterRowSequenceChange?: (source: 'init' | 'move' | 'insert' | 'remove' | 'update') => void;
  afterScrollHorizontally?: () => void;
  afterScrollVertically?: () => void;
  afterScroll?: () => void;
  afterSelectColumns?: (from: CellCoords, to: CellCoords, highlight: CellCoords) => void;
  afterSelection?: (row: number, column: number, row2: number, column2: number, preventScrolling: { value: boolean }, selectionLayerLevel: number) => void;
  afterSelectionByProp?: (row: number, prop: string, row2: number, prop2: string, preventScrolling: { value: boolean }, selectionLayerLevel: number) => void;
  afterSelectionEnd?: (row: number, column: number, row2: number, column2: number, selectionLayerLevel: number) => void;
  afterSelectionEndByProp?: (row: number, prop: string, row2: number, prop2: string, selectionLayerLevel: number) => void;
  afterSelectionFocusSet?: (row: number, column: number, preventScrolling: { value: boolean }) => void;
  afterSelectRows?: (from: CellCoords, to: CellCoords, highlight: CellCoords) => void;
  afterSetCellMeta?: (row: number, column: number, key: string, value: any) => void;
  afterSetDataAtCell?: (changes: CellChange[], source?: ChangeSource) => void;
  afterSetDataAtRowProp?: (changes: CellChange[], source?: ChangeSource) => void;
  afterSetSourceDataAtCell?: (changes: CellChange[], source?: ChangeSource) => void;
  afterSetTheme?: (themeName: string|boolean|undefined, firstRun: boolean) => void;
  afterSheetAdded?: (addedSheetDisplayName: string) => void;
  afterSheetRemoved?: (removedSheetDisplayName: string, changes: ExportedChange[]) => void;
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
  beforeBeginEditing?: (row: number, column: number, initialValue: any, event: MouseEvent | KeyboardEvent, fullEditMode: boolean) => boolean | void;
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
  beforeColumnWrap?: (isActionInterrupted: { value: boolean }, newCoords: CellCoords, isColumnFlipped: boolean) => void;
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
  beforeFilter?: (conditionsStack: FiltersColumnConditions[], previousConditionsStack: FiltersColumnConditions[]) => void | boolean;
  beforeGetCellMeta?: (row: number, column: number, cellProperties: CellProperties) => void;
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
  beforeRefreshDimensions?: (previousDimensions: { width: number, height: number }, currentDimensions: { width: number, height: number }, actionPossible: boolean) => boolean | void;
  beforeRemoveCellClassNames?: () => string[] | void;
  beforeRemoveCellMeta?: (row: number, column: number, key: string, value: any) => void;
  beforeRemoveCol?: (index: number, amount: number, physicalColumns: number[], source?: ChangeSource) => void;
  beforeRemoveRow?: (index: number, amount: number, physicalColumns: number[], source?: ChangeSource) => void;
  beforeRender?: (isForced: boolean) => void;
  beforeRenderer?: (TD: HTMLTableCellElement, row: number, column: number, prop: string | number, value: CellValue, cellProperties: CellProperties) => void;
  beforeRowMove?: (movedRows: number[], finalIndex: number, dropIndex: number | undefined, movePossible: boolean) => void;
  beforeRowResize?: (newSize: number, row: number, isDoubleClick: boolean) => number | void;
  beforeRowWrap?: (isActionInterrupted: { value: boolean }, newCoords: CellCoords, isRowFlipped: boolean) => void;
  beforeSelectColumns?: (from: CellCoords, to: CellCoords, highlight: CellCoords) => void;
  beforeSelectionFocusSet?: (coords: CellCoords) => void;
  beforeSelectionHighlightSet?: () => void;
  beforeSelectRows?: (from: CellCoords, to: CellCoords, highlight: CellCoords) => void;
  beforeSetCellMeta?: (row: number, column: number, key: string, value: any) => boolean | void;
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
  beforeViewportScrollVertically?: (visualRow: number, snapping: 'auto' | 'top' | 'bottom') => number | boolean | null;
  beforeViewportScrollHorizontally?: (visualColumn: number, snapping: 'auto' | 'start' | 'end') => number | boolean | null;
  beforeViewportScroll?: () => void;
  beforeViewRender?: (isForced: boolean, skipRender: { skipRender?: boolean }) => void;
  construct?: () => void;
  init?: () => void;
  modifyAutoColumnSizeSeed?: (seed: string, cellProperties: CellProperties, cellValue: CellValue) => string | void;
  modifyAutofillRange?: (startArea: Array<[number, number, number, number]>, entireArea: Array<[number, number, number, number]>) => void;
  modifyColHeader?: (column: number) => void;
  modifyColumnHeaderHeight?: () => void;
  modifyColumnHeaderValue?: (headerValue: string, visualColumnIndex: number, headerLevel: number) => void | string;
  modifyColWidth?: (width: number, column: number, source?: string) => void;
  modifyCopyableRange?: (copyableRanges: RangeType[]) => void;
  modifyFiltersMultiSelectValue?: (value: string, meta: CellProperties) => void | CellValue;
  modifyFocusedElement?: (row: number, column: number, focusedElement: HTMLElement) => void | HTMLElement;
  modifyData?: (row: number, column: number, valueHolder: { value: CellValue }, ioMode: 'get' | 'set') => void;
  modifyFocusOnTabNavigation?: (tabActivationDir: 'from_above' | 'from_below', visualCoords: CellCoords) => void;
  modifyGetCellCoords?: (row: number, column: number, topmost: boolean, source: string | undefined) => void | [number, number] | [number, number, number, number];
  modifyGetCoordsElement?: (row: number, column: number) => void | [number, number];
  modifyRowData?: (row: number) => void;
  modifyRowHeader?: (row: number) => void;
  modifyRowHeaderWidth?: (rowHeaderWidth: number) => void;
  modifyRowHeight?: (height: number, row: number, source?: string) => void | number;
  modifyRowHeightByOverlayName?: (height: number, row: number, overlayType: OverlayType) => void | number;
  modifySourceData?: (row: number, column: number, valueHolder: { value: CellValue }, ioMode: 'get' | 'set') => void;
  modifyTransformEnd?: (delta: CellCoords) => void;
  modifyTransformFocus?: (delta: CellCoords) => void;
  modifyTransformStart?: (delta: CellCoords) => void;
  persistentStateLoad?: (key: string, valuePlaceholder: { value: any }) => void;
  persistentStateReset?: (key: string) => void;
  persistentStateSave?: (key: string, value: any) => void;
}

export class Hooks {
  add<K extends keyof Events>(key: K, callback: Events[K] | Array<Events[K]>, context?: Core, orderIndex?: number): Hooks;
  addAsFixed<K extends keyof Events>(key: K, callback: Events[K] | Array<Events[K]>, context?: Core, orderIndex?: number): Hooks;
  deregister(key: string): void;
  destroy(context?: Core): void;
  getRegistered(): Array<keyof Events>;
  has(key: keyof Events, context?: Core): boolean;
  isDeprecated(key: keyof Events): boolean;
  isRegistered(key: keyof Events): boolean;
  once<K extends keyof Events>(key: K, callback: Events[K] | Array<Events[K]>, context?: Core): Hooks;
  register(key: string): void;
  remove(key: keyof Events, callback: () => void, context?: Core): boolean;
  run(context: Core, key: keyof Events, p1?: any, p2?: any, p3?: any, p4?: any, p5?: any, p6?: any): any;
}
