import { deepClone } from '../../helpers/object';
import type { DataProviderQueryParameters } from './dataProvider';

/**
 * What a fetch was started for: the SheetsBar sheet (or `null` without SheetsBar), the data array the grid was
 * working on, the `dataProvider` config whose callbacks serve it, and the SheetsBar workbook the sheet id belongs
 * to (a rebuilt workbook numbers its sheets from 1 again, so an id alone does not identify a sheet).
 */
export interface FetchBinding<Config extends object = object> {
  sheetId: number | null;
  data: unknown;
  config: Config;
  workbook: number;
}

/**
 * A failed `onRowsCreate`, `onRowsUpdate`, or `onRowsRemove` whose error toast waits for its sheet.
 */
export interface DeferredMutationFailure {
  kind: 'create' | 'update' | 'remove';
  error: unknown;
}

/**
 * Tells whether a request kind is one of the mutations whose failure can wait for its sheet.
 *
 * @param {string} kind The request kind.
 * @returns {boolean}
 */
export function isMutationFailureKind(kind: string): kind is DeferredMutationFailure['kind'] {
  return kind === 'create' || kind === 'update' || kind === 'remove';
}

/**
 * The server view of one sheet: the query its rows were fetched with, the last `fetchRows` response (the
 * `afterDataProviderFetch` payload is built from it each time the sheet is shown, against the columns the sheet
 * has then), a fetch failure waiting to be shown when the sheet is visible again, and the mutation failures
 * waiting the same way.
 */
export interface SheetServerState<Result extends object = object> {
  queryParameters: DataProviderQueryParameters;
  lastResult: Result | null;
  failure: unknown;
  hasFailure: boolean;
  mutationFailures: DeferredMutationFailure[];
}

/**
 * Creates the state of a sheet that has not fetched yet.
 *
 * @param {object} queryParameters The query the sheet starts with.
 * @returns {object}
 */
export function createServerState<Result extends object>(
  queryParameters: DataProviderQueryParameters
): SheetServerState<Result> {
  return {
    queryParameters: deepClone(queryParameters),
    lastResult: null,
    failure: undefined,
    hasFailure: false,
    mutationFailures: [],
  };
}

/**
 * Copies a sheet's state for a duplicated sheet. The query is cloned so the copy's later queries stay its own;
 * pending failures belong to the original and are not copied.
 *
 * @param {object} state The original sheet's state.
 * @returns {object}
 */
export function cloneServerState<Result extends object>(state: SheetServerState<Result>): SheetServerState<Result> {
  return { ...createServerState<Result>(state.queryParameters), lastResult: state.lastResult };
}

/**
 * Replaces the contents of `target` with `rows`, keeping the array identity, so every holder of the reference
 * (a SheetsBar sheet record) sees the new rows. Pushes one by one: spreading a large array into `push()` overflows
 * the call stack. Handing the target in as `rows` leaves it untouched; emptying it first would lose every row.
 *
 * @param {*} target The array to fill.
 * @param {Array} rows The rows to put in it.
 * @returns {boolean} `false` when `target` is not an array.
 */
export function replaceArrayContents(target: unknown, rows: unknown[]): target is unknown[] {
  if (!Array.isArray(target)) {
    return false;
  }

  if (target === rows) {
    return true;
  }

  target.length = 0;
  rows.forEach(row => target.push(row));

  return true;
}
