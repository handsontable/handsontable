import {
  applyColumnSortingToQueryParameters,
  normalizeSortToQueryFormat,
  querySortToPluginSort,
} from '../utils';

const COLUMN_SORTING_PLUGIN_KEY = 'columnSorting';

/**
 * Copies ColumnSorting state into query `sort` when sorting is enabled.
 *
 * @param {Core} hot Handsontable instance.
 * @param {{ sort: ({ prop: string, order: 'asc'|'desc' }|null) }} queryParameters Target object (mutated).
 * @returns {void}
 */
export function applyColumnSortToQueryFromPlugin(hot, queryParameters) {
  applyColumnSortingToQueryParameters(
    hot.getPlugin(COLUMN_SORTING_PLUGIN_KEY),
    queryParameters,
    column => hot.colToProp(column)
  );
}

/**
 * Normalizes `params.sort` to query format using column props.
 *
 * @param {object} params Fetch params object (mutated). May hold plugin or query `sort`; written back as query `sort`.
 * @param {Core} hot Handsontable instance.
 * @returns {void}
 */
export function normalizeSortInFetchParams(params, hot) {
  params.sort = normalizeSortToQueryFormat(params.sort, col => hot.colToProp(col));
}

/**
 * Converts DataProvider query `sort` payload (`prop` and `order`) to a value accepted by [[ColumnSorting#setSortConfig]].
 * Inverse of [[applyColumnSortingToQueryParameters]] for restoring header state after a successful fetch.
 *
 * @param {Core} hot Handsontable instance.
 * @param {{ prop: string, order: 'asc'|'desc' }|null|undefined} sortingPayload Sort from [[DataProviderQueryParameters]], or null when unsorted.
 * @returns {{ column: number, sortOrder: 'asc'|'desc' }|Array} Empty array when there is no valid sort; otherwise a single-column config object.
 */
export function sortingPayloadToSort(hot, sortingPayload) {
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
  ctx,
  _currentSortConfig,
  destinationSortConfigs,
  sortPossible
) {
  const { hot, hasFetchFn, applyQueryParametersFromPlugins, fetchData } = ctx;

  if (!hasFetchFn() || !sortPossible) {
    return;
  }

  const columnSorting = hot.getPlugin(COLUMN_SORTING_PLUGIN_KEY);

  columnSorting.setSortConfig(destinationSortConfigs);
  applyQueryParametersFromPlugins();
  fetchData({ skipLoading: true });

  return false;
}
