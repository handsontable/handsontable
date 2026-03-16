import Core from '../../core';
import { BasePlugin } from '../base';
import { CellValue } from '../../common';

/**
 * Filter condition operators supported in queryParameters.filters when using server-side filtering.
 */
export type FilterConditionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'not_contains'
  | 'begins_with'
  | 'ends_with';

/**
 * A single filter condition (operator + value/args) for one column.
 */
export interface FilterCondition {
  name: FilterConditionOperator | string;
  args: unknown[];
}

/**
 * Filter stack for one column: column index (visual), logical operation, and conditions.
 */
export interface ColumnFilterStack {
  column: number;
  operation: 'conjunction' | 'disjunction' | 'disjunctionWithExtraCondition';
  conditions: FilterCondition[] | null;
}

/**
 * Filters model passed to the dataProvider: array of column filter stacks, or null when no filters.
 */
export type DataProviderFilters = ColumnFilterStack[] | null;

/**
 * Query parameters passed to the dataProvider function and hooks.
 */
export interface DataProviderQueryParameters {
  page: number;
  pageSize: number;
  sort: object | null;
  filters: DataProviderFilters;
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
  setFilters(filters: DataProviderFilters): Promise<void>;
}
