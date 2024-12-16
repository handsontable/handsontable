import {
  AfterViewInit,
  Component,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import Handsontable from 'handsontable/base';
import {
  HotTableRegisterer,
  HOT_DESTROYED_WARNING
} from './hot-table-registerer.service';
import { HotSettingsResolver } from './hot-settings-resolver.service';
import { HotColumnComponent } from './hot-column.component';

@Component({
  selector: 'hot-table',
  template: '<div #container [id]="hotId"></div>',
  encapsulation: ViewEncapsulation.None,
  providers: [ HotTableRegisterer, HotSettingsResolver ],
})
export class HotTableComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('container', { static: false }) public container;

  private __hotInstance: Handsontable | null = null;
  private columnsComponents: HotColumnComponent[] = [];
  // component inputs
  @Input() settings: Handsontable.GridSettings;
  @Input() hotId = '';
  // handsontable options
  @Input() activeHeaderClassName: Handsontable.GridSettings['activeHeaderClassName'];
  @Input() allowEmpty: Handsontable.GridSettings['allowEmpty'];
  @Input() allowHtml: Handsontable.GridSettings['allowHtml'];
  @Input() allowInsertColumn: Handsontable.GridSettings['allowInsertColumn'];
  @Input() allowInsertRow: Handsontable.GridSettings['allowInsertRow'];
  @Input() allowInvalid: Handsontable.GridSettings['allowInvalid'];
  @Input() allowRemoveColumn: Handsontable.GridSettings['allowRemoveColumn'];
  @Input() allowRemoveRow: Handsontable.GridSettings['allowRemoveRow'];
  @Input() ariaTags: Handsontable.GridSettings['ariaTags'];
  @Input() autoColumnSize: Handsontable.GridSettings['autoColumnSize'];
  @Input() autoRowSize: Handsontable.GridSettings['autoRowSize'];
  @Input() autoWrapCol: Handsontable.GridSettings['autoWrapCol'];
  @Input() autoWrapRow: Handsontable.GridSettings['autoWrapRow'];
  @Input() bindRowsWithHeaders: Handsontable.GridSettings['bindRowsWithHeaders'];
  @Input() cell: Handsontable.GridSettings['cell'];
  @Input() cells: Handsontable.GridSettings['cells'];
  @Input() checkedTemplate: Handsontable.GridSettings['checkedTemplate'];
  @Input() className: Handsontable.GridSettings['className'];
  @Input() colHeaders: Handsontable.GridSettings['colHeaders'];
  @Input() collapsibleColumns: Handsontable.GridSettings['collapsibleColumns'];
  @Input() columnHeaderHeight: Handsontable.GridSettings['columnHeaderHeight'];
  @Input() columns: Handsontable.GridSettings['columns'];
  @Input() columnSorting: Handsontable.GridSettings['columnSorting'];
  @Input() columnSummary: Handsontable.GridSettings['columnSummary'];
  @Input() colWidths: Handsontable.GridSettings['colWidths'];
  @Input() commentedCellClassName: Handsontable.GridSettings['commentedCellClassName'];
  @Input() comments: Handsontable.GridSettings['comments'];
  @Input() contextMenu: Handsontable.GridSettings['contextMenu'];
  @Input() copyable: Handsontable.GridSettings['copyable'];
  @Input() copyPaste: Handsontable.GridSettings['copyPaste'];
  @Input() correctFormat: Handsontable.GridSettings['correctFormat'];
  @Input() currentColClassName: Handsontable.GridSettings['currentColClassName'];
  @Input() currentHeaderClassName: Handsontable.GridSettings['currentHeaderClassName'];
  @Input() currentRowClassName: Handsontable.GridSettings['currentRowClassName'];
  @Input() customBorders: Handsontable.GridSettings['customBorders'];
  @Input() data: Handsontable.GridSettings['data'];
  @Input() dataDotNotation: Handsontable.GridSettings['dataDotNotation'];
  @Input() dataSchema: Handsontable.GridSettings['dataSchema'];
  @Input() dateFormat: Handsontable.GridSettings['dateFormat'];
  @Input() datePickerConfig: Handsontable.GridSettings['datePickerConfig'];
  @Input() defaultDate: Handsontable.GridSettings['defaultDate'];
  @Input() tabNavigation: Handsontable.GridSettings['tabNavigation'];
  @Input() themeName: Handsontable.GridSettings['themeName'];
  @Input() disableVisualSelection: Handsontable.GridSettings['disableVisualSelection'];
  @Input() dragToScroll: Handsontable.GridSettings['dragToScroll'];
  @Input() dropdownMenu: Handsontable.GridSettings['dropdownMenu'];
  @Input() editor: Handsontable.GridSettings['editor'];
  @Input() enterBeginsEditing: Handsontable.GridSettings['enterBeginsEditing'];
  @Input() enterMoves: Handsontable.GridSettings['enterMoves'];
  @Input() fillHandle: Handsontable.GridSettings['fillHandle'];
  @Input() filter: Handsontable.GridSettings['filter'];
  @Input() filteringCaseSensitive: Handsontable.GridSettings['filteringCaseSensitive'];
  @Input() filters: Handsontable.GridSettings['filters'];
  @Input() fixedColumnsLeft: Handsontable.GridSettings['fixedColumnsLeft'];
  @Input() fixedColumnsStart: Handsontable.GridSettings['fixedColumnsStart'];
  @Input() fixedRowsBottom: Handsontable.GridSettings['fixedRowsBottom'];
  @Input() fixedRowsTop: Handsontable.GridSettings['fixedRowsTop'];
  @Input() formulas: Handsontable.GridSettings['formulas'];
  @Input() fragmentSelection: Handsontable.GridSettings['fragmentSelection'];
  @Input() headerClassName: Handsontable.GridSettings['headerClassName'];
  @Input() height: Handsontable.GridSettings['height'];
  @Input() hiddenColumns: Handsontable.GridSettings['hiddenColumns'];
  @Input() hiddenRows: Handsontable.GridSettings['hiddenRows'];
  @Input() invalidCellClassName: Handsontable.GridSettings['invalidCellClassName'];
  @Input() imeFastEdit: Handsontable.GridSettings['imeFastEdit'];
  @Input() label: Handsontable.GridSettings['label'];
  @Input() language: Handsontable.GridSettings['language'];
  @Input() layoutDirection: Handsontable.GridSettings['layoutDirection'];
  @Input() licenseKey: Handsontable.GridSettings['licenseKey'];
  @Input() locale: Handsontable.GridSettings['locale'];
  @Input() manualColumnFreeze: Handsontable.GridSettings['manualColumnFreeze'];
  @Input() manualColumnMove: Handsontable.GridSettings['manualColumnMove'];
  @Input() manualColumnResize: Handsontable.GridSettings['manualColumnResize'];
  @Input() manualRowMove: Handsontable.GridSettings['manualRowMove'];
  @Input() manualRowResize: Handsontable.GridSettings['manualRowResize'];
  @Input() maxCols: Handsontable.GridSettings['maxCols'];
  @Input() maxRows: Handsontable.GridSettings['maxRows'];
  @Input() mergeCells: Handsontable.GridSettings['mergeCells'];
  @Input() minCols: Handsontable.GridSettings['minCols'];
  @Input() minRows: Handsontable.GridSettings['minRows'];
  @Input() minSpareCols: Handsontable.GridSettings['minSpareCols'];
  @Input() minSpareRows: Handsontable.GridSettings['minSpareRows'];
  @Input() multiColumnSorting: Handsontable.GridSettings['multiColumnSorting'];
  @Input() navigableHeaders: Handsontable.GridSettings['navigableHeaders'];
  @Input() nestedHeaders: Handsontable.GridSettings['nestedHeaders'];
  @Input() nestedRows: Handsontable.GridSettings['nestedRows'];
  @Input() noWordWrapClassName: Handsontable.GridSettings['noWordWrapClassName'];
  @Input() numericFormat: Handsontable.GridSettings['numericFormat'];
  @Input() observeDOMVisibility: Handsontable.GridSettings['observeDOMVisibility'];
  @Input() outsideClickDeselects: Handsontable.GridSettings['outsideClickDeselects'];
  @Input() persistentState: Handsontable.GridSettings['persistentState'];
  @Input() placeholder: Handsontable.GridSettings['placeholder'];
  @Input() placeholderCellClassName: Handsontable.GridSettings['placeholderCellClassName'];
  @Input() preventOverflow: Handsontable.GridSettings['preventOverflow'];
  @Input() preventWheel: Handsontable.GridSettings['preventWheel'];
  @Input() readOnly: Handsontable.GridSettings['readOnly'];
  @Input() readOnlyCellClassName: Handsontable.GridSettings['readOnlyCellClassName'];
  @Input() renderAllColumns: Handsontable.GridSettings['renderAllColumns'];
  @Input() renderAllRows: Handsontable.GridSettings['renderAllRows'];
  @Input() renderer: Handsontable.GridSettings['renderer'];
  @Input() rowHeaders: Handsontable.GridSettings['rowHeaders'];
  @Input() rowHeaderWidth: Handsontable.GridSettings['rowHeaderWidth'];
  @Input() rowHeights: Handsontable.GridSettings['rowHeights'];
  @Input() search: Handsontable.GridSettings['search'];
  @Input() selectionMode: Handsontable.GridSettings['selectionMode'];
  @Input() selectOptions: Handsontable.GridSettings['selectOptions'];
  @Input() skipColumnOnPaste: Handsontable.GridSettings['skipColumnOnPaste'];
  @Input() skipRowOnPaste: any;
  @Input() sortByRelevance: Handsontable.GridSettings['sortByRelevance'];
  @Input() source: Handsontable.GridSettings['source'];
  @Input() startCols: Handsontable.GridSettings['startCols'];
  @Input() startRows: Handsontable.GridSettings['startRows'];
  @Input() stretchH: Handsontable.GridSettings['stretchH'];
  @Input() strict: Handsontable.GridSettings['strict'];
  @Input() tableClassName: Handsontable.GridSettings['tableClassName'];
  @Input() tabMoves: Handsontable.GridSettings['tabMoves'];
  @Input() title: Handsontable.GridSettings['title'];
  @Input() trimDropdown: Handsontable.GridSettings['trimDropdown'];
  @Input() trimRows: Handsontable.GridSettings['nestedRows'];
  @Input() trimWhitespace: Handsontable.GridSettings['trimWhitespace'];
  @Input() type: Handsontable.GridSettings['type'];
  @Input() uncheckedTemplate: Handsontable.GridSettings['uncheckedTemplate'];
  @Input() undo: Handsontable.GridSettings['undo'];
  @Input() validator: Handsontable.GridSettings['validator'];
  @Input() viewportColumnRenderingOffset: Handsontable.GridSettings['viewportColumnRenderingOffset'];
  @Input() viewportRowRenderingOffset: Handsontable.GridSettings['viewportRowRenderingOffset'];
  @Input() visibleRows: Handsontable.GridSettings['visibleRows'];
  @Input() width: Handsontable.GridSettings['width'];
  @Input() wordWrap: Handsontable.GridSettings['wordWrap'];

  // handsontable hooks
  @Input() afterAddChild: Handsontable.GridSettings['afterAddChild'];
  @Input() afterAutofill: Handsontable.GridSettings['afterAutofill'];
  @Input() afterBeginEditing: Handsontable.GridSettings['afterBeginEditing'];
  @Input() afterCellMetaReset: Handsontable.GridSettings['afterCellMetaReset'];
  @Input() afterChange: Handsontable.GridSettings['afterChange'];
  @Input() afterChangesObserved: Handsontable.GridSettings['afterChangesObserved'];
  @Input() afterColumnCollapse: Handsontable.GridSettings['afterColumnCollapse'];
  @Input() afterColumnExpand: Handsontable.GridSettings['afterColumnExpand'];
  @Input() afterColumnFreeze: Handsontable.GridSettings['afterColumnFreeze'];
  @Input() afterColumnMove: Handsontable.GridSettings['afterColumnMove'];
  @Input() afterColumnResize: Handsontable.GridSettings['afterColumnResize'];
  @Input() afterColumnSequenceChange: Handsontable.GridSettings['afterColumnSequenceChange'];
  @Input() afterColumnSort: Handsontable.GridSettings['afterColumnSort'];
  @Input() afterColumnUnfreeze: Handsontable.GridSettings['afterColumnUnfreeze'];
  @Input() afterContextMenuDefaultOptions: Handsontable.GridSettings['afterContextMenuDefaultOptions'];
  @Input() afterContextMenuHide: Handsontable.GridSettings['afterContextMenuHide'];
  @Input() afterContextMenuShow: Handsontable.GridSettings['afterContextMenuShow'];
  @Input() afterCopy: Handsontable.GridSettings['afterCopy'];
  @Input() afterCopyLimit: Handsontable.GridSettings['afterCopyLimit'];
  @Input() afterCreateCol: Handsontable.GridSettings['afterCreateCol'];
  @Input() afterCreateRow: Handsontable.GridSettings['afterCreateRow'];
  @Input() afterCut: Handsontable.GridSettings['afterCut'];
  @Input() afterDeselect: Handsontable.GridSettings['afterDeselect'];
  @Input() afterDestroy: Handsontable.GridSettings['afterDestroy'];
  @Input() afterDetachChild: Handsontable.GridSettings['afterDetachChild'];
  @Input() afterDocumentKeyDown: Handsontable.GridSettings['afterDocumentKeyDown'];
  @Input() afterDrawSelection: Handsontable.GridSettings['afterDrawSelection'];
  @Input() afterDropdownMenuDefaultOptions: Handsontable.GridSettings['afterDropdownMenuDefaultOptions'];
  @Input() afterDropdownMenuHide: Handsontable.GridSettings['afterDropdownMenuHide'];
  @Input() afterDropdownMenuShow: Handsontable.GridSettings['afterDropdownMenuShow'];
  @Input() afterFilter: Handsontable.GridSettings['afterFilter'];
  @Input() afterFormulasValuesUpdate: Handsontable.GridSettings['afterFormulasValuesUpdate'];
  @Input() afterGetCellMeta: Handsontable.GridSettings['afterGetCellMeta'];
  @Input() afterGetColHeader: Handsontable.GridSettings['afterGetColHeader'];
  @Input() afterGetColumnHeaderRenderers: Handsontable.GridSettings['afterGetColumnHeaderRenderers'];
  @Input() afterGetRowHeader: Handsontable.GridSettings['afterGetRowHeader'];
  @Input() afterGetRowHeaderRenderers: Handsontable.GridSettings['afterGetRowHeaderRenderers'];
  @Input() afterHideColumns: Handsontable.GridSettings['afterHideColumns'];
  @Input() afterHideRows: Handsontable.GridSettings['afterHideRows'];
  @Input() afterInit: Handsontable.GridSettings['afterInit'];
  @Input() afterLanguageChange: Handsontable.GridSettings['afterLanguageChange'];
  @Input() afterListen: Handsontable.GridSettings['afterListen'];
  @Input() afterLoadData: Handsontable.GridSettings['afterLoadData'];
  @Input() afterMergeCells: Handsontable.GridSettings['afterMergeCells'];
  @Input() afterModifyTransformEnd: Handsontable.GridSettings['afterModifyTransformEnd'];
  @Input() afterModifyTransformFocus: Handsontable.GridSettings['afterModifyTransformFocus'];
  @Input() afterModifyTransformStart: Handsontable.GridSettings['afterModifyTransformStart'];
  @Input() afterMomentumScroll: Handsontable.GridSettings['afterMomentumScroll'];
  @Input() afterNamedExpressionAdded: Handsontable.GridSettings['afterNamedExpressionAdded'];
  @Input() afterNamedExpressionRemoved: Handsontable.GridSettings['afterNamedExpressionRemoved'];
  @Input() afterOnCellContextMenu: Handsontable.GridSettings['afterOnCellContextMenu'];
  @Input() afterOnCellCornerDblClick: Handsontable.GridSettings['afterOnCellCornerDblClick'];
  @Input() afterOnCellCornerMouseDown: Handsontable.GridSettings['afterOnCellCornerMouseDown'];
  @Input() afterOnCellMouseDown: Handsontable.GridSettings['afterOnCellMouseDown'];
  @Input() afterOnCellMouseOut: Handsontable.GridSettings['afterOnCellMouseOut'];
  @Input() afterOnCellMouseOver: Handsontable.GridSettings['afterOnCellMouseOver'];
  @Input() afterOnCellMouseUp: Handsontable.GridSettings['afterOnCellMouseUp'];
  @Input() afterPaste: Handsontable.GridSettings['afterPaste'];
  @Input() afterPluginsInitialized: Handsontable.GridSettings['afterPluginsInitialized'];
  @Input() afterRedo: Handsontable.GridSettings['afterRedo'];
  @Input() afterRedoStackChange: Handsontable.GridSettings['afterRedoStackChange'];
  @Input() afterRefreshDimensions: Handsontable.GridSettings['afterRefreshDimensions'];
  @Input() afterRemoveCellMeta: Handsontable.GridSettings['afterRemoveCellMeta'];
  @Input() afterRemoveCol: Handsontable.GridSettings['afterRemoveCol'];
  @Input() afterRemoveRow: Handsontable.GridSettings['afterRemoveRow'];
  @Input() afterRender: Handsontable.GridSettings['afterRender'];
  @Input() afterRenderer: Handsontable.GridSettings['afterRenderer'];
  @Input() afterRowMove: Handsontable.GridSettings['afterRowMove'];
  @Input() afterRowResize: Handsontable.GridSettings['afterRowResize'];
  @Input() afterRowSequenceChange: Handsontable.GridSettings['afterRowSequenceChange'];
  @Input() afterScrollHorizontally: Handsontable.GridSettings['afterScrollHorizontally'];
  @Input() afterScrollVertically: Handsontable.GridSettings['afterScrollVertically'];
  @Input() afterScroll: Handsontable.GridSettings['afterScroll'];
  @Input() afterSelectColumns: Handsontable.GridSettings['afterSelectColumns'];
  @Input() afterSelection: Handsontable.GridSettings['afterSelection'];
  @Input() afterSelectionByProp: Handsontable.GridSettings['afterSelectionByProp'];
  @Input() afterSelectionEnd: Handsontable.GridSettings['afterSelectionEnd'];
  @Input() afterSelectionEndByProp: Handsontable.GridSettings['afterSelectionEndByProp'];
  @Input() afterSelectionFocusSet: Handsontable.GridSettings['afterSelectionFocusSet'];
  @Input() afterSelectRows: Handsontable.GridSettings['afterSelectRows'];
  @Input() afterSetCellMeta: Handsontable.GridSettings['afterSetCellMeta'];
  @Input() afterSetDataAtCell: Handsontable.GridSettings['afterSetDataAtCell'];
  @Input() afterSetDataAtRowProp: Handsontable.GridSettings['afterSetDataAtRowProp'];
  @Input() afterSetSourceDataAtCell: Handsontable.GridSettings['afterSetSourceDataAtCell'];
  @Input() afterSetTheme: Handsontable.GridSettings['afterSetTheme'];
  @Input() afterSheetAdded: Handsontable.GridSettings['afterSheetAdded'];
  @Input() afterSheetRenamed: Handsontable.GridSettings['afterSheetRenamed'];
  @Input() afterSheetRemoved: Handsontable.GridSettings['afterSheetRemoved'];
  @Input() afterTrimRow: Handsontable.GridSettings['afterTrimRow'];
  @Input() afterUndo: Handsontable.GridSettings['afterUndo'];
  @Input() afterUndoStackChange: Handsontable.GridSettings['afterUndoStackChange'];
  @Input() afterUnhideColumns: Handsontable.GridSettings['afterUnhideColumns'];
  @Input() afterUnhideRows: Handsontable.GridSettings['afterUnhideRows'];
  @Input() afterUnlisten: Handsontable.GridSettings['afterUnlisten'];
  @Input() afterUnmergeCells: Handsontable.GridSettings['afterUnmergeCells'];
  @Input() afterUntrimRow: Handsontable.GridSettings['afterUntrimRow'];
  @Input() afterUpdateData: Handsontable.GridSettings['afterUpdateData'];
  @Input() afterUpdateSettings: Handsontable.GridSettings['afterUpdateSettings'];
  @Input() afterValidate: Handsontable.GridSettings['afterValidate'];
  @Input() afterViewportColumnCalculatorOverride: Handsontable.GridSettings['afterViewportColumnCalculatorOverride'];
  @Input() afterViewportRowCalculatorOverride: Handsontable.GridSettings['afterViewportRowCalculatorOverride'];
  @Input() afterViewRender: Handsontable.GridSettings['afterViewRender'];
  @Input() beforeAddChild: Handsontable.GridSettings['beforeAddChild'];
  @Input() beforeAutofill: Handsontable.GridSettings['beforeAutofill'];
  @Input() beforeBeginEditing: Handsontable.GridSettings['beforeBeginEditing'];
  @Input() beforeCellAlignment: Handsontable.GridSettings['beforeCellAlignment'];
  @Input() beforeChange: Handsontable.GridSettings['beforeChange'];
  @Input() beforeChangeRender: Handsontable.GridSettings['beforeChangeRender'];
  @Input() beforeColumnCollapse: Handsontable.GridSettings['beforeColumnCollapse'];
  @Input() beforeColumnExpand: Handsontable.GridSettings['beforeColumnExpand'];
  @Input() beforeColumnFreeze: Handsontable.GridSettings['beforeColumnFreeze'];
  @Input() beforeColumnMove: Handsontable.GridSettings['beforeColumnMove'];
  @Input() beforeColumnResize: Handsontable.GridSettings['beforeColumnResize'];
  @Input() beforeColumnSort: Handsontable.GridSettings['beforeColumnSort'];
  @Input() beforeColumnWrap: Handsontable.GridSettings['beforeColumnWrap'];
  @Input() beforeColumnUnfreeze: Handsontable.GridSettings['beforeColumnUnfreeze'];
  @Input() beforeContextMenuSetItems: Handsontable.GridSettings['beforeContextMenuSetItems'];
  @Input() beforeContextMenuShow: Handsontable.GridSettings['beforeContextMenuShow'];
  @Input() beforeCopy: Handsontable.GridSettings['beforeCopy'];
  @Input() beforeCreateCol: Handsontable.GridSettings['beforeCreateCol'];
  @Input() beforeCreateRow: Handsontable.GridSettings['beforeCreateRow'];
  @Input() beforeCut: Handsontable.GridSettings['beforeCut'];
  @Input() beforeDetachChild: Handsontable.GridSettings['beforeDetachChild'];
  @Input() beforeDrawBorders: Handsontable.GridSettings['beforeDrawBorders'];
  @Input() beforeDropdownMenuSetItems: Handsontable.GridSettings['beforeDropdownMenuSetItems'];
  @Input() beforeDropdownMenuShow: Handsontable.GridSettings['beforeDropdownMenuShow'];
  @Input() beforeFilter: Handsontable.GridSettings['beforeFilter'];
  @Input() beforeGetCellMeta: Handsontable.GridSettings['beforeGetCellMeta'];
  @Input() beforeHideColumns: Handsontable.GridSettings['beforeHideColumns'];
  @Input() beforeHideRows: Handsontable.GridSettings['beforeHideRows'];
  @Input() beforeHighlightingColumnHeader: Handsontable.GridSettings['beforeHighlightingColumnHeader'];
  @Input() beforeHighlightingRowHeader: Handsontable.GridSettings['beforeHighlightingRowHeader'];
  @Input() beforeInit: Handsontable.GridSettings['beforeInit'];
  @Input() beforeInitWalkontable: Handsontable.GridSettings['beforeInitWalkontable'];
  @Input() beforeKeyDown: Handsontable.GridSettings['beforeKeyDown'];
  @Input() beforeLanguageChange: Handsontable.GridSettings['beforeLanguageChange'];
  @Input() beforeLoadData: Handsontable.GridSettings['beforeLoadData'];
  @Input() beforeMergeCells: Handsontable.GridSettings['beforeMergeCells'];
  @Input() beforeOnCellContextMenu: Handsontable.GridSettings['beforeOnCellContextMenu'];
  @Input() beforeOnCellMouseDown: Handsontable.GridSettings['beforeOnCellMouseDown'];
  @Input() beforeOnCellMouseOut: Handsontable.GridSettings['beforeOnCellMouseOut'];
  @Input() beforeOnCellMouseOver: Handsontable.GridSettings['beforeOnCellMouseOver'];
  @Input() beforeOnCellMouseUp: Handsontable.GridSettings['beforeOnCellMouseUp'];
  @Input() beforePaste: Handsontable.GridSettings['beforePaste'];
  @Input() beforeRedo: Handsontable.GridSettings['beforeRedo'];
  @Input() beforeRedoStackChange: Handsontable.GridSettings['beforeRedoStackChange'];
  @Input() beforeRefreshDimensions: Handsontable.GridSettings['beforeRefreshDimensions'];
  @Input() beforeRemoveCellClassNames: Handsontable.GridSettings['beforeRemoveCellClassNames'];
  @Input() beforeRemoveCellMeta: Handsontable.GridSettings['beforeRemoveCellMeta'];
  @Input() beforeRemoveCol: Handsontable.GridSettings['beforeRemoveCol'];
  @Input() beforeRemoveRow: Handsontable.GridSettings['beforeRemoveRow'];
  @Input() beforeRender: Handsontable.GridSettings['beforeRender'];
  @Input() beforeRenderer: Handsontable.GridSettings['beforeRenderer'];
  @Input() beforeRowMove: Handsontable.GridSettings['beforeRowMove'];
  @Input() beforeRowResize: Handsontable.GridSettings['beforeRowResize'];
  @Input() beforeRowWrap: Handsontable.GridSettings['beforeRowWrap'];
  @Input() beforeSelectColumns: Handsontable.GridSettings['beforeSelectColumns'];
  @Input() beforeSelectionFocusSet: Handsontable.GridSettings['beforeSelectionFocusSet'];
  @Input() beforeSelectionHighlightSet: Handsontable.GridSettings['beforeSelectionHighlightSet'];
  @Input() beforeSelectRows: Handsontable.GridSettings['beforeSelectRows'];
  @Input() beforeSetCellMeta: Handsontable.GridSettings['beforeSetCellMeta'];
  @Input() beforeSetRangeEnd: Handsontable.GridSettings['beforeSetRangeEnd'];
  @Input() beforeSetRangeStart: Handsontable.GridSettings['beforeSetRangeStart'];
  @Input() beforeSetRangeStartOnly: Handsontable.GridSettings['beforeSetRangeStartOnly'];
  @Input() beforeStretchingColumnWidth: Handsontable.GridSettings['beforeStretchingColumnWidth'];
  @Input() beforeTouchScroll: Handsontable.GridSettings['beforeTouchScroll'];
  @Input() beforeTrimRow: Handsontable.GridSettings['beforeTrimRow'];
  @Input() beforeUndo: Handsontable.GridSettings['beforeUndo'];
  @Input() beforeUndoStackChange: Handsontable.GridSettings['beforeUndoStackChange'];
  @Input() beforeUnhideColumns: Handsontable.GridSettings['beforeUnhideColumns'];
  @Input() beforeUnhideRows: Handsontable.GridSettings['beforeUnhideRows'];
  @Input() beforeUnmergeCells: Handsontable.GridSettings['beforeUnmergeCells'];
  @Input() beforeUntrimRow: Handsontable.GridSettings['beforeUntrimRow'];
  @Input() beforeUpdateData: Handsontable.GridSettings['beforeUpdateData'];
  @Input() beforeValidate: Handsontable.GridSettings['beforeValidate'];
  @Input() beforeValueRender: Handsontable.GridSettings['beforeValueRender'];
  @Input() beforeViewportScroll: Handsontable.GridSettings['beforeViewportScroll'];
  @Input() beforeViewportScrollHorizontally: Handsontable.GridSettings['beforeViewportScrollHorizontally'];
  @Input() beforeViewportScrollVertically: Handsontable.GridSettings['beforeViewportScrollVertically'];
  @Input() beforeViewRender: Handsontable.GridSettings['beforeViewRender'];
  @Input() construct: Handsontable.GridSettings['construct'];
  @Input() init: Handsontable.GridSettings['init'];
  @Input() modifyAutoColumnSizeSeed: Handsontable.GridSettings['modifyAutoColumnSizeSeed'];
  @Input() modifyAutofillRange: Handsontable.GridSettings['modifyAutofillRange'];
  @Input() modifyColHeader: Handsontable.GridSettings['modifyColHeader'];
  @Input() modifyColumnHeaderHeight: Handsontable.GridSettings['modifyColumnHeaderHeight'];
  @Input() modifyColumnHeaderValue: Handsontable.GridSettings['modifyColumnHeaderValue'];
  @Input() modifyColWidth: Handsontable.GridSettings['modifyColWidth'];
  @Input() modifyCopyableRange: Handsontable.GridSettings['modifyCopyableRange'];
  @Input() modifyFiltersMultiSelectValue: Handsontable.GridSettings['modifyFiltersMultiSelectValue'];
  @Input() modifyFocusedElement: Handsontable.GridSettings['modifyFocusedElement'];
  @Input() modifyData: Handsontable.GridSettings['modifyData'];
  @Input() modifyFocusOnTabNavigation: Handsontable.GridSettings['modifyFocusOnTabNavigation'];
  @Input() modifyGetCellCoords: Handsontable.GridSettings['modifyGetCellCoords'];
  @Input() modifyGetCoordsElement: Handsontable.GridSettings['modifyGetCoordsElement'];
  @Input() modifyRowData: Handsontable.GridSettings['modifyRowData'];
  @Input() modifyRowHeader: Handsontable.GridSettings['modifyRowHeader'];
  @Input() modifyRowHeaderWidth: Handsontable.GridSettings['modifyRowHeaderWidth'];
  @Input() modifyRowHeight: Handsontable.GridSettings['modifyRowHeight'];
  @Input() modifyRowHeightByOverlayName: Handsontable.GridSettings['modifyRowHeightByOverlayName'];
  @Input() modifySourceData: Handsontable.GridSettings['modifySourceData'];
  @Input() modifyTransformEnd: Handsontable.GridSettings['modifyTransformEnd'];
  @Input() modifyTransformFocus: Handsontable.GridSettings['modifyTransformFocus'];
  @Input() modifyTransformStart: Handsontable.GridSettings['modifyTransformStart'];
  @Input() persistentStateLoad: Handsontable.GridSettings['persistentStateLoad'];
  @Input() persistentStateReset: Handsontable.GridSettings['persistentStateReset'];
  @Input() persistentStateSave: Handsontable.GridSettings['persistentStateSave'];

  constructor(
    private _hotTableRegisterer: HotTableRegisterer,
    private _hotSettingsResolver: HotSettingsResolver,
    public ngZone: NgZone,
  ) {}

  private get hotInstance(): Handsontable | null {
    if (!this.__hotInstance || (this.__hotInstance && !this.__hotInstance.isDestroyed)) {

      // Will return the Handsontable instance or `null` if it's not yet been created.
      return this.__hotInstance;

    } else {
      this._hotTableRegisterer.removeInstance(this.hotId);

      console.warn(HOT_DESTROYED_WARNING);

      return null;
    }
  }

  private set hotInstance(hotInstance) {
    this.__hotInstance = hotInstance;
  }

  ngAfterViewInit(): void {
    const options: Handsontable.GridSettings = (this._hotSettingsResolver.mergeSettings(this) as Handsontable.GridSettings);

    if (this.columnsComponents.length > 0) {
      const columns: Handsontable.ColumnSettings[] = [];

      this.columnsComponents.forEach((column) => {
        columns.push((this._hotSettingsResolver.mergeSettings(column) as Handsontable.ColumnSettings));
      });

      options['columns'] = columns;
    }

    this.ngZone.runOutsideAngular(() => {
      this.hotInstance = new Handsontable.Core(this.container.nativeElement, options);

      if (this.hotId) {
        this._hotTableRegisterer.registerInstance(this.hotId, this.hotInstance);
      }
      // @ts-ignore
      this.hotInstance.init();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.hotInstance === null) {
      return;
    }

    const newOptions: Handsontable.GridSettings = this._hotSettingsResolver.prepareChanges(changes);

    this.updateHotTable(newOptions);
  }

  ngOnDestroy(): void {
    this.ngZone.runOutsideAngular(() => {
      if (this.hotInstance) {
        this.hotInstance.destroy();
      }
    });

    if (this.hotId) {
      this._hotTableRegisterer.removeInstance(this.hotId);
    }
  }

  updateHotTable(newSettings: Handsontable.GridSettings ): void {
    if (!this.hotInstance) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.hotInstance.updateSettings(newSettings, false);
    });
  }

  onAfterColumnsChange(): void {
    if (this.columnsComponents === void 0) {
      return;
    }

    if (this.columnsComponents.length > 0) {
      const columns: Handsontable.ColumnSettings[] = [];

      this.columnsComponents.forEach((column) => {
        columns.push((this._hotSettingsResolver.mergeSettings(column) as Handsontable.ColumnSettings));
      });

      const newOptions: Handsontable.GridSettings = {
        columns: columns
      };

      this.updateHotTable(newOptions);
    }
  }

  onAfterColumnsNumberChange(): void {
    const columns: Handsontable.ColumnSettings[] = [];

    if (this.columnsComponents.length > 0) {
      this.columnsComponents.forEach((column) => {
        columns.push((this._hotSettingsResolver.mergeSettings(column) as Handsontable.ColumnSettings));
      });
    }

    this.updateHotTable({ columns });
  }

  addColumn(column: HotColumnComponent): void {
    this.columnsComponents.push(column);
    this.onAfterColumnsNumberChange();
  }

  removeColumn(column: HotColumnComponent): void {
    const index: number = this.columnsComponents.indexOf(column);

    this.columnsComponents.splice(index, 1);
    this.onAfterColumnsNumberChange();
  }

}
