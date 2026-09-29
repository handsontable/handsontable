import type { HotInstance } from '../../core/types';
import type { SelectionState } from '../../selection/types';
import { clamp } from '../../helpers/number';

/**
 * One tracked explicit cell-meta write. The indexes are physical: a visual index only means
 * something against the row and column order in force when it was read, and the entries are
 * served lazily against whatever order is in force when the cell's meta is next read.
 */
export interface TrackedCellMeta {
  row: number;
  col: number;
  key: string;
  value: unknown;
}

/**
 * Snapshot of the runtime-mutable view state of one sheet. The manual size overrides are
 * sparse `[physicalIndex, size]` pairs — a dense array the length of the row count would
 * retain one slot per row per sheet for the session, and a visual index would lose every
 * trimmed row's size.
 */
export interface ViewState {
  rowSequence: number[];
  unsortedRowSequence: number[];
  columnSequence: number[];
  hiddenRows: number[];
  hiddenColumns: number[];
  trimmedRows: number[];
  collapsedParents: number[][];
  colWidths: Array<[number, number]>;
  rowHeights: Array<[number, number]>;
  sortConfig: unknown;
  filterConditions: unknown[] | null;
  mergedCells: Array<{ row: number, col: number, rowspan: number, colspan: number }>;
  fixedColumnsStart: number | undefined;
  customBorders: Array<Record<string, unknown>>;
  cellMeta: TrackedCellMeta[];
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
 * The part of the Pagination plugin the view state talks to.
 */
interface PaginationPlugin {
  getCurrentPage: () => number;
  getCurrentPageSize: () => number | 'auto';
  setPage: (page: number) => void;
  setPageSize: (pageSize: number | 'auto') => void;
  getSetting: (name: string) => unknown;
  getPaginationData: () => { totalPages: number, firstVisibleRowIndex: number, lastVisibleRowIndex: number };
}

/**
 * Runs an operation with rendering and index-cache recalculation suspended, resuming both in a
 * `finally` — `Core#batch` has no such guard, and the restore runs host code through the
 * filters and sorting plugins, whose hooks a listener can throw from. Left un-resumed, the
 * grid would silently skip every later render.
 */
function safeBatch(hot: HotInstance, operations: () => void) {
  hot.suspendRender();
  hot.suspendExecution();

  try {
    operations();
  } finally {
    hot.resumeExecution();
    hot.resumeRender();
  }
}

/**
 * Returns the plugin instance for `name` only when it is registered and enabled;
 * `undefined` otherwise. Keeps every capture/restore helper safe when a feature
 * plugin is absent from the grid's configuration.
 */
function getEnabledPlugin(hot: HotInstance, name: string): { enabled: boolean } | undefined {
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
function captureAxisState(hot: HotInstance) {
  const hiddenRowsPlugin = getEnabledPlugin(hot, 'hiddenRows') as { pluginName: string } | undefined;
  const hiddenRowsMap = hiddenRowsPlugin
    ? hot.rowIndexMapper.hidingMapsCollection.get(hiddenRowsPlugin.pluginName) as
      { getHiddenIndexes: () => number[] } | undefined
    : undefined;
  const hiddenColumnsPlugin =
    getEnabledPlugin(hot, 'hiddenColumns') as { getHiddenColumns: () => number[] } | undefined;
  const trimRowsPlugin = getEnabledPlugin(hot, 'trimRows') as { getTrimmedRows: () => number[] } | undefined;

  return {
    rowSequence: hot.rowIndexMapper.getIndexesSequence().slice(),
    unsortedRowSequence: captureUnsortedRowSequence(hot),
    columnSequence: hot.columnIndexMapper.getIndexesSequence().slice(),
    hiddenRows: hiddenRowsMap?.getHiddenIndexes() ?? [],
    hiddenColumns: (hiddenColumnsPlugin?.getHiddenColumns() ?? []).map(col => hot.toPhysicalColumn(col)),
    trimmedRows: trimRowsPlugin?.getTrimmedRows() ?? [],
  };
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
      parents: number[], action: 'collapse', shouldRunHooks?: boolean, forceRender?: boolean
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
 * not a new collapse — and the render is left to the caller's batch.
 */
function restoreCollapsedParents(hot: HotInstance, state: ViewState) {
  const nestedRows = getEnabledPlugin(hot, 'nestedRows') as NestedRowsPlugin | undefined;
  const dataManager = nestedRows?.dataManager;

  if (!dataManager || !nestedRows.collapsingUI || state.collapsedParents.length === 0) {
    return;
  }

  const parents = state.collapsedParents
    .map(path => dataManager.getRowIndexByTreePath(path))
    .filter((row): row is number => row !== null && dataManager.hasChildren(row));

  nestedRows.collapsingUI.toggleCollapsedRows(parents, 'collapse', false, false);
}

/**
 * Returns the resize plugin for one axis, or `undefined` when it is absent or disabled.
 */
function getResizePlugin(hot: HotInstance, axis: 'column' | 'row') {
  return getEnabledPlugin(hot, axis === 'column' ? 'manualColumnResize' : 'manualRowResize') as
    {
      getManualSizes: () => Array<[number, number]>,
      setManualSizes: (sizes: Array<[number, number]>) => void,
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
function captureSizes(hot: HotInstance) {
  return {
    colWidths: getResizePlugin(hot, 'column')?.getManualSizes() ?? [],
    rowHeights: getResizePlugin(hot, 'row')?.getManualSizes() ?? [],
  };
}

/**
 * Captures the sort configuration.
 */
function captureSortConfig(hot: HotInstance): unknown {
  return getSortingPlugin(hot)?.getSortConfig();
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
 * Captures merged cell ranges as plain `{row, col, rowspan, colspan}` records.
 */
function captureMergedCells(hot: HotInstance): Array<{ row: number, col: number, rowspan: number, colspan: number }> {
  const mergeCells = getEnabledPlugin(hot, 'mergeCells') as
    { mergedCellsCollection: { mergedCells: Array<{ row: number, col: number, rowspan: number, colspan: number }> } }
    | undefined;

  return mergeCells?.mergedCellsCollection.mergedCells.map(({ row, col, rowspan, colspan }) => (
    { row, col, rowspan, colspan }
  )) ?? [];
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
function fitsGrid(hot: HotInstance, state: SelectionState): boolean {
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
export function captureViewState(hot: HotInstance, trackedCellMeta: TrackedCellMeta[]): ViewState {
  const { colWidths, rowHeights } = captureSizes(hot);

  return {
    ...captureAxisState(hot),
    collapsedParents: captureCollapsedParents(hot),
    colWidths,
    rowHeights,
    sortConfig: captureSortConfig(hot),
    filterConditions: captureFilterConditions(hot),
    mergedCells: captureMergedCells(hot),
    fixedColumnsStart: hot.getSettings().fixedColumnsStart as number | undefined,
    customBorders: captureCustomBorders(hot),
    cellMeta: trackedCellMeta.slice(),
    pagination: capturePagination(hot),
    selection: hot.getSelected(),
    selectionState: captureSelectionState(hot),
    scroll: { row: hot.getFirstFullyVisibleRow(), col: hot.getFirstFullyVisibleColumn() },
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
 * Restores the hidden index sets, clearing whatever the previously active sheet left behind
 * first. Runs after trimming and filters, since it addresses rows by their visual index.
 */
function restoreHiddenState(hot: HotInstance, state: ViewState) {
  const hiddenRowsPlugin = getEnabledPlugin(hot, 'hiddenRows') as
    { getHiddenRows: () => number[], showRows: (rows: number[]) => void, hideRows: (rows: number[]) => void }
    | undefined;
  const hiddenColumnsPlugin = getEnabledPlugin(hot, 'hiddenColumns') as unknown as
    { getHiddenColumns: () => number[], showColumns: (cols: number[]) => void, hideColumns: (cols: number[]) => void }
    | undefined;

  if (hiddenRowsPlugin) {
    hiddenRowsPlugin.showRows(hiddenRowsPlugin.getHiddenRows());
    hiddenRowsPlugin.hideRows(toVisualIndexes(state.hiddenRows, row => hot.toVisualRow(row)));
  }

  if (hiddenColumnsPlugin) {
    hiddenColumnsPlugin.showColumns(hiddenColumnsPlugin.getHiddenColumns());
    hiddenColumnsPlugin.hideColumns(toVisualIndexes(state.hiddenColumns, col => hot.toVisualColumn(col)));
  }
}

/**
 * Writes a stored index order into a mapper, unless the data changed size while the sheet was
 * away. A sheet's data array is the caller's own, and rows added or removed while another
 * sheet was in front would leave the stored order describing a grid that no longer exists.
 */
function restoreSequence(
  mapper: { setIndexesSequence: (sequence: number[]) => void, getNumberOfIndexes: () => number },
  sequence: number[],
) {
  if (sequence.length === mapper.getNumberOfIndexes()) {
    mapper.setIndexesSequence(sequence);
  }
}

/**
 * Restores the row/column order together with the sort state. The sorting plugin owns the
 * row order while a sort is on: it sorts from the order it cached before the first sort, and
 * resets the rows to that cache every time it sorts. So the sort is cleared first (dropping
 * the states the previous sheet left behind), the unsorted order is handed back, the sort is
 * re-applied on top of it, and only then the exact live order — which may carry manual moves
 * made after the sort — is written last.
 */
function restoreAxisState(hot: HotInstance, state: ViewState) {
  const sorting = getSortingPlugin(hot);
  const hasSortConfig = Array.isArray(state.sortConfig) ? state.sortConfig.length > 0 : Boolean(state.sortConfig);

  // The column order goes first: the sort config addresses its column visually, so re-applying
  // the sort against the order `loadData` reset would sort the wrong physical column on a
  // sheet whose columns were manually moved.
  restoreSequence(hot.columnIndexMapper, state.columnSequence);

  if (sorting) {
    sorting.sort([]);

    if (hasSortConfig) {
      restoreSequence(hot.rowIndexMapper, state.unsortedRowSequence ?? state.rowSequence);
      sorting.sort(state.sortConfig);
    }
  }

  restoreSequence(hot.rowIndexMapper, state.rowSequence);
}

/**
 * Drops every manual column width and row height override through the plugins' own bulk
 * clears, so a sheet that was never resized does not inherit the previous sheet's sizes.
 * The bulk call empties the whole map at once — a per-index loop over `countRows()` would
 * both cost one call per row on the switch path and miss every index the arriving sheet
 * trims out of the count.
 */
function clearManualSizes(hot: HotInstance) {
  const manualColumnResize = getEnabledPlugin(hot, 'manualColumnResize') as
    { clearManualSizes: () => void } | undefined;
  const manualRowResize = getEnabledPlugin(hot, 'manualRowResize') as
    { clearManualSizes: () => void } | undefined;

  manualColumnResize?.clearManualSizes();
  manualRowResize?.clearManualSizes();
}

/**
 * Restores manual column widths and row heights, dropping the overrides carried over from the
 * previously active sheet first. The stored pairs are physical, and the plugins' bulk setter
 * writes them physically too, so a size follows its record through trimming and reorder — and
 * skips indexes the shrunken data no longer covers.
 */
function restoreSizes(hot: HotInstance, state: ViewState) {
  clearManualSizes(hot);
  getResizePlugin(hot, 'column')?.setManualSizes(state.colWidths);
  getResizePlugin(hot, 'row')?.setManualSizes(state.rowHeights);
}

/**
 * Restores filter conditions and re-applies the filter. Skipped when there is nothing to apply
 * and nothing to clear, so a switch between two unfiltered sheets does not run a filter pass.
 */
function restoreFilterConditions(hot: HotInstance, state: ViewState) {
  const filters = getEnabledPlugin(hot, 'filters') as {
    importConditions: (conditions: unknown[]) => void,
    exportConditions: () => unknown[],
    filter: () => void,
  } | undefined;

  if (!filters || !state.filterConditions) {
    return;
  }

  if (state.filterConditions.length === 0 && filters.exportConditions().length === 0) {
    return;
  }

  filters.importConditions(state.filterConditions);
  filters.filter();
}

/**
 * Restores merged cell ranges, clearing the current collection first.
 */
function restoreMergedCells(hot: HotInstance, state: ViewState) {
  const mergeCells = getEnabledPlugin(hot, 'mergeCells') as
    {
      clearCollections: () => void,
      merge: (row: number, col: number, row2: number, col2: number) => void,
    } | undefined;

  if (!mergeCells) {
    return;
  }

  mergeCells.clearCollections();
  state.mergedCells.forEach(({ row, col, rowspan, colspan }) => {
    mergeCells.merge(row, col, row + rowspan - 1, col + colspan - 1);
  });
}

/**
 * The keys of a saved border record that describe its sides. The record also carries its
 * position and id, which `setBorders()` does not take.
 */
const BORDER_SIDES = ['top', 'bottom', 'start', 'end', 'left', 'right'];

/**
 * Restores custom borders, clearing the current set first.
 */
function restoreCustomBorders(hot: HotInstance, state: ViewState) {
  const customBorders = getEnabledPlugin(hot, 'customBorders') as
    {
      clearBorders: () => void,
      setBorders: (ranges: unknown[], borderObject?: Record<string, unknown>) => void,
    } | undefined;

  if (!customBorders) {
    return;
  }

  customBorders.clearBorders();
  state.customBorders.forEach((border) => {
    const { row, col } = border as { row: number, col: number };
    const sides = Object.fromEntries(
      BORDER_SIDES.filter(side => side in border).map(side => [side, border[side]]),
    );

    customBorders.setBorders([[row, col, row, col]], sides);
  });
}

/**
 * Restores a previously captured view state. Order matters: row/column order and sort first,
 * since later steps address cells by that reordered position; then filters and trimming,
 * which decide the visual space; then the hidden sets, which are addressed in it; then the
 * collapsed NestedRows parents, after the hidden sets because collapsing trims the children out
 * of that visual space and a hidden child would no longer be found by its visual index; then
 * sizes, merges, freeze, and borders, none of which depend on each other.
 *
 * The tracked cell meta (`state.cellMeta`) is deliberately not replayed here: the plugin
 * serves it lazily from its `afterGetCellMeta` hook, so a switch pays nothing per entry and
 * no meta object is materialized for a cell nobody reads — replaying 130k validated-sheet
 * entries eagerly made a switch measurably slower and tripled the heap.
 *
 * The selection and the scroll position are left to {@link restoreViewport}: both need the
 * grid painted with the arriving sheet's sizes, and this runs inside a render batch.
 */
export function restoreViewState(hot: HotInstance, state: ViewState): void {
  safeBatch(hot, () => {
    restoreAxisState(hot, state);
    restoreFilterConditions(hot, state);
    restoreTrimmedState(hot, state);
    restoreHiddenState(hot, state);
    restoreCollapsedParents(hot, state);
    restoreSizes(hot, state);
    restoreMergedCells(hot, state);

    // A captured `undefined` means no freeze was configured when the sheet was captured, so a
    // freeze another sheet set at runtime is cleared back to none rather than left in force.
    if ((state.fixedColumnsStart ?? 0) !== (hot.getSettings().fixedColumnsStart ?? 0)) {
      hot.updateSettings({ fixedColumnsStart: state.fixedColumnsStart ?? 0 });
    }

    restoreCustomBorders(hot, state);
  });

  hot.render();
}

/**
 * Puts the page, the selection, and the scroll position back. Runs after the render batch the
 * rest of the restore happens in: scrolling to a column while rendering is suspended measures
 * the widths of the sheet that has just left, and lands short by the difference. The page goes
 * first, because the rows of every other page are hidden, and a selection or a scroll aimed at a
 * hidden row does nothing. Returns whether the captured selection was put back, which decides
 * what {@link keepSelectionOnPage} may do with it.
 */
export function restoreViewport(hot: HotInstance, state: ViewState): boolean {
  if (state.pagination) {
    applyPagination(hot, state.pagination);
  }

  const restored = restoreSelection(hot, state);

  hot.scrollViewportTo({ row: state.scroll.row, col: state.scroll.col, verticalSnap: 'top', horizontalSnap: 'start' });

  return restored;
}

/**
 * Opens a never-visited sheet on the configured initial page and page size, instead of the page
 * and page size the previous sheet left behind. Runs after the render batch, like
 * {@link restoreViewport}, so the page count is the arriving sheet's.
 */
export function resetViewport(hot: HotInstance): void {
  const pagination = getLocalPagination(hot);

  if (pagination) {
    applyPagination(hot, {
      page: pagination.getSetting('initialPage') as number,
      pageSize: pagination.getSetting('pageSize') as number | 'auto',
    });
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
 * Returns the page a row is estimated to sit on, from how many shown-page spans it lies away from
 * the current page's first row. Hidden rows make it an estimate, which {@link followRow} refines.
 */
function estimatePageOfRow(pagination: PaginationPlugin, row: number): number {
  const { totalPages, firstVisibleRowIndex, lastVisibleRowIndex } = pagination.getPaginationData();
  const rowsPerPage = Math.max(lastVisibleRowIndex - firstVisibleRowIndex + 1, 1);
  const offset = Math.floor((row - firstVisibleRowIndex) / rowsPerPage);
  const step = offset === 0 ? Math.sign(row - firstVisibleRowIndex) : offset;

  return clamp(pagination.getCurrentPage() + step, 1, Math.max(totalPages, 1));
}

/**
 * Opens the page a row sits on and returns whether it got there. It jumps to the estimated page
 * rather than paging one step at a time, so a gap of many pages fires the page hooks once, and
 * refines from there. Stops when a page change does not happen — a `beforePageChange` listener
 * vetoed it — and after one pass over the page count.
 */
function followRow(hot: HotInstance, pagination: PaginationPlugin, row: number): boolean {
  const { totalPages } = pagination.getPaginationData();

  for (let step = 0; step < totalPages && !isRowOnPage(pagination, row); step++) {
    const page = pagination.getCurrentPage();

    pagination.setPage(estimatePageOfRow(pagination, row));

    if (pagination.getCurrentPage() === page) {
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
 * restored selection is followed to its page (`follow`); one carried over from the previous sheet
 * is not, and a selection still off the page is dropped rather than left on a hidden row.
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
 * sorted, filtered, merged, bordered, or manually sized. The row/column sequences are
 * left empty because `loadData` has already reset both mappers by the time this runs.
 */
function createNeutralViewState(): ViewState {
  return {
    rowSequence: [],
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
    customBorders: [],
    cellMeta: [],
    pagination: null,
    selection: undefined,
    selectionState: null,
    scroll: { row: 0, col: 0 },
  };
}

/**
 * Returns the grid to a neutral baseline. Switching to a sheet that carries no captured
 * view state must not inherit the previous sheet's filters, hidden or trimmed indexes,
 * sort, merges, borders, manual sizes, or a freeze set at runtime (`fixedColumnsStart`
 * carries the value the grid started with): `loadData` resets the index mappers and
 * ColumnSorting clears itself on `afterLoadData`, but every other collection survives it.
 */
export function resetViewState(hot: HotInstance, fixedColumnsStart?: number): void {
  const state = createNeutralViewState();

  safeBatch(hot, () => {
    // An `undefined` neutral value means the grid never configured a freeze, so a freeze set at
    // runtime on another sheet is cleared back to none rather than left in force.
    const targetFreeze = fixedColumnsStart ?? 0;

    if ((hot.getSettings().fixedColumnsStart ?? 0) !== targetFreeze) {
      hot.updateSettings({ fixedColumnsStart: targetFreeze });
    }

    getSortingPlugin(hot)?.sort([]);
    restoreFilterConditions(hot, state);
    restoreTrimmedState(hot, state);
    restoreHiddenState(hot, state);
    clearManualSizes(hot);
    restoreMergedCells(hot, state);
    restoreCustomBorders(hot, state);
  });

  hot.render();
}
