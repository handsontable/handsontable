/**
 * Turns the browser's grid schema into a guided-JSON request.
 * Condition names come from the posted schema (getAvailableConditions).
 * by_value is added here because Filters#getAvailableConditions omits it.
 */

const SYSTEM = [
  'You convert one plain-language request into a Handsontable view state: filters, sort, and hidden columns.',
  'Return JSON only, matching the schema.',
  'not_expressible is true for grouping, pivoting, bucketing, charts, formulas, and any sum, count, or average.',
  'Grouping is never a filter. Comparing an existing column (including one named total) is a filter.',
  'When not_expressible is true, explain why in reason and leave state as empty filters, an empty sort, and no hidden columns.',
  'When the request fits, not_expressible is false and reason is "".',
  'state.version is 1.',
  'filters, sort, and hiddenColumns are the FULL view after the request, not a patch.',
  'Copy the current view for any part the request does not change. An empty filters array, empty sort.columns, or empty hiddenColumns clears that part.',
  'Name every column by its prop string, never by a numeric index.',
  'operation "conjunction" means AND. "disjunction" means OR. One column entry holds every condition on that column.',
  'A condition name must be one listed for THAT column. args length must equal the inputsCount shown in parentheses.',
  'by_value is allowed on every column even though it is not in the per-column list.',
  'by_value args are exactly one element, the array of values to KEEP, shaped [["a","b"]].',
  'Every by_value entry must be one of that column\'s sampleValues when sampleValues are present.',
  'Dates are absolute YYYY-MM-DD. today is in the user message.',
  'A relative date (today, yesterday, last N days, this month, last month, this week, last week, since Monday) becomes between when that column lists between, otherwise intl_date_between.',
  'Both args are absolute dates. A single day uses the same date for both ends.',
  'last N days includes today and the previous N-1 days.',
  'this month is the first day of today\'s month through the last day of that month. last month is the previous calendar month.',
  'Weeks start on Monday. this week is that Monday through Sunday. last week is the previous Monday through Sunday.',
  'Never emit date_today, date_yesterday, date_tomorrow, intl_date_today, intl_date_yesterday, or intl_date_tomorrow.',
  'explanation is one short sentence about the view, or "" when not expressible.',
  'The examples below show the shape. The column condition list in the user message wins when it disagrees.',
  'Example, today 2026-10-20. Request: "paid EMEA orders from the last 7 days, highest total first, hide rep".',
  '{"not_expressible":false,"reason":"","explanation":"Paid EMEA orders from 2026-10-14 to 2026-10-20, total descending, rep hidden.","state":{"version":1,"filters":[{"column":"status","operation":"conjunction","conditions":[{"name":"eq","args":["paid"]}]},{"column":"region","operation":"conjunction","conditions":[{"name":"eq","args":["EMEA"]}]},{"column":"order_date","operation":"conjunction","conditions":[{"name":"between","args":["2026-10-14","2026-10-20"]}]}],"sort":{"columns":[{"column":"total","sortOrder":"desc"}]},"hiddenColumns":["rep"]}}',
  'Example. Request: "group tickets by assignee".',
  '{"not_expressible":true,"reason":"Grouping rows is not a filter, sort, or hidden column.","explanation":"","state":{"version":1,"filters":[],"sort":{"columns":[]},"hiddenColumns":[]}}',
].join('\n');

/**
 * @param {Array<{ prop: string, conditions?: Array<{ name: string }> }>} columns
 * @returns {object} JSON schema for Workers AI response_format.json_schema.
 */
export function buildJsonSchema(columns) {
  const props = columns.map(column => column.prop);
  const names = new Set(['by_value']);

  columns.forEach((column) => {
    (column.conditions || []).forEach((condition) => {
      if (condition && typeof condition.name === 'string' && condition.name) {
        names.add(condition.name);
      }
    });
  });

  const columnProp = { type: 'string', enum: props };
  const condition = {
    type: 'object',
    properties: {
      name: { type: 'string', enum: [...names] },
      args: { type: 'array' },
    },
    required: ['name', 'args'],
  };

  return {
    type: 'object',
    properties: {
      not_expressible: { type: 'boolean' },
      reason: { type: 'string' },
      explanation: { type: 'string' },
      state: {
        type: 'object',
        properties: {
          version: { type: 'integer' },
          filters: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                column: columnProp,
                operation: { type: 'string', enum: ['conjunction', 'disjunction'] },
                conditions: { type: 'array', items: condition },
              },
              required: ['column', 'operation', 'conditions'],
            },
          },
          sort: {
            type: 'object',
            properties: {
              columns: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    column: columnProp,
                    sortOrder: { type: 'string', enum: ['asc', 'desc'] },
                  },
                  required: ['column', 'sortOrder'],
                },
              },
            },
            required: ['columns'],
          },
          hiddenColumns: { type: 'array', items: columnProp },
        },
        required: ['version', 'filters', 'sort', 'hiddenColumns'],
      },
    },
    required: ['not_expressible', 'reason', 'explanation', 'state'],
  };
}

/**
 * @param {object} input Prompt, today, columns, current state, optional repair.
 * @returns {Array<{ role: string, content: string }>}
 */
export function buildMessages(input) {
  const lines = [
    `Today: ${input.today}`,
    'Columns (condition inputsCount in parentheses):',
  ];

  input.columns.forEach((column) => {
    const conditions = (column.conditions || [])
      .map(condition => `${condition.name}(${condition.inputsCount})`)
      .join(', ');
    let line = `- ${column.prop} type=${column.inferredType || 'unknown'} conditions: ${conditions || '(none)'}`;

    if (Array.isArray(column.sampleValues) && column.sampleValues.length > 0) {
      line += ` sampleValues: ${JSON.stringify(column.sampleValues)}`;
    }

    lines.push(line);
  });

  lines.push('Current view state:');
  lines.push(JSON.stringify(input.currentState || { version: 1, filters: [], sort: { columns: [] }, hiddenColumns: [] }));
  lines.push(`Request: ${input.prompt}`);

  if (input.repair && Array.isArray(input.repair.issues) && input.repair.issues.length > 0) {
    lines.push('The previous state was rejected. Fix every error. Do not repeat them.');
    lines.push(`Rejected state: ${JSON.stringify(input.repair.rejectedState || null)}`);
    input.repair.issues.slice(0, 30).forEach((issue) => {
      lines.push(`- ${issue.path || 'state'}: ${issue.message}`);
    });
  }

  return [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: lines.join('\n') },
  ];
}

/**
 * @param {unknown} raw What env.AI.run returned.
 * @returns {object}
 */
export function parseModelContent(raw) {
  const record = raw && typeof raw === 'object' ? raw : {};
  let value = Object.prototype.hasOwnProperty.call(record, 'response') ? record.response : raw;

  if (typeof value === 'string') {
    const trimmed = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

    value = JSON.parse(trimmed);
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('model response was not a JSON object');
  }

  return value;
}

/**
 * @param {object} payload Parsed model JSON.
 * @returns {{ not_expressible: true, reason: string }|{ not_expressible: false, explanation: string, state: object }}
 */
export function interpretModel(payload) {
  const flagged = payload.not_expressible === true || payload.not_expressible === 'true';

  if (flagged) {
    const reason = typeof payload.reason === 'string' && payload.reason.trim()
      ? payload.reason.trim()
      : '';

    return {
      not_expressible: true,
      reason: reason || 'The request is not expressible as filters, sort, or hidden columns.',
    };
  }

  if (!payload.state || typeof payload.state !== 'object' || Array.isArray(payload.state)) {
    throw new Error('model response had no state object');
  }

  const state = payload.state;

  return {
    not_expressible: false,
    explanation: typeof payload.explanation === 'string' ? payload.explanation.trim() : '',
    state: {
      version: state.version == null ? 1 : state.version,
      filters: Array.isArray(state.filters) ? state.filters : [],
      sort: {
        columns: state.sort && Array.isArray(state.sort.columns) ? state.sort.columns : [],
      },
      hiddenColumns: Array.isArray(state.hiddenColumns) ? state.hiddenColumns : [],
    },
  };
}

/**
 * @param {unknown} raw env.AI.run result.
 * @returns {{ prompt_tokens: number, completion_tokens: number, total_tokens: number }|null}
 */
export function readUsage(raw) {
  const record = raw && typeof raw === 'object' ? raw : {};
  const usage = record.usage || (record.result && record.result.usage);

  if (!usage || typeof usage !== 'object') {
    return null;
  }

  const promptTokens = count(usage.prompt_tokens ?? usage.input_tokens);
  const completionTokens = count(usage.completion_tokens ?? usage.output_tokens);

  if (promptTokens == null || completionTokens == null) {
    return null;
  }

  const total = count(usage.total_tokens);

  return {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: total == null ? promptTokens + completionTokens : total,
  };
}

/**
 * @param {unknown} value
 * @returns {number|null}
 */
function count(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return value;
}
