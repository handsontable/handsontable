const COLUMN_SORTING_PLUGIN_KEY = 'columnSorting';

/**
 * Normalizes a sort descriptor to query format `{ prop, order }`.
 * Accepts either plugin format `{ column, sortOrder }` (column index) or already query format `{ prop, order }`.
 *
 * @param {{ column?: number, prop?: string, sortOrder?: string, order?: string }|null} sort Sort from plugin or overrides.
 * @param {function(number): string} colToProp Maps visual column index to column data key.
 * @returns {{ prop: string, order: 'asc'|'desc' }|null} Query-format sort or null.
 */
export function normalizeSortToQueryFormat(sort, colToProp) {
  if (sort === null || sort === undefined || typeof sort !== 'object') {
    return null;
  }

  if (typeof sort.column === 'number' && typeof colToProp === 'function') {
    return {
      prop: colToProp(sort.column),
      order: sort.sortOrder,
    };
  }

  const order = sort.order ?? sort.sortOrder;

  if (typeof sort.prop === 'string' && (order === 'asc' || order === 'desc')) {
    return {
      prop: sort.prop,
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
export function querySortToPluginSort(sort, propToCol) {
  if ((sort === null || sort === undefined) || typeof sort !== 'object' || typeof sort.prop !== 'string') {
    return null;
  }

  const order = sort.order ?? sort.sortOrder;

  if (order !== 'asc' && order !== 'desc') {
    return null;
  }

  if (typeof propToCol !== 'function') {
    return null;
  }

  const column = propToCol(sort.prop);

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
export function applyColumnSortingToQueryParameters(columnSortingPlugin, queryParameters, colToProp) {
  if (!columnSortingPlugin?.enabled || typeof colToProp !== 'function') {
    return;
  }

  const sortConfig = columnSortingPlugin.getSortConfig();
  const first = Array.isArray(sortConfig) && sortConfig.length > 0 ? sortConfig[0] : sortConfig;

  if (first && typeof first === 'object' && typeof first.column === 'number') {
    queryParameters.sort = {
      prop: colToProp(first.column),
      order: first.sortOrder,
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
export function syncColumnSortingFromQuerySort(columnSortingPlugin, sort) {
  if (!columnSortingPlugin?.enabled) {
    return;
  }

  const sortConfig = sort && typeof sort === 'object' && 'column' in sort ? sort : [];

  columnSortingPlugin.setSortConfig(sortConfig);
}

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
