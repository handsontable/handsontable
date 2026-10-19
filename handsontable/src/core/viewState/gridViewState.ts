import type { HotInstance } from '../types';
import type { ColumnConditions } from '../../plugins/filters/filters';
import type { SelectionState } from '../../selection/types';
import type CellCoords from '../../3rdparty/walkontable/src/cell/coords';
import type CellRange from '../../3rdparty/walkontable/src/cell/range';
import { isPlainObject } from '../../helpers/object';
import { conditions as registeredConditions } from '../../plugins/filters/conditionRegisterer';
import { operations as registeredOperations } from '../../plugins/filters/logicalOperationRegisterer';
import { warn } from '../../helpers/console';
import {
  captureViewState,
  getEnabledPlugin,
  keepSelectionOnPage,
  restoreViewState,
  restoreViewport,
  type ViewState,
  type ViewStatePart,
} from './viewState';
import { withoutUndoEntry } from './withoutUndoEntry';

/**
 * The version of the {@link GridViewState} shape this build reads and writes.
 */
export const GRID_VIEW_STATE_VERSION = 1;

/**
 * A cell position as `[row, column]`. Header cells carry negative indexes.
 */
export type GridViewStateCoords = [number, number];

/**
 * One selection layer: its start, its end, and the cell the focus is on inside it.
 */
export interface GridViewStateRange {
  from: GridViewStateCoords;
  to: GridViewStateCoords;
  highlight: GridViewStateCoords;
}

/**
 * The selection part of a {@link GridViewState}. Coordinates are visual.
 */
export interface GridViewStateSelection {
  ranges: GridViewStateRange[];
  activeLayer: number;
  selectedByRowHeader: number[];
  selectedByColumnHeader: number[];
  rowExtentSpansGrid: number[];
  columnExtentSpansGrid: number[];
  disableHeadersHighlight: boolean;
}

/**
 * One sorted column of a {@link GridViewState}: its visual index and its order.
 */
export interface GridViewStateSortColumn {
  column: number;
  sortOrder: 'asc' | 'desc';
}

/**
 * A JSON-serializable snapshot of the grid's view. Every part is optional: a part left out is
 * left as it is on restore. Unless noted, indexes are physical, so a part keeps addressing the
 * same records whatever the row and column order.
 */
export interface GridViewState {
  version: number;

  /**
   * The physical column indexes in their visual order.
   */
  columnOrder?: number[];

  /**
   * The physical row indexes in their visual order.
   */
  rowOrder?: number[];

  /**
   * The sort configuration. Each entry names a visual column and its order.
   */
  sort?: {
    columns: GridViewStateSortColumn[],
  };

  /**
   * The filter conditions, as `Filters#exportConditions()` returns them.
   */
  filters?: ColumnConditions[];
  hiddenRows?: number[];
  hiddenColumns?: number[];
  trimmedRows?: number[];

  /**
   * The collapsed `NestedRows` parents, each as its path in the row tree.
   */
  collapsedRows?: number[][];

  /**
   * The manual column widths, as sparse `[physicalColumn, width]` pairs.
   */
  columnWidths?: Array<[number, number]>;

  /**
   * The manual row heights, as sparse `[physicalRow, height]` pairs.
   */
  rowHeights?: Array<[number, number]>;
  frozen?: {
    rowsTop: number,
    rowsBottom: number,
    columnsStart: number,
    columnsEnd: number,
  };
  pagination?: {
    page: number,
    pageSize: number | 'auto',
  };

  /**
   * The selection, or `null` when nothing is selected.
   */
  selection?: GridViewStateSelection | null;

  /**
   * The first fully visible row and column (visual indexes).
   */
  scroll?: {
    row: number,
    col: number,
  };
}

/**
 * The name of one part of a {@link GridViewState}.
 */
export type GridViewStatePart = Exclude<keyof GridViewState, 'version'>;

/**
 * Why a part of a {@link GridViewState} was not applied.
 */
export type GridViewStateSkipReason =
  'pluginDisabled' |
  'externalDataSource' |
  'sizeMismatch' |
  'outOfRange' |
  'invalid' |
  'unsupportedVersion';

/**
 * What `setViewState()` could not apply.
 */
export interface GridViewStateRestoreResult {
  skipped: Array<{ part: GridViewStatePart, reason: GridViewStateSkipReason }>;
}

/**
 * Every part, in the order a restore applies them.
 */
const PARTS: readonly GridViewStatePart[] = [
  'columnOrder',
  'rowOrder',
  'sort',
  'filters',
  'trimmedRows',
  'hiddenRows',
  'hiddenColumns',
  'collapsedRows',
  'columnWidths',
  'rowHeights',
  'frozen',
  'pagination',
  'selection',
  'scroll',
];

/**
 * The plugins a part needs, any one of which is enough. A part not listed needs none.
 */
const REQUIRED_PLUGINS: Partial<Record<GridViewStatePart, string[]>> = {
  sort: ['multiColumnSorting', 'columnSorting'],
  filters: ['filters'],
  trimmedRows: ['trimRows'],
  hiddenRows: ['hiddenRows'],
  hiddenColumns: ['hiddenColumns'],
  collapsedRows: ['nestedRows'],
  columnWidths: ['manualColumnResize'],
  rowHeights: ['manualRowResize'],
  pagination: ['pagination'],
};

/**
 * The parts a grid with an external data source (DataProvider) cannot take: each answers with a
 * server fetch.
 */
const SERVER_DRIVEN_PARTS: ReadonlySet<GridViewStatePart> = new Set(['sort', 'filters', 'pagination']);

/**
 * Returns why a part cannot be captured or restored on this grid, or `null` when it can.
 */
function getUnavailability(hot: HotInstance, part: GridViewStatePart): GridViewStateSkipReason | null {
  const plugins = REQUIRED_PLUGINS[part];

  if (plugins && !plugins.some(name => getEnabledPlugin(hot, name))) {
    return 'pluginDisabled';
  }

  if (SERVER_DRIVEN_PARTS.has(part) && hot.runHooks('hasExternalDataSource') === true) {
    return 'externalDataSource';
  }

  return null;
}

/**
 * Whether a value is an integer.
 */
function isInteger(value: unknown): value is number {
  return Number.isInteger(value);
}

/**
 * Whether a value is an array of integers.
 */
function isIntegerArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isInteger);
}

/**
 * Whether a value is an array of indexes: integers that are not negative.
 */
function isIndexList(value: unknown): value is number[] {
  return isIntegerArray(value) && value.every(index => index >= 0);
}

/**
 * Whether a list of indexes names each of `0` to `length - 1` exactly once.
 */
function isPermutation(indexes: number[], length: number): boolean {
  return new Set(indexes).size === length && indexes.every(index => index < length);
}

/**
 * Whether a value is an array of `[index, size]` pairs with a positive size.
 */
function isSizePairs(value: unknown): value is Array<[number, number]> {
  return Array.isArray(value) &&
    value.every(pair => Array.isArray(pair) && pair.length === 2 && isInteger(pair[0]) && pair[0] >= 0 &&
      Number.isFinite(pair[1]) && pair[1] > 0);
}

/**
 * Whether a value is a `[row, column]` pair.
 */
function isCoords(value: unknown): value is GridViewStateCoords {
  return Array.isArray(value) && value.length === 2 && isInteger(value[0]) && isInteger(value[1]);
}

/**
 * Turns a live coordinate into a `[row, column]` pair.
 */
function toCoordsTuple(coords: CellCoords): GridViewStateCoords {
  return [coords.row ?? 0, coords.col ?? 0];
}

/**
 * Turns a captured selection state into its plain form.
 */
function serializeSelection(state: SelectionState | null): GridViewStateSelection | null {
  if (!state) {
    return null;
  }

  return {
    ranges: state.ranges.map(range => ({
      from: toCoordsTuple(range.from),
      to: toCoordsTuple(range.to),
      highlight: toCoordsTuple(range.highlight),
    })),
    activeLayer: state.activeSelectionLayer,
    selectedByRowHeader: state.selectedByRowHeader.slice(),
    selectedByColumnHeader: state.selectedByColumnHeader.slice(),
    rowExtentSpansGrid: state.rowExtentSpansGrid.slice(),
    columnExtentSpansGrid: state.columnExtentSpansGrid.slice(),
    disableHeadersHighlight: state.disableHeadersHighlight,
  };
}

/**
 * Whether a value has the shape of a {@link GridViewStateSelection}.
 */
function isSelection(value: unknown): value is GridViewStateSelection {
  if (!isPlainObject(value)) {
    return false;
  }

  const selection = value as Record<string, unknown>;
  const ranges = selection.ranges;

  return Array.isArray(ranges) && ranges.length > 0 &&
    ranges.every(range => isPlainObject(range) &&
      isCoords(range.from) && isCoords(range.to) && isCoords(range.highlight)) &&
    isInteger(selection.activeLayer) && selection.activeLayer >= 0 && selection.activeLayer < ranges.length &&
    isIndexList(selection.selectedByRowHeader) &&
    isIndexList(selection.selectedByColumnHeader) &&
    isIndexList(selection.rowExtentSpansGrid) &&
    isIndexList(selection.columnExtentSpansGrid) &&
    typeof selection.disableHeadersHighlight === 'boolean';
}

/**
 * Builds live selection objects from the plain form, through the instance's own coordinate and
 * range factories, so the restore can measure and clone them.
 */
function deserializeSelection(
  hot: HotInstance,
  selection: GridViewStateSelection,
): Pick<ViewState, 'selection' | 'selectionState'> {
  const toCoords = ([row, col]: GridViewStateCoords) => hot._createCellCoords(row, col) as CellCoords;
  const ranges = selection.ranges.map(({ from, to, highlight }) => (
    hot._createCellRange(toCoords(highlight), toCoords(from), toCoords(to)) as CellRange
  ));

  return {
    selection: selection.ranges.map(({ from, to }) => [from[0], from[1], to[0], to[1]]),
    selectionState: {
      ranges,
      activeRange: ranges[selection.activeLayer].clone(),
      activeSelectionLayer: selection.activeLayer,
      selectedByRowHeader: selection.selectedByRowHeader.slice(),
      selectedByColumnHeader: selection.selectedByColumnHeader.slice(),
      rowExtentSpansGrid: selection.rowExtentSpansGrid.slice(),
      columnExtentSpansGrid: selection.columnExtentSpansGrid.slice(),
      disableHeadersHighlight: selection.disableHeadersHighlight,
    },
  };
}

/**
 * Reads one part off a captured view state, as a plain value.
 */
function readPart(hot: HotInstance, state: ViewState, part: GridViewStatePart): unknown {
  switch (part) {
    case 'columnOrder': return state.columnSequence;
    case 'rowOrder': return state.rowSequence;
    case 'sort': return {
      columns: (state.sortConfig as GridViewStateSortColumn[] | undefined) ?? [],
    };
    case 'filters': return state.filterConditions ?? [];
    case 'hiddenRows': return state.hiddenRows;
    case 'hiddenColumns': return state.hiddenColumns;
    case 'trimmedRows': return state.trimmedRows;
    case 'collapsedRows': return state.collapsedParents;
    case 'columnWidths': return state.colWidths;
    case 'rowHeights': return state.rowHeights;
    case 'frozen': return {
      rowsTop: state.fixedRowsTop ?? 0,
      rowsBottom: state.fixedRowsBottom ?? 0,
      columnsStart: state.fixedColumnsStart ?? 0,
      columnsEnd: state.fixedColumnsEnd ?? 0,
    };
    case 'pagination': return state.pagination ?? undefined;
    case 'selection': return serializeSelection(state.selectionState);
    case 'scroll': return isInteger(state.scroll.row) && isInteger(state.scroll.col) &&
      state.scroll.row >= 0 && state.scroll.col >= 0 ? state.scroll : undefined;
    default: return undefined;
  }
}

/**
 * The view-state fields that hold a list of indexes, by the part they belong to.
 */
const INDEX_LIST_FIELDS = {
  columnOrder: 'columnSequence',
  rowOrder: 'rowSequence',
  hiddenRows: 'hiddenRows',
  hiddenColumns: 'hiddenColumns',
  trimmedRows: 'trimmedRows',
} as const;

/**
 * The view-state fields that hold `[index, size]` pairs, by the part they belong to.
 */
const SIZE_FIELDS = {
  columnWidths: 'colWidths',
  rowHeights: 'rowHeights',
} as const;

/**
 * Whether a value is one entry of `Filters#exportConditions()` the Filters plugin can import: a
 * physical column of this grid, and an operation and conditions registered on this page. A
 * condition registered on the page the state was saved on may be missing here, and the import
 * throws on an unknown name.
 */
function isColumnConditions(value: unknown, columnCount: number): value is ColumnConditions {
  if (!isPlainObject(value)) {
    return false;
  }

  const entry = value as Record<string, unknown>;

  return isInteger(entry.column) && entry.column >= 0 && entry.column < columnCount &&
    typeof entry.operation === 'string' && Object.hasOwn(registeredOperations, entry.operation) &&
    Array.isArray(entry.conditions) &&
    entry.conditions.every(condition => isPlainObject(condition) &&
      typeof condition.name === 'string' && Object.hasOwn(registeredConditions, condition.name) &&
      Array.isArray(condition.args));
}

/**
 * Whether a value is a list of filter entries the Filters plugin can import. Two entries for one
 * column are rejected: the plugin throws when they name different operations.
 */
function isFilterList(hot: HotInstance, value: unknown): value is ColumnConditions[] {
  const columnCount = hot.columnIndexMapper.getNumberOfIndexes();

  return Array.isArray(value) &&
    value.every(entry => isColumnConditions(entry, columnCount)) &&
    new Set(value.map(entry => (entry as ColumnConditions).column)).size === value.length;
}

/**
 * Whether a value is a sort configuration the enabled sorting plugin accepts: visual columns of
 * this grid, each once, and at most one of them unless `MultiColumnSorting` is on. The restore
 * clears the current sort before the plugin checks the configuration, so a rejected one would
 * leave the grid unsorted.
 */
function isSortConfig(hot: HotInstance, value: unknown): value is GridViewStateSortColumn[] {
  const columnCount = hot.countCols();
  const maxColumns = getEnabledPlugin(hot, 'multiColumnSorting') ? columnCount : 1;

  return Array.isArray(value) && value.length <= maxColumns &&
    value.every(entry => isPlainObject(entry) &&
      isInteger(entry.column) && entry.column >= 0 && entry.column < columnCount &&
      (entry.sortOrder === 'asc' || entry.sortOrder === 'desc')) &&
    new Set(value.map(entry => (entry as GridViewStateSortColumn).column)).size === value.length;
}

/**
 * Writes one part of a public state into a captured view state. Returns why the part cannot be
 * applied, or `null` when it was written.
 */
function writePart(
  hot: HotInstance,
  state: ViewState,
  part: GridViewStatePart,
  value: unknown,
): GridViewStateSkipReason | null {
  if (part === 'columnOrder' || part === 'rowOrder') {
    return writeOrder(hot, state, part, value);
  }

  if (part in INDEX_LIST_FIELDS) {
    if (!isIndexList(value)) {
      return 'invalid';
    }

    state[INDEX_LIST_FIELDS[part as keyof typeof INDEX_LIST_FIELDS]] = value.slice();

    return null;
  }

  if (part in SIZE_FIELDS) {
    if (!isSizePairs(value)) {
      return 'invalid';
    }

    state[SIZE_FIELDS[part as keyof typeof SIZE_FIELDS]] = value.map(([index, size]) => [index, size]);

    return null;
  }

  if (part === 'collapsedRows') {
    if (!Array.isArray(value) || !value.every(isIndexList)) {
      return 'invalid';
    }

    state.collapsedParents = value.map(path => path.slice());

    return null;
  }

  if (part === 'filters') {
    if (!isFilterList(hot, value)) {
      return 'invalid';
    }

    state.filterConditions = toPlainData(value);

    return null;
  }

  return writeObjectPart(hot, state, part, value) ? null : 'invalid';
}

/**
 * Writes a row or column order. It must name every physical index of the axis exactly once: an
 * index named twice would show one record in two places, and an index past the end would show
 * nothing. An order of another length was captured on other data.
 */
function writeOrder(
  hot: HotInstance,
  state: ViewState,
  part: 'columnOrder' | 'rowOrder',
  value: unknown,
): GridViewStateSkipReason | null {
  const mapper = part === 'columnOrder' ? hot.columnIndexMapper : hot.rowIndexMapper;

  if (!isIndexList(value)) {
    return 'invalid';
  }

  if (value.length !== mapper.getNumberOfIndexes()) {
    return 'sizeMismatch';
  }

  if (!isPermutation(value, value.length)) {
    return 'invalid';
  }

  state[INDEX_LIST_FIELDS[part]] = value.slice();

  return null;
}

/**
 * Writes the parts whose value is an object, see {@link writePart}. Returns `false` when the value
 * does not have the part's shape.
 */
function writeObjectPart(hot: HotInstance, state: ViewState, part: GridViewStatePart, value: unknown): boolean {
  if (part === 'selection' && value === null) {
    state.selection = undefined;
    state.selectionState = null;

    return true;
  }

  if (!isPlainObject(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;

  switch (part) {
    case 'sort':
      if (!isSortConfig(hot, record.columns)) {
        return false;
      }

      state.sortConfig = toPlainData(record.columns);
      // The sorting plugin sorts from the pre-sort order it caches on its first sort, built from the
      // rows' order at that moment, so a grid that has not sorted yet starts from the order shown now.
      state.unsortedRowSequence = hot.rowIndexMapper.getIndexesSequence().slice();

      return true;
    case 'frozen':
      if (![record.rowsTop, record.rowsBottom, record.columnsStart, record.columnsEnd]
        .every(count => isInteger(count) && count >= 0)) {
        return false;
      }

      state.fixedRowsTop = record.rowsTop as number;
      state.fixedRowsBottom = record.rowsBottom as number;
      state.fixedColumnsStart = record.columnsStart as number;
      state.fixedColumnsEnd = record.columnsEnd as number;

      return true;
    case 'pagination':
      if (!(isInteger(record.page) && (record.page as number) >= 1) ||
          !(record.pageSize === 'auto' || (isInteger(record.pageSize) && (record.pageSize as number) >= 1))) {
        return false;
      }

      state.pagination = { page: record.page as number, pageSize: record.pageSize as number | 'auto' };

      return true;
    case 'selection':
      if (!isSelection(value)) {
        return false;
      }

      Object.assign(state, deserializeSelection(hot, value));

      return true;
    case 'scroll':
      if (!isInteger(record.row) || !isInteger(record.col) || record.row < 0 || record.col < 0) {
        return false;
      }

      state.scroll = { row: record.row, col: record.col };

      return true;
    default:
      return false;
  }
}

/**
 * Copies a captured value so the returned state shares nothing with the grid.
 */
function toPlainData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Captures the grid's view as a {@link GridViewState}. A part whose plugin is off, or that the
 * grid's external data source owns, is left out.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @returns {GridViewState}
 */
export function getGridViewState(hot: HotInstance): GridViewState {
  const captured = captureViewState(hot, []);
  const result: Record<string, unknown> = { version: GRID_VIEW_STATE_VERSION };

  PARTS.forEach((part) => {
    if (getUnavailability(hot, part) !== null) {
      return;
    }

    const value = readPart(hot, captured, part);

    if (value !== undefined) {
      result[part] = toPlainData(value);
    }
  });

  return result as unknown as GridViewState;
}

/**
 * Applies a {@link GridViewState} to the grid. Only the parts the state carries are applied, in
 * the order a sheet switch applies them, and none of them is recorded on the undo stack.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {GridViewState} state The state to apply.
 * @returns {GridViewStateRestoreResult} The parts that were not applied, and why.
 */
export function setGridViewState(hot: HotInstance, state: GridViewState): GridViewStateRestoreResult {
  const presentParts = isPlainObject(state) ? PARTS.filter(part => state[part] !== undefined) : [];
  const skipped: GridViewStateRestoreResult['skipped'] = [];

  if (!isPlainObject(state) || state.version !== GRID_VIEW_STATE_VERSION) {
    warn(`setViewState(): the view state version is not supported (expected ${GRID_VIEW_STATE_VERSION}), ` +
      'so nothing was applied.');

    return { skipped: presentParts.map(part => ({ part, reason: 'unsupportedVersion' })) };
  }

  // The current view is the base: a part the state leaves out keeps the value the grid has now.
  const internal = captureViewState(hot, []);
  const parts = new Set<ViewStatePart>();

  presentParts.forEach((part) => {
    const unavailability = getUnavailability(hot, part);

    if (unavailability !== null) {
      skipped.push({ part, reason: unavailability });
    } else {
      const writeFailure = writePart(hot, internal, part, state[part]);

      if (writeFailure === null) {
        parts.add(part);
      } else {
        skipped.push({ part, reason: writeFailure });
      }
    }
  });

  withoutUndoEntry(hot, () => applyParts(hot, internal, parts, skipped));

  return { skipped };
}

/**
 * Runs the restore for the accepted parts and records the ones the grid turned down.
 */
function applyParts(
  hot: HotInstance,
  state: ViewState,
  parts: Set<ViewStatePart>,
  skipped: GridViewStateRestoreResult['skipped'],
) {
  if (parts.size === 0) {
    return;
  }

  restoreViewState(hot, state, parts).forEach((part) => {
    skipped.push({ part: part as GridViewStatePart, reason: 'sizeMismatch' });
  });

  const coversSelection = parts.has('selection');
  let selectionRestored = false;

  // The page, the selection, and the scroll need the grid painted with the restored sizes, so
  // they run after the batch above. Only the rendering is held here, never the index cache:
  // Pagination counts its pages from it, and a page set while it is held is clamped to a stale count.
  hot.suspendRender();

  try {
    selectionRestored = restoreViewport(hot, state, parts);

    if (coversSelection && !selectionRestored) {
      hot.deselectCell();

      if (state.selectionState) {
        skipped.push({ part: 'selection', reason: 'outOfRange' });
      }
    }
  } finally {
    hot.resumeRender();
  }

  if (coversSelection || parts.has('pagination')) {
    keepSelectionOnPage(hot, selectionRestored);
  }
}
