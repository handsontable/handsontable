import Handsontable, {
  CellCoords,
} from 'handsontable/base';
import { HotInstance } from 'handsontable';
import { BasePlugin } from 'handsontable/plugins';

interface CellProperties {
  row: number;
  col: number;
  instance: HotInstance;
  visualRow: number;
  visualCol: number;
  prop: string;
  [key: string]: unknown;
}

const mockTD = document.createElement('td');
const elem = document.createElement('div');
const hot = Handsontable(elem, {});
const cellProperties: CellProperties = {
  row: 0,
  col: 0,
  instance: hot,
  visualRow: 0,
  visualCol: 0,
  prop: 'foo'
};

const container: HTMLElement = hot.container;
const guid: string = hot.guid;
const isDestroyed: boolean = hot.isDestroyed;
const rootContainer: HTMLElement = hot.rootContainer;
const rootWrapperElement: HTMLElement = hot.rootWrapperElement;
const rootGridElement: HTMLElement = hot.rootGridElement;
const rootPortalElement: HTMLElement = hot.rootPortalElement;
const rootElement: HTMLElement = hot.rootElement;
const rootDocument: Document = hot.rootDocument;
const rootWindow: Window = hot.rootWindow;

hot.addHook('afterChange', (changes: any[] | null, source: string) => {});
hot.addHook('afterChange', [(changes: any[] | null, source: string) => {}]);
hot.addHook('afterChange', [(changes: any[] | null, source: string) => {}], 3);
hot.addHookOnce('afterChange', (changes: any[] | null, source: string) => {});
hot.addHookOnce('afterChange', [(changes: any[] | null, source: string) => {}]);
hot.addHookOnce('afterChange', [(changes: any[] | null, source: string) => {}], -1);
hot.alter('insert_row_above');
hot.alter('insert_row_below');
hot.alter('insert_col_start');
hot.alter('insert_col_end');
hot.alter('remove_row', 1, 10, 'source');
hot.alter('remove_col', 1, 10, 'source');
(hot.batch(() => 'string') as string).toUpperCase();
(hot.batch(() => 12345) as number).toFixed();
hot.batch(() => {});
(hot.batchExecution(() => 'string', true) as string).toUpperCase();
(hot.batchExecution(() => 12345, false) as number).toFixed();
(hot.batchRender(() => 'string') as string).toUpperCase();
(hot.batchRender(() => 12345) as number).toFixed();
(hot as any).clear();
hot.clearUndo();
hot.colToProp(123) === 'foo';
hot.countCols() === 123;
(hot as any).countEmptyCols(true) === 123;
(hot as any).countEmptyRows(true) === 123;
hot.countRenderedCols() === 123;
hot.countRenderedRows() === 123;
hot.countRows() === 123;
hot.countSourceRows() === 123;
hot.countVisibleCols() === 123;
hot.countVisibleRows() === 123;
hot.countRowHeaders() === 2;
hot.countColHeaders() === 2;
hot.deselectCell();
hot.destroy();
hot.destroyEditor(true, true);
hot.emptySelectedCells();
hot.getActiveEditor();
const activeSelectionLayerIndex: number = hot.getActiveSelectionLayerIndex();

hot.getCell(123, 123, true)!.focus();
hot.getCellEditor(123, 123);
hot.getCellMeta(123, 123).type === 'text';
hot.getCellMeta(123, 123, { skipMetaExtension: true }).type === 'text';
hot.getCellMetaAtRow(123).forEach(meta => meta.type === 'text');
hot.getCellRenderer(123, 123)(hot, mockTD, 1, 2, 'prop', '', cellProperties);
hot.getCellsMeta()[0].visualRow;
hot.getCellValidator(123, 123);
(hot.getColHeader() as string[]).forEach((header: number | string) => {});
hot.getColHeader(123).toString();
hot.getColHeader(123, 1).toString();
hot.getColHeader(123, -1).toString();
hot.getColumnMeta(0);
hot.getColumnMeta(0).type === 'test';
hot.getColWidth(123) === 123;
hot.getColWidth(123, 'my_source') === 123;
hot.getCoords(elem.querySelector('td')!)!.row === 0;
hot.getCopyableData(123, 123).toUpperCase();
hot.getCopyableSourceData(123, 123).toUpperCase();
(hot as any).getCopyableText(123, 123, 123, 123).toUpperCase();
hot.getData(123, 123, 123, 123).forEach((v) => {});
hot.getDataAtCell(123, 123) === '';
hot.getDataAtCol(123).forEach(v => v === '');
(hot as any).getDataAtProp(123).forEach((v: any) => v === '');
(hot as any).getDataAtRow(123).forEach((v: any) => v === '');
hot.getDataAtRowProp(123, 'foo') === '';
hot.getDataType(123, 123, 123, 123) === 'text';
hot.getDirectionFactor() === 1;
const firstFullyVisibleColumn: number | null = hot.getFirstFullyVisibleColumn();
const firstFullyVisibleRow: number | null = hot.getFirstFullyVisibleRow();
const firstPartiallyVisibleColumn: number | null = (hot as any).getFirstPartiallyVisibleColumn();
const firstPartiallyVisibleRow: number | null = (hot as any).getFirstPartiallyVisibleRow();
const firstRenderedVisibleColumn: number | null = hot.getFirstRenderedVisibleColumn();
const firstRenderedVisibleRow: number | null = hot.getFirstRenderedVisibleRow();
const lastFullyVisibleColumn: number | null = hot.getLastFullyVisibleColumn();
const lastFullyVisibleRow: number | null = hot.getLastFullyVisibleRow();
const lastPartiallyVisibleColumn: number | null = (hot as any).getLastPartiallyVisibleColumn();
const lastPartiallyVisibleRow: number | null = (hot as any).getLastPartiallyVisibleRow();
const lastRenderedVisibleColumn: number | null = hot.getLastRenderedVisibleColumn();
const lastRenderedVisibleRow: number | null = hot.getLastRenderedVisibleRow();

hot.getFocusManager();

const _hot: HotInstance = (hot as any).getInstance();

(hot.getRowHeader() as string[]).forEach((header: string) => header.toString());
hot.getRowHeader(123) === '';
hot.getRowHeight(123) === 123;
hot.getRowHeight(123, 'my_source') === 123;
(hot as any).getSchema().foo;
hot.getSelected()![0][0] === 123;
hot.getSelectedLast()![0] === 123;
hot.getSelectedActive()![0] === 123;
hot.getSelectedRange()![0].from.row === 123;
hot.getSelectedRangeLast()!.to.col === 123;
hot.getSelectedRangeActive()!.from.row === 123;
hot.getSettings().type === 'text';
hot.getShortcutManager();
hot.getSourceData()[0];
hot.getSourceData(123, 123, 123, 123)[0];
hot.getSourceDataAtCell(123, 123) === '';
hot.getSourceDataAtCol(123)[0] === '';
hot.getSourceDataAtRow(123) as any[];
hot.getTranslatedPhrase('foo', 123)!.toLowerCase();
const tableWidth: number = hot.getTableWidth();
const tableHeight: number = hot.getTableHeight();

hot.getValue() === '';

const hasColHeaders: boolean = hot.hasColHeaders();
const hasHook: boolean = hot.hasHook('afterChange');
const hasRowHeaders: boolean = hot.hasRowHeaders();

hot.init() === undefined;

const isColumnModificationAllowed: boolean = hot.isColumnModificationAllowed();
const isEmptyCol: boolean = (hot as any).isEmptyCol(123);
const isEmptyRow: boolean = (hot as any).isEmptyRow(123);
const isExecutionSuspended: boolean = (hot as any).isExecutionSuspended();
const isListening: boolean = hot.isListening();
const isLtr: boolean = hot.isLtr();
const isRenderSuspended: boolean = hot.isRenderSuspended();
const isRtl: boolean = hot.isRtl();

hot.listen();
hot.loadData([[1, 2, 3], [1, 2, 3]]);
hot.loadData([{ a: 'a', b: 2, c: '' }, { a: 'a', b: 2, c: '' }]);
hot.populateFromArray(123, 123, [], 123, 123, 'foo', 'shift_down');
hot.propToCol('know_prop') === 123;
(hot.propToCol('not_known_prop') as any) === 'not_known_prop';
hot.propToCol(123) === 123;
hot.refreshDimensions();
hot.removeCellMeta(123, 123, 'foo');
hot.removeHook('afterChange', () => {});
hot.render();
(hot as any).resumeExecution();
(hot as any).resumeRender();
hot.runHooks('afterChange', 123, 'foo', true, {}, [], () => {});
hot.scrollViewportTo({ row: 0 });
hot.scrollViewportTo({ col: 0 });
hot.scrollViewportTo({ row: 0, col: 0 });
hot.scrollViewportTo({ row: 0, col: 0, verticalSnap: 'top' });
hot.scrollViewportTo({ row: 0, col: 0, verticalSnap: 'bottom' });
hot.scrollViewportTo({ row: 0, col: 0, horizontalSnap: 'start' });
hot.scrollViewportTo({ row: 0, col: 0, horizontalSnap: 'end' });
hot.scrollViewportTo({ row: 0, col: 0, considerHiddenIndexes: false });
hot.scrollViewportTo({ row: 0, col: 0 }, () => {
  // callback
});
hot.scrollViewportTo(0, 10);
hot.scrollViewportTo(0, 10, true, true, true);
hot.scrollToFocusedCell();
hot.scrollToFocusedCell(() => {});
(hot as any).selectAll();
(hot as any).selectAll(true);
(hot as any).selectAll(true, false);
(hot as any).selectAll(false, true, { focusPosition: { row: 1, col: 2 } });
(hot as any).selectAll(false, true, { focusPosition: new CellCoords(1, 2) });
(hot as any).selectAll(false, true, { focusPosition: { row: 1, col: 2 }, disableHeadersHighlight: true });
(hot as any).selectAll(false, true, { disableHeadersHighlight: false });
hot.selectCell(123, 123, 123, 123, true, true);
(hot as any).selectCell(123, 'prop1', 123, 'prop2', true, true);
hot.selectCells([[123, 123, 123, 123]], true, true);
hot.selectCells([[123, 'prop1', 123, 'prop2']], true, true);
hot.selectColumns(1, 4, -1);
hot.selectColumns(1, 4, { row: -1, col: 1 });
hot.selectColumns(1, 4, new CellCoords(-1, 1));
hot.selectColumns(1, 4);
hot.selectColumns(1);
hot.selectRows(1, 4, -1);
hot.selectRows(1, 4, { row: 1, col: -1 });
hot.selectRows(1, 4, new CellCoords(1, -1));
hot.selectRows(1, 4);
hot.selectRows(1);
hot.setCellMeta(123, 123, 'foo', 'foo');
hot.setCellMetaObject(123, 123, {});
(hot as any).setDataAtCell([[123, 123, 'foo'], [123, 123, { myProperty: 'foo' }]], 'foo');
hot.setDataAtCell(123, 123, 'foo', 'foo');
hot.setDataAtCell(123, 123, { myProperty: 'foo' }, 'foo');
(hot as any).setDataAtRowProp([[123, 'foo', 'foo'], [123, 'foo', 'foo']], 'foo');
(hot as any).setDataAtRowProp(123, 'foo', 'foo', 'foo');
hot.setSourceDataAtCell([[1, 'foo', 'foo']]);
hot.setSourceDataAtCell([[1, 'foo', 'foo']], 'sourceString');
hot.setSourceDataAtCell(123, 123, 'foo');
hot.setSourceDataAtCell(123, 123, 'foo', 'sourceString');
hot.spliceCol(123, 123, 123, 'foo');
hot.spliceRow(123, 123, 123, 'foo');
(hot as any).suspendExecution();
(hot as any).suspendRender();
hot.toPhysicalColumn(123) === 123;
hot.toPhysicalRow(123) === 123;
hot.toVisualColumn(123) === 123;
hot.toVisualRow(123) === 123;
hot.unlisten();
(hot as any).updateData([[1, 2, 3], [1, 2, 3]]);
(hot as any).updateData([{ a: 'a', b: 2, c: '' }, { a: 'a', b: 2, c: '' }]);
hot.updateSettings({}, true);
(hot as any).useTheme('ht-theme-sth');
hot.validateCell('test', cellProperties, (valid: boolean) => {}, 'sourceString');
(hot as any).validateCells((valid: boolean) => {});
(hot as any).validateColumns([1, 2, 3], (valid: boolean) => {});
(hot as any).validateRows([1, 2, 3], (valid: boolean) => {});

const isDestroyedAfter: boolean = hot.isDestroyed;
const testToHTMLTableElement: HTMLTableElement = (hot as any).toTableElement();
const testToHTML: string = (hot as any).toHTML();
const currentThemeName: string|null = hot.getCurrentThemeName();

const autoColumnSize = hot.getPlugin('autoColumnSize');

autoColumnSize.inProgress;

autoColumnSize.calculateVisibleColumnsWidth();
autoColumnSize.isEnabled();

const autofill: BasePlugin = hot.getPlugin('autofill');
const autoRowSize: BasePlugin = hot.getPlugin('autoRowSize');
const bindRowsWithHeaders: BasePlugin = hot.getPlugin('bindRowsWithHeaders');
const collapsibleColumns: BasePlugin = hot.getPlugin('collapsibleColumns');
const columnSorting: BasePlugin = hot.getPlugin('columnSorting');
const columnSummary: BasePlugin = hot.getPlugin('columnSummary');
const comments: BasePlugin = hot.getPlugin('comments');
const contextMenu: BasePlugin = hot.getPlugin('contextMenu');
const copyPaste: BasePlugin = hot.getPlugin('copyPaste');
const customBorders: BasePlugin = hot.getPlugin('customBorders');
const dragToScroll: BasePlugin = hot.getPlugin('dragToScroll');
const dropdownMenu: BasePlugin = hot.getPlugin('dropdownMenu');
const exportFile: BasePlugin = hot.getPlugin('exportFile');
const filters: BasePlugin = hot.getPlugin('filters');
const formulas: BasePlugin = hot.getPlugin('formulas');
const hiddenColumns: BasePlugin = hot.getPlugin('hiddenColumns');
const hiddenRows: BasePlugin = hot.getPlugin('hiddenRows');
const manualColumnFreeze: BasePlugin = hot.getPlugin('manualColumnFreeze');
const manualColumnMove: BasePlugin = hot.getPlugin('manualColumnMove');
const manualColumnResize: BasePlugin = hot.getPlugin('manualColumnResize');
const manualRowMove: BasePlugin = hot.getPlugin('manualRowMove');
const manualRowResize: BasePlugin = hot.getPlugin('manualRowResize');
const mergeCells: BasePlugin = hot.getPlugin('mergeCells');
const multiColumnSorting: BasePlugin = hot.getPlugin('multiColumnSorting');
const multipleSelectionHandles: BasePlugin = hot.getPlugin('multipleSelectionHandles');
const nestedHeaders: BasePlugin = hot.getPlugin('nestedHeaders');
const nestedRows: BasePlugin = hot.getPlugin('nestedRows');
const search: BasePlugin = hot.getPlugin('search');
const touchScroll: BasePlugin = hot.getPlugin('touchScroll');
const trimRows: BasePlugin = hot.getPlugin('trimRows');
const undoRedo: BasePlugin = hot.getPlugin('undoRedo');
const dialog: BasePlugin = hot.getPlugin('dialog');
const loading: BasePlugin = hot.getPlugin('loading');
const emptyDataState: BasePlugin = hot.getPlugin('emptyDataState');
const custom: BasePlugin = hot.getPlugin('custom');
