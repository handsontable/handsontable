import type { HotInstance } from '../../core/types';

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
 * sparse `[index, size]` pairs — a dense array the length of the row count would retain one
 * slot per row per sheet for the session.
 */
export interface ViewState {
  rowSequence: number[];
  unsortedRowSequence: number[];
  columnSequence: number[];
  hiddenRows: number[];
  hiddenColumns: number[];
  trimmedRows: number[];
  colWidths: Array<[number, number]>;
  rowHeights: Array<[number, number]>;
  sortConfig: unknown;
  filterConditions: unknown[] | null;
  mergedCells: Array<{ row: number, col: number, rowspan: number, colspan: number }>;
  fixedColumnsStart: number | undefined;
  customBorders: Array<Record<string, unknown>>;
  cellMeta: TrackedCellMeta[];
  selection: number[][] | undefined;
  scroll: { row: number, col: number };
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
 * again by an index that does not move.
 */
function captureAxisState(hot: HotInstance) {
  const hiddenRowsPlugin = getEnabledPlugin(hot, 'hiddenRows') as { getHiddenRows: () => number[] } | undefined;
  const hiddenColumnsPlugin =
    getEnabledPlugin(hot, 'hiddenColumns') as { getHiddenColumns: () => number[] } | undefined;
  const trimRowsPlugin = getEnabledPlugin(hot, 'trimRows') as { getTrimmedRows: () => number[] } | undefined;

  return {
    rowSequence: hot.rowIndexMapper.getIndexesSequence().slice(),
    unsortedRowSequence: captureUnsortedRowSequence(hot),
    columnSequence: hot.columnIndexMapper.getIndexesSequence().slice(),
    hiddenRows: (hiddenRowsPlugin?.getHiddenRows() ?? []).map(row => hot.toPhysicalRow(row)),
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
 * Returns the resize plugin for one axis, or `undefined` when it is absent or disabled.
 */
function getResizePlugin(hot: HotInstance, axis: 'column' | 'row') {
  return getEnabledPlugin(hot, axis === 'column' ? 'manualColumnResize' : 'manualRowResize') as
    { getManualSize: (index: number) => number | null } | undefined;
}

/**
 * Captures the manual column width and row height overrides as sparse `[index, size]` pairs.
 * Only the plugins' own overrides are read — capturing the effective
 * `getColWidth`/`getRowHeight` would pin every column as manually sized and stop
 * AutoColumnSize and StretchColumns from adapting after a switch.
 */
function captureSizes(hot: HotInstance) {
  const colWidths: Array<[number, number]> = [];
  const rowHeights: Array<[number, number]> = [];
  const columnResize = getResizePlugin(hot, 'column');
  const rowResize = getResizePlugin(hot, 'row');

  for (let col = 0; col < hot.countCols(); col += 1) {
    const width = columnResize?.getManualSize(col);

    if (typeof width === 'number') {
      colWidths.push([col, width]);
    }
  }

  for (let row = 0; row < hot.countRows(); row += 1) {
    const height = rowResize?.getManualSize(row);

    if (typeof height === 'number') {
      rowHeights.push([row, height]);
    }
  }

  return { colWidths, rowHeights };
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
 * Captures the current runtime view state of the grid.
 */
export function captureViewState(hot: HotInstance, trackedCellMeta: TrackedCellMeta[]): ViewState {
  const { colWidths, rowHeights } = captureSizes(hot);

  return {
    ...captureAxisState(hot),
    colWidths,
    rowHeights,
    sortConfig: captureSortConfig(hot),
    filterConditions: captureFilterConditions(hot),
    mergedCells: captureMergedCells(hot),
    fixedColumnsStart: hot.getSettings().fixedColumnsStart as number | undefined,
    customBorders: captureCustomBorders(hot),
    cellMeta: trackedCellMeta.slice(),
    selection: hot.getSelected(),
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
 */
function restoreTrimmedState(hot: HotInstance, state: ViewState) {
  const trimRowsPlugin = getEnabledPlugin(hot, 'trimRows') as
    { untrimAll: () => void, trimRows: (rows: number[]) => void } | undefined;

  if (trimRowsPlugin) {
    trimRowsPlugin.untrimAll();
    trimRowsPlugin.trimRows(state.trimmedRows);
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
 * Restores manual column widths and row heights, dropping the overrides carried over
 * from the previously active sheet first. An index at or past the current count is skipped:
 * the host may have shortened the sheet's data while another sheet was in front, and
 * `setManualSize` resolves an out-of-range visual index to `null`, which would write an
 * entry under the string "null".
 */
function restoreSizes(hot: HotInstance, state: ViewState) {
  const manualColumnResize = getEnabledPlugin(hot, 'manualColumnResize') as
    { setManualSize: (col: number, width: number) => number } | undefined;
  const manualRowResize = getEnabledPlugin(hot, 'manualRowResize') as
    { setManualSize: (row: number, height: number) => number } | undefined;

  clearManualSizes(hot);

  state.colWidths.forEach(([col, width]) => {
    if (col < hot.countCols()) {
      manualColumnResize?.setManualSize(col, width);
    }
  });

  state.rowHeights.forEach(([row, height]) => {
    if (row < hot.countRows()) {
      manualRowResize?.setManualSize(row, height);
    }
  });
}

/**
 * Restores filter conditions and re-applies the filter.
 */
function restoreFilterConditions(hot: HotInstance, state: ViewState) {
  const filters = getEnabledPlugin(hot, 'filters') as
    { importConditions: (conditions: unknown[]) => void, filter: () => void } | undefined;

  if (filters && state.filterConditions) {
    filters.importConditions(state.filterConditions);
    filters.filter();
  }
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
 * which decide the visual space; then the hidden sets, which are addressed in it; then
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
 * Puts the selection and the scroll position back. Runs after the render batch the rest of
 * the restore happens in: scrolling to a column while rendering is suspended measures the
 * widths of the sheet that has just left, and lands short by the difference.
 */
export function restoreViewport(hot: HotInstance, state: ViewState): void {
  if (state.selection) {
    hot.selectCells(state.selection, false, false);
  }

  hot.scrollViewportTo({ row: state.scroll.row, col: state.scroll.col, verticalSnap: 'top', horizontalSnap: 'start' });
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
    colWidths: [],
    rowHeights: [],
    sortConfig: [],
    filterConditions: [],
    mergedCells: [],
    fixedColumnsStart: undefined,
    customBorders: [],
    cellMeta: [],
    selection: undefined,
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
