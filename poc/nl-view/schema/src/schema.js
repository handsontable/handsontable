import { inferColumnTypes } from '@hot/utils/columnTypeInference/index.ts';
import { addDays, calendarFor } from './dates.js';

const VALUE_CARDINALITY = 20;
const BY_VALUE = 'by_value';

/**
 * Column settings the grid should wear so Filters#getAvailableConditions
 * lists date and numeric operators. Dropdown is left as text: a strict
 * dropdown source rejects values the sample never saw.
 */
export function inferGridColumns(rows, props) {
  if (rows.length === 0) {
    return props.map(prop => ({ data: prop, type: 'text', inferredType: 'text' }));
  }

  const inferred = inferColumnTypes(rows, {
    dropdown: false,
    sampleSize: Math.max(rows.length, 1),
    sampling: 'spread',
    headerRow: false,
  });

  return props.map((prop, index) => {
    const match = inferred.columns.find(column => column.settings.data === prop) ?? inferred.columns[index];
    const settings = match?.settings ?? { type: 'text' };
    const column = {
      data: prop,
      type: settings.type || 'text',
      inferredType: settings.type || 'text',
    };

    if (settings.numericFormat) {
      column.numericFormat = settings.numericFormat;
    }
    if (settings.dateFormat) {
      column.dateFormat = settings.dateFormat;
    }
    if (settings.dateTimeFormat) {
      column.dateTimeFormat = settings.dateTimeFormat;
    }
    if (settings.timeFormat) {
      column.timeFormat = settings.timeFormat;
    }

    return column;
  });
}

function propForPhysical(hot, physical) {
  if (typeof physical === 'string') {
    return physical;
  }

  const visual = hot.toVisualColumn(physical);

  if (visual === null || visual < 0) {
    return physical;
  }

  return hot.colToProp(visual);
}

/**
 * getViewState() speaks physical indexes. The model speaks property names.
 */
export function viewStateForPrompt(hot) {
  const state = hot.getPlugin('viewState').getViewState();
  const copy = JSON.parse(JSON.stringify(state));

  if (copy.sort?.columns) {
    copy.sort.columns = copy.sort.columns.map(entry => ({
      ...entry,
      column: propForPhysical(hot, entry.column),
    }));
  }

  if (Array.isArray(copy.filters)) {
    copy.filters = copy.filters.map(entry => ({
      ...entry,
      column: propForPhysical(hot, entry.column),
    }));
  }

  if (Array.isArray(copy.hiddenColumns)) {
    copy.hiddenColumns = copy.hiddenColumns.map(column => propForPhysical(hot, column));
  }

  return copy;
}

function cellValues(hot, prop) {
  const rows = hot.getSourceData();
  const values = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    values.push(row == null ? null : row[prop]);
  }

  return values;
}

function valueKey(value) {
  return JSON.stringify(value);
}

function sortValues(values) {
  return values.slice().sort((left, right) => {
    if (left === right) {
      return 0;
    }
    if (left === null || left === undefined) {
      return 1;
    }
    if (right === null || right === undefined) {
      return -1;
    }
    if (typeof left === 'number' && typeof right === 'number') {
      return left - right;
    }

    const a = String(left);
    const b = String(right);

    if (a < b) {
      return -1;
    }

    return a > b ? 1 : 0;
  });
}

/**
 * Distinct source values for every column. Low-cardinality text columns are
 * opted into the prompt; the full set is what by_value is checked against.
 */
export function indexColumnValues(hot, columns) {
  const index = new Map();

  columns.forEach((column) => {
    const seen = new Map();

    cellValues(hot, column.data).forEach((value) => {
      const normalized = value === undefined ? null : value;
      seen.set(valueKey(normalized), normalized);
    });

    index.set(column.data, {
      type: column.inferredType || column.type || 'text',
      values: sortValues([...seen.values()]),
    });
  });

  return index;
}

function sampledValues(entry) {
  const textual = entry.type === 'text' || entry.type === 'dropdown';

  if (!textual || entry.values.length === 0 || entry.values.length > VALUE_CARDINALITY) {
    return null;
  }

  return entry.values;
}

function rangeOf(values) {
  const concrete = values.filter(value => value !== null && value !== '');

  if (concrete.length === 0) {
    return null;
  }

  if (typeof concrete[0] === 'number') {
    return { min: Math.min(...concrete), max: Math.max(...concrete) };
  }

  if (typeof concrete[0] === 'string' && /^\d{4}-\d{2}-\d{2}/.test(concrete[0])) {
    const sorted = concrete.slice().sort();

    return { min: sorted[0], max: sorted[sorted.length - 1] };
  }

  return null;
}

/**
 * Live schema: props, inferred types, conditions from the grid, current view,
 * today's calendar, and opt-in value samples.
 */
export function buildGridSchema(hot, columns, { today, sampleValues }) {
  const filters = hot.getPlugin('filters');
  const valueIndex = indexColumnValues(hot, columns);

  const described = columns.map((column, visual) => {
    const conditions = filters.getAvailableConditions(visual).map(({ name, inputsCount }) => ({
      name,
      inputsCount,
    }));
    const entry = valueIndex.get(column.data);
    const values = sampleValues ? sampledValues(entry) : null;

    if (values) {
      conditions.push({
        name: BY_VALUE,
        inputsCount: 1,
      });
    }

    const describedColumn = {
      prop: column.data,
      inferredType: column.inferredType || column.type || 'text',
      conditions,
    };
    const range = rangeOf(entry.values);

    if (range) {
      describedColumn.range = range;
    }
    if (values) {
      describedColumn.values = values;
    }

    return describedColumn;
  });

  return {
    today,
    calendar: calendarFor(today),
    rowCount: hot.getSourceData().length,
    columns: described,
    currentViewState: viewStateForPrompt(hot),
    valueIndex,
  };
}

function relativeSpan(name, today) {
  const lower = String(name).toLowerCase();
  const keys = [
    ['today', 0, 0],
    ['yesterday', -1, -1],
    ['tomorrow', 1, 1],
  ];

  for (let index = 0; index < keys.length; index += 1) {
    const [key, fromOffset, toOffset] = keys[index];

    if (lower === key || lower.endsWith(`_${key}`)) {
      return [addDays(today, fromOffset), addDays(today, toOffset)];
    }
  }

  return null;
}

/**
 * Zero-argument today/yesterday/tomorrow conditions follow the computer clock.
 * The eval date is `today`, so those become the column's 2-arg range condition.
 */
export function resolveRelativeDates(state, gridSchema) {
  let rewritten = 0;

  if (!state || !Array.isArray(state.filters)) {
    return { state, rewritten };
  }

  const filters = state.filters.map((entry) => {
    const column = gridSchema.columns.find(item => item.prop === entry.column);
    const range = column?.conditions.find(condition => (
      condition.inputsCount === 2 && String(condition.name).includes('between')
    ));

    if (!range || !Array.isArray(entry.conditions)) {
      return entry;
    }

    const conditions = entry.conditions.map((condition) => {
      const span = relativeSpan(condition.name, gridSchema.today);
      const args = condition.args ?? [];

      if (!span || args.length > 0) {
        return condition;
      }

      rewritten += 1;

      return { name: range.name, args: span };
    });

    return { ...entry, conditions };
  });

  return { state: { ...state, filters }, rewritten };
}

export function checkByValue(state, valueIndex, gridSchema) {
  const issues = [];
  const filters = state?.filters ?? [];

  filters.forEach((entry, filterIndex) => {
    const column = gridSchema.columns.find(item => item.prop === entry.column);
    const offered = new Set((column?.conditions ?? []).map(condition => condition.name));

    (entry.conditions ?? []).forEach((condition, conditionIndex) => {
      if (condition.name !== BY_VALUE) {
        return;
      }

      const path = `filters[${filterIndex}].conditions[${conditionIndex}]`;

      if (!offered.has(BY_VALUE)) {
        issues.push({
          path,
          message: `${entry.column} has no values list, so by_value is not allowed. Use a condition from its list.`,
        });

        return;
      }

      const known = valueIndex.get(entry.column);
      const inner = Array.isArray(condition.args) ? condition.args[0] : undefined;

      if (!Array.isArray(inner) || (condition.args.length !== 1)) {
        issues.push({
          path: `${path}.args`,
          message: 'by_value args must be one array of values to KEEP, for example [["paid","shipped"]].',
        });

        return;
      }

      inner.forEach((value, valueIndexInArgs) => {
        if (!known || !known.values.some(candidate => valueKey(candidate) === valueKey(value))) {
          issues.push({
            path: `${path}.args[0][${valueIndexInArgs}]`,
            message: `${JSON.stringify(value)} is not a value of ${entry.column}. Copy one from its values list, with the same JSON type.`,
          });
        }
      });
    });
  });

  return issues;
}

export function responseFormat(props) {
  const columnEnum = props.length > 0 ? props : ['column'];

  return {
    type: 'json_schema',
    json_schema: {
      name: 'nl_view',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['not_expressible', 'explanation', 'reason', 'state'],
        properties: {
          not_expressible: { type: 'boolean' },
          explanation: { type: 'string' },
          reason: { type: 'string' },
          state: {
            type: 'object',
            additionalProperties: false,
            required: ['version', 'sort', 'filters', 'hiddenColumns'],
            properties: {
              version: { type: 'integer', enum: [1] },
              sort: {
                type: 'object',
                additionalProperties: false,
                required: ['columns'],
                properties: {
                  columns: {
                    type: 'array',
                    items: {
                      type: 'object',
                      additionalProperties: false,
                      required: ['column', 'sortOrder'],
                      properties: {
                        column: { type: 'string', enum: columnEnum },
                        sortOrder: { type: 'string', enum: ['asc', 'desc'] },
                      },
                    },
                  },
                },
              },
              filters: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['column', 'operation', 'conditions'],
                  properties: {
                    column: { type: 'string', enum: columnEnum },
                    operation: {
                      type: 'string',
                      enum: ['conjunction', 'disjunction', 'disjunctionWithExtraCondition'],
                    },
                    conditions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['name', 'args'],
                        properties: {
                          name: { type: 'string' },
                          args: {
                            type: 'array',
                            items: {
                              anyOf: [
                                { type: 'string' },
                                { type: 'number' },
                                { type: 'null' },
                                {
                                  type: 'array',
                                  items: {
                                    anyOf: [
                                      { type: 'string' },
                                      { type: 'number' },
                                      { type: 'null' },
                                    ],
                                  },
                                },
                              ],
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              hiddenColumns: {
                type: 'array',
                items: { type: 'string', enum: columnEnum },
              },
            },
          },
        },
      },
    },
  };
}

export const SYSTEM_PROMPT = [
  'You translate one plain-language request into the next Handsontable view state.',
  'You can filter rows, sort columns, and hide columns. Nothing else.',
  'Grouping, aggregation (sum, count, average, pivot), charts, new columns, and cell edits are not supported.',
  'If the request needs any of that, or anything this grid cannot do, set not_expressible to true and put the reason in reason.',
  'Otherwise not_expressible is false, reason is "", explanation is one short sentence, and state is the FULL next view for sort, filters, and hiddenColumns.',
  'Copy every part the request does not change from currentViewState. Empty sort.columns, filters, and hiddenColumns clear that part.',
  'Column keys are the property names in the schema, never indexes.',
  'Use only condition names listed for that column. args length must equal inputsCount.',
  'Exception: by_value has inputsCount 1 and args is a single array of values to KEEP, for example [["paid","shipped"]].',
  'Every by_value entry must be copied from that column\'s values list with the same JSON type. Do not invent values.',
  'A blank cell is null. Prefer a zero-argument condition from that column when the request is about empty or filled cells.',
  'Relative dates (today, yesterday, last week, this month, last 7 days) must be absolute YYYY-MM-DD arguments of that column\'s two-argument range condition (the one whose name contains "between").',
  'Read the bounds from calendar. Do not emit a zero-argument today, yesterday, or tomorrow condition. Those follow the computer clock, not the today in this request.',
  'Date and number arguments are inclusive. One column appears at most once in filters, once in sort, and once in hiddenColumns.',
  'Numeric args are JSON numbers. Date args are YYYY-MM-DD strings.',
  'operation is conjunction (AND) or disjunction (OR). Use by_value when several listed values of one column should match.',
].join(' ');
