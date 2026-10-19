import type { HotInstance } from '../../core/types';
import type { ColumnConditions } from '../filters/filters';
import type { SelectionState } from '../../selection/types';
import type CellCoords from '../../3rdparty/walkontable/src/cell/coords';
import type CellRange from '../../3rdparty/walkontable/src/cell/range';
import { isPlainObject } from '../../helpers/object';
import { warn } from '../../helpers/console';
import {
  captureViewState,
  createNeutralViewState,
  fitsGrid,
  getEnabledPlugin,
  keepSelectionOnPage,
  restoreViewState,
  restoreViewport,
  type SortedColumn,
  type ViewState,
  type ViewStatePart,
} from '../../utils/viewState/viewState';
import { withoutUndoEntry } from '../../utils/viewState/withoutUndoEntry';

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
 * One sorted column of a {@link GridViewState}: its physical index and its order.
 */
export interface GridViewStateSortColumn {
  column: number;
  sortOrder: 'asc' | 'desc';
}

/**
 * A column a {@link GridViewStateInput} names: its physical index, or the property its data is bound to
 * (a `columns[].data` string, or a key of the row objects, such as `'address.city'`).
 */
export type GridViewStateColumnKey = number | string;

/**
 * One sorted column of a {@link GridViewStateInput}: its physical index or its property, and its order.
 */
export interface GridViewStateSortColumnInput {
  column: GridViewStateColumnKey;
  sortOrder: 'asc' | 'desc';
}

/**
 * One filter entry of a {@link GridViewStateInput}, with its column as a physical index or a property.
 */
export type GridViewStateFilterInput = Omit<ColumnConditions, 'column'> & {
  column: GridViewStateColumnKey,
};

/**
 * A JSON-serializable snapshot of the grid's view. Every part is optional: a part left out is
 * left as it is on restore.
 *
 * An index that names a record or a column is physical, so a part keeps addressing the same data
 * whatever the row and column order. The positions on screen are visual: the selection, the scroll
 * position, and the frozen counts.
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
   * The sort configuration. Each entry names a physical column and its order.
   */
  sort?: {
    columns: GridViewStateSortColumn[],
  };

  /**
   * The filter conditions, as `Filters#exportConditions()` returns them.
   */
  filters?: ColumnConditions[];

  /**
   * The hidden rows, as physical indexes.
   */
  hiddenRows?: number[];

  /**
   * The hidden columns, as physical indexes.
   */
  hiddenColumns?: number[];

  /**
   * The trimmed rows, as physical indexes.
   */
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
 * A view state as `setViewState()` and `validateViewState()` take it: a {@link GridViewState} whose sort,
 * filters, hidden columns, and column widths can also name a column by its property.
 */
export interface GridViewStateInput extends
  Omit<GridViewState, 'sort' | 'filters' | 'hiddenColumns' | 'columnWidths'> {
  sort?: {
    columns: GridViewStateSortColumnInput[],
  };
  filters?: GridViewStateFilterInput[];
  hiddenColumns?: GridViewStateColumnKey[];
  columnWidths?: Array<[GridViewStateColumnKey, number]>;
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
  'pluginConflict' |
  'unsupportedVersion';

/**
 * What `setViewState()` could not apply.
 */
export interface GridViewStateIssue {
  /**
   * The part the issue is about. A key that is not a part of the view state is reported under its own
   * name, so a misspelled part does not pass as valid.
   */
  part: GridViewStatePart | (string & {});
  reason: GridViewStateSkipReason;

  /**
   * Where the problem is, as a path into the state: `filters[2].conditions[0].args`.
   */
  path: string;

  /**
   * What is wrong, in a sentence a caller can use to correct the state and retry.
   */
  message: string;
}

/**
 * Why a whole {@link GridViewState} was rejected, as opposed to one of its parts.
 */
export interface GridViewStateError {
  reason: 'notAnObject' | 'unsupportedVersion' | 'atomicRejected';
  message: string;
}

/**
 * What `setViewState()` did.
 */
export interface GridViewStateRestoreResult {
  /**
   * The parts that were restored. Empty when nothing was applied.
   */
  applied: GridViewStatePart[];

  /**
   * The parts that were not restored, and why.
   */
  skipped: GridViewStateIssue[];

  /**
   * Set when the whole state was rejected: it is not an object, it has another `version`, or `atomic`
   * was on and a part was invalid. Nothing was applied then.
   */
  error?: GridViewStateError;

  /**
   * The view the restored parts had before the restore, in the same shape. Pass it to `setViewState()`
   * to revert. Left out when nothing was applied.
   */
  previous?: GridViewState;
}

/**
 * What `validateViewState()` found, without applying anything.
 */
export interface GridViewStateValidationResult {
  /**
   * Whether `setViewState()` with `atomic: true` would apply the whole state.
   */
  valid: boolean;

  /**
   * The parts `setViewState()` would apply.
   */
  applicable: GridViewStatePart[];

  /**
   * The parts it would skip, and why.
   */
  skipped: GridViewStateIssue[];

  /**
   * Set when the whole state would be rejected, as `setViewState()` reports it.
   */
  error?: GridViewStateError;
}

/**
 * The options of `setViewState()`.
 */
export interface GridViewStateSetOptions {
  /**
   * Whether the restore is one undo step (`'record'`) or none (`'skip'`, the default).
   */
  undo?: 'record' | 'skip';

  /**
   * When `true`, nothing is applied if any part cannot be applied. Defaults to `false`: the parts that
   * can be applied are, and the rest are reported.
   */
  atomic?: boolean;
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
 * The parts a grid with an external data source (DataProvider) cannot take. The sort, the filters and the
 * page each answer with a server fetch. The rest address rows by their position in the page the grid has
 * loaded, and the page itself is the server's, so a state saved on page 3 would land on other records on
 * page 1: the row order, the hidden, trimmed and collapsed rows, the row heights, and the selection.
 */
const SERVER_DRIVEN_PARTS: ReadonlySet<GridViewStatePart> = new Set([
  'sort',
  'filters',
  'pagination',
  'rowOrder',
  'hiddenRows',
  'trimmedRows',
  'collapsedRows',
  'rowHeights',
  'selection',
]);

/**
 * The parts that change how many rows the grid shows. A selection or a scroll position in the same state
 * is read against the row count they leave, which is not known before they are applied.
 */
const ROW_COUNT_PARTS: readonly GridViewStatePart[] = ['filters', 'trimmedRows', 'collapsedRows'];

/**
 * Returns why a part cannot be captured or restored on this grid, or `null` when it can.
 */
function getUnavailability(hot: HotInstance, part: GridViewStatePart): GridViewStateSkipReason | null {
  return describeUnavailability(hot, part)?.reason ?? null;
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
    case 'sort': return { columns: state.sortConfig };
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
 * A part that cannot be applied: why, where, and what to change.
 */
interface Failure {
  reason: GridViewStateSkipReason;
  path: string;
  message: string;
}

/**
 * Builds a {@link Failure}.
 */
function fail(reason: GridViewStateSkipReason, path: string, message: string): Failure {
  return { reason, path, message };
}

/**
 * Describes why a part is not available on this grid, or returns `null` when it is.
 */
function describeUnavailability(hot: HotInstance, part: GridViewStatePart): Failure | null {
  const plugins = REQUIRED_PLUGINS[part];

  if (plugins && !plugins.some(name => getEnabledPlugin(hot, name))) {
    return fail('pluginDisabled', part, `${part} needs the ${plugins.join(' or ')} plugin enabled on this grid`);
  }

  if (SERVER_DRIVEN_PARTS.has(part) && hot.runHooks('hasExternalDataSource') === true) {
    return fail('externalDataSource', part,
      `the server owns ${part} on a grid that loads its rows through dataProvider`);
  }

  return null;
}

/**
 * Describes why a value is not a list of non-negative integers, or returns `null` when it is one.
 */
function describeIndexList(path: string, value: unknown): Failure | null {
  if (!Array.isArray(value)) {
    return fail('invalid', path, `${path} must be an array of non-negative integers`);
  }

  const bad = value.findIndex(index => !(isInteger(index) && index >= 0));

  return bad === -1 ? null : fail('invalid', `${path}[${bad}]`, `${path}[${bad}] must be a non-negative integer`);
}

/**
 * Describes an index that lies past the end of the axis the part addresses, or returns `null`. The
 * restore would drop such an index without a word, so a stale state is reported instead.
 */
function describeRange(
  hot: HotInstance,
  part: GridViewStatePart,
  indexes: number[],
  axis: 'row' | 'column',
  path = part,
): Failure | null {
  const count = axis === 'row' ? hot.rowIndexMapper.getNumberOfIndexes() : hot.columnIndexMapper.getNumberOfIndexes();
  const bad = indexes.findIndex(index => index >= count);

  return bad === -1 ? null : fail('outOfRange', `${path}[${bad}]`,
    `${path}[${bad}] is ${indexes[bad]}, and the grid has ${count} ${axis}s`);
}

/**
 * Describes a hidden or trimmed index past the end of its axis.
 */
function describeIndexRange(hot: HotInstance, part: GridViewStatePart, indexes: number[]): Failure | null {
  if (part === 'hiddenRows' || part === 'trimmedRows') {
    return describeRange(hot, part, indexes, 'row');
  }

  return part === 'hiddenColumns' ? describeRange(hot, part, indexes, 'column') : null;
}

/**
 * Describes a size entry whose index is past the end of its axis.
 */
function describeSizeRange(hot: HotInstance, part: GridViewStatePart, pairs: Array<[number, number]>): Failure | null {
  return describeRange(hot, part, pairs.map(([index]) => index), part === 'rowHeights' ? 'row' : 'column');
}

/**
 * Describes why a value is not a list of `[index, size]` pairs with a positive size.
 */
function describeSizePairs(path: string, value: unknown): Failure | null {
  if (!Array.isArray(value)) {
    return fail('invalid', path, `${path} must be an array of [index, size] pairs`);
  }

  const bad = value.findIndex(pair => !isSizePairs([pair]));

  return bad === -1 ? null : fail(
    'invalid',
    `${path}[${bad}]`,
    `${path}[${bad}] must be [index, size] with a non-negative index and a positive size`,
  );
}

/**
 * Describes the first filter entry the Filters plugin cannot import on this grid. The plugin answers
 * because the import empties the current conditions first and throws on an entry it cannot take, so a
 * bad entry has to be refused before the restore starts.
 */
function describeFilters(hot: HotInstance, value: unknown): Failure | null {
  const filters = getEnabledPlugin(hot, 'filters') as
    { _findInvalidConditions: (value: unknown) => { path: string, message: string } | null } | undefined;
  const problem = filters?._findInvalidConditions(value);

  return problem ? fail('invalid', `filters${problem.path}`, `filters${problem.path} ${problem.message}`) : null;
}

/**
 * Where a list entry names its column: the value, its path, and how to rebuild the entry around a
 * physical index.
 */
interface ColumnKeyLocation {
  key: unknown;
  path: string;
  replace: (column: number) => unknown;
}

/**
 * How a part that can name a column by its property holds its columns: where the list of entries is in
 * the part's value, how to put a resolved list back, and where each entry names its column.
 */
interface ColumnKeyLocator {
  unwrap: (value: unknown) => unknown;
  wrap: (value: unknown, list: unknown[]) => unknown;
  locate: (entry: unknown, index: number) => ColumnKeyLocation;
}

/**
 * Locates the column of an entry that is an object with a `column` key (a sort column, a filter entry).
 */
function locateObjectColumn(prefix: string) {
  return (entry: unknown, index: number): ColumnKeyLocation => ({
    key: isPlainObject(entry) ? (entry as Record<string, unknown>).column : undefined,
    path: `${prefix}[${index}].column`,
    replace: column => ({ ...(entry as Record<string, unknown>), column }),
  });
}

/**
 * Returns a part's value as it is, for a part whose value is the list itself.
 */
function asList(value: unknown): unknown {
  return value;
}

/**
 * How each part that can name a column by its property holds its columns.
 */
const COLUMN_KEY_LOCATORS: Partial<Record<GridViewStatePart, ColumnKeyLocator>> = {
  sort: {
    unwrap: value => (isPlainObject(value) ? (value as Record<string, unknown>).columns : undefined),
    wrap: (value, columns) => ({ ...(value as Record<string, unknown>), columns }),
    locate: locateObjectColumn('sort.columns'),
  },
  filters: { unwrap: asList, wrap: (value, list) => list, locate: locateObjectColumn('filters') },
  hiddenColumns: {
    unwrap: asList,
    wrap: (value, list) => list,
    locate: (entry, index) => ({ key: entry, path: `hiddenColumns[${index}]`, replace: column => column }),
  },
  columnWidths: {
    unwrap: asList,
    wrap: (value, list) => list,
    locate: (entry, index) => ({
      key: Array.isArray(entry) ? entry[0] : undefined,
      path: `columnWidths[${index}]`,
      replace: column => [column, ...(entry as unknown[]).slice(1)],
    }),
  },
};

/**
 * Returns the physical index of the column whose data is bound to a property, or the failure when there
 * is none. `propToCol()` hands an unknown property back unchanged, and answers `null` for a property
 * whose column has no visual index (a trimming map removed it), which the same column named by its
 * index is reported as too.
 */
function resolveColumnKey(hot: HotInstance, key: string, path: string): number | Failure {
  const column = hot.propToCol(key);

  if (column === null) {
    return fail('outOfRange', path, `${path} is '${key}', a column the grid does not show`);
  }

  if (!isInteger(column)) {
    return fail('invalid', path, `${path} is '${key}', and no column of this grid has that property`);
  }

  return hot.toPhysicalColumn(column);
}

/**
 * Replaces each column property a part names with the physical index of its column, so the part's own
 * checks see indexes only. Returns the failure for the first property that names no column the grid
 * shows. A value of another shape is handed back as it is, for those checks to report.
 */
function resolveColumnKeys(
  hot: HotInstance,
  part: GridViewStatePart,
  value: unknown,
): { value: unknown, failure?: Failure } {
  const locator = COLUMN_KEY_LOCATORS[part];
  const list = locator?.unwrap(value);

  if (!locator || !Array.isArray(list)) {
    return { value };
  }

  const resolved: unknown[] = [];

  for (let index = 0; index < list.length; index++) {
    const { key, path, replace } = locator.locate(list[index], index);
    const column = typeof key === 'string' ? resolveColumnKey(hot, key, path) : undefined;

    if (column !== undefined && !isInteger(column)) {
      return { value, failure: column };
    }

    resolved.push(column === undefined ? list[index] : replace(column));
  }

  return { value: locator.wrap(value, resolved) };
}

/**
 * Describes why one sort entry is not a column the sorting plugin sorts by, or returns `null`. The plugin
 * takes visual columns below `countCols()`, which `maxCols` and a trimming map lower, so a physical
 * column past either is reported, not left for the plugin to drop after the restore cleared the sort.
 */
function describeSortColumn(hot: HotInstance, entry: Record<string, unknown> | null, at: string): Failure | null {
  if (!isPlainObject(entry) || !isInteger(entry.column) || entry.column < 0) {
    return fail('invalid', `${at}.column`, `${at}.column must be a physical column index or a column property`);
  }

  const column = entry.column as number;
  const columnCount = hot.columnIndexMapper.getNumberOfIndexes();

  if (column >= columnCount) {
    return fail('outOfRange', `${at}.column`, `${at}.column is ${column}, and the grid has ${columnCount} columns`);
  }

  const visualColumn = hot.toVisualColumn(column);

  if (visualColumn === null || visualColumn >= hot.countCols()) {
    return fail('outOfRange', `${at}.column`, `${at}.column is ${column}, a column the grid does not show`);
  }

  if (entry.sortOrder !== 'asc' && entry.sortOrder !== 'desc') {
    return fail('invalid', `${at}.sortOrder`, `${at}.sortOrder must be 'asc' or 'desc'`);
  }

  return null;
}

/**
 * Describes why a value is not a sort configuration the enabled sorting plugin accepts: physical columns
 * the grid shows, each once, and at most one of them unless `MultiColumnSorting` is on. The restore
 * clears the current sort before the plugin checks the configuration, so a rejected one would leave
 * the grid unsorted.
 */
function describeSort(hot: HotInstance, value: unknown): Failure | null {
  const columns = isPlainObject(value) ? (value as Record<string, unknown>).columns : undefined;
  const maxColumns = getEnabledPlugin(hot, 'multiColumnSorting') ? hot.columnIndexMapper.getNumberOfIndexes() : 1;

  if (!Array.isArray(columns)) {
    return fail('invalid', 'sort.columns', 'sort.columns must be an array of { column, sortOrder }');
  }

  if (columns.length > maxColumns) {
    return fail('invalid', 'sort.columns', 'more than one sort column needs the MultiColumnSorting plugin');
  }

  const seen = new Set<unknown>();

  for (let index = 0; index < columns.length; index++) {
    const entry = columns[index] as Record<string, unknown> | null;
    const at = `sort.columns[${index}]`;
    const failure = describeSortColumn(hot, entry, at);

    if (failure) {
      return failure;
    }

    const { column } = entry as Record<string, unknown>;

    if (seen.has(column)) {
      return fail('invalid', `${at}.column`, `column ${column} is sorted more than once`);
    }

    seen.add(column);
  }

  return null;
}

/**
 * Writes one part of a public state into a captured view state. Returns what is wrong with the part,
 * or `null` when it was written.
 */
function writePart(
  hot: HotInstance,
  state: ViewState,
  part: GridViewStatePart,
  rawValue: unknown,
  deferRows = false,
): Failure | null {
  const { value, failure: unknownColumn } = resolveColumnKeys(hot, part, rawValue);

  if (unknownColumn) {
    return unknownColumn;
  }

  if (part === 'columnOrder' || part === 'rowOrder') {
    return writeOrder(hot, state, part, value);
  }

  if (part in INDEX_LIST_FIELDS) {
    const failure = describeIndexList(part, value) ?? describeIndexRange(hot, part, value as number[]);

    if (!failure) {
      state[INDEX_LIST_FIELDS[part as keyof typeof INDEX_LIST_FIELDS]] = (value as number[]).slice();
    }

    return failure;
  }

  if (part in SIZE_FIELDS) {
    const failure = describeSizePairs(part, value) ?? describeSizeRange(hot, part, value as Array<[number, number]>);

    if (!failure) {
      state[SIZE_FIELDS[part as keyof typeof SIZE_FIELDS]] =
        (value as Array<[number, number]>).map(([index, size]) => [index, size]);
    }

    return failure;
  }

  if (part === 'collapsedRows') {
    const bad = Array.isArray(value) ? value.findIndex(path => describeIndexList('', path) !== null) : -1;

    if (!Array.isArray(value) || bad !== -1) {
      return fail('invalid', Array.isArray(value) ? `collapsedRows[${bad}]` : 'collapsedRows',
        'collapsedRows must be an array of tree paths, each an array of non-negative integers');
    }

    state.collapsedParents = value.map(path => (path as number[]).slice());

    return null;
  }

  if (part === 'filters') {
    const failure = describeFilters(hot, value);

    if (!failure) {
      state.filterConditions = toPlainData(value as ColumnConditions[]);
    }

    return failure;
  }

  return writeObjectPart(hot, state, part, value, deferRows);
}

/**
 * Describes frozen rows on a paginated grid. The restore writes the frozen counts onto the table meta,
 * which skips the check `updateSettings()` makes, and Pagination refuses to run next to `fixedRowsTop`
 * and `fixedRowsBottom`. A value of the wrong shape is not a conflict, and is reported as invalid.
 */
function describeFrozenConflict(hot: HotInstance, value: unknown): Failure | null {
  if (!isPlainObject(value) || !getEnabledPlugin(hot, 'pagination')) {
    return null;
  }

  const frozen = value as Record<string, unknown>;
  const counts = [frozen.rowsTop, frozen.rowsBottom, frozen.columnsStart, frozen.columnsEnd];

  if (!counts.every(count => isInteger(count) && count >= 0) ||
      (frozen.rowsTop as number) + (frozen.rowsBottom as number) === 0) {
    return null;
  }

  return fail('pluginConflict', 'frozen',
    'frozen rows cannot run on a grid with Pagination; send rowsTop and rowsBottom as 0, or turn Pagination off');
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
): Failure | null {
  const mapper = part === 'columnOrder' ? hot.columnIndexMapper : hot.rowIndexMapper;
  const failure = describeIndexList(part, value);

  if (failure) {
    return failure;
  }

  const order = value as number[];
  const count = mapper.getNumberOfIndexes();
  const noun = part === 'columnOrder' ? 'columns' : 'rows';

  if (order.length !== count) {
    return fail('sizeMismatch', part, `${part} lists ${order.length} ${noun}, and the grid has ${count}`);
  }

  if (!isPermutation(order, count)) {
    return fail('invalid', part, `${part} must name each of the ${count} ${noun} (0 to ${count - 1}) exactly once`);
  }

  state[INDEX_LIST_FIELDS[part]] = order.slice();

  return null;
}

/**
 * Writes the parts whose value is an object, see {@link writePart}. Returns what is wrong with the part,
 * or `null` when it was written.
 */
function writeObjectPart(
  hot: HotInstance,
  state: ViewState,
  part: GridViewStatePart,
  value: unknown,
  deferRows: boolean,
): Failure | null {
  if (part === 'selection' && value === null) {
    state.selection = undefined;
    state.selectionState = null;

    return null;
  }

  if (part === 'sort') {
    const failure = describeSort(hot, value);

    if (!failure) {
      state.sortConfig = toPlainData((value as { columns: SortedColumn[] }).columns);
      // The sorting plugin sorts from the pre-sort order it caches on its first sort, built from the
      // rows' order at that moment, so a grid that has not sorted yet starts from the order shown now.
      state.unsortedRowSequence = hot.rowIndexMapper.getIndexesSequence().slice();
    }

    return failure;
  }

  if (!isPlainObject(value)) {
    return fail('invalid', part, `${part} must be an object`);
  }

  const record = value as Record<string, unknown>;

  switch (part) {
    case 'frozen':
      return writeFrozen(hot, state, record);
    case 'pagination':
      return writePagination(state, record);
    case 'selection':
      return writeSelection(hot, state, value, deferRows);
    case 'scroll':
      return writeScroll(hot, state, record, deferRows);
    default:
      return fail('invalid', part, `${part} is not a part of the view state`);
  }
}

/**
 * Writes the frozen counts.
 */
function writeFrozen(hot: HotInstance, state: ViewState, record: Record<string, unknown>): Failure | null {
  const bad = (['rowsTop', 'rowsBottom', 'columnsStart', 'columnsEnd'] as const)
    .find(key => !(isInteger(record[key]) && (record[key] as number) >= 0));

  if (bad) {
    return fail('invalid', `frozen.${bad}`, `frozen.${bad} must be a non-negative integer`);
  }

  const conflict = describeFrozenConflict(hot, record);

  if (conflict) {
    return conflict;
  }

  state.fixedRowsTop = record.rowsTop as number;
  state.fixedRowsBottom = record.rowsBottom as number;
  state.fixedColumnsStart = record.columnsStart as number;
  state.fixedColumnsEnd = record.columnsEnd as number;

  return null;
}

/**
 * Writes the page and the page size.
 */
function writePagination(state: ViewState, record: Record<string, unknown>): Failure | null {
  if (!(isInteger(record.page) && record.page >= 1)) {
    return fail('invalid', 'pagination.page', 'pagination.page must be an integer from 1');
  }

  if (!(record.pageSize === 'auto' || (isInteger(record.pageSize) && record.pageSize >= 1))) {
    return fail('invalid', 'pagination.pageSize', 'pagination.pageSize must be a positive integer or \'auto\'');
  }

  state.pagination = { page: record.page, pageSize: record.pageSize as number | 'auto' };

  return null;
}

/**
 * Writes the scroll position. It must lie inside the grid, or the restore would scroll nowhere.
 */
function writeScroll(
  hot: HotInstance,
  state: ViewState,
  record: Record<string, unknown>,
  deferRows: boolean,
): Failure | null {
  const axes = [['row', deferRows ? Infinity : hot.countRows()], ['col', hot.countCols()]] as const;

  for (const [key, count] of axes) {
    const index = record[key];

    if (!isInteger(index) || index < 0) {
      return fail('invalid', `scroll.${key}`, `scroll.${key} must be a non-negative integer`);
    }

    if (index >= count) {
      return fail('outOfRange', `scroll.${key}`,
        `scroll.${key} is ${index}, and the grid has ${count} ${key === 'row' ? 'rows' : 'columns'}`);
    }
  }

  state.scroll = { row: record.row as number, col: record.col as number };

  return null;
}

/**
 * Writes the selection. The ranges are measured against the grid here, so a selection that does not
 * fit is reported with the other problems, before anything is applied. When the same state changes the
 * row count (filters, trimmed or collapsed rows), the fit is left to the apply, which measures the
 * selection against the rows the state leaves.
 */
function writeSelection(hot: HotInstance, state: ViewState, value: unknown, deferRows: boolean): Failure | null {
  if (!isSelection(value)) {
    return fail('invalid', 'selection', 'selection must have ranges (each with from, to and highlight as ' +
      '[row, column]), an activeLayer inside them, and the header and span lists of indexes');
  }

  const restored = deserializeSelection(hot, value);

  if (!deferRows && restored.selectionState && !fitsGrid(hot, restored.selectionState)) {
    return fail('outOfRange', 'selection',
      `the selection lies outside the grid (${hot.countRows()} rows, ${hot.countCols()} columns)`);
  }

  Object.assign(state, restored);

  return null;
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
  const available = PARTS.filter(part => getUnavailability(hot, part) === null);
  // Only the parts the state carries are read, so a grid with merges and borders pays no scan for them.
  const captured = captureViewState(hot, [], new Set<ViewStatePart>(available));
  const result: Record<string, unknown> = { version: GRID_VIEW_STATE_VERSION };

  available.forEach((part) => {
    const value = readPart(hot, captured, part);

    if (value !== undefined) {
      result[part] = toPlainData(value);
    }
  });

  return result as unknown as GridViewState;
}

/**
 * What checking a state against a grid found, before anything is applied.
 */
interface RestorePlan {
  error?: GridViewStateError;

  /**
   * How many parts the state names, the unknown keys included.
   */
  total: number;
  internal: ViewState;
  parts: Set<ViewStatePart>;
  presentParts: GridViewStatePart[];
  skipped: GridViewStateIssue[];
}

/**
 * Checks a state against the grid and reads the parts it can apply into the internal form. Nothing on
 * the grid changes.
 */
function planRestore(hot: HotInstance, state: unknown): RestorePlan {
  const plan: RestorePlan = {
    internal: createNeutralViewState(),
    total: 0,
    parts: new Set(),
    presentParts: [],
    skipped: [],
  };

  if (!isPlainObject(state)) {
    plan.error = {
      reason: 'notAnObject',
      message: `expected a view state object, got ${state === null ? 'null' : typeof state}`,
    };

    return plan;
  }

  const record = state as Record<string, unknown>;

  plan.presentParts = PARTS.filter(part => record[part] !== undefined);

  const unknownKeys = Object.keys(record).filter(key => key !== 'version' && !PARTS.includes(key as GridViewStatePart));

  plan.total = plan.presentParts.length + unknownKeys.length;

  if (record.version !== GRID_VIEW_STATE_VERSION) {
    plan.error = {
      reason: 'unsupportedVersion',
      message: `the view state version is not supported (expected ${GRID_VIEW_STATE_VERSION})`,
    };
    plan.skipped = plan.presentParts.map(part => ({
      part,
      reason: 'unsupportedVersion',
      path: 'version',
      message: `${part} comes from an unsupported view state version`,
    }));

    return plan;
  }

  unknownKeys.forEach((key) => {
    plan.skipped.push({
      part: key,
      reason: 'invalid',
      path: key,
      message: `${key} is not a part of the view state, the parts are: ${PARTS.join(', ')}`,
    });
  });

  const deferRows = ROW_COUNT_PARTS.some(part => record[part] !== undefined);

  plan.presentParts.forEach((part) => {
    const failure = describeUnavailability(hot, part) ??
      writePart(hot, plan.internal, part, record[part], deferRows);

    if (failure) {
      plan.skipped.push({ part, ...failure });
    } else {
      plan.parts.add(part);
    }
  });

  return plan;
}

/**
 * Lists parts in the order a restore applies them.
 */
function toPartList(parts: Iterable<ViewStatePart>): GridViewStatePart[] {
  const wanted = new Set<ViewStatePart>(parts);

  return PARTS.filter(part => wanted.has(part));
}

/**
 * Checks a {@link GridViewState} against the grid, without applying anything.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {GridViewStateInput} state The state to check.
 * @returns {GridViewStateValidationResult} Whether the whole state can be applied, which parts can, and
 * what is wrong with the others.
 */
export function validateGridViewState(hot: HotInstance, state: GridViewStateInput): GridViewStateValidationResult {
  const plan = planRestore(hot, state);

  return {
    valid: !plan.error && plan.skipped.length === 0,
    applicable: toPartList(plan.parts),
    skipped: plan.skipped,
    ...(plan.error ? { error: plan.error } : {}),
  };
}

/**
 * Applies a {@link GridViewStateInput} to the grid. Only the parts the state carries are applied, in
 * the order a sheet switch applies them. The parts are checked first, and a part that cannot be
 * applied is reported, never thrown on. By default the rest is applied and no undo step is recorded;
 * `options.undo: 'record'` records the restore as one step, and `options.atomic` applies nothing
 * when any part is rejected.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {GridViewStateInput} state The state to apply.
 * @param {GridViewStateSetOptions} [options] The undo and atomic options.
 * @returns {GridViewStateRestoreResult} The parts that were applied and skipped, and the view they replaced.
 */
export function setGridViewState(
  hot: HotInstance,
  state: GridViewStateInput,
  options: GridViewStateSetOptions = {},
): GridViewStateRestoreResult {
  const plan = planRestore(hot, state);

  if (plan.error) {
    warn(`setViewState(): ${plan.error.message}, so nothing was applied.`);

    return { applied: [], skipped: plan.skipped, error: plan.error };
  }

  if (options.atomic && plan.skipped.length > 0) {
    return {
      applied: [],
      skipped: plan.skipped,
      error: {
        reason: 'atomicRejected',
        message: `${plan.skipped.length} of ${plan.total} parts cannot be applied, ` +
          'so nothing was applied',
      },
    };
  }

  if (plan.parts.size === 0) {
    return { applied: [], skipped: plan.skipped };
  }

  const previous = readPreviousState(hot, plan.parts);
  const skipped = plan.skipped.slice();
  const apply = () => applyParts(hot, plan.internal, plan.parts, skipped);

  if (options.undo === 'record') {
    hot._getOperationScope().run('view_state', 'setViewState', apply);
  } else {
    withoutUndoEntry(hot, apply);
  }

  return {
    applied: toPartList(plan.parts).filter(part => !skipped.some(entry => entry.part === part)),
    skipped,
    previous,
  };
}

/**
 * Whether the grid is sorted, and sorts its own rows. Only then does a restore have a sort to put back.
 */
function isSortOn(hot: HotInstance): boolean {
  const config = describeUnavailability(hot, 'sort') === null ?
    captureViewState(hot, [], new Set<ViewStatePart>(['sort'])).sortConfig : null;

  return config !== null && config.length > 0;
}

/**
 * Reads the view the given parts have now, in the public shape, so that passing it back reverts them.
 * A row order restored without a sort clears the sort, so the sort is part of what a revert has to put
 * back, and it is read as well.
 */
function readPreviousState(hot: HotInstance, restored: Set<ViewStatePart>): GridViewState {
  const parts = new Set(restored);

  if (parts.has('rowOrder') && !parts.has('sort') && isSortOn(hot)) {
    parts.add('sort');
  }

  const captured = captureViewState(hot, [], parts);
  const previous: Record<string, unknown> = { version: GRID_VIEW_STATE_VERSION };

  toPartList(parts).forEach((part) => {
    const value = readPart(hot, captured, part);

    if (value !== undefined) {
      previous[part] = toPlainData(value);
    }
  });

  return previous as unknown as GridViewState;
}

/**
 * The parts restored after the render batch, once the grid is painted at the restored sizes.
 */
const VIEWPORT_PARTS: ReadonlySet<ViewStatePart> = new Set(['pagination', 'selection', 'scroll']);

/**
 * Runs the restore for the accepted parts and records the ones the grid turned down. The batch
 * that restores the view and the one that restores the viewport each run only when a part of theirs
 * is in the request, so a state that carries only a scroll position renders once.
 */
function applyParts(
  hot: HotInstance,
  state: ViewState,
  partsToApply: Set<ViewStatePart>,
  skipped: GridViewStateIssue[],
) {
  let parts = partsToApply;
  const requested = Array.from(parts);

  if (requested.some(part => !VIEWPORT_PARTS.has(part))) {
    restoreViewState(hot, state, parts).forEach((part) => {
      skipped.push({
        part: part as GridViewStatePart,
        reason: 'sizeMismatch',
        path: part,
        message: `${part} no longer matches the number of ${part === 'rowOrder' ? 'rows' : 'columns'} in the grid`,
      });
    });
  }

  if (!requested.some(part => VIEWPORT_PARTS.has(part))) {
    return;
  }

  const coversSelection = parts.has('selection');
  let selectionRestored = false;

  // A state that changes the row count could not be measured for its scroll row before it was applied.
  if (parts.has('scroll') && state.scroll.row >= hot.countRows()) {
    skipped.push({
      part: 'scroll',
      reason: 'outOfRange',
      path: 'scroll.row',
      message: `scroll.row is ${state.scroll.row}, and the grid has ${hot.countRows()} rows once the state is applied`,
    });
    parts = new Set(parts);
    parts.delete('scroll');
  }

  // The page, the selection, and the scroll need the grid painted with the restored sizes, so
  // they run after the batch above. Only the rendering is held here, never the index cache:
  // Pagination counts its pages from it, and a page set while it is held is clamped to a stale count.
  hot.suspendRender();

  try {
    selectionRestored = restoreViewport(hot, state, parts);

    if (coversSelection && !selectionRestored) {
      hot.deselectCell();

      if (state.selectionState) {
        skipped.push({
          part: 'selection',
          reason: 'outOfRange',
          path: 'selection',
          message: 'the selection could not be restored on this grid',
        });
      }
    }
  } finally {
    hot.resumeRender();
  }

  if (coversSelection || parts.has('pagination')) {
    keepSelectionOnPage(hot, selectionRestored);
  }
}
