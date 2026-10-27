import type { HotInstance } from '../../core/types';
import type { MergeAreaGeometry } from '../mergeAreas';
import type { SelectionState } from '../../selection/types';
import { clamp } from '../../helpers/number';
import { safeBatch } from '../safeBatch';

/**
 * One key of the cell meta a sheet's rows carried when the user left it: a key set through
 * `setCellMeta()`, or `valid: false` for a cell whose last validation failed. The indexes are
 * physical, so each entry goes back onto its record whatever row and column order the sheet
 * returns with.
 */
export interface TrackedCellMeta {
  row: number;
  col: number;
  key: string;
  value: unknown;
}

/**
 * One merged area of a {@link ViewState}: where it is drawn, by visual indexes, and, when MergeCells knows
 * them, the physical rows it owns and its physical left column. The restore places an area that carries
 * them from those, so it covers the same cells whatever row and column order the sheet returns with.
 */
export interface MergedAreaState extends MergeAreaGeometry {
  physicalRows?: number[];
  physicalColumn?: number;
}

/**
 * One sorted column of a {@link ViewState}, by its physical index.
 */
export interface SortedColumn {
  column: number;
  sortOrder: 'asc' | 'desc';
}

/**
 * Snapshot of the runtime-mutable view state of one sheet. The manual size overrides are
 * sparse `[physicalIndex, size]` pairs — a dense array the length of the row count would
 * retain one slot per row per sheet for the session, and a visual index would lose every
 * trimmed row's size.
 */
export interface ViewState {
  rowSequence: number[];

  /**
   * The row header number of every physical row, kept by the `'strict'` BindRowsWithHeaders strategy. Absent
   * when that strategy is off, since the other one numbers each row by its physical index. Part of the row
   * order.
   */
  rowHeaders?: number[];
  unsortedRowSequence: number[];
  columnSequence: number[];
  hiddenRows: number[];
  hiddenColumns: number[];
  trimmedRows: number[];
  collapsedParents: number[][];
  colWidths: Array<[number, number]>;
  rowHeights: Array<[number, number]>;

  /**
   * The sort, each column by its physical index.
   */
  sortConfig: SortedColumn[];
  filterConditions: unknown[] | null;

  /**
   * The merged areas on screen. Each carries its visual geometry, for a listener to read, and the physical
   * rows and left column it owns when MergeCells has captured them; the restore places an area by those
   * when they are present, and by its visual geometry otherwise.
   */
  mergedCells: MergedAreaState[];
  fixedColumnsStart: number | undefined;
  fixedColumnsEnd: number | undefined;
  fixedRowsTop?: number | undefined;
  fixedRowsBottom?: number | undefined;

  /**
   * The custom borders on screen, by visual coordinates, for a listener to read. A sheets bar return
   * does not replay it: the borders come back with the sheet's kept cell meta, so a change made to this
   * list is not applied.
   */
  customBorders: Array<Record<string, unknown>>;

  /**
   * The cell meta the sheet keeps, by physical indexes. Absent when a server response replaced the
   * sheet's rows while it was hidden, because the meta described the old rows.
   */
  cellMeta?: TrackedCellMeta[];
  pagination: PaginationState | null;

  /**
   * The selection as `getSelected()` reports it. Restored through `selectCells()` when
   * `selectionState` describes a plain cell selection.
   */
  selection: number[][] | undefined;

  /**
   * The full selection, as copies: every layer, the focus, and the header and grid-span flags.
   * It wins over `selection` for a selection made from a header or spanning a whole axis, and
   * supplies the focus for a plain one.
   */
  selectionState: SelectionState | null;
  scroll: { row: number, col: number };

  /**
   * The collapsed CollapsibleColumns groups and the columns they hide, or `null` when the plugin is off.
   * Absent from a view state the `ViewState` plugin built, which does not restore it.
   */
  collapsedColumns?: CollapsedColumnsState | null;

  /**
   * The rows checked through RowSelection, or `null` when the plugin is off or a bound checkbox column
   * holds them. Absent from a view state the `ViewState` plugin built, which does not restore it.
   */
  checkedRows?: CheckedRowsState | null;
}

/**
 * The collapsed CollapsibleColumns groups of one sheet, by header level and authored group identity,
 * and the physical columns those collapses hide.
 */
export interface CollapsedColumnsState {
  groups: Array<{ headerLevel: number, authoredColumnIndex: number }>;
  columns: number[];
}

/**
 * The rows one sheet checked through RowSelection: the physical rows of its selection map and, for a
 * server-backed sheet, its selection by row id and the row count of its server query.
 */
export interface CheckedRowsState {
  rows: number[];
  server: { selectAll: boolean, toggledRowIds: unknown[] } | null;
  serverTotalRows: number;
}

/**
 * The page and page size of one sheet, or `null` in a view state captured while the Pagination
 * plugin was off.
 */
export interface PaginationState {
  page: number;
  pageSize: number | 'auto';
}

/**
 * One independently restorable part of a view state. A restore given a set of parts runs only
 * their steps, in the usual order; a restore given none runs every step. `collapsedColumns` and
 * `checkedRows` are the sheets bar's own: the `ViewState` plugin never passes them.
 */
export type ViewStatePart =
  'columnOrder' |
  'rowOrder' |
  'sort' |
  'filters' |
  'trimmedRows' |
  'hiddenRows' |
  'hiddenColumns' |
  'collapsedRows' |
  'collapsedColumns' |
  'checkedRows' |
  'columnWidths' |
  'rowHeights' |
  'mergedCells' |
  'frozen' |
  'customBorders' |
  'pagination' |
  'selection' |
  'scroll';

/**
 * Every part, in the order a restore applies them.
 */
export const VIEW_STATE_PARTS: readonly ViewStatePart[] = [
  'columnOrder',
  'rowOrder',
  'sort',
  'filters',
  'trimmedRows',
  'hiddenRows',
  'hiddenColumns',
  'collapsedRows',
  'collapsedColumns',
  'checkedRows',
  'columnWidths',
  'rowHeights',
  'mergedCells',
  'frozen',
  'customBorders',
  'pagination',
  'selection',
  'scroll',
];

/**
 * Answers whether a restore covers a part. No set means every part.
 */
type PartFilter = (part: ViewStatePart) => boolean;

/**
 * Builds the {@link PartFilter} for an optional set of parts.
 */
function toPartFilter(parts: ReadonlySet<ViewStatePart> | undefined): PartFilter {
  return parts ? part => parts.has(part) : () => true;
}

/**
 * The part of the Pagination plugin the view state talks to.
 */
interface PaginationPlugin {
  getCurrentPage: () => number;
  getCurrentPageSize: () => number | 'auto';
  setPage: (page: number) => void;
  setPageSize: (pageSize: number | 'auto') => void;
  nextPage: () => void;
  prevPage: () => void;
  getSetting: (name: string) => unknown;
  getPaginationData: () => { totalPages: number, firstVisibleRowIndex: number, lastVisibleRowIndex: number };
}

/**
 * Returns the plugin instance for `name` only when it is registered and enabled;
 * `undefined` otherwise. Keeps every capture/restore helper safe when a feature
 * plugin is absent from the grid's configuration.
 */
export function getEnabledPlugin(hot: HotInstance, name: string): { enabled: boolean } | undefined {
  const plugin = hot.getPlugin(name) as { enabled?: boolean } | undefined;

  return plugin?.enabled ? plugin as { enabled: boolean } : undefined;
}

/**
 * Returns the sorting plugin in charge of the row order — `multiColumnSorting` over
 * `columnSorting` when both are enabled, since it is the superset feature — or `undefined`.
 */
function getSortingPlugin(hot: HotInstance) {
  return (getEnabledPlugin(hot, 'multiColumnSorting') ?? getEnabledPlugin(hot, 'columnSorting')) as
    SortingPlugin | undefined;
}

/**
 * The part of a sorting plugin the view state talks to.
 */
interface SortingPlugin {
  sort: (config: unknown) => void;
  setSortConfig: (config: unknown) => void;
  getSortConfig: () => unknown;
  indexesSequenceCache: { getValues: () => number[] } | null;
}

/**
 * Captures row/column order plus the hidden and trimmed index sets. The row/column
 * sequences are copied defensively with `.slice()`: `getIndexesSequence()` returns
 * the mapper's live internal array, not a copy.
 *
 * Hidden indexes are stored as physical ones. The hiding plugins report visual indexes, and
 * a visual index only means something against the trimming that was in force when it was
 * read — the restore re-applies filters and trimming first, so the same rows have to be found
 * again by an index that does not move. The hidden rows are read physically, straight off the
 * plugin's hiding map: a hidden row that a collapsed NestedRows parent trims has no visual
 * index, so reading it through `getHiddenRows()` would drop it from the capture.
 */
function captureAxisState(hot: HotInstance, covers: PartFilter = () => true) {
  const hiddenRowsPlugin = getEnabledPlugin(hot, 'hiddenRows') as { pluginName: string } | undefined;
  const hiddenRowsMap = hiddenRowsPlugin
    ? hot.rowIndexMapper.hidingMapsCollection.get(hiddenRowsPlugin.pluginName) as
      { getHiddenIndexes: () => number[] } | undefined
    : undefined;
  const hiddenColumnsPlugin =
    getEnabledPlugin(hot, 'hiddenColumns') as { getHiddenColumns: () => number[] } | undefined;
  const trimRowsPlugin = getEnabledPlugin(hot, 'trimRows') as { getTrimmedRows: () => number[] } | undefined;

  // Each read is gated on the part that needs it: the sequences copy one entry per row or column, which a
  // request for a scroll position on a million-row grid must not pay for.
  return {
    rowSequence: covers('rowOrder') ? hot.rowIndexMapper.getIndexesSequence().slice() : [],
    rowHeaders: covers('rowOrder') ? captureStrictRowHeaders(hot) : undefined,
    unsortedRowSequence: covers('sort') ? captureUnsortedRowSequence(hot) : [],
    columnSequence: covers('columnOrder') ? hot.columnIndexMapper.getIndexesSequence().slice() : [],
    hiddenRows: covers('hiddenRows') ? hiddenRowsMap?.getHiddenIndexes() ?? [] : [],
    hiddenColumns: covers('hiddenColumns') ?
      (hiddenColumnsPlugin?.getHiddenColumns() ?? []).map(col => hot.toPhysicalColumn(col)) : [],
    trimmedRows: covers('trimmedRows') ? trimRowsPlugin?.getTrimmedRows() ?? [] : [],
  };
}

/**
 * Returns the BindRowsWithHeaders plugin when it is enabled. Read through the typed `getPlugin()` overload, so
 * a change to the methods the view state calls on it fails the type check.
 */
function getEnabledBindRowsWithHeaders(hot: HotInstance) {
  const bindRowsWithHeaders = hot.getPlugin('bindRowsWithHeaders');

  return bindRowsWithHeaders?.enabled ? bindRowsWithHeaders : undefined;
}

/**
 * Captures the row header numbers the `'strict'` BindRowsWithHeaders strategy keeps, by physical row. A data
 * load re-initializes them to the physical indexes, so a sheet switch would renumber every inserted row.
 */
function captureStrictRowHeaders(hot: HotInstance): number[] | undefined {
  return getEnabledBindRowsWithHeaders(hot)?._exportStrictHeaders() ?? undefined;
}

/**
 * Returns the row order the sorting plugin sorts from — the order the rows had before the
 * first sort — or the live order when nothing is sorted. The sorting plugin resets the rows
 * to that cached order every time it sorts, so a restore has to hand it back the same one,
 * or clearing the sort later would "restore" a sorted order as if it were the original.
 */
function captureUnsortedRowSequence(hot: HotInstance): number[] {
  const cached = getSortingPlugin(hot)?.indexesSequenceCache?.getValues();

  return (cached ?? hot.rowIndexMapper.getIndexesSequence()).slice();
}

/**
 * The part of the NestedRows plugin the view state talks to.
 */
interface NestedRowsPlugin {
  getCollapsedParents: () => number[];
  dataManager: {
    getRowTreePath: (row: number) => number[] | null,
    getRowIndexByTreePath: (path: number[] | null) => number | null,
    hasChildren: (row: number) => boolean,
  } | null;
  collapsingUI: {
    toggleCollapsedRows: (
      parents: number[], action: 'collapse' | 'expand', shouldRunHooks?: boolean, forceRender?: boolean
    ) => boolean,
  } | null;
}

/**
 * Captures the collapsed NestedRows parents as tree paths. `loadData` drops the collapsed state,
 * so a sheet switch would otherwise expand every branch. A physical index would not survive the
 * sheet's data gaining or losing a row while another sheet is in front — the path does.
 */
function captureCollapsedParents(hot: HotInstance): number[][] {
  const nestedRows = getEnabledPlugin(hot, 'nestedRows') as NestedRowsPlugin | undefined;
  const dataManager = nestedRows?.dataManager;

  if (!dataManager) {
    return [];
  }

  return nestedRows.getCollapsedParents()
    .map(row => dataManager.getRowTreePath(row))
    .filter((path): path is number[] => path !== null);
}

/**
 * Collapses the parents stored as tree paths again, skipping the ones the data no longer has or
 * that lost their children. The hooks stay silent — replaying a state the user already chose is
 * not a new collapse — and the render is left to the caller's batch. Parents collapsed on the
 * grid now are expanded first: a sheet switch arrives with none (`loadData` drops them), but a
 * restore onto a live grid would otherwise keep every branch the state leaves open collapsed.
 */
function restoreCollapsedParents(hot: HotInstance, state: ViewState) {
  const nestedRows = getEnabledPlugin(hot, 'nestedRows') as NestedRowsPlugin | undefined;
  const dataManager = nestedRows?.dataManager;

  if (!dataManager || !nestedRows.collapsingUI) {
    return;
  }

  const collapsedNow = nestedRows.getCollapsedParents();

  if (collapsedNow.length > 0) {
    nestedRows.collapsingUI.toggleCollapsedRows(collapsedNow, 'expand', false, false);
  }

  if (state.collapsedParents.length === 0) {
    return;
  }

  const parents = state.collapsedParents
    .map(path => dataManager.getRowIndexByTreePath(path))
    .filter((row): row is number => row !== null && dataManager.hasChildren(row));

  nestedRows.collapsingUI.toggleCollapsedRows(parents, 'collapse', false, false);
}

/**
 * The part of the CollapsibleColumns plugin the view state talks to.
 */
interface CollapsibleColumnsPlugin {
  _exportViewState: () => CollapsedColumnsState | null;
  _importViewState: (state: CollapsedColumnsState | null) => void;
}

/**
 * The part of the RowSelection plugin the view state talks to.
 */
interface RowSelectionPlugin {
  _exportViewState: () => CheckedRowsState | null;
  _importViewState: (state: CheckedRowsState | null) => void;
}

/**
 * Captures the collapsed CollapsibleColumns groups. A data load rebuilds the header state with every
 * group expanded, so a sheet switch would otherwise expand them all.
 */
function captureCollapsedColumns(hot: HotInstance): CollapsedColumnsState | null {
  return (getEnabledPlugin(hot, 'collapsibleColumns') as CollapsibleColumnsPlugin | undefined)
    ?._exportViewState() ?? null;
}

/**
 * Collapses the stored groups again, with the collapse hooks off, and expands every other group.
 */
function restoreCollapsedColumns(hot: HotInstance, state: ViewState) {
  (getEnabledPlugin(hot, 'collapsibleColumns') as CollapsibleColumnsPlugin | undefined)
    ?._importViewState(state.collapsedColumns ?? null);
}

/**
 * Captures the rows checked through RowSelection. `loadData` re-creates its selection map empty, and a
 * server-backed grid's selection by row id belongs to the server of the sheet it was made on.
 */
function captureCheckedRows(hot: HotInstance): CheckedRowsState | null {
  return (getEnabledPlugin(hot, 'rowSelection') as RowSelectionPlugin | undefined)?._exportViewState() ?? null;
}

/**
 * Puts the stored checked rows back, with the selection hooks off, replacing whatever is checked now.
 */
function restoreCheckedRows(hot: HotInstance, state: ViewState) {
  (getEnabledPlugin(hot, 'rowSelection') as RowSelectionPlugin | undefined)
    ?._importViewState(state.checkedRows ?? null);
}

/**
 * Returns the resize plugin for one axis, or `undefined` when it is absent or disabled.
 */
function getResizePlugin(hot: HotInstance, axis: 'column' | 'row') {
  return getEnabledPlugin(hot, axis === 'column' ? 'manualColumnResize' : 'manualRowResize') as
    {
      getManualSizes: () => Array<[number, number]>,
      setManualSizes: (sizes: Array<[number, number]>) => void,
      clearManualSizes: () => void,
    } | undefined;
}

/**
 * Captures the manual column width and row height overrides as sparse
 * `[physicalIndex, size]` pairs, read straight off the plugins' physical maps — a visual walk
 * over `countRows()` would skip every trimmed row, so a resized row hidden by a filter would
 * lose its height on the switch. Only the plugins' own overrides are read — capturing the
 * effective `getColWidth`/`getRowHeight` would pin every column as manually sized and stop
 * AutoColumnSize and StretchColumns from adapting after a switch.
 */
function captureSizes(hot: HotInstance, covers: PartFilter = () => true) {
  return {
    colWidths: (covers('columnWidths') ? getResizePlugin(hot, 'column')?.getManualSizes() : undefined) ?? [],
    rowHeights: (covers('rowHeights') ? getResizePlugin(hot, 'row')?.getManualSizes() : undefined) ?? [],
  };
}

/**
 * Captures the sort configuration, each column by its physical index. The sorting plugin reports
 * visual columns, and a visual index only names a column under the order it was read with, which the
 * restore does not have in force when it sorts (see {@link toPluginSortConfig}).
 */
function captureSortConfig(hot: HotInstance): SortedColumn[] {
  const config = getSortingPlugin(hot)?.getSortConfig();

  if (!Array.isArray(config)) {
    return [];
  }

  return (config as SortedColumn[]).flatMap((entry) => {
    const column = hot.toPhysicalColumn(entry.column);

    return column === null ? [] : [{ ...entry, column }];
  });
}

/**
 * Turns a stored sort into the visual columns the sorting plugin takes. The plugin turns them back
 * into physical ones through the index cache, and inside the restore batch that cache still holds the
 * column order from before the restore, whatever order has been written since. So the translation runs
 * right before each call into the plugin, against the cache the plugin then reads, never ahead of it. A
 * column without a visual index is left out.
 */
function toPluginSortConfig(hot: HotInstance, sortConfig: SortedColumn[]): SortedColumn[] {
  return sortConfig.flatMap((entry) => {
    const column = hot.toVisualColumn(entry.column);

    return column === null ? [] : [{ ...entry, column }];
  });
}

/**
 * Captures the exported filter conditions (physical columns), or `null` when
 * the Filters plugin is not enabled.
 */
function captureFilterConditions(hot: HotInstance): unknown[] | null {
  const filters = getEnabledPlugin(hot, 'filters') as { exportConditions: () => unknown[] } | undefined;

  return filters?.exportConditions() ?? null;
}

/**
 * Returns the MergeCells plugin when it is enabled. Read through the typed `getPlugin()` overload,
 * so a change to the methods the switch calls on it fails the type check.
 */
function getEnabledMergeCells(hot: HotInstance) {
  const mergeCells = hot.getPlugin('mergeCells');

  return mergeCells?.enabled ? mergeCells : undefined;
}

/**
 * Captures the merged cell ranges on screen as `{row, col, rowspan, colspan}` records, each with the
 * physical rows it owns and its physical left column. Visual coordinates name cells only under the order
 * they were read with, and the restore runs under another one (see {@link restoreMergedCells}). A merge
 * whose rows are all trimmed is left out: restored at its stale position it would come back as a visible
 * merge over unrelated rows.
 */
function captureMergedCells(hot: HotInstance): MergedAreaState[] {
  return getEnabledMergeCells(hot)?._exportMergedAreas() ?? [];
}

/**
 * Captures every saved custom border as a copy — `getBorders()` hands out the plugin's own
 * records, which it goes on mutating.
 */
function captureCustomBorders(hot: HotInstance): Array<Record<string, unknown>> {
  const customBorders = getEnabledPlugin(hot, 'customBorders') as
    { getBorders: () => Record<string, unknown>[] } | undefined;

  return (customBorders?.getBorders() ?? []).map(border => ({ ...border }));
}

/**
 * Returns the Pagination plugin when it pages the grid's own rows, or `undefined`. With an external
 * data source (DataProvider) a page change is a server fetch, and its result is loaded into whichever
 * sheet is active when it resolves — so the view state leaves the page alone there.
 */
function getLocalPagination(hot: HotInstance): PaginationPlugin | undefined {
  if (hot.runHooks('hasExternalDataSource') === true) {
    return undefined;
  }

  return getEnabledPlugin(hot, 'pagination') as PaginationPlugin | undefined;
}

/**
 * Captures the page and page size. Pagination keeps one current page for the whole grid and
 * clamps it to the page count on every load, so a switch through a shorter sheet would
 * otherwise bring the sheet back on a different page than the one it left.
 */
function capturePagination(hot: HotInstance): PaginationState | null {
  const pagination = getLocalPagination(hot);

  if (!pagination) {
    return null;
  }

  return { page: pagination.getCurrentPage(), pageSize: pagination.getCurrentPageSize() };
}

/**
 * Puts a page and page size back through the Pagination API, skipping the calls that would not
 * change anything so a switch between sheets on the same page fires no page hooks. The page
 * size goes first: changing it re-clamps the current page, and the page is clamped to the count
 * the arriving sheet has, so a page past its end does not fire a change that lands where it was.
 */
function applyPagination(hot: HotInstance, state: PaginationState) {
  const pagination = getLocalPagination(hot);

  if (!pagination) {
    return;
  }

  if (pagination.getCurrentPageSize() !== state.pageSize) {
    pagination.setPageSize(state.pageSize);
  }

  const page = clamp(state.page, 1, Math.max(pagination.getPaginationData().totalPages, 1));

  if (pagination.getCurrentPage() !== page) {
    pagination.setPage(page);
  }
}

/**
 * Captures every selection layer together with its header and grid-span flags, or `null` when
 * nothing is selected. `getSelected()` alone cannot describe a whole row, a whole column, or
 * select-all: their ranges may carry header coordinates, which `selectCells()` rejects, or none at
 * all, since Pagination moves a column's start to the first row of the page. The captured ranges
 * are copies, and so is the active range — `exportSelection()` hands that one out live.
 */
function captureSelectionState(hot: HotInstance): SelectionState | null {
  const state = hot.selection.exportSelection();

  if (state.ranges.length === 0 || !state.activeRange) {
    return null;
  }

  return { ...state, activeRange: state.activeRange.clone() };
}

/**
 * Whether a captured selection was made from a header or spans a whole axis. Only such a
 * selection needs more than `selectCells()`: that one re-lays the ranges, but drops the flags
 * that decide the header highlight and how a later trim repairs the selection.
 */
function isHeaderSelection(state: SelectionState): boolean {
  return state.selectedByRowHeader.length > 0 ||
    state.selectedByColumnHeader.length > 0 ||
    state.rowExtentSpansGrid.length > 0 ||
    state.columnExtentSpansGrid.length > 0;
}

/**
 * Whether every range of a captured selection, and its focus, still fits the grid.
 */
export function fitsGrid(hot: HotInstance, state: SelectionState): boolean {
  const tableParams = {
    countRows: hot.countRows(),
    countCols: hot.countCols(),
    countRowHeaders: hot.countRowHeaders(),
    countColHeaders: hot.countColHeaders(),
  };

  return !!state.activeRange &&
    state.activeRange.highlight.isValid(tableParams) &&
    state.ranges.every(range => range.isValid(tableParams));
}

/**
 * Replays a one-layer whole-row, whole-column, or select-all selection through the public
 * selection API, which runs the selection hooks and marks the header state exactly as the
 * original gesture did. Returns `false` for a shape the API cannot express.
 */
function replaySingleLayer(hot: HotInstance, state: SelectionState): boolean {
  const { from, to } = state.ranges[0];
  const { row, col } = (state.activeRange as NonNullable<SelectionState['activeRange']>).highlight;
  const focusPosition = { row: row ?? 0, col: col ?? 0 };
  const spansRows = state.rowExtentSpansGrid.includes(0);
  const spansColumns = state.columnExtentSpansGrid.includes(0);

  if (spansRows && spansColumns) {
    hot.selection.selectAll((from.col ?? 0) < 0, (from.row ?? 0) < 0, {
      focusPosition,
      disableHeadersHighlight: state.disableHeadersHighlight,
    });

    return true;
  }

  if (spansColumns) {
    return hot.selectRows(from.row ?? 0, to.row ?? 0, focusPosition);
  }

  if (spansRows) {
    return hot.selectColumns(from.col ?? 0, to.col ?? 0, focusPosition);
  }

  return false;
}

/**
 * Puts a multi-layer header selection back through the selection's own import, the way `dialog`
 * and `emptyDataState` restore one, handing it copies so the stored state never becomes the live
 * selection. The import runs no selection hooks and leaves the grid's row/column selection
 * classes as they were, so the last layer's end is set once more and the selection finished:
 * that is the step core answers with the classes, `afterSelection`, and `afterSelectionEnd`.
 * Setting that end makes the last layer the active one, so the captured focus and active layer
 * are put back afterwards.
 */
function importLayers(hot: HotInstance, state: SelectionState): void {
  const ranges = state.ranges.map(range => range.clone());
  const activeRange = (state.activeRange as NonNullable<SelectionState['activeRange']>).clone();

  hot.selection.importSelection({ ...state, ranges, activeRange });
  hot.selection.setRangeEnd(ranges[ranges.length - 1].to.clone());
  hot.selection.finish();
  hot.selection.setRangeFocus(activeRange.highlight.clone(), state.activeSelectionLayer);
}

/**
 * Restores a selection made from a header or spanning a whole axis. Returns `false` when the
 * captured ranges no longer fit the arriving sheet.
 */
function restoreHeaderSelection(hot: HotInstance, state: SelectionState): boolean {
  if (!fitsGrid(hot, state)) {
    return false;
  }

  if (state.ranges.length === 1 && replaySingleLayer(hot, state)) {
    return true;
  }

  importLayers(hot, state);

  return true;
}

/**
 * Moves the focus back to the cell it had inside its layer. `selectCells()` puts the focus on the
 * start of the last range, so a focus moved inside a range, or held by another layer, is otherwise
 * lost on the round-trip.
 */
function restoreFocus(hot: HotInstance, state: SelectionState): void {
  const layer = state.ranges[state.activeSelectionLayer];
  const highlight = state.activeRange?.highlight;
  const current = hot.selection.getActiveSelectedRange()?.highlight;
  const unchanged = hot.selection.getActiveSelectionLayerIndex() === state.activeSelectionLayer &&
    current?.row === highlight?.row && current?.col === highlight?.col;

  if (!unchanged && layer && highlight && fitsGrid(hot, state) && layer.includes(highlight)) {
    hot.selection.setRangeFocus(highlight.clone(), state.activeSelectionLayer);
  }
}

/**
 * Restores the selection and returns whether it did. A selection made from a header, or one
 * spanning a whole axis, is replayed from the captured selection state; a plain cell selection goes
 * through `selectCells()`, which runs the selection hooks, and gets its focus back afterwards.
 */
function restoreSelection(hot: HotInstance, state: ViewState): boolean {
  const snapshot = state.selectionState ?? null;

  if (snapshot && isHeaderSelection(snapshot)) {
    return restoreHeaderSelection(hot, snapshot);
  }

  if (!state.selection || !hot.selectCells(state.selection, false, false)) {
    return false;
  }

  if (snapshot) {
    restoreFocus(hot, snapshot);
  }

  return true;
}

/**
 * Captures the current runtime view state of the grid.
 */
export function captureViewState(
  hot: HotInstance,
  trackedCellMeta: TrackedCellMeta[],
  parts?: ReadonlySet<ViewStatePart>,
): ViewState {
  const covers = toPartFilter(parts);
  const neutral = createNeutralViewState();
  const { colWidths, rowHeights } = captureSizes(hot, covers);

  // The cheap reads (the index sequences, the hidden and trimmed sets, the frozen counts) are always
  // taken. A part left out of `parts` keeps its neutral value, so a caller that asks for a few parts
  // does not pay for the scan of the filters, the merges, the borders and the selection.
  return {
    ...captureAxisState(hot, covers),
    collapsedParents: covers('collapsedRows') ? captureCollapsedParents(hot) : neutral.collapsedParents,
    collapsedColumns: covers('collapsedColumns') ? captureCollapsedColumns(hot) : neutral.collapsedColumns,
    checkedRows: covers('checkedRows') ? captureCheckedRows(hot) : neutral.checkedRows,
    colWidths,
    rowHeights,
    sortConfig: covers('sort') ? captureSortConfig(hot) : neutral.sortConfig,
    filterConditions: covers('filters') ? captureFilterConditions(hot) : neutral.filterConditions,
    mergedCells: covers('mergedCells') ? captureMergedCells(hot) : neutral.mergedCells,
    fixedColumnsStart: hot.getSettings().fixedColumnsStart as number | undefined,
    fixedColumnsEnd: hot.getSettings().fixedColumnsEnd as number | undefined,
    fixedRowsTop: hot.getSettings().fixedRowsTop as number | undefined,
    fixedRowsBottom: hot.getSettings().fixedRowsBottom as number | undefined,
    customBorders: covers('customBorders') ? captureCustomBorders(hot) : neutral.customBorders,
    cellMeta: trackedCellMeta.slice(),
    pagination: covers('pagination') ? capturePagination(hot) : neutral.pagination,
    selection: covers('selection') ? hot.getSelected() : neutral.selection,
    selectionState: covers('selection') ? captureSelectionState(hot) : neutral.selectionState,
    scroll: covers('scroll') ?
      { row: hot.getFirstFullyVisibleRow(), col: hot.getFirstFullyVisibleColumn() } : neutral.scroll,
  };
}

/**
 * Maps stored physical indexes back to the visual ones the hiding plugins take, dropping
 * indexes that trimming has since taken out of the visual space.
 */
function toVisualIndexes(indexes: number[], toVisual: (index: number) => number | null): number[] {
  return indexes
    .map(index => toVisual(index))
    .filter((index): index is number => index !== null);
}

/**
 * Restores the trimmed row set, clearing whatever the previously active sheet left behind.
 * Rows past the end of the data are dropped first — the data may have shrunk while the sheet
 * was away, and `trimRows()` rejects the whole list when a single index is out of range.
 */
function restoreTrimmedState(hot: HotInstance, state: ViewState) {
  const trimRowsPlugin = getEnabledPlugin(hot, 'trimRows') as
    { untrimAll: () => void, trimRows: (rows: number[]) => void } | undefined;

  if (trimRowsPlugin) {
    const sourceRows = hot.countSourceRows();

    trimRowsPlugin.untrimAll();
    trimRowsPlugin.trimRows(state.trimmedRows.filter(row => row < sourceRows));
  }
}

/**
 * Replaces the hidden rows with a set of physical rows. A row a filter, TrimRows, or a collapsed
 * NestedRows parent trims has no visual index, so the plugin's visual `showRows()`/`hideRows()` reject
 * a list that holds one and could never show or hide it. The plugin's own physical method takes the
 * whole set, runs the hiding hooks, and leaves its map untouched when a listener vetoes the change.
 */
function restoreHiddenRows(hot: HotInstance, physicalRows: number[]) {
  (getEnabledPlugin(hot, 'hiddenRows') as { _replaceHiddenRows: (rows: number[]) => void } | undefined)
    ?._replaceHiddenRows(physicalRows);
}

/**
 * Restores the hidden index sets, clearing whatever the previously active sheet left behind
 * first. Runs after trimming and filters, since it addresses rows by their visual index.
 */
function restoreHiddenState(hot: HotInstance, state: ViewState, covers: PartFilter = () => true) {
  const hiddenColumnsPlugin = covers('hiddenColumns') ? getEnabledPlugin(hot, 'hiddenColumns') as unknown as
    { getHiddenColumns: () => number[], showColumns: (cols: number[]) => void, hideColumns: (cols: number[]) => void }
    | undefined : undefined;

  if (covers('hiddenRows')) {
    restoreHiddenRows(hot, state.hiddenRows);
  }

  if (hiddenColumnsPlugin) {
    hiddenColumnsPlugin.showColumns(hiddenColumnsPlugin.getHiddenColumns());
    hiddenColumnsPlugin.hideColumns(toVisualIndexes(state.hiddenColumns, col => hot.toVisualColumn(col)));
  }
}

/**
 * Clears the sort when one is on and the grid sorts its own rows. A grid with no sort is left alone, so a
 * switch between unsorted sheets fires no `beforeColumnSort`/`afterColumnSort`.
 */
function clearActiveSort(hot: HotInstance) {
  const sorting = getSortingPlugin(hot);
  const config = sorting?.getSortConfig();

  if (sorting && Array.isArray(config) && config.length > 0 && hot.runHooks('hasExternalDataSource') !== true) {
    sorting.sort([]);
  }
}

/**
 * Writes a stored index order into a mapper, unless the data changed size while the sheet was
 * away. A sheet's data array is the caller's own, and rows added or removed while another
 * sheet was in front would leave the stored order describing a grid that no longer exists.
 * Returns whether the order was written.
 */
function restoreSequence(
  mapper: { setIndexesSequence: (sequence: number[]) => void, getNumberOfIndexes: () => number },
  sequence: number[],
): boolean {
  if (sequence.length !== mapper.getNumberOfIndexes()) {
    return false;
  }

  mapper.setIndexesSequence(sequence);

  return true;
}

/**
 * Restores the row/column order together with the sort state. The sorting plugin owns the
 * row order while a sort is on: it sorts from the order it cached before the first sort, and
 * resets the rows to that cache every time it sorts. So a sort that is on is cleared first
 * (dropping the states the previous sheet left behind), the unsorted order is handed back, the
 * sort is re-applied on top of it — the plugin takes the order it finds as its cache, because the
 * sort starts from empty states — and only then the exact live order, which may carry manual moves
 * made after the sort, is written last.
 *
 * A `beforeColumnSort` listener can cancel either `sort()` call. The rows still land in the
 * captured order, which is written directly, so `restoreCanceledSortStates()` puts the sort
 * states back to match them. It runs right after the canceled call, while the rows are still in
 * the unsorted order, because writing the states onto an unsorted grid is when the plugin takes
 * its cache.
 *
 * Returns the order parts whose stored sequence no longer matched the data's length and was
 * therefore not written.
 */
function restoreAxisState(hot: HotInstance, state: ViewState, covers: PartFilter): ViewStatePart[] {
  const notApplied: ViewStatePart[] = [];
  const sorting = covers('sort') ? getSortingPlugin(hot) : undefined;
  const hasSortConfig = state.sortConfig.length > 0;

  // The sort config is stored by physical column and translated right before each call into the
  // sorting plugin (`toPluginSortConfig()`): this runs inside a batch, so the index cache the plugin
  // translates with still holds the column order from before the restore, not the one written here.
  if (covers('columnOrder') && !restoreSequence(hot.columnIndexMapper, state.columnSequence)) {
    notApplied.push('columnOrder');
  }

  if (sorting) {
    clearActiveSort(hot);

    if (hasSortConfig) {
      const isUnsortedOrderRestored =
        restoreSequence(hot.rowIndexMapper, state.unsortedRowSequence ?? state.rowSequence);

      sorting.sort(toPluginSortConfig(hot, state.sortConfig));

      if (isUnsortedOrderRestored && covers('rowOrder')) {
        restoreCanceledSortStates(sorting, toPluginSortConfig(hot, state.sortConfig));
      }
    }
  }

  if (!covers('rowOrder')) {
    return notApplied;
  }

  // A row order written under a sort the state does not mention would leave the header indicator and
  // `getSortConfig()` describing an order the rows no longer have, so that sort is cleared first. Only a
  // sort that is on is cleared: `sort([])` on a grid that never sorted makes the sorting plugin cache the
  // order from before the restore, which a later sort and clear would bring back over the restored one, and
  // on a grid with an external data source it sends a fetch with an empty sort.
  if (!covers('sort')) {
    clearActiveSort(hot);
  }

  if (!restoreSequence(hot.rowIndexMapper, state.rowSequence)) {
    notApplied.push('rowOrder');

    return notApplied;
  }

  if (state.rowHeaders) {
    getEnabledBindRowsWithHeaders(hot)?._importStrictHeaders(state.rowHeaders);
  }

  return notApplied;
}

/**
 * Writes the captured sort states back after a `beforeColumnSort` listener canceled the restore's
 * `sort()`. A canceled call returns before the plugin records the states, and `loadData` has
 * already cleared them, so the header indicators and `getSortConfig()` would describe an unsorted
 * grid over the sorted rows. It goes through `setSortConfig()`, the pattern the sorting plugin
 * documents for a canceled sort, and it runs while the rows are in the captured unsorted order,
 * which `setSortConfig()` then keeps as the order a later clear goes back to. The caller runs it
 * only when that order and the row order are restored: when the sheet's data changed size while it
 * was away, the order is skipped, the rows stay in the `loadData` order, and an indicator would
 * claim a sort they do not have.
 *
 * Nothing is written when the states are no longer empty: the sort ran, or the listener that
 * canceled it set a config of its own, which stays. Nothing is written either while the plugin
 * holds no pre-sort row cache. It builds that cache only inside a `sort()` that starts from empty
 * states, so states written without one make the next `sort()` throw. The cache is missing after
 * the plugin was disabled and enabled again, which a sheet declaring `columnSorting: false` does
 * on every switch.
 */
function restoreCanceledSortStates(sorting: SortingPlugin, sortConfig: SortedColumn[]) {
  const currentStates = sorting.getSortConfig() as unknown[];

  if (sorting.indexesSequenceCache === null || currentStates.length > 0) {
    return;
  }

  sorting.setSortConfig(sortConfig);
}

/**
 * Drops every manual column width and row height override through the plugins' own bulk
 * clears, so a sheet that was never resized does not inherit the previous sheet's sizes.
 * The bulk call empties the whole map at once — a per-index loop over `countRows()` would
 * both cost one call per row on the switch path and miss every index the arriving sheet
 * trims out of the count. A disabled plugin is cleared too: it keeps the sizes it had when it was
 * turned off and puts them back when it is turned on again, so a sheet with the plugin off between
 * a resized sheet and a never-visited one carried the resized sheet's sizes over to the new one.
 */
function clearManualSizes(hot: HotInstance, covers: PartFilter = () => true) {
  const manualColumnResize = hot.getPlugin('manualColumnResize') as
    { clearManualSizes: () => void } | undefined;
  const manualRowResize = hot.getPlugin('manualRowResize') as
    { clearManualSizes: () => void } | undefined;

  if (covers('columnWidths')) {
    manualColumnResize?.clearManualSizes();
  }

  if (covers('rowHeights')) {
    manualRowResize?.clearManualSizes();
  }
}

/**
 * Restores manual column widths and row heights, dropping the overrides carried over from the
 * previously active sheet first. The stored pairs are physical, and the plugins' bulk setter
 * writes them physically too, so a size follows its record through trimming and reorder — and
 * skips indexes the shrunken data no longer covers.
 */
function restoreSizes(hot: HotInstance, state: ViewState, covers: PartFilter) {
  const columnResize = covers('columnWidths') ? getResizePlugin(hot, 'column') : undefined;
  const rowResize = covers('rowHeights') ? getResizePlugin(hot, 'row') : undefined;

  columnResize?.clearManualSizes();
  rowResize?.clearManualSizes();
  columnResize?.setManualSizes(state.colWidths);
  rowResize?.setManualSizes(state.rowHeights);
}

/**
 * Restores filter conditions and re-applies the filter. Skipped when there is nothing to apply
 * and nothing to clear, so a switch between two unfiltered sheets does not run a filter pass.
 *
 * A `beforeFilter` listener can cancel the pass, and a canceled pass puts back the conditions of
 * the previous pass, which ran on the departing sheet. A pass that ran fires `afterFilter` and a
 * canceled one does not, so that hook is the signal; comparing conditions would also fire when an
 * `afterFilter` listener edited them, and the re-import would then undo that edit. After a canceled
 * pass the arriving sheet's conditions go back in through the Filters plugin's baseline import,
 * which also makes them the fallback for any later canceled pass on this sheet. The rows stay
 * unfiltered while the menu shows those conditions: whether the sheet is filtered is the
 * listener's call, and with DataProvider it is the server that filters. The skipped case sets an empty baseline for
 * the same reason: without it, the first canceled pass on an unfiltered sheet, and the undo of
 * its first filter, would bring back the departing sheet's conditions. The pass itself imports
 * the conditions the plain way, so `beforeFilter` still receives the departing sheet's conditions
 * as the previous stack.
 */
function restoreFilterConditions(hot: HotInstance, state: ViewState) {
  const filters = getEnabledPlugin(hot, 'filters') as {
    importConditions: (conditions: unknown[]) => void,
    importBaselineConditions: (conditions: unknown[]) => void,
    exportConditions: () => unknown[],
    filter: () => void,
  } | undefined;

  if (!filters || !state.filterConditions) {
    return;
  }

  if (state.filterConditions.length === 0 && filters.exportConditions().length === 0) {
    filters.importBaselineConditions([]);

    return;
  }

  filters.importConditions(state.filterConditions);

  if (!runFilterPass(hot, filters)) {
    filters.importBaselineConditions(state.filterConditions);
  }
}

/**
 * Drops the conditions the Filters plugin falls back to after a canceled pass, without running a
 * filter pass. The reset is always followed by the arriving sheet's `loadData()`, which empties the
 * condition collection and resets the plugin's trimming map, so a pass here would only filter the
 * departing sheet's rows and fire the filter hooks for a sheet the user is leaving.
 */
function clearFilterBaseline(hot: HotInstance) {
  const filters = getEnabledPlugin(hot, 'filters') as
    { importBaselineConditions: (conditions: unknown[]) => void } | undefined;

  filters?.importBaselineConditions([]);
}

/**
 * Runs one filter pass and returns whether it ran, which a canceled one does not. It listens for
 * `afterFilter`, which the Filters plugin fires only for a pass no `beforeFilter` listener
 * canceled, and removes the listener in a `finally`, because the pass runs host code that can
 * throw.
 */
function runFilterPass(hot: HotInstance, filters: { filter: () => void }): boolean {
  let hasRun = false;
  const onAfterFilter = () => {
    hasRun = true;
  };

  hot.addHook('afterFilter', onAfterFilter);

  try {
    filters.filter();
  } finally {
    hot.removeHook('afterFilter', onAfterFilter);
  }

  return hasRun;
}

/**
 * Drops every merged cell of the sheet on screen. Must run while that sheet's data is still
 * loaded: MergeCells does not react to `loadData`, and clearing a merge resets the cell meta
 * of every cell it covers, so run against a shorter sheet it addresses rows that no longer
 * exist and throws.
 */
export function clearMergedCells(hot: HotInstance): void {
  getEnabledMergeCells(hot)?.clearCollections();
}

/**
 * Restores merged cell ranges into a collection {@link clearMergedCells} emptied before the
 * sheet's data load. The merges the sheet's settings declare are not built on this path.
 * MergeCells drops a stored merge that no longer fits — the sheet's data is the caller's own and
 * can shrink while the sheet is away — and one that would overlap a merge already on screen,
 * which a host listener can add during the load. The rest go through the automatic merge path,
 * like merges declared in the settings: the hooks report `auto`, so a listener can tell a restore
 * from a user's merge, and no cell is written, so the covered cells keep the values they hold.
 *
 * It runs after the restore's batch, once the index cache holds the restored row and column order: an area is
 * placed from its physical anchor through that cache, and a merge made inside the batch was placed through the
 * order from before the restore, so a sheet with a sort or a row or column move got its merges back over
 * other cells.
 */
function restoreMergedCells(hot: HotInstance, state: ViewState) {
  getEnabledMergeCells(hot)?.restoreMergedAreas(state.mergedCells);
}

/**
 * Restores custom borders from the `borders` cell meta, which is the record of a sheet's borders: the sheets
 * bar keeps it with the sheet's other cell meta and core writes it back with the rows. The border list the
 * view state captures (`customBorders`) is not replayed, because it holds visual coordinates only and so
 * misses a border on a row the filters hide. The model keeps visual coordinates, so CustomBorders only marks
 * it for a rebuild here, and the rebuild runs on the next model read or render, once the restore's batch
 * has resumed the index cache with the restored sort and moves.
 */
export function rebuildCustomBordersFromCellMeta(hot: HotInstance): void {
  const customBorders = hot.getPlugin('customBorders');

  if (customBorders?.enabled) {
    customBorders._rebuildFromCellMeta();
  }
}

/**
 * Removes every custom border, from the model and from the cell meta. The sheets bar runs it before a sheet
 * comes back, while the grid still holds the departing sheet's rows: the arriving sheet's borders come back
 * as its kept cell meta, and a departing border left in the model would be written onto the arriving rows
 * when CustomBorders applies its settings.
 */
export function clearCustomBorders(hot: HotInstance): void {
  const customBorders = hot.getPlugin('customBorders');

  if (customBorders?.enabled) {
    customBorders.clearBorders();
  }
}

/**
 * Restores a previously captured view state. Order matters: row/column order and sort first,
 * since later steps address cells by that reordered position; then filters and trimming,
 * which decide the visual space; then the hidden sets, which are addressed in it; then the
 * collapsed NestedRows parents, after the hidden sets because collapsing trims the children out
 * of that visual space and a hidden child would no longer be found by its visual index; then
 * sizes, freeze, and borders, none of which depend on each other. After the batch come the merges,
 * which are placed through the index cache and need the restored order in it (see {@link restoreMergedCells}),
 * then the collapsed column groups, whose header tree is derived through the same cache, and the checked rows.
 *
 * The kept cell meta (`state.cellMeta`) is not replayed here: the sheets bar hands it to core's
 * `_applySettingsAndData()` together with the sheet's rows, which writes it back before the cell
 * types expand, so a `type` comes back with its renderer and validator.
 *
 * The selection and the scroll position are left to {@link restoreViewport}: both need the
 * grid painted with the arriving sheet's sizes, and this runs inside a render batch.
 *
 * With `parts` given, only those parts' steps run, still in this order, and every other part of
 * the grid is left as it is. Returns the order parts that were not written because their stored
 * sequence no longer matched the data's length.
 */
export function restoreViewState(
  hot: HotInstance,
  state: ViewState,
  parts?: ReadonlySet<ViewStatePart>,
): ViewStatePart[] {
  const covers = toPartFilter(parts);
  let notApplied: ViewStatePart[] = [];

  safeBatch(hot, () => {
    notApplied = restoreAxisState(hot, state, covers);

    if (covers('filters')) {
      restoreFilterConditions(hot, state);
    }

    if (covers('trimmedRows')) {
      restoreTrimmedState(hot, state);
    }

    restoreHiddenState(hot, state, covers);

    if (covers('collapsedRows')) {
      restoreCollapsedParents(hot, state);
    }

    restoreSizes(hot, state, covers);

    // A captured `undefined` means no freeze was configured when the sheet was captured, so a
    // freeze another sheet set at runtime is cleared back to none rather than left in force. The
    // frozen end columns and the frozen rows follow the same rule as the start ones.
    if (covers('frozen')) {
      FROZEN_COUNT_KEYS.forEach(key => setFrozenCount(hot, key, state[key] ?? 0));
    }

    if (covers('customBorders')) {
      rebuildCustomBordersFromCellMeta(hot);
    }
  });

  if (covers('mergedCells')) {
    safeBatch(hot, () => restoreMergedCells(hot, state));
  }

  restorePluginStates(hot, state, covers);
  hot.render();

  return notApplied;
}

/**
 * Puts back the collapsed column groups and the checked rows, the state two plugins keep for the data
 * they show and drop on every `loadData()`. Runs outside the restore batch (see {@link restoreViewState}).
 */
function restorePluginStates(hot: HotInstance, state: ViewState, covers: PartFilter) {
  if (covers('collapsedColumns')) {
    restoreCollapsedColumns(hot, state);
  }

  if (covers('checkedRows')) {
    restoreCheckedRows(hot, state);
  }
}

/**
 * Puts the page, the selection, and the scroll position back. Runs after the render batch the
 * rest of the restore happens in: scrolling to a column while rendering is suspended measures
 * the widths of the sheet that has just left, and lands short by the difference. The page goes
 * first, because the rows of every other page are hidden, and a selection or a scroll aimed at a
 * hidden row does nothing. Returns whether the captured selection was put back, which decides
 * what {@link keepSelectionOnPage} may do with it. With `parts` given, only the page, the
 * selection, and the scroll position those parts name are put back; a selection left out counts
 * as not restored.
 */
export function restoreViewport(hot: HotInstance, state: ViewState, parts?: ReadonlySet<ViewStatePart>): boolean {
  const covers = toPartFilter(parts);

  if (state.pagination && covers('pagination')) {
    applyPagination(hot, state.pagination);
  }

  const restored = covers('selection') && restoreSelection(hot, state);

  if (covers('scroll')) {
    hot.scrollViewportTo({
      row: state.scroll.row,
      col: state.scroll.col,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });
  }

  return restored;
}

/**
 * Opens a never-visited sheet on the configured initial page and page size, and scrolled to its first
 * row and column, instead of the page, the page size, and the scroll offset the previous sheet left
 * behind: `loadData` keeps the holder's scroll offset. Runs after the render batch, like
 * {@link restoreViewport}, so the page count and the column widths are the arriving sheet's. With
 * `parts` given, only the page and the scroll position those parts name are reset.
 */
export function resetViewport(hot: HotInstance, parts?: ReadonlySet<ViewStatePart>): void {
  const covers = toPartFilter(parts);
  const pagination = getLocalPagination(hot);

  if (pagination && covers('pagination')) {
    applyPagination(hot, {
      page: pagination.getSetting('initialPage') as number,
      pageSize: pagination.getSetting('pageSize') as number | 'auto',
    });
  }

  if (covers('scroll')) {
    hot.scrollViewportTo({ row: 0, col: 0, verticalSnap: 'top', horizontalSnap: 'start' });
  }
}

/**
 * Whether a visual row sits on the page Pagination currently shows.
 */
function isRowOnPage(pagination: PaginationPlugin, row: number): boolean {
  const { firstVisibleRowIndex, lastVisibleRowIndex } = pagination.getPaginationData();

  return row >= firstVisibleRowIndex && row <= lastVisibleRowIndex;
}

/**
 * Returns the page a row is estimated to sit on, from how many pages it lies away from the current
 * page's first row. A number page size is the page length; `'auto'` falls back to the shown page's
 * span. Hidden rows, a short last page, and `'auto'` pages of other lengths make it an estimate,
 * which {@link followRow} refines one page at a time.
 */
function estimatePageOfRow(pagination: PaginationPlugin, row: number): number {
  const { totalPages, firstVisibleRowIndex, lastVisibleRowIndex } = pagination.getPaginationData();
  const pageSize = pagination.getCurrentPageSize();
  const rowsPerPage = typeof pageSize === 'number' ?
    Math.max(pageSize, 1) :
    Math.max(lastVisibleRowIndex - firstVisibleRowIndex + 1, 1);
  const offset = Math.floor((row - firstVisibleRowIndex) / rowsPerPage);

  return clamp(pagination.getCurrentPage() + offset, 1, Math.max(totalPages, 1));
}

/**
 * Pages one step towards a row and returns whether the page changed — `false` when there is no
 * further page that way, or a `beforePageChange` listener vetoed the change.
 */
function stepTowardsRow(pagination: PaginationPlugin, row: number): boolean {
  const page = pagination.getCurrentPage();

  if (row < pagination.getPaginationData().firstVisibleRowIndex) {
    pagination.prevPage();
  } else {
    pagination.nextPage();
  }

  return pagination.getCurrentPage() !== page;
}

/**
 * Opens the page a row sits on and returns whether it got there. It jumps once to the estimated
 * page, so a gap of many pages fires the page hooks once, and then walks one page at a time: a walk
 * cannot overshoot, where repeated estimates from pages of different lengths can bounce past the
 * row for ever. Stops when a step does not move the page, and after one pass over the page count.
 */
function followRow(hot: HotInstance, pagination: PaginationPlugin, row: number): boolean {
  const { totalPages } = pagination.getPaginationData();
  const estimate = estimatePageOfRow(pagination, row);

  if (estimate !== pagination.getCurrentPage()) {
    pagination.setPage(estimate);
  }

  for (let step = 0; step < totalPages && !isRowOnPage(pagination, row); step++) {
    if (!stepTowardsRow(pagination, row)) {
      break;
    }
  }

  if (!isRowOnPage(pagination, row)) {
    return false;
  }

  hot.scrollViewportTo({ row, verticalSnap: 'top' });

  return true;
}

/**
 * Keeps the focused cell on the page Pagination shows, once the arriving sheet is painted. With a
 * `'auto'` page size the page boundaries depend on row heights measured in that paint, so the
 * restored page can end a row short of the selection; a host can also veto the page change. A
 * restored selection is followed to its page (`follow`); one that was not restored (made by a
 * plugin or a listener during the switch) is not, and a selection still off the page is dropped
 * rather than left on a hidden row.
 */
export function keepSelectionOnPage(hot: HotInstance, follow: boolean): void {
  const pagination = getLocalPagination(hot);
  const row = hot.selection.getActiveSelectedRange()?.highlight.row;

  if (!pagination || row === undefined || row === null || row < 0 || isRowOnPage(pagination, row)) {
    return;
  }

  if (!follow || !followRow(hot, pagination, row)) {
    hot.deselectCell();
  }
}

/**
 * Returns the view state a never-visited sheet opens with: nothing hidden, trimmed,
 * sorted, filtered, merged, bordered, collapsed, checked, or manually sized. The row/column sequences are
 * left empty because `loadData` has already reset both mappers by the time this runs.
 */
export function createNeutralViewState(): ViewState {
  return {
    rowSequence: [],
    rowHeaders: undefined,
    unsortedRowSequence: [],
    columnSequence: [],
    hiddenRows: [],
    hiddenColumns: [],
    trimmedRows: [],
    collapsedParents: [],
    colWidths: [],
    rowHeights: [],
    sortConfig: [],
    filterConditions: [],
    mergedCells: [],
    fixedColumnsStart: undefined,
    fixedColumnsEnd: undefined,
    fixedRowsTop: undefined,
    fixedRowsBottom: undefined,
    customBorders: [],
    cellMeta: [],
    pagination: null,
    selection: undefined,
    selectionState: null,
    scroll: { row: 0, col: 0 },
    collapsedColumns: null,
    checkedRows: null,
  };
}

/**
 * The four frozen counts of a sheet, as the grid had them before any sheet was applied.
 */
export type NeutralFrozenCounts = Partial<Record<FrozenCountKey, number | undefined>>;

export type FrozenCountKey = 'fixedColumnsStart' | 'fixedColumnsEnd' | 'fixedRowsTop' | 'fixedRowsBottom';

export const FROZEN_COUNT_KEYS: readonly FrozenCountKey[] = [
  'fixedColumnsStart',
  'fixedColumnsEnd',
  'fixedRowsTop',
  'fixedRowsBottom',
];

/**
 * Removes the count a plugin or an action wrote on the table meta. The freeze bar, `ManualColumnFreeze`, `alter()` and
 * undo write a frozen count there, where it shadows the grid-level setting, and `updateSettings()` leaves a shadow
 * alone when the new value equals the previous grid-level one. A sheet's count must win over what another sheet left
 * behind, so the shadow goes first.
 *
 * @param {object} hot The Handsontable instance.
 * @param {string} key The frozen count option.
 */
export function clearFrozenCountShadow(hot: HotInstance, key: FrozenCountKey): void {
  const meta = hot.getSettings();

  Reflect.deleteProperty(meta, key);

  // the two names of the start freeze share one backing field
  if (key === 'fixedColumnsStart') {
    Reflect.deleteProperty(meta, '_fixedColumnsStart');
  }
}

/**
 * Makes a frozen count what a sheet needs it to be.
 *
 * @param {object} hot The Handsontable instance.
 * @param {string} key The frozen count option.
 * @param {number} value The count.
 */
function setFrozenCount(hot: HotInstance, key: FrozenCountKey, value: number): void {
  if ((hot.getSettings()[key] ?? 0) === value) {
    return;
  }

  clearFrozenCountShadow(hot, key);

  if ((hot.getSettings()[key] ?? 0) === value) {
    return;
  }

  // The count is written on the table meta, the way the freeze bar writes it, and not through `updateSettings()`: a
  // wrapper re-sends the app's own value on each render, and it would revert a count that became the grid-level one.
  // A shadow survives such a re-send, because `updateSettings()` drops it only for a value that differs from the
  // previous grid-level one.
  const meta = hot.getSettings() as Record<string, unknown>;

  meta[key === 'fixedColumnsStart' ? '_fixedColumnsStart' : key] = value;

  if (key === 'fixedRowsTop' || key === 'fixedRowsBottom') {
    // the rows Filters exempts from the filter may have changed, and no update tells it
    hot.getPlugin('filters')?._markPinnedRowsStale();
  }
}

/**
 * Returns the grid to a neutral baseline. Switching to a sheet that carries no captured
 * view state must not inherit the previous sheet's filters, hidden or trimmed indexes,
 * sort, merges, borders, manual sizes, or a freeze set at runtime (`fixedColumnsStart`
 * carries the value the grid started with): `loadData` resets the index mappers and
 * ColumnSorting clears itself on `afterLoadData`, but every other collection survives it.
 * Every caller loads the arriving sheet's data right after the reset, which also empties the
 * filter conditions, so the reset runs no filter pass of its own.
 *
 * The merges are cleared first. MergeCells takes the span attributes off the rendered cells it
 * finds through `getCell()` at their visual coordinates, and those coordinates hold only while
 * the index maps still match the drawn rows: cleared after the trimmed and hidden rows came back,
 * the attributes were taken off another cell and the merged one kept its `rowspan`. With
 * MergeCells disabled for the arriving sheet, no render repaired it.
 *
 * With `parts` given, only those parts are reset, and every other part of the grid is left as it is.
 */
export function resetViewState(
  hot: HotInstance,
  neutral: NeutralFrozenCounts = {},
  parts?: ReadonlySet<ViewStatePart>,
): void {
  const covers = toPartFilter(parts);
  const state = createNeutralViewState();

  safeBatch(hot, () => {
    // An `undefined` neutral value means the grid never configured that freeze, so a freeze set at
    // runtime on another sheet is cleared back to none rather than left in force.
    if (covers('frozen')) {
      FROZEN_COUNT_KEYS.forEach(key => setFrozenCount(hot, key, neutral[key] ?? 0));
    }

    if (covers('mergedCells')) {
      clearMergedCells(hot);
    }

    if (covers('sort')) {
      clearActiveSort(hot);
    }

    if (covers('filters')) {
      clearFilterBaseline(hot);
    }

    if (covers('trimmedRows')) {
      restoreTrimmedState(hot, state);
    }

    restoreHiddenState(hot, state, covers);
    clearManualSizes(hot, covers);

    if (covers('customBorders')) {
      clearCustomBorders(hot);
    }
  });

  restorePluginStates(hot, state, covers);
  hot.render();
}
