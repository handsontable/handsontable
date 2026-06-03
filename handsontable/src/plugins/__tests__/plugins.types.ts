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
  Search,
  TouchScroll,
  TrimRows,
  Dialog,
  Loading,
  EmptyDataState,
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
registerPlugin(Search);
registerPlugin(TouchScroll);
registerPlugin(TrimRows);
registerPlugin(Dialog);
registerPlugin(Loading);
registerPlugin(EmptyDataState);
registerPlugin(UndoRedo);
registerPlugin('custom', class CustomPlugin extends BasePlugin {});

// getPlugin() infers the specific constructor type for each registered plugin name.
const autoColumnSize: typeof AutoColumnSize | undefined = getPlugin('autoColumnSize');
const autofill: typeof Autofill | undefined = getPlugin('autofill');
const autoRowSize: typeof AutoRowSize | undefined = getPlugin('autoRowSize');
const bindRowsWithHeaders: typeof BindRowsWithHeaders | undefined = getPlugin('bindRowsWithHeaders');
const collapsibleColumns: typeof CollapsibleColumns | undefined = getPlugin('collapsibleColumns');
const columnSorting: typeof ColumnSorting | undefined = getPlugin('columnSorting');
const columnSummary: typeof ColumnSummary | undefined = getPlugin('columnSummary');
const comments: typeof Comments | undefined = getPlugin('comments');
const contextMenu: typeof ContextMenu | undefined = getPlugin('contextMenu');
const copyPaste: typeof CopyPaste | undefined = getPlugin('copyPaste');
const customBorders: typeof CustomBorders | undefined = getPlugin('customBorders');
const dragToScroll: typeof DragToScroll | undefined = getPlugin('dragToScroll');
const dropdownMenu: typeof DropdownMenu | undefined = getPlugin('dropdownMenu');
const exportFile: typeof ExportFile | undefined = getPlugin('exportFile');
const filters: typeof Filters | undefined = getPlugin('filters');
const formulas: typeof Formulas | undefined = getPlugin('formulas');
const hiddenColumns: typeof HiddenColumns | undefined = getPlugin('hiddenColumns');
const hiddenRows: typeof HiddenRows | undefined = getPlugin('hiddenRows');
const manualColumnFreeze: typeof ManualColumnFreeze | undefined = getPlugin('manualColumnFreeze');
const manualColumnMove: typeof ManualColumnMove | undefined = getPlugin('manualColumnMove');
const manualColumnResize: typeof ManualColumnResize | undefined = getPlugin('manualColumnResize');
const manualRowMove: typeof ManualRowMove | undefined = getPlugin('manualRowMove');
const manualRowResize: typeof ManualRowResize | undefined = getPlugin('manualRowResize');
const mergeCells: typeof MergeCells | undefined = getPlugin('mergeCells');
const multiColumnSorting: typeof MultiColumnSorting | undefined = getPlugin('multiColumnSorting');
const multipleSelectionHandles: typeof MultipleSelectionHandles | undefined = getPlugin('multipleSelectionHandles');
const nestedHeaders: typeof NestedHeaders | undefined = getPlugin('nestedHeaders');
const nestedRows: typeof NestedRows | undefined = getPlugin('nestedRows');
const search: typeof Search | undefined = getPlugin('search');
const touchScroll: typeof TouchScroll | undefined = getPlugin('touchScroll');
const trimRows: typeof TrimRows | undefined = getPlugin('trimRows');
const dialog: typeof Dialog | undefined = getPlugin('dialog');
const loading: typeof Loading | undefined = getPlugin('loading');
const emptyDataState: typeof EmptyDataState | undefined = getPlugin('emptyDataState');
const undoRedo: typeof UndoRedo | undefined = getPlugin('undoRedo');
const custom: typeof BasePlugin | undefined = getPlugin('custom');
