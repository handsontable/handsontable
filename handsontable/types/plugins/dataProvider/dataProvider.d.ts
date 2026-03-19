import Core from '../../core';
import { CellValue, RowObject, SourceRowData } from '../../common';
import { BasePlugin } from '../base';

/**
 * Sort descriptor sent to the server (column data key and order).
 */
export interface DataProviderSortDescriptor {
  prop: string;
  order: 'asc' | 'desc';
}

/**
 * Query parameters passed to `fetchRows` and DataProvider hooks.
 */
export interface DataProviderQueryParameters {
  page: number;
  pageSize: number;
  /**
   * Primary sort descriptor, or `null`.
   */
  sort: DataProviderSortDescriptor | null;
  /**
   * Opaque filter state (or `null`). Your `fetchRows` interprets it. Set via [[DataProvider#fetchData]] with `{ filters }`.
   */
  filters: object | null;
}

/**
 * Result object passed to the `afterDataProviderFetch` hook.
 */
export interface DataProviderFetchResult {
  rows: SourceRowData[];
  totalRows: number;
  queryParameters: DataProviderQueryParameters;
}

/**
 * Options passed to fetchRows (second argument).
 */
export interface DataProviderFetchOptions {
  signal: AbortSignal;
}

/** @deprecated Use DataProviderFetchOptions. */
export type DataProviderOptions = DataProviderFetchOptions;

/**
 * Payload for onRowsCreate. Tells the server where and how many rows to create.
 */
export interface RowsCreatePayload {
  position: 'above' | 'below';
  /** Row id of the anchor row (from `rowId`), when inserting relative to a row. */
  referenceRowId?: unknown;
  rowsAmount: number;
}

/**
 * Single row update payload for onRowsUpdate. `rowData` is optional when you pass payloads into [[DataProvider#updateRows]]; Handsontable fills it from the grid before calling `onRowsUpdate`.
 */
export interface RowUpdatePayload {
  id: unknown;
  changes: Record<string, CellValue>;
  rowData?: SourceRowData;
}

/**
 * DataProvider config object. Use this shape for the `dataProvider` option.
 */
export interface DataProviderConfig {
  /**
   * Property path or function to get the unique row id from row data.
   */
  rowId: string | ((rowData: RowObject) => unknown);
  /**
   * Fetches rows for the current page. Receives query parameters and AbortSignal.
   */
  fetchRows: (
    queryParameters: DataProviderQueryParameters,
    options: DataProviderFetchOptions
  ) => Promise<{ rows: SourceRowData[]; totalRows: number }>;
  /**
   * Called when rows are created (e.g. context menu "Insert row above/below").
   * Use `rowsAmount` on the payload to create multiple rows in one request.
   */
  onRowsCreate: (payload: RowsCreatePayload) => Promise<void>;
  /**
   * Called with an array of row updates (each with id, changes, rowData).
   * One batch per user action; multiple rows when e.g. Delete clears several cells or paste spans rows.
   */
  onRowsUpdate: (rows: RowUpdatePayload[]) => Promise<void>;
  /**
   * Called with an array of row ids to remove.
   */
  onRowsRemove: (rowIds: unknown[]) => Promise<void>;
}

/**
 * `dataProvider` option: full config object (all keys required for the plugin to enable).
 *
 * When active, `trimRows`, `manualRowMove`, `manualColumnMove`, and `multiColumnSorting` are disabled. Use `columnSorting` for server-side sort.
 */
export type Settings = DataProviderConfig | undefined;

export const DEFAULT_PAGE_SIZE: number;

/**
 * Payload for `beforeRowsMutation` / `afterRowsMutation` / `afterRowsMutationError` when `operation` is `'create'`.
 */
export interface RowMutationCreatePayload {
  rowsCreate: RowsCreatePayload;
}

/**
 * Payload for `beforeRowsMutation` / `afterRowsMutation` / `afterRowsMutationError` when `operation` is `'update'`.
 */
export interface RowMutationUpdatePayload {
  rows: RowUpdatePayload[];
}

/**
 * Payload for `beforeRowsMutation` / `afterRowsMutation` / `afterRowsMutationError` when `operation` is `'remove'`.
 */
export interface RowMutationRemovePayload {
  rowsRemove: unknown[];
}

/**
 * Discriminate by `operation`: `'create'` has `{ rowsCreate }` (single spec); `'update'` has `{ rows }`; `'remove'` has `{ rowsRemove }`.
 */
export type RowMutationPayload =
  | RowMutationCreatePayload
  | RowMutationUpdatePayload
  | RowMutationRemovePayload;

export class DataProvider extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  getTotalRows(): number;
  getQueryParameters(): DataProviderQueryParameters;
  getRowId(visualRow: number): unknown;
  fetchData(overrides?: Partial<DataProviderQueryParameters>): Promise<{ rows: SourceRowData[]; totalRows: number } | null>;
  /**
   * Create rows on the server via `onRowsCreate`. Set `rowsAmount` to insert more than one row.
   */
  createRows(options?: {
    position?: 'above' | 'below';
    referenceRowId?: unknown;
    rowsAmount?: number;
  }): Promise<void>;
  /**
   * Update rows on the server via `onRowsUpdate`. Pass the same array shape as `onRowsUpdate` (one or more rows).
   */
  updateRows(rows: RowUpdatePayload[]): Promise<void>;
  /**
   * Remove rows on the server via `onRowsRemove`. Pass a single id or an array of ids.
   */
  removeRows(rowIds: unknown | unknown[]): Promise<void>;
}
