/**
 * Compact prompt for schema=lean. Condition names still come from the grid;
 * this file only formats a schema object the full path already built.
 */

export const LEAN_SYSTEM_PROMPT = [
  'Translate one request into the next Handsontable view. You can filter rows, sort columns, and hide columns. Nothing else.',
  'Grouping, aggregation (sum, count, average, pivot), charts, new columns, and cell edits are not supported.',
  'If the request needs any of that, set not_expressible true and put the reason in reason. Do not approximate grouping or aggregation with a filter or a sort.',
  'Otherwise not_expressible is false, reason is "", explanation is one short sentence, and state is the full next sort, filters, and hiddenColumns.',
  'Copy parts the request does not change. If there is no view line, those parts are empty. Empty sort.columns, filters, or hiddenColumns clears that part.',
  'Column keys are the names in the columns line. Use only condition names listed for that column type. The number after the colon is the arg count.',
  'by_value is allowed only on a column with a values line. args is one array of values to KEEP, copied exactly, same JSON type: [["paid","shipped"]].',
  'A blank or unassigned cell uses the zero-arg empty condition. A filled cell uses not_empty.',
  'Relative dates (today, yesterday, last week, this month, last 7 days, last 30 days) are inclusive YYYY-MM-DD args of the two-arg condition whose name contains "between". Copy the bounds from the calendar line. Do not emit date_today, date_yesterday, or date_tomorrow.',
  'Numeric args are JSON numbers. Date args are YYYY-MM-DD. operation is conjunction (AND) or disjunction (OR). One column once per part.',
].join(' ');

function tokensOf(text) {
  return new Set(String(text).toLowerCase().split(/[^a-z0-9]+/).filter(part => part.length >= 2));
}

/**
 * Cheap keyword match. A single word must appear as its own token, so "id"
 * does not match "paid". A multi-word value matches when every word is present.
 */
export function mentions(prompt, needle) {
  const parts = String(needle ?? '').toLowerCase().split(/[^a-z0-9]+/).filter(part => part.length >= 2);

  if (parts.length === 0) {
    return false;
  }

  const tokens = tokensOf(prompt);

  return parts.every(part => tokens.has(part));
}

function conditionGroups(columns) {
  const groups = [];

  columns.forEach((column) => {
    const ops = (column.conditions || []).filter(condition => condition.name !== 'by_value');
    const key = ops.map(condition => `${condition.name}:${condition.inputsCount}`).join(' ');
    let group = groups.find(item => item.key === key);

    if (!group) {
      group = { key, types: [], props: [] };
      groups.push(group);
    }

    const type = column.inferredType || 'text';

    if (!group.types.includes(type)) {
      group.types.push(type);
    }

    group.props.push(column.prop);
  });

  const used = new Set();

  return groups.map((group, index) => {
    let label = group.types.join('+') || `type${index + 1}`;

    if (used.has(label)) {
      label = `${label}${index + 1}`;
    }

    used.add(label);

    return { label, line: group.key, props: group.props };
  });
}

function valueLines(prompt, columns) {
  const lines = [];

  columns.forEach((column) => {
    const values = Array.isArray(column.values) ? column.values : null;

    if (!values || values.length === 0) {
      return;
    }

    const concrete = values.filter(value => value != null && value !== '');
    const named = mentions(prompt, column.prop);
    const valued = concrete.some(value => mentions(prompt, value));

    if (!named && !valued) {
      return;
    }

    lines.push(`${column.prop}: ${JSON.stringify(concrete)}`);
  });

  return lines;
}

function leanView(state) {
  if (!state) {
    return null;
  }

  const sort = Array.isArray(state.sort?.columns) && state.sort.columns.length > 0;
  const filters = Array.isArray(state.filters) && state.filters.length > 0;
  const hidden = Array.isArray(state.hiddenColumns) && state.hiddenColumns.length > 0;

  if (!sort && !filters && !hidden) {
    return null;
  }

  return {
    sort: state.sort && Array.isArray(state.sort.columns) ? state.sort : { columns: [] },
    filters: Array.isArray(state.filters) ? state.filters : [],
    hiddenColumns: Array.isArray(state.hiddenColumns) ? state.hiddenColumns : [],
  };
}

function calendarLine(calendar) {
  const last7 = calendar.last7DaysInclusive;
  const last30 = calendar.last30DaysInclusive;
  const week = calendar.thisWeekMondayToSunday;
  const month = calendar.thisMonth;
  const year = calendar.thisYear;

  return [
    `yesterday ${calendar.yesterday}`,
    `tomorrow ${calendar.tomorrow}`,
    `last7 ${last7.from}..${last7.to}`,
    `last30 ${last30.from}..${last30.to}`,
    `week ${week.from}..${week.to}`,
    `month ${month.from}..${month.to}`,
    `year ${year.from}..${year.to}`,
  ].join('; ');
}

/**
 * User message for one lean call. Values are included only when the prompt
 * mentions that column or one of its values.
 */
export function leanUserMessage(gridSchema, prompt) {
  const groups = conditionGroups(gridSchema.columns || []);
  const labelByProp = new Map();

  groups.forEach(group => group.props.forEach(prop => labelByProp.set(prop, group.label)));

  const columns = (gridSchema.columns || [])
    .map(column => `${column.prop}:${labelByProp.get(column.prop) || column.inferredType || 'text'}`)
    .join(' ');
  const conditions = groups.map(group => `${group.label}: ${group.line}`).join('\n');
  const values = valueLines(prompt, gridSchema.columns || []);
  const view = leanView(gridSchema.currentViewState);
  const lines = [
    `request: ${prompt}`,
    `today: ${gridSchema.today}`,
    `calendar: ${calendarLine(gridSchema.calendar)}`,
    `columns: ${columns}`,
    `conditions:\n${conditions}`,
  ];

  if (values.length > 0) {
    lines.push(`values:\n${values.join('\n')}`);
  }

  if (view) {
    lines.push(`view: ${JSON.stringify(view)}`);
  }

  return lines.join('\n');
}
