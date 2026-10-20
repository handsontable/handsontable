/**
 * Tool handlers. They edit a pending view copied from getViewState().
 * Nothing is written to the grid here.
 */

import { resolveRelativeRange } from './dates.js';

const DISTINCT_CAP = 200;
const RANGE_CONDITIONS = ['between', 'intl_date_between', 'intl_datetime_between'];

/**
 * @param {Handsontable} hot
 * @param {string} today
 * @returns {object}
 */
export function createSession(hot, today) {
  return {
    hot,
    today,
    pending: capture(hot),
    touched: { filters: false, sort: false, hiddenColumns: false },
  };
}

/**
 * @param {object} session
 * @returns {object}
 */
export function pendingState(session) {
  const state = { version: 1 };

  if (session.touched.filters) {
    state.filters = session.pending.filters;
  }

  if (session.touched.sort) {
    state.sort = session.pending.sort;
  }

  if (session.touched.hiddenColumns) {
    state.hiddenColumns = session.pending.hiddenColumns;
  }

  return state;
}

/**
 * @param {object} session
 * @returns {object}
 */
export function validatePending(session) {
  const state = pendingState(session);
  const parts = Object.keys(state).filter(key => key !== 'version');

  if (!parts.length) {
    return { valid: true, skipped: [], state };
  }

  const result = session.hot.getPlugin('viewState').validateViewState(state);

  return { ...result, state };
}

/**
 * @param {object} session
 * @param {string} name
 * @param {object} args
 * @returns {object}
 */
export function runTool(session, name, args) {
  try {
    return dispatch(session, name, args || {});
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * @param {object} session
 * @param {string} name
 * @param {object} args
 * @returns {object}
 */
function dispatch(session, name, args) {
  switch (name) {
    case 'get_columns':
      return getColumns(session);
    case 'get_distinct_values':
      return getDistinctValues(session, args.column);
    case 'set_filter':
      return setFilter(session, args);
    case 'clear_filter':
      return clearFilter(session, args.column);
    case 'set_sort':
      return setSort(session, args.columns);
    case 'hide_columns':
      return hideColumns(session, args.columns, true);
    case 'show_columns':
      return hideColumns(session, args.columns, false);
    case 'reset_view':
      return resetView(session);
    default:
      return { ok: false, error: `Unknown tool ${name}` };
  }
}

/**
 * @param {Handsontable} hot
 * @returns {object}
 */
function capture(hot) {
  const state = hot.getPlugin('viewState').getViewState();

  return {
    filters: (state.filters || []).map(entry => ({
      column: asProp(hot, entry.column),
      operation: entry.operation,
      conditions: (entry.conditions || []).map(condition => ({
        name: condition.name,
        args: condition.args,
      })),
    })),
    sort: {
      columns: (state.sort?.columns || []).map(column => ({
        column: asProp(hot, column.column),
        sortOrder: column.sortOrder,
      })),
    },
    hiddenColumns: (state.hiddenColumns || []).map(column => asProp(hot, column)),
  };
}

/**
 * @param {Handsontable} hot
 * @param {number|string} column
 * @returns {number|string}
 */
function asProp(hot, column) {
  if (typeof column === 'string') {
    return column;
  }

  const visual = hot.toVisualColumn(column);

  if (typeof visual !== 'number' || visual < 0) {
    return column;
  }

  const prop = hot.colToProp(visual);

  return typeof prop === 'string' ? prop : column;
}

/**
 * @param {Handsontable} hot
 * @param {string} column
 * @returns {number|null}
 */
function visualOf(hot, column) {
  if (typeof column !== 'string' || column === '') {
    return null;
  }

  const visual = hot.propToCol(column);

  return typeof visual === 'number' ? visual : null;
}

/**
 * @param {object} session
 * @returns {object}
 */
function getColumns(session) {
  const { hot } = session;
  const rows = hot.getSourceData();
  let inferred = [];

  try {
    inferred = hot.getPlugin('importFile').inferColumnTypes(rows, {
      headerRow: false,
      stats: true,
      sampling: 'spread',
    }).columns || [];
  } catch (error) {
    inferred = [];
  }

  const byProp = new Map();

  inferred.forEach((column) => {
    const prop = column.settings?.data ?? column.title;

    if (prop != null) {
      byProp.set(String(prop), column);
    }
  });

  const filters = hot.getPlugin('filters');
  const columns = [];

  for (let visual = 0; visual < hot.countCols(); visual += 1) {
    const prop = hot.colToProp(visual);
    const found = byProp.get(String(prop));
    const values = valuesOf(hot, prop);
    const distinct = new Set(values.map(value => value === undefined ? null : value));

    columns.push({
      column: prop,
      inferredType: found?.settings?.type || hot.getCellMeta(0, visual).type || 'text',
      confidence: found?.confidence ?? null,
      distinctCount: distinct.size,
      nullCount: values.filter(value => value == null || value === '').length,
      min: found?.stats?.min,
      max: found?.stats?.max,
      conditions: filters.getAvailableConditions(visual),
    });
  }

  return {
    ok: true,
    today: session.today,
    byValue: {
      name: 'by_value',
      note: 'Not returned by getAvailableConditions. args is a flat list of values to keep, copied from get_distinct_values. validateViewState does not check those values.',
    },
    columns,
  };
}

/**
 * @param {object} session
 * @param {string} column
 * @returns {object}
 */
function getDistinctValues(session, column) {
  const visual = visualOf(session.hot, column);

  if (visual == null) {
    return { ok: false, error: `Unknown column "${column}".` };
  }

  const counts = new Map();

  valuesOf(session.hot, column).forEach((value) => {
    const key = value === undefined ? null : value;
    const token = JSON.stringify(key);
    const current = counts.get(token);

    if (current) {
      current.count += 1;
    } else {
      counts.set(token, { value: key, count: 1 });
    }
  });

  const all = Array.from(counts.values()).sort((left, right) => compareValues(left.value, right.value));
  const shown = all.length > DISTINCT_CAP ? all.slice(0, DISTINCT_CAP) : all;

  return {
    ok: true,
    column,
    distinctCount: all.length,
    truncated: all.length > DISTINCT_CAP,
    values: shown.map(entry => ({ value: entry.value, count: entry.count })),
  };
}

/**
 * @param {unknown} left
 * @param {unknown} right
 * @returns {number}
 */
function compareValues(left, right) {
  if (left == null && right == null) {
    return 0;
  }

  if (left == null) {
    return -1;
  }

  if (right == null) {
    return 1;
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return String(left).localeCompare(String(right));
}

/**
 * @param {Handsontable} hot
 * @param {string|number} prop
 * @returns {unknown[]}
 */
function valuesOf(hot, prop) {
  const rows = hot.getSourceData();
  const values = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];

    if (row && typeof row === 'object' && !Array.isArray(row)) {
      values.push(row[prop]);
    } else {
      values.push(hot.getSourceDataAtCell(index, prop));
    }
  }

  return values;
}

/**
 * @param {object} session
 * @param {object} args
 * @returns {object}
 */
function setFilter(session, args) {
  const column = args.column;

  if (visualOf(session.hot, column) == null) {
    return { ok: false, error: `Unknown column "${column}".` };
  }

  const operator = args.operator || 'conjunction';

  if (operator !== 'conjunction' && operator !== 'disjunction') {
    return { ok: false, error: 'operator must be conjunction or disjunction.' };
  }

  if (!Array.isArray(args.conditions) || args.conditions.length === 0) {
    return { ok: false, error: 'conditions must be a non-empty array.' };
  }

  const conditions = args.conditions.map(condition => normalizeCondition(session, column, condition));
  const next = session.pending.filters.filter(entry => entry.column !== column);

  next.push({ column, operation: operator, conditions });

  return commit(session, 'filters', next);
}

/**
 * @param {object} session
 * @param {string} column
 * @param {object} condition
 * @returns {{ name: string, args: unknown[] }}
 */
function normalizeCondition(session, column, condition) {
  const name = condition && typeof condition.name === 'string' ? condition.name : '';
  const args = Array.isArray(condition?.args) ? condition.args.slice() : [];

  if (name !== 'by_value' && args.length === 1 && (typeof args[0] === 'string' || typeof args[0] === 'number')) {
    const range = resolveRelativeRange(String(args[0]), session.today);

    if (range) {
      return { name: rangeConditionName(session.hot, column), args: range };
    }
  }

  if (name === 'by_value') {
    const wrapped = args.length === 1 && Array.isArray(args[0]) ? args : [args];

    return { name, args: wrapped };
  }

  if ((name === 'between' || name === 'not_between') && args.length === 2) {
    const next = args.map((arg) => {
      if (typeof arg !== 'string') {
        return arg;
      }

      const range = resolveRelativeRange(arg, session.today);

      return range && range[0] === range[1] ? range[0] : arg;
    });

    return { name, args: next };
  }

  return { name, args };
}

/**
 * Prefer a between-style condition the column actually offers.
 *
 * @param {Handsontable} hot
 * @param {string} column
 * @returns {string}
 */
function rangeConditionName(hot, column) {
  const visual = visualOf(hot, column);
  const offered = new Set(
    visual == null ? [] : hot.getPlugin('filters').getAvailableConditions(visual).map(item => item.name),
  );

  const match = RANGE_CONDITIONS.find(name => offered.has(name));

  return match || 'between';
}

/**
 * @param {object} session
 * @param {string} column
 * @returns {object}
 */
function clearFilter(session, column) {
  if (visualOf(session.hot, column) == null) {
    return { ok: false, error: `Unknown column "${column}".` };
  }

  return commit(session, 'filters', session.pending.filters.filter(entry => entry.column !== column));
}

/**
 * @param {object} session
 * @param {object[]} columns
 * @returns {object}
 */
function setSort(session, columns) {
  if (!Array.isArray(columns)) {
    return { ok: false, error: 'columns must be an array (empty clears the sort).' };
  }

  const next = [];

  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index] || {};
    const name = column.column;

    if (visualOf(session.hot, name) == null) {
      return { ok: false, error: `Unknown sort column "${name}".` };
    }

    if (column.sortOrder !== 'asc' && column.sortOrder !== 'desc') {
      return { ok: false, error: 'sortOrder must be asc or desc.' };
    }

    next.push({ column: name, sortOrder: column.sortOrder });
  }

  return commit(session, 'sort', { columns: next });
}

/**
 * @param {object} session
 * @param {string[]} columns
 * @param {boolean} hide
 * @returns {object}
 */
function hideColumns(session, columns, hide) {
  if (!Array.isArray(columns) || columns.length === 0) {
    return { ok: false, error: 'columns must be a non-empty array of property names.' };
  }

  const unknown = columns.filter(column => visualOf(session.hot, column) == null);

  if (unknown.length) {
    return { ok: false, error: `Unknown column: ${unknown.join(', ')}.` };
  }

  const next = session.pending.hiddenColumns.slice();

  columns.forEach((column) => {
    const index = next.indexOf(column);

    if (hide && index === -1) {
      next.push(column);
    }

    if (!hide && index !== -1) {
      next.splice(index, 1);
    }
  });

  return commit(session, 'hiddenColumns', next);
}

/**
 * @param {object} session
 * @returns {object}
 */
function resetView(session) {
  session.pending.filters = [];
  session.pending.sort = { columns: [] };
  session.pending.hiddenColumns = [];
  session.touched.filters = true;
  session.touched.sort = true;
  session.touched.hiddenColumns = true;

  const check = validatePending(session);

  if (!check.valid) {
    return issuesOf(check);
  }

  return { ok: true, pending: viewOf(session) };
}

/**
 * @param {object} session
 * @param {string} part
 * @param {unknown} value
 * @returns {object}
 */
function commit(session, part, value) {
  const previous = structuredClone(session.pending[part]);
  const wasTouched = session.touched[part];

  session.pending[part] = value;
  session.touched[part] = true;

  const check = validatePending(session);

  if (!check.valid) {
    session.pending[part] = previous;
    session.touched[part] = wasTouched;

    return issuesOf(check);
  }

  return { ok: true, pending: viewOf(session) };
}

/**
 * @param {object} check
 * @returns {object}
 */
function issuesOf(check) {
  return {
    ok: false,
    error: check.error?.message || 'View state was rejected.',
    issues: (check.skipped || []).map(issue => ({
      part: issue.part,
      path: issue.path,
      reason: issue.reason,
      message: issue.message,
    })),
  };
}

/**
 * @param {object} session
 * @returns {object}
 */
function viewOf(session) {
  return {
    filters: session.pending.filters,
    sort: session.pending.sort,
    hiddenColumns: session.pending.hiddenColumns,
  };
}
