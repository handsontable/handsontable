import {
  AutoColumnSize,
  Autofill,
  AutoRowSize,
  BasePlugin,
  BindRowsWithHeaders,
  CollapsibleColumns,
  ColumnSorting,
  ColumnSummary,
  Comments,
  ContextMenu,
  CopyPaste,
  CustomBorders,
  DragToScroll,
  DropdownMenu,
  ExportFile,
  Filters,
  Formulas,
  HiddenColumns,
  HiddenRows,
  ManualColumnFreeze,
  ManualColumnMove,
  ManualColumnResize,
  ManualRowMove,
  ManualRowResize,
  MergeCells,
  MultiColumnSorting,
  MultipleSelectionHandles,
  NestedHeaders,
  NestedRows,
  PersistentState,
  Search,
  TouchScroll,
  TrimRows,
  UndoRedo,
  getPlugin,
  registerAllPlugins,
  registerPlugin,
} from 'handsontable/plugins';

registerAllPlugins();

registerPlugin(AutoColumnSize);
registerPlugin(Autofill);
registerPlugin(AutoRowSize);
registerPlugin(BindRowsWithHeaders);
registerPlugin(CollapsibleColumns);
registerPlugin(ColumnSorting);
registerPlugin(ColumnSummary);
registerPlugin(Comments);
registerPlugin(ContextMenu);
registerPlugin(CopyPaste);
registerPlugin(CustomBorders);
registerPlugin(DragToScroll);
registerPlugin(DropdownMenu);
registerPlugin(ExportFile);
registerPlugin(Filters);
registerPlugin(Formulas);
registerPlugin(HiddenColumns);
registerPlugin(HiddenRows);
registerPlugin(ManualColumnFreeze);
registerPlugin(ManualColumnMove);
registerPlugin(ManualColumnResize);
registerPlugin(ManualRowMove);
registerPlugin(ManualRowResize);
registerPlugin(MergeCells);
registerPlugin(MultiColumnSorting);
registerPlugin(MultipleSelectionHandles);
registerPlugin(NestedHeaders);
registerPlugin(NestedRows);
registerPlugin(PersistentState);
registerPlugin(Search);
registerPlugin(TouchScroll);
registerPlugin(TrimRows);
registerPlugin(UndoRedo);
registerPlugin('custom', class CustomPlugin extends BasePlugin {});

const autoColumnSize: AutoColumnSize = getPlugin('autoColumnSize');
const autofill: Autofill = getPlugin('autofill');
const autoRowSize: AutoRowSize = getPlugin('autoRowSize');
const bindRowsWithHeaders: BindRowsWithHeaders = getPlugin('bindRowsWithHeaders');
const collapsibleColumns: CollapsibleColumns = getPlugin('collapsibleColumns');
const columnSorting: ColumnSorting = getPlugin('columnSorting');
const columnSummary: ColumnSummary = getPlugin('columnSummary');
const comments: Comments = getPlugin('comments');
const contextMenu: ContextMenu = getPlugin('contextMenu');
const copyPaste: CopyPaste = getPlugin('copyPaste');
const customBorders: CustomBorders = getPlugin('customBorders');
const dragToScroll: DragToScroll = getPlugin('dragToScroll');
const dropdownMenu: DropdownMenu = getPlugin('dropdownMenu');
const exportFile: ExportFile = getPlugin('exportFile');
const filters: Filters = getPlugin('filters');
const formulas: Formulas = getPlugin('formulas');
const hiddenColumns: HiddenColumns = getPlugin('hiddenColumns');
const hiddenRows: HiddenRows = getPlugin('hiddenRows');
const manualColumnFreeze: ManualColumnFreeze = getPlugin('manualColumnFreeze');
const manualColumnMove: ManualColumnMove = getPlugin('manualColumnMove');
const manualColumnResize: ManualColumnResize = getPlugin('manualColumnResize');
const manualRowMove: ManualRowMove = getPlugin('manualRowMove');
const manualRowResize: ManualRowResize = getPlugin('manualRowResize');
const mergeCells: MergeCells = getPlugin('mergeCells');
const multiColumnSorting: MultiColumnSorting = getPlugin('multiColumnSorting');
const multipleSelectionHandles: MultipleSelectionHandles = getPlugin('multipleSelectionHandles');
const nestedHeaders: NestedHeaders = getPlugin('nestedHeaders');
const nestedRows: NestedRows = getPlugin('nestedRows');
const persistentState: PersistentState = getPlugin('persistentState');
const search: Search = getPlugin('search');
const touchScroll: TouchScroll = getPlugin('touchScroll');
const trimRows: TrimRows = getPlugin('trimRows');
const undoRedo: UndoRedo = getPlugin('undoRedo');
const custom: BasePlugin = getPlugin('custom');
