import { isFunction } from '../../../helpers/function';
import type { HotInstance } from '../../../core/types';
import type { ColumnConditions, ConditionId, OperationType } from '../../filters/filters';

/**
 * Shape of a single column entry in the DataProvider server-side filter payload.
 * Uses `prop` (column data key) instead of a numeric column index.
 */
interface FilterPayloadColumn {
  prop: string;
  operation: string;
  conditions: { name?: string; args: unknown[] }[];
}

const FILTERS_PLUGIN_KEY = 'filters';

/**
 * Deep-clones DataProvider server filter payload for safe return from getters (mutations do not affect plugin state).
 *
 * @param {Array<{ prop: string, operation: string, conditions: Array<{ name?: string, args: Array<*> }> }>|null} filters Server filter columns from query parameters, or `null`.
 * @returns {Array<{ prop: string, operation: string, conditions: Array<{ name?: string, args: Array<*> }> }>|null}
 */
export function cloneDataProviderFiltersPayload(filters: FilterPayloadColumn[] | null): FilterPayloadColumn[] | null {
  if (filters === null) {
    return null;
  }

  return filters.map(col => ({
    prop: col.prop,
    operation: col.operation,
    conditions: (col.conditions || []).map(c => ({
      name: c.name,
      args: Array.isArray(c.args) ? [...c.args] : [],
    })),
  }));
}

/**
 * Converts Filters plugin condition stack (physical column indexes) to query filters (prop = column data key).
 * Expects the same shape as [[Filters#exportConditions]] returns.
 *
 * @param {Core} hot Handsontable instance.
 * @param {Array} conditionsStack Array of { column, operation, conditions } (same shape as exportConditions).
 * @returns {Array<{ prop: string, operation: 'conjunction'|'disjunction'|'disjunctionWithExtraCondition', conditions: Array<{ name?: string, args: Array<*> }> }>|null} Payload or null when empty.
 */
export function conditionsStackToFiltersPayload(
  hot: HotInstance, conditionsStack: ColumnConditions[]
): FilterPayloadColumn[] | null {
  if (!Array.isArray(conditionsStack) || conditionsStack.length === 0) {
    return null;
  }

  const payload: FilterPayloadColumn[] = [];

  for (let i = 0; i < conditionsStack.length; i++) {
    const stack = conditionsStack[i];
    const visualCol = hot.toVisualColumn(stack.column);
    const prop = hot.colToProp(visualCol);

    if (prop === null || prop === undefined) {
      continue;
    }

    payload.push({
      prop: String(prop),
      operation: stack.operation,
      conditions: stack.conditions.map((c: ConditionId) => ({
        name: c.name,
        args: Array.isArray(c.args) ? [...c.args] : [],
      })),
    });
  }

  return payload.length === 0 ? null : payload;
}

/**
 * Converts DataProvider `fetchRows` filter payload (prop keys) back to a Filters plugin condition stack (physical columns).
 * Inverse of [[conditionsStackToFiltersPayload]] for restoring UI state after a successful fetch.
 *
 * @param {object} hot Handsontable instance.
 * @param {Array<{ prop: string, operation: string, conditions: Array<{ name?: string, args: Array<*> }> }>|null} filtersPayload Filters from [[DataProviderQueryParameters]], or `null` when no column filters.
 * @returns {Array<{ column: number, operation: string, conditions: Array<{ name: string, args: Array<*> }> }>} Shape accepted by [[Filters#importConditions]].
 */
export function filtersPayloadToConditionsStack(
  hot: HotInstance, filtersPayload: FilterPayloadColumn[] | null | undefined
): ColumnConditions[] {
  if (filtersPayload === null || filtersPayload === undefined) {
    return [];
  }

  if (!Array.isArray(filtersPayload) || filtersPayload.length === 0) {
    return [];
  }

  const stack: ColumnConditions[] = [];

  for (let i = 0; i < filtersPayload.length; i++) {
    const col = filtersPayload[i];
    const visualCol = hot.propToCol(col.prop);

    if (visualCol === null || visualCol === undefined || visualCol < 0) {
      continue;
    }

    const physicalColumn = hot.toPhysicalColumn(visualCol);

    stack.push({
      column: physicalColumn,
      operation: col.operation as OperationType,
      conditions: (col.conditions || []).map(c => ({
        name: c.name ?? '',
        args: Array.isArray(c.args) ? [...c.args] : [],
      })),
    });
  }

  return stack;
}

/**
 * When `getFetchFn()` returns a function and the Filters plugin is enabled, sets `queryParameters.filters` from
 * [[Filters#exportConditions]] (same mapping as server-side `beforeFilter`).
 *
 * @param {Core} hot Handsontable instance.
 * @param {{ filters: * }} queryParameters Target object (mutated).
 * @param {function(): Function|undefined} getFetchFn Returns `fetchRows` or a falsy value when not configured.
 * @returns {void}
 */
export function applyFiltersFromFiltersPluginToQueryParameters(
  hot: HotInstance,
  queryParameters: { filters: FilterPayloadColumn[] | null },
  getFetchFn: () => Function | undefined
): void {
  if (!isFunction(getFetchFn())) {
    return;
  }

  const filtersPlugin = hot.getPlugin(FILTERS_PLUGIN_KEY);

  if (!filtersPlugin || !filtersPlugin.enabled) {
    return;
  }

  const filtersForProvider = conditionsStackToFiltersPayload(
    hot,
    filtersPlugin.exportConditions()
  );

  queryParameters.filters = filtersForProvider ?? null;
}

/**
 * Server-backed filter: write query `filters`, reset page, refetch; return false so Filters skip client-side row trimming.
 *
 * @param {object} ctx Hook context.
 * @param {Core} ctx.hot Handsontable instance.
 * @param {function(): boolean} ctx.hasFetchFn Whether `fetchRows` is configured.
 * @param {function(Array|null): void} ctx.applyFiltersAndRefetch Receives payload from [[conditionsStackToFiltersPayload]] (or null), updates query and refetches.
 * @param {Array} conditionsStack Exported filter conditions (column = physical index).
 * @returns {boolean|void} False when the server path handled the filter.
 */
export function handleBeforeFilterForServer(
  ctx: {
    hot: HotInstance;
    hasFetchFn: () => boolean;
    applyFiltersAndRefetch: (payload: FilterPayloadColumn[] | null) => void;
  },
  conditionsStack: unknown[]
): boolean | void {
  const { hot, hasFetchFn, applyFiltersAndRefetch } = ctx;

  if (!hasFetchFn()) {
    return;
  }

  const filtersForProvider = conditionsStackToFiltersPayload(hot, conditionsStack as ColumnConditions[]);

  applyFiltersAndRefetch(filtersForProvider);

  return false;
}
