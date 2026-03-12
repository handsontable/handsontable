import Core from '../../core';
import { BasePlugin } from '../base';
import { CellValue } from '../../common';

/**
 * Query parameters passed to the dataProvider function and hooks.
 */
export interface DataProviderQueryParameters {
  page: number;
  pageSize: number;
  sort: object | null;
  filters: object | null;
}

/**
 * Result object passed to the `afterDataProviderFetch` hook.
 */
export interface DataProviderFetchResult {
  rows: CellValue[][];
  totalRows: number;
  queryParameters: DataProviderQueryParameters;
}

/**
 * Options passed to the dataProvider function (second argument).
 */
export interface DataProviderOptions {
  signal: AbortSignal;
}

/**
 * DataProvider function type. When set, the table loads data from this async provider instead of a static `data` array.
 * Use with the `pagination` option for server-side paging. When `dataProvider` is set, the `data` option is ignored.
 */
export type DataProviderFunction = (
  queryParameters: DataProviderQueryParameters,
  options: DataProviderOptions
) => Promise<{ rows: CellValue[][]; totalRows: number }>;

export type Settings = DataProviderFunction | undefined;

export const DEFAULT_PAGE_SIZE: number;

export class DataProvider extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  getTotalRows(): number;
  getQueryParameters(): DataProviderQueryParameters;
  fetchData(overrides?: Partial<DataProviderQueryParameters>): Promise<void | null>;
  goToPage(page: number): Promise<void>;
  setPageSize(pageSize: number): Promise<void>;
  setSort(sort: object | null): Promise<void>;
  setFilters(filters: object | null): Promise<void>;
}
