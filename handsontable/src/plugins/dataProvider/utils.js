import { toSingleLine } from '../../helpers/templateLiteralTag';
import { warn } from '../../helpers/console';

/**
 * Settings/plugins that conflict with server-backed `dataProvider` mode.
 *
 * @type {ReadonlyArray<{ settingKey: string, pluginId: string, label: string }>}
 */
export const DATA_PROVIDER_INCOMPATIBLE_ENTRIES = [
  { settingKey: 'trimRows', pluginId: 'trimRows', label: 'Trim rows' },
  { settingKey: 'manualRowMove', pluginId: 'manualRowMove', label: 'Manual row move' },
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
 * Copies ColumnSorting state into query `sort` when sorting is enabled.
 *
 * @param {{ enabled?: boolean, getSortConfig: function(): * }|null|undefined} columnSortingPlugin ColumnSorting plugin instance.
 * @param {{ sort: object|null }} queryParameters Target object (mutated).
 * @returns {void}
 */
export function applyColumnSortingToQueryParameters(columnSortingPlugin, queryParameters) {
  if (!columnSortingPlugin?.enabled) {
    return;
  }

  const sortConfig = columnSortingPlugin.getSortConfig();

  if (Array.isArray(sortConfig) && sortConfig.length > 0) {
    queryParameters.sort = sortConfig[0];
  } else if (sortConfig && typeof sortConfig === 'object' && 'column' in sortConfig) {
    queryParameters.sort = sortConfig;
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
