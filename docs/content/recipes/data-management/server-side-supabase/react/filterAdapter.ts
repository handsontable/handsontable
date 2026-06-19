import type { SupabaseClient } from '@supabase/supabase-js';
import type { DataProviderQueryParameters } from 'handsontable/plugins/dataProvider';

// The query builder returned by supabase.from('inventory').select(...).
type QueryBuilder = ReturnType<ReturnType<SupabaseClient['from']>['select']>;

// One column's filter state, taken directly from the dataProvider query parameters.
type FilterColumn = NonNullable<DataProviderQueryParameters['filters']>[number];
type FilterCondition = FilterColumn['conditions'][number];

function applyCondition(query: QueryBuilder, column: string, condition: FilterCondition): QueryBuilder {
  const { name, args } = condition;
  const value = args[0];

  switch (name) {
    case 'eq':
      return query.eq(column, value as string);
    case 'neq':
      return query.neq(column, value as string);
    case 'contains':
      return query.ilike(column, `%${value}%`);
    case 'not_contains':
      return query.not(column, 'ilike', `%${value}%`);
    case 'begins_with':
      return query.ilike(column, `${value}%`);
    case 'ends_with':
      return query.ilike(column, `%${value}`);
    case 'gt':
      return query.gt(column, value as number);
    case 'gte':
      return query.gte(column, value as number);
    case 'lt':
      return query.lt(column, value as number);
    case 'lte':
      return query.lte(column, value as number);
    case 'empty':
      return query.or(`${column}.is.null,${column}.eq.`);
    case 'not_empty':
      return (query.not(column, 'is', null) as QueryBuilder).neq(column, '');
    default:
      console.warn(`[dataProvider] Unsupported filter condition: "${name}" - skipping`);
      return query;
  }
}

export function applyFilters(
  query: QueryBuilder,
  filters: DataProviderQueryParameters['filters'],
): QueryBuilder {
  if (!filters || filters.length === 0) {
    return query;
  }

  for (const column of filters) {
    for (const condition of column.conditions) {
      query = applyCondition(query, column.prop, condition);
    }
  }

  return query;
}
