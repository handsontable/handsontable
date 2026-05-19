/**
 * Evaluates Handsontable DataProvider filter payloads (same shape as fetchRows `queryParameters.filters`).
 */

function stringifyLoose(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

/**
 * @param {Record<string, unknown>} row
 * @param {string} prop
 * @param {{ name?: string, args?: unknown[] }} condition
 * @returns {boolean}
 */
function matchesCondition(row, prop, condition) {
  const raw = row[prop];
  const name = condition.name;
  const args = Array.isArray(condition.args) ? condition.args : [];

  const str = () => stringifyLoose(raw).toLowerCase();
  const arg0 = () => stringifyLoose(args[0]).toLowerCase();

  switch (name) {
    case 'eq':
      return str() === arg0();
    case 'neq':
      return str() !== arg0();
    case 'contains':
      return str().includes(arg0());
    case 'not_contains':
      return !str().includes(arg0());
    case 'begins_with':
      return str().startsWith(arg0());
    case 'ends_with':
      return str().endsWith(arg0());
    case 'empty':
      return raw === '' || raw === null || raw === undefined;
    case 'not_empty':
      return !(raw === '' || raw === null || raw === undefined);
    case 'gt':
      return Number(raw) > Number(args[0]);
    case 'gte':
      return Number(raw) >= Number(args[0]);
    case 'lt':
      return Number(raw) < Number(args[0]);
    case 'lte':
      return Number(raw) <= Number(args[0]);
    case 'between': {
      const lo = Math.min(Number(args[0]), Number(args[1]));
      const hi = Math.max(Number(args[0]), Number(args[1]));
      const n = Number(raw);

      return n >= lo && n <= hi;
    }
    case 'not_between': {
      const lo = Math.min(Number(args[0]), Number(args[1]));
      const hi = Math.max(Number(args[0]), Number(args[1]));
      const n = Number(raw);

      return n < lo || n > hi;
    }
    default:
      return true;
  }
}

/**
 * @param {Record<string, unknown>} row
 * @param {{ prop: string, operation: string, conditions: Array<{ name?: string, args?: unknown[] }> }} colFilter
 * @returns {boolean}
 */
function matchesColumnFilter(row, colFilter) {
  const conditions = colFilter.conditions || [];

  if (conditions.length === 0) {
    return true;
  }

  const results = conditions.map((c) => matchesCondition(row, colFilter.prop, c));
  const op = colFilter.operation;

  if (op === 'disjunctionWithExtraCondition' && conditions.length >= 3) {
    return results.slice(0, -1).some(Boolean) && results[results.length - 1];
  }

  if (op === 'disjunction') {
    return results.some(Boolean);
  }

  return results.every(Boolean);
}

/**
 * @param {Array<Record<string, unknown>>} rows
 * @param {unknown} filters
 * @returns {Array<Record<string, unknown>>}
 */
export function applyServerFilters(rows, filters) {
  if (!Array.isArray(filters) || filters.length === 0) {
    return rows;
  }

  return rows.filter((row) => filters.every((f) => matchesColumnFilter(row, f)));
}
