/**
 * Why a pending request was cancelled.
 *
 * - `'edit'`: the cell's value was changed (an edit, a paste, an autofill, an undo, or an API write).
 * - `'dependency'`: the value of a cell listed in `dependsOn` was changed.
 * - `'restart'`: a new request was started for the same cell.
 * - `'rowRemoved'`: the cell's row was removed.
 * - `'columnRemoved'`: a column was inserted or removed, which shifts the columns of array data.
 * - `'dataReplaced'`: the data was replaced with `loadData()` or `updateData()`.
 * - `'manual'`: the request was cancelled with `cancel()` or `cancelAll()`.
 * - `'disabled'`: the plugin was disabled.
 */
export type AsyncValueCancelReason = 'edit' | 'dependency' | 'restart' | 'rowRemoved' | 'columnRemoved' |
  'dataReplaced' | 'manual' | 'disabled';

/**
 * The state of a cell that has a pending request or a failed one.
 */
export type AsyncValueStatus = 'pending' | 'error';

/**
 * The object passed to an async value source.
 */
export interface AsyncValueContext {
  /**
   * The signal aborted when the request is cancelled. Pass it to `fetch()` or to any other API that
   * accepts an `AbortSignal`.
   */
  signal: AbortSignal;
  /**
   * The visual row index of the cell, at the time the request started.
   */
  row: number;
  /**
   * The visual column index of the cell, at the time the request started.
   */
  column: number;
  /**
   * The physical row index of the cell, at the time the request started.
   */
  physicalRow: number;
  /**
   * The property of the cell's column.
   */
  prop: string | number;
}

/**
 * A promise of a cell's value, or a function that returns one. Only a function receives the
 * `AbortSignal`, so only a function can stop its work when the request is cancelled.
 */
export type AsyncValueSource =
  ((context: AsyncValueContext) => PromiseLike<unknown>) | PromiseLike<unknown>;

/**
 * The options of a request.
 */
export interface AsyncValueOptions {
  /**
   * The properties of the columns, in the same row, that the value is computed from. A change to any
   * of them cancels the request. For array data, the property is the physical column index.
   */
  dependsOn?: Array<string | number>;
}

/**
 * How a request ended.
 */
export type AsyncValueResult =
  { status: 'resolved'; value: unknown } |
  { status: 'rejected'; error: unknown; message: string } |
  { status: 'cancelled'; reason: AsyncValueCancelReason };

/**
 * The state of a cell, as `getAsyncState()` returns it.
 */
export type AsyncValueState =
  { status: 'pending' } |
  { status: 'error'; error: unknown; message: string };
