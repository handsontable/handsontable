import { PLUGIN_KEY as COLUMN_SORTING_PLUGIN_KEY } from '../columnSorting';
import {
  applyColumnSortingToQueryParameters,
  normalizeSortToQueryFormat,
  querySortToPluginSort,
  syncColumnSortingFromQuerySort,
} from './utils';

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
 * Aligns ColumnSorting plugin UI with query-format sort after loadData / fetch.
 *
 * @param {Core} hot Handsontable instance.
 * @param {{ prop: string, order: 'asc'|'desc' }|null} querySort Query `sort` descriptor.
 * @returns {void}
 */
export function syncColumnSortingStateFromQuerySort(hot, querySort) {
  const sortForPlugin = querySortToPluginSort(querySort, prop => hot.propToCol(prop));

  syncColumnSortingFromQuerySort(
    hot.getPlugin(COLUMN_SORTING_PLUGIN_KEY),
    sortForPlugin
  );
}

/**
 * Server-backed sort: apply plugin sort config, refresh query from plugins, refetch; return false to cancel default.
 *
 * @param {object} ctx Hook context.
 * @param {Core} ctx.hot Handsontable instance.
 * @param {function(): boolean} ctx.isEnabled Whether DataProvider is enabled.
 * @param {function(): boolean} ctx.hasFetchFn Whether fetchRows is configured.
 * @param {function(): void} ctx.applyPaginationAndSortFromPlugins Refreshes query from Pagination + ColumnSorting.
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
  const { hot, isEnabled, hasFetchFn, applyPaginationAndSortFromPlugins, fetchData } = ctx;

  if (!hasFetchFn() || !isEnabled() || !sortPossible) {
    return;
  }

  const columnSorting = hot.getPlugin(COLUMN_SORTING_PLUGIN_KEY);

  columnSorting.setSortConfig(destinationSortConfigs);
  applyPaginationAndSortFromPlugins();
  fetchData({ skipLoading: true });

  return false;
}
