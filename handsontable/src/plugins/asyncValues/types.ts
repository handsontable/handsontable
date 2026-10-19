/**
 * Every reason a pending request can be cancelled for, for exhaustive handling.
 *
 * - `'edit'`: the cell's value was changed (an edit, a paste, an autofill, an undo, or an API write).
 * - `'dependency'`: the value of a cell listed in `dependsOn` was changed.
 * - `'restart'`: a new request was started for the same cell.
 * - `'rowRemoved'`: the cell's row was removed, or a data replacement no longer holds its row.
 * - `'columnsChanged'`: a column was inserted or removed at or before the cell's column, which shifts the columns
 *   of array data.
 * - `'dataReplaced'`: `loadData()` replaced the data and the rows have no ids to follow.
 * - `'manual'`: the request was cancelled with `cancel()`, `cancelAt()`, or `cancelAll()`.
 * - `'disabled'`: the plugin was disabled, or the grid destroyed.
 * - `'vetoed'`: a `beforeAsyncValueStart` or `beforeAsyncValueResolve` listener returned `false`.
 */
export const ASYNC_VALUE_CANCEL_REASONS = [
  'edit',
  'dependency',
  'restart',
  'rowRemoved',
  'columnsChanged',
  'dataReplaced',
  'manual',
  'disabled',
  'vetoed',
] as const;

/**
 * Why a pending request was cancelled (see `ASYNC_VALUE_CANCEL_REASONS`).
 */
export type AsyncValueCancelReason = typeof ASYNC_VALUE_CANCEL_REASONS[number];

/**
 * The state of a cell that has a pending request or a failed one.
 */
export type AsyncValueStatus = 'pending' | 'error';

/**
 * A column property: a `data` key of object data, or a physical column index of array data.
 */
export type AsyncValueProp = string | number;

/**
 * The object passed to an async value source.
 */
export interface AsyncValueContext {
  /**
   * The signal aborted when the cell's request is cancelled. Pass it to `fetch()` or to any other API
   * that accepts an `AbortSignal`.
   */
  signal: AbortSignal;
  /**
   * The visual row index of the cell when the source is called, or `null` for a row with no visual
   * index (filtered out or trimmed).
   */
  row: number | null;
  /**
   * The visual column index of the cell when the source is called, or `null` when the column has no
   * visual index (a column trimmed out of the grid).
   */
  column: number | null;
  /**
   * The physical row index of the cell when the source is called.
   */
  physicalRow: number;
  /**
   * The property of the cell's column.
   */
  prop: AsyncValueProp;
  /**
   * The id of the cell's row (see the `rowId` option), or `null` when the rows have no ids.
   */
  rowId: unknown;
}

/**
 * A promise of a cell's value, or a function that returns one. Only a function receives the
 * `AbortSignal`, so only a function can stop its work when the request is cancelled, and only a
 * function can be retried.
 */
export type AsyncValueSource =
  ((context: AsyncValueContext) => PromiseLike<unknown>) | PromiseLike<unknown>;

/**
 * A function that computes the values of many cells in one request. It resolves with an array aligned
 * with `cells`: an element that is an `Error` rejects that cell, and a missing element rejects it with
 * an empty message. A rejection rejects every cell of the batch.
 */
export type AsyncValueBatchSource =
  (cells: AsyncValueContext[], signal: AbortSignal) => PromiseLike<ArrayLike<unknown>>;

/**
 * The options of a request.
 */
export interface AsyncValueOptions {
  /**
   * The properties of the columns, in the same row, that the value is computed from. A change to any
   * of them cancels the request, or clears the error state the request left.
   */
  dependsOn?: AsyncValueProp[];
  /**
   * The source the resolved value is written with, as `beforeChange` and `afterChange` receive it.
   * Default: `'AsyncValues.resolve'`.
   */
  source?: string;
  /**
   * Cell meta merged into the cell when its value is written, for example `{ aiGenerated: true }`.
   * Applied to rows with a visual index only, and never part of an undo step.
   */
  meta?: Record<string, unknown>;
  /**
   * `'skip'` (default) writes the values without an undo step. `'record'` records every value the call
   * wrote as one undo step, when the call's last request settles.
   */
  undo?: 'skip' | 'record';
  /**
   * Whether a failed cell keeps its source for `retry()`. Default: `true`.
   */
  keepSource?: boolean;
}

/**
 * The options of a batched request.
 */
export interface AsyncValueBatchOptions extends AsyncValueOptions {
  /**
   * The maximum number of cells per call of the batch source. Default: `25`.
   */
  batchSize?: number;
}

/**
 * A cell, by visual coordinates, by physical row, or by row id.
 */
export type AsyncCellRef =
  { row: number; column: number } |
  { physicalRow: number; prop: AsyncValueProp } |
  { rowId: unknown; prop: AsyncValueProp };

/**
 * A row, by physical index or by row id.
 */
export type AsyncRowRef = { physicalRow: number } | { rowId: unknown };

/**
 * A cell, as the query methods report it.
 */
export interface AsyncCellInfo {
  /**
   * The physical row index of the cell.
   */
  physicalRow: number;
  /**
   * The property of the cell's column.
   */
  prop: AsyncValueProp;
  /**
   * The id of the cell's row, or `null` when the rows have no ids.
   */
  rowId: unknown;
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

/**
 * The object form of the `asyncValues` option.
 */
export interface AsyncValuesSettings {
  /**
   * When settled requests are written: `'microtask'` (default, right after the task they settled in),
   * `'frame'` (once per animation frame), or a number of milliseconds to wait and collect results.
   */
  flush?: 'microtask' | 'frame' | number;
  /**
   * The maximum number of sources running at once (a batch counts as one). Further requests stay pending
   * and wait for a free slot. Default: `6`; `Infinity` lifts the limit.
   */
  concurrency?: number;
  /**
   * What copying a pending cell puts on the clipboard: `'previous'` (default, the value the cell holds)
   * or `'empty'`.
   */
  copyPendingAs?: 'previous' | 'empty';
}
