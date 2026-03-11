import { deepClone, isObject } from '../helpers/object';
import { throwWithCause } from '../helpers/errors';

export const DEFAULT_QUERY_PARAMETERS = Object.freeze({
  page: 1,
  pageSize: 20,
  sort: null,
  filters: null,
});

/**
 * Creates a fresh query parameters object used by the `dataProvider`.
 *
 * @returns {object}
 */
export function createDefaultQueryParameters() {
  return deepClone(DEFAULT_QUERY_PARAMETERS);
}

/**
 * Resolves query parameters passed to the `dataProvider`.
 *
 * @param {object} currentQueryParameters The current query parameters.
 * @param {object|boolean|undefined} beforeHookResult The return value from the `beforeDataProviderRequest` hook.
 * @returns {object|boolean}
 */
export function resolveDataProviderRequestQueryParameters(currentQueryParameters, beforeHookResult) {
  if (beforeHookResult === false) {
    return false;
  }

  if (isObject(beforeHookResult)) {
    return beforeHookResult;
  }

  return deepClone(currentQueryParameters);
}

/**
 * Normalizes and validates the `dataProvider` response.
 *
 * @param {object} response The value returned by the `dataProvider`.
 * @returns {{rows: Array, totalRows: number}}
 */
export function normalizeDataProviderResponse(response) {
  if (!isObject(response) || !Array.isArray(response.rows)) {
    throwWithCause('`dataProvider` must resolve to an object containing a `rows` array.');
  }

  return {
    rows: response.rows,
    totalRows: Number.isFinite(response.totalRows) ? response.totalRows : response.rows.length,
  };
}
