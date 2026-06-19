import type { SupabaseClient } from '@supabase/supabase-js';
import type { DataProviderQueryParameters } from 'handsontable/plugins/dataProvider';

// The query builder returned by supabase.from('inventory').select(...).
type QueryBuilder = ReturnType<ReturnType<SupabaseClient['from']>['select']>;

// One column's filter state, taken directly from the dataProvider query parameters.
type FilterColumn = NonNullable<DataProviderQueryParameters['filters']>[number];
type FilterCondition = FilterColumn['conditions'][number];

// `between` / `not_between` inputs can arrive in either order; Handsontable sorts
// them before comparing. Both are offered only on numeric columns (here: quantity,
// unit_price), so normalize to a numeric [low, high] range.
function numericRange(args: unknown[]): [number, number] {
  const a = Number(args[0]);
  const b = Number(args[1]);

  return [Math.min(a, b), Math.max(a, b)];
}

// Conjunction: chain each condition onto the builder. PostgREST ANDs chained calls.
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
    case 'between': {
      const [low, high] = numericRange(args);

      return query.gte(column, low).lte(column, high);
    }
    case 'not_between': {
      const [low, high] = numericRange(args);

      return query.or(`${column}.lt.${low},${column}.gt.${high}`);
    }
    case 'empty':
      return query.or(`${column}.is.null,${column}.eq.`);
    case 'not_empty':
      return (query.not(column, 'is', null) as QueryBuilder).neq(column, '');
    default:
      console.warn(`[dataProvider] Unsupported filter condition: "${name}" - skipping`);
      return query;
  }
}

// Disjunction: each condition becomes a PostgREST `.or()` term. Inside `.or()`,
// wildcards use `*` (not `%`) and negation uses the `not.` prefix. Values that
// contain commas or parentheses would need quoting; the inventory data has none.
function conditionToOrTerm(column: string, condition: FilterCondition): string | null {
  const { name, args } = condition;
  const value = args[0];

  switch (name) {
    case 'eq':
      return `${column}.eq.${value}`;
    case 'neq':
      return `${column}.neq.${value}`;
    case 'contains':
      return `${column}.ilike.*${value}*`;
    case 'not_contains':
      return `${column}.not.ilike.*${value}*`;
    case 'begins_with':
      return `${column}.ilike.${value}*`;
    case 'ends_with':
      return `${column}.ilike.*${value}`;
    case 'gt':
      return `${column}.gt.${value}`;
    case 'gte':
      return `${column}.gte.${value}`;
    case 'lt':
      return `${column}.lt.${value}`;
    case 'lte':
      return `${column}.lte.${value}`;
    case 'between': {
      const [low, high] = numericRange(args);

      return `and(${column}.gte.${low},${column}.lte.${high})`;
    }
    case 'not_between': {
      const [low, high] = numericRange(args);

      return `${column}.lt.${low},${column}.gt.${high}`;
    }
    case 'empty':
      return `${column}.is.null,${column}.eq.`;
    case 'not_empty':
      return `and(${column}.not.is.null,${column}.neq.)`;
    default:
      console.warn(`[dataProvider] Unsupported filter condition: "${name}" - skipping`);
      return null;
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
    if (column.operation === 'disjunction') {
      // OR within the column: combine the conditions into a single .or() call.
      const terms = column.conditions
        .map(condition => conditionToOrTerm(column.prop, condition))
        .filter((term): term is string => term !== null);

      if (terms.length > 0) {
        query = query.or(terms.join(','));
      }
    } else {
      // Conjunction (the default): chain the conditions so PostgREST ANDs them.
      for (const condition of column.conditions) {
        query = applyCondition(query, column.prop, condition);
      }
    }
  }

  return query;
}
