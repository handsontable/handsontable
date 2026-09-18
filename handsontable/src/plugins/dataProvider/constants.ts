import { isFunction } from '../../helpers/function';
import type { DataProviderConfig } from './dataProvider';

export const PLUGIN_KEY = 'dataProvider';
export const PLUGIN_PRIORITY = 950;
export const DEFAULT_PAGE_SIZE = 10;

export const DEFAULT_SETTINGS: {
  rowId: string | ((rowData: unknown) => unknown) | undefined;
  fetchRows: DataProviderConfig['fetchRows'] | undefined;
  onRowsCreate: DataProviderConfig['onRowsCreate'] | undefined;
  onRowsUpdate: DataProviderConfig['onRowsUpdate'] | undefined;
  onRowsRemove: DataProviderConfig['onRowsRemove'] | undefined;
  refetchAfterCreate: boolean;
} = {
  rowId: undefined,
  fetchRows: undefined,
  onRowsCreate: undefined,
  onRowsUpdate: undefined,
  onRowsRemove: undefined,
  refetchAfterCreate: true,
};

/**
 * Per-key validators run by `BasePlugin#updatePluginSettings` for every key present on the `dataProvider`
 * object. `satisfies` keeps the literal key union, so `REQUIRED_CONFIG_KEYS` cannot name a key that has
 * no validator (a typo there would otherwise compile and throw at runtime for every grid with a `dataProvider`).
 *
 * `refetchAfterCreate` accepts an explicit `undefined`: the base plugin validates a key that is `in` the object
 * even when its value is `undefined`, and wrapper props such as `refetchAfterCreate: skip ? false : undefined`
 * produce exactly that. `undefined` reads as the default (refetch).
 */
export const SETTINGS_VALIDATORS = {
  rowId: (value: unknown) => typeof value === 'string' || isFunction(value),
  fetchRows: (value: unknown) => isFunction(value),
  onRowsCreate: (value: unknown) => isFunction(value),
  onRowsUpdate: (value: unknown) => isFunction(value),
  onRowsRemove: (value: unknown) => isFunction(value),
  refetchAfterCreate: (value: unknown) => value === undefined || typeof value === 'boolean',
} satisfies Record<string, (value: unknown) => boolean>;

/**
 * Keys that must be present and valid for a `dataProvider` object to count as a complete server-backed
 * configuration (`hasExternalDataSource` returns `true`). Optional keys such as `refetchAfterCreate` have
 * validators too, but they are not required for completeness.
 *
 * @package
 */
export const REQUIRED_CONFIG_KEYS: readonly (keyof typeof SETTINGS_VALIDATORS)[] = Object.freeze([
  'rowId',
  'fetchRows',
  'onRowsCreate',
  'onRowsUpdate',
  'onRowsRemove',
]);

/**
 * Message used when an in-flight `fetchRows` is aborted because a newer request started.
 *
 * @package
 */
export const ABORT_REASON_MESSAGE = 'DataProvider fetch superseded by a newer request';

/**
 * Default query parameters before the first successful fetch.
 *
 * @package
 */
export const INITIAL_QUERY_PARAMETERS = Object.freeze({
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  sort: null,
  filters: null,
});

/**
 * Change sources that batch into one `onRowsUpdate` call. DataProvider also returns `false` from
 * `beforeUndoStackChange` for these sources when `onRowsUpdate` is set, so local undo does not fight server-backed state.
 *
 * @package
 */
export const DATA_PROVIDER_BATCH_UPDATE_SOURCES = new Set([
  'edit',
  undefined,
  'CopyPaste.paste',
  'CopyPaste.cut',
  'Autofill.fill',
  'ContextMenu.clearColumn',
  /** Revert after failed `onRowsUpdate`; skipped for server enqueue and omitted from undo stack. */
  'DataProvider.revert',
]);

/**
 * Error message when a batched or programmatic update cannot run because `rowId` is missing on a row.
 *
 * @package
 */
export const DATA_PROVIDER_ERROR_UPDATE_MISSING_ROW_ID =
  'DataProvider: cannot send row update because `rowId` resolves to null or undefined for that row.';

/**
 * @param {number} visualIndex Visual row index.
 * @returns {string} Error message for remove_row when `rowId` is missing.
 * @package
 */
export function dataProviderErrorRemoveMissingRowId(visualIndex: number): string {
  return `DataProvider: cannot remove row at visual index ${visualIndex} because \`rowId\` `
    + 'resolves to null or undefined.';
}

/**
 * Thrown by {@link DataProvider#updateRows} when an entry has no `id`.
 *
 * @package
 */
export const DATA_PROVIDER_ERROR_UPDATE_ROWS_MISSING_ID =
  'DataProvider: `updateRows` requires every entry to include a non-null `id`.';

/**
 * Thrown by {@link DataProvider#removeRows} when an id is null or undefined.
 *
 * @package
 */
export const DATA_PROVIDER_ERROR_REMOVE_ROWS_MISSING_ID =
  'DataProvider: `removeRows` requires every id to be non-null.';
