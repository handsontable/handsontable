import { isFunction } from '../../helpers/function';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { warn } from '../../helpers/console';

/**
 * Whether `dataProvider` settings are complete enough for the DataProvider plugin to run.
 *
 * @param {*} c Value of the `dataProvider` setting.
 * @returns {boolean}
 */
export function isCompleteDataProviderConfig(c) {
  if (!c || typeof c !== 'object') {
    return false;
  }

  const rid = c.rowId;

  return (typeof rid === 'string' || isFunction(rid))
    && isFunction(c.fetchRows)
    && isFunction(c.onRowsCreate)
    && isFunction(c.onRowsUpdate)
    && isFunction(c.onRowsRemove);
}

/**
 * Settings/plugins that conflict with server-backed `dataProvider` mode.
 *
 * @type {ReadonlyArray<{ settingKey: string, pluginId: string, label: string }>}
 */
export const DATA_PROVIDER_INCOMPATIBLE_ENTRIES = [
  { settingKey: 'trimRows', pluginId: 'trimRows', label: 'Trim rows' },
  { settingKey: 'manualRowMove', pluginId: 'manualRowMove', label: 'Manual row move' },
  { settingKey: 'manualColumnMove', pluginId: 'manualColumnMove', label: 'Manual column move' },
  { settingKey: 'multiColumnSorting', pluginId: 'multiColumnSorting', label: 'Multi-column sorting' },
];

/**
 * Whether a setting value means "enabled" for conflict checks.
 *
 * @param {*} value Plugin setting value.
 * @returns {boolean}
 */
function isEnabledSettingValue(value) {
  return value !== undefined && value !== false && value !== null;
}

/**
 * Copies enabled Pagination `pageSize` / `initialPage` into query parameters.
 *
 * @param {{ enabled?: boolean, getSetting: function(string): * }|null|undefined} paginationPlugin Pagination plugin instance.
 * @param {{ page: number, pageSize: number }} queryParameters Target object (mutated).
 * @returns {void}
 */
export function applyPaginationToQueryParameters(paginationPlugin, queryParameters) {
  if (!paginationPlugin?.enabled) {
    return;
  }

  const pageSize = paginationPlugin.getSetting('pageSize');
  const initialPage = paginationPlugin.getSetting('initialPage');

  if (typeof pageSize === 'number') {
    queryParameters.pageSize = pageSize;
  }
  if (typeof initialPage === 'number' && initialPage >= 1) {
    queryParameters.page = initialPage;
  }
}

/**
 * Normalizes a sort descriptor to query format `{ prop, order }`.
 * Accepts either plugin format `{ column, sortOrder }` (column index) or already query format `{ prop, order }`.
 *
 * @param {{ column?: number, prop?: string, sortOrder?: string, order?: string }|null} sort Sort from plugin or overrides.
 * @param {function(number): string} colToProp Maps visual column index to column data key.
 * @returns {{ prop: string, order: string }|null} Query-format sort or null.
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
 * @param {{ prop: string, order: string }|null} sort Query-format sort.
 * @param {function(string): number} propToCol Maps column data key to visual column index.
 * @returns {{ column: number, sortOrder: string }|null} Plugin-format sort or null.
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
 * @param {{ sort: object|null }} queryParameters Target object (mutated).
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
 * Resolves page size for external pagination fetch when UI reports `'auto'` or invalid values.
 *
 * @param {number | 'auto'} newPageSize Value from Pagination hook.
 * @param {number} fallbackPageSize Default when `newPageSize` is not a positive number.
 * @returns {number}
 */
export function normalizeExternalPaginationPageSize(newPageSize, fallbackPageSize) {
  if (newPageSize === 'auto'
    || typeof newPageSize !== 'number'
    || !Number.isFinite(newPageSize)
    || newPageSize < 1) {
    return fallbackPageSize;
  }

  return newPageSize;
}

/**
 * Aligns ColumnSorting UI with a single-column sort descriptor from the data layer.
 *
 * @param {{ enabled?: boolean, setSortConfig: function(*): void }|null|undefined} columnSortingPlugin ColumnSorting plugin instance.
 * @param {object|null} sort Sort descriptor or null.
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
 * Logs one warning per conflicting option and disables the corresponding plugin.
 *
 * @param {{ getPlugin: function(string): { enabled?: boolean, disablePlugin?: function(): void }|undefined }} hot Handsontable instance.
 * @param {object} settings Current instance settings.
 * @param {Set<string>} warnedSettingKeys Keys already warned this session (mutated).
 * @returns {void}
 */
export function disablePluginsIncompatibleWithDataProvider(hot, settings, warnedSettingKeys) {
  DATA_PROVIDER_INCOMPATIBLE_ENTRIES.forEach(({ settingKey, pluginId, label }) => {
    const value = settings[settingKey];

    if (!isEnabledSettingValue(value)) {
      return;
    }

    if (!warnedSettingKeys.has(settingKey)) {
      warn(toSingleLine`Handsontable: "${settingKey}" (${label}) is incompatible with \`dataProvider\`\x20
                        and has been disabled.`);
      warnedSettingKeys.add(settingKey);
    }

    const plugin = hot.getPlugin(pluginId);

    if (plugin?.enabled) {
      plugin.disablePlugin();
    }
  });
}
