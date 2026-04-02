import { isFunction } from '../../helpers/function';

export const PLUGIN_KEY = 'dataProvider';
export const PLUGIN_PRIORITY = 950;
export const DEFAULT_PAGE_SIZE = 10;

export const DEFAULT_SETTINGS = {
  rowId: undefined,
  fetchRows: undefined,
  onRowsCreate: undefined,
  onRowsUpdate: undefined,
  onRowsRemove: undefined,
};

export const SETTINGS_VALIDATORS = {
  rowId: value => typeof value === 'string' || isFunction(value),
  fetchRows: value => isFunction(value),
  onRowsCreate: value => isFunction(value),
  onRowsUpdate: value => isFunction(value),
  onRowsRemove: value => isFunction(value),
};

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
export function dataProviderErrorRemoveMissingRowId(visualIndex) {
  return `DataProvider: cannot remove row at visual index ${visualIndex} because \`rowId\` `
    + 'resolves to null or undefined.';
}

/**
 * Thrown by [[DataProvider#updateRows]] when an entry has no `id`.
 *
 * @package
 */
export const DATA_PROVIDER_ERROR_UPDATE_ROWS_MISSING_ID =
  'DataProvider: `updateRows` requires every entry to include a non-null `id`.';

/**
 * Thrown by [[DataProvider#removeRows]] when an id is null or undefined.
 *
 * @package
 */
export const DATA_PROVIDER_ERROR_REMOVE_ROWS_MISSING_ID =
  'DataProvider: `removeRows` requires every id to be non-null.';
