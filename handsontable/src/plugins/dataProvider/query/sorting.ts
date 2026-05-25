import type { HotInstance } from '../../../core/types';
import type { ColumnSortingConfig } from '../../columnSorting/columnSorting';

const COLUMN_SORTING_PLUGIN_KEY = 'columnSorting';

type SortOrder = 'asc' | 'desc';

/** Query-format sort descriptor `{ prop, order }`. */
type QuerySort = { prop: string; order: SortOrder } | null;

/**
 * Duck-typed interface for the subset of ColumnSorting plugin API used in this module.
 * Using a structural interface avoids a circular dependency on the concrete plugin class.
 */
interface ColumnSortingPluginLike {
  enabled?: boolean;
  getSortConfig(): ColumnSortingConfig | ColumnSortingConfig[];
  setSortConfig(sortConfig?: ColumnSortingConfig | ColumnSortingConfig[]): void;
}

/**
 * Normalizes a sort descriptor to query format `{ prop, order }`.
 * Accepts either plugin format `{ column, sortOrder }` (column index) or already query format `{ prop, order }`.
 *
 * @param {{ column?: number, prop?: string, sortOrder?: string, order?: string }|null} sort Sort from plugin or overrides.
 * @param {function(number): string} colToProp Maps visual column index to column data key.
 * @returns {{ prop: string, order: 'asc'|'desc' }|null} Query-format sort or null.
 */
export function normalizeSortToQueryFormat(
  sort: unknown, colToProp: (col: number) => string
): QuerySort {
  if (sort === null || sort === undefined || typeof sort !== 'object') {
    return null;
  }

  const s = sort as Record<string, unknown>;

  if (typeof s.column === 'number' && typeof colToProp === 'function') {
    return {
      prop: colToProp(s.column),
      order: s.sortOrder as SortOrder,
    };
  }

  const order = s.order ?? s.sortOrder;

  if (typeof s.prop === 'string' && (order === 'asc' || order === 'desc')) {
    return {
      prop: s.prop,
      order,
    };
  }

  return null;
}

/**
 * Converts query-format sort `{ prop, order }` to ColumnSorting plugin format `{ column, sortOrder }`.
 *
 * @param {{ prop: string, order: 'asc'|'desc' }|null} sort Query-format sort.
 * @param {function(string): number} propToCol Maps column data key to visual column index.
 * @returns {{ column: number, sortOrder: 'asc'|'desc' }|null} Plugin-format sort or null.
 */
export function querySortToPluginSort(
  sort: unknown, propToCol: (prop: string) => number
): { column: number; sortOrder: SortOrder } | null {
  if ((sort === null || sort === undefined) || typeof sort !== 'object') {
    return null;
  }

  const s = sort as Record<string, unknown>;

  if (typeof s.prop !== 'string') {
    return null;
  }

  const order = s.order ?? s.sortOrder;

  if (order !== 'asc' && order !== 'desc') {
    return null;
  }

  if (typeof propToCol !== 'function') {
    return null;
  }

  const column = propToCol(s.prop);

  if (typeof column !== 'number') {
    return null;
  }

  return {
    column,
    sortOrder: order,
  };
}

/**
 * Copies ColumnSorting state into query `sort` as `{ prop, order }` when sorting is enabled.
 *
 * @param {{ enabled?: boolean, getSortConfig: function(): * }|null|undefined} columnSortingPlugin ColumnSorting plugin instance.
 * @param {{ sort: ({ prop: string, order: 'asc'|'desc' }|null) }} queryParameters Target object (mutated).
 * @param {function(number): string} colToProp Maps visual column index to column data key.
 * @returns {void}
 */
export function applyColumnSortingToQueryParameters(
  columnSortingPlugin: ColumnSortingPluginLike | null | undefined,
  queryParameters: { sort: QuerySort },
  colToProp: (col: number) => string
): void {
  if (!columnSortingPlugin?.enabled || typeof colToProp !== 'function') {
    return;
  }

  const sortConfig = columnSortingPlugin.getSortConfig();
  const first: ColumnSortingConfig | undefined = Array.isArray(sortConfig)
    ? sortConfig[0]
    : sortConfig;

  if (first && typeof first.column === 'number') {
    queryParameters.sort = {
      prop: colToProp(first.column),
      order: first.sortOrder as SortOrder,
    };
  } else {
    queryParameters.sort = null;
  }
}

/**
 * Aligns ColumnSorting UI with a single-column sort descriptor from the data layer.
 *
 * @param {{ enabled?: boolean, setSortConfig: function(*): void }|null|undefined} columnSortingPlugin ColumnSorting plugin instance.
 * @param {{ column: number, sortOrder: 'asc'|'desc' }|Array|undefined|null} sort ColumnSorting config entry, `[]` to clear, or null/undefined.
 * @returns {void}
 */
export function syncColumnSortingFromQuerySort(
  columnSortingPlugin: ColumnSortingPluginLike | null | undefined,
  sort: ColumnSortingConfig | ColumnSortingConfig[] | null | undefined
): void {
  if (!columnSortingPlugin?.enabled) {
    return;
  }

  const sortConfig: ColumnSortingConfig | ColumnSortingConfig[] =
    sort && !Array.isArray(sort) && 'column' in sort ? sort : [];

  columnSortingPlugin.setSortConfig(sortConfig);
}

/**
 * Copies ColumnSorting state into query `sort` when sorting is enabled.
 *
 * @param {Core} hot Handsontable instance.
 * @param {{ sort: ({ prop: string, order: 'asc'|'desc' }|null) }} queryParameters Target object (mutated).
 * @returns {void}
 */
export function applyColumnSortToQueryFromPlugin(hot: HotInstance, queryParameters: { sort: QuerySort }): void {
  applyColumnSortingToQueryParameters(
    hot.getPlugin(COLUMN_SORTING_PLUGIN_KEY) as unknown as ColumnSortingPluginLike,
    queryParameters,
    column => String(hot.colToProp(column))
  );
}

/**
 * Normalizes `params.sort` to query format using column props.
 *
 * @param {object} params Fetch params object (mutated). May hold plugin or query `sort`; written back as query `sort`.
 * @param {Core} hot Handsontable instance.
 * @returns {void}
 */
export function normalizeSortInFetchParams(params: { sort: unknown }, hot: HotInstance): void {
  params.sort = normalizeSortToQueryFormat(params.sort, col => String(hot.colToProp(col)));
}

/**
 * Converts DataProvider query `sort` payload (`prop` and `order`) to a value accepted by [[ColumnSorting#setSortConfig]].
 * Inverse of [[applyColumnSortingToQueryParameters]] for restoring header state after a successful fetch.
 *
 * @param {Core} hot Handsontable instance.
 * @param {{ prop: string, order: 'asc'|'desc' }|null|undefined} sortingPayload Sort from [[DataProviderQueryParameters]], or null when unsorted.
 * @returns {{ column: number, sortOrder: 'asc'|'desc' }|Array} Empty array when there is no valid sort; otherwise a single-column config object.
 */
export function sortingPayloadToSort(
  hot: HotInstance, sortingPayload: QuerySort | undefined
): { column: number; sortOrder: SortOrder } | ColumnSortingConfig[] {
  const pluginSort = querySortToPluginSort(sortingPayload, prop => hot.propToCol(prop));

  return pluginSort && typeof pluginSort === 'object' && 'column' in pluginSort ? pluginSort : [];
}

/**
 * Server-backed sort: apply plugin sort config, refresh query from plugins, refetch; return false to cancel default.
 *
 * @param {object} ctx Hook context.
 * @param {Core} ctx.hot Handsontable instance.
 * @param {function(): boolean} ctx.isEnabled Whether DataProvider is enabled.
 * @param {function(): boolean} ctx.hasFetchFn Whether fetchRows is configured.
 * @param {function(): void} ctx.applyQueryParametersFromPlugins Refreshes query from Pagination, ColumnSorting, and Filters.
 * @param {function(object=): Promise<*>} ctx.fetchData Triggers refetch (optional overrides, e.g. `{ skipLoading: true }`).
 * @param {Array} _currentSortConfig Current sort config (hook arity).
 * @param {Array} destinationSortConfigs Destination sort config from the hook.
 * @param {boolean} sortPossible Whether sort is allowed.
 * @returns {boolean|void} False when server path handled the sort.
 */
export function handleBeforeColumnSortForServer(
  ctx: {
    hot: HotInstance;
    hasFetchFn: () => boolean;
    applyQueryParametersFromPlugins: () => void;
    fetchData: (overrides?: object) => Promise<unknown>;
  },
  _currentSortConfig: unknown[],
  destinationSortConfigs: unknown[],
  sortPossible: boolean
): boolean | void {
  const { hot, hasFetchFn, applyQueryParametersFromPlugins, fetchData } = ctx;

  if (!hasFetchFn() || !sortPossible) {
    return;
  }

  const columnSorting = hot.getPlugin(COLUMN_SORTING_PLUGIN_KEY);

  columnSorting.setSortConfig(destinationSortConfigs as unknown as ColumnSortingConfig[]);
  applyQueryParametersFromPlugins();
  fetchData({ skipLoading: true });

  return false;
}
