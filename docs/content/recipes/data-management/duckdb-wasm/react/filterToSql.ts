import type { DataProviderQueryParameters } from 'handsontable/plugins/dataProvider';
import { getColumn, type ColumnDef } from './schema';

type FilterColumn = NonNullable<DataProviderQueryParameters['filters']>[number];
type FilterCondition = FilterColumn['conditions'][number];

interface SqlFragment {
  sql: string;
  params: unknown[];
}

// Filter values arrive from the UI as strings. Numeric columns need numbers.
function toNumber(value: unknown): number | null {
  const number = Number(value);

  return value === '' || value === null || Number.isNaN(number) ? null : number;
}

// One Handsontable condition -> one SQL predicate with bound parameters.
// Text comparisons are case-insensitive, matching Handsontable's own conditions.
function conditionToSql(column: ColumnDef, condition: FilterCondition): SqlFragment | null {
  const { name, args } = condition;
  const e = column.expr;

  if (!name || name === 'none') {
    return null;
  }

  if (name === 'empty') {
    return { sql: column.kind === 'numeric' ? `${e} IS NULL` : `(${e} IS NULL OR ${e} = '')`, params: [] };
  }

  if (name === 'not_empty') {
    return { sql: column.kind === 'numeric' ? `${e} IS NOT NULL` : `(${e} IS NOT NULL AND ${e} <> '')`, params: [] };
  }

  if (column.kind === 'numeric') {
    const values = args.map(toNumber);
    const [a, b] = values;

    if (values.some((value) => value === null)) {
      console.warn(`[dataProvider] Ignoring "${name}": not a number`, args);

      return null;
    }

    switch (name) {
      case 'eq': return { sql: `${e} = ?`, params: [a] };
      case 'neq': return { sql: `(${e} IS NULL OR ${e} <> ?)`, params: [a] };
      case 'gt': return { sql: `${e} > ?`, params: [a] };
      case 'gte': return { sql: `${e} >= ?`, params: [a] };
      case 'lt': return { sql: `${e} < ?`, params: [a] };
      case 'lte': return { sql: `${e} <= ?`, params: [a] };
      // Handsontable accepts the two bounds in either order.
      case 'between':
        return { sql: `${e} BETWEEN ? AND ?`, params: [Math.min(a!, b!), Math.max(a!, b!)] };
      case 'not_between':
        return { sql: `(${e} < ? OR ${e} > ?)`, params: [Math.min(a!, b!), Math.max(a!, b!)] };
    }
  } else {
    const value = String(args[0] ?? '');

    switch (name) {
      case 'eq': return { sql: `lower(${e}) = lower(?)`, params: [value] };
      case 'neq': return { sql: `(${e} IS NULL OR lower(${e}) <> lower(?))`, params: [value] };
      case 'contains': return { sql: `contains(lower(${e}), lower(?))`, params: [value] };
      case 'not_contains': return { sql: `(${e} IS NULL OR NOT contains(lower(${e}), lower(?)))`, params: [value] };
      case 'begins_with': return { sql: `starts_with(lower(${e}), lower(?))`, params: [value] };
      case 'ends_with': return { sql: `ends_with(lower(${e}), lower(?))`, params: [value] };
    }
  }

  console.warn(`[dataProvider] Unsupported filter condition "${name}" on a ${column.kind} column, skipping`);

  return null;
}

function join(fragments: SqlFragment[], operator: 'AND' | 'OR'): SqlFragment | null {
  if (fragments.length === 0) {
    return null;
  }

  return {
    sql: `(${fragments.map((fragment) => fragment.sql).join(` ${operator} `)})`,
    params: fragments.flatMap((fragment) => fragment.params),
  };
}

function columnToSql(filter: FilterColumn): SqlFragment | null {
  const column = getColumn(filter.prop);
  const toFragments = (conditions: FilterCondition[]) => conditions
    .map((condition) => conditionToSql(column, condition))
    .filter((fragment): fragment is SqlFragment => fragment !== null);

  switch (filter.operation) {
    case 'disjunction':
      return join(toFragments(filter.conditions), 'OR');
    case 'disjunctionWithExtraCondition': {
      // (a OR b OR ...) AND last: the shape Handsontable's Filters plugin produces.
      // Split the conditions before mapping them, so a skipped last condition can't
      // promote one of the OR conditions to the AND side.
      const either = join(toFragments(filter.conditions.slice(0, -1)), 'OR');
      const extra = join(toFragments(filter.conditions.slice(-1)), 'AND');

      return join([either, extra].filter((fragment): fragment is SqlFragment => fragment !== null), 'AND');
    }
    default:
      return join(toFragments(filter.conditions), 'AND');
  }
}

// Builds the WHERE clause for every filtered column. Columns are always ANDed together.
export function filtersToWhere(filters: DataProviderQueryParameters['filters']): SqlFragment {
  const clause = join(
    (filters ?? [])
      .map(columnToSql)
      .filter((fragment): fragment is SqlFragment => fragment !== null),
    'AND',
  );

  return clause ? { sql: `WHERE ${clause.sql}`, params: clause.params } : { sql: '', params: [] };
}
