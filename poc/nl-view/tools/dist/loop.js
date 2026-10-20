/**
 * Multi-turn tool loop. The grid changes once, on finish, through setViewState.
 *
 * gpt-5.6-luna may attach reasoning_items (encrypted_content) on tool turns.
 * Those fields are passed back on the assistant message. They are stripped
 * only when the proxy rejects the follow-up with HTTP 400 and the body
 * mentions reasoning, and that retry is a second model call.
 */

import { createSession, pendingState, runTool, validatePending } from './tools.js';

const ENDPOINT = 'https://poc-nl-view-proxy.handsontable-sandbox.workers.dev/v1/chat/completions';
const MODEL = 'gpt-5.6-luna';
const MAX_TURNS = 4;
const REQUEST_TIMEOUT_MS = 60000;

const READ_TOOLS = new Set(['get_columns', 'get_distinct_values']);

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_columns',
      description: 'List columns: property name, inferred type, null count, and the conditions Filters#getAvailableConditions returns ({name, inputsCount}). Call this before any filter.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_distinct_values',
      description: 'Distinct source values of one column, with counts. Required before by_value. Does not change the view.',
      parameters: {
        type: 'object',
        properties: { column: { type: 'string', description: 'Column property name from get_columns.' } },
        required: ['column'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_filter',
      description: 'Replace the filter on one column in the pending view. operator joins that column\'s conditions: conjunction (AND) or disjunction (OR). Filters on different columns all apply.',
      parameters: {
        type: 'object',
        properties: {
          column: { type: 'string' },
          operator: { type: 'string', enum: ['conjunction', 'disjunction'] },
          conditions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                args: { type: 'array' },
              },
              required: ['name'],
            },
          },
        },
        required: ['column', 'conditions'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'clear_filter',
      description: 'Remove the pending filter on one column.',
      parameters: {
        type: 'object',
        properties: { column: { type: 'string' } },
        required: ['column'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_sort',
      description: 'Replace the whole pending sort. Pass an empty array to clear it.',
      parameters: {
        type: 'object',
        properties: {
          columns: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                column: { type: 'string' },
                sortOrder: { type: 'string', enum: ['asc', 'desc'] },
              },
              required: ['column', 'sortOrder'],
            },
          },
        },
        required: ['columns'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'hide_columns',
      description: 'Add columns to the pending hidden set.',
      parameters: {
        type: 'object',
        properties: { columns: { type: 'array', items: { type: 'string' } } },
        required: ['columns'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'show_columns',
      description: 'Remove columns from the pending hidden set.',
      parameters: {
        type: 'object',
        properties: { columns: { type: 'array', items: { type: 'string' } } },
        required: ['columns'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reset_view',
      description: 'Clear pending filters, sort, and hidden columns.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'finish',
      description: 'Validate the pending view and apply it once. Call this only after the pending view matches the request.',
      parameters: {
        type: 'object',
        properties: { explanation: { type: 'string' } },
        required: ['explanation'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'not_expressible',
      description: 'Stop without changing the grid. Use for grouping, aggregation, pivots, charts, or calculated columns.',
      parameters: {
        type: 'object',
        properties: { reason: { type: 'string' } },
        required: ['reason'],
      },
    },
  },
];

const TOOLS_FAST = TOOLS.filter(tool => tool.function.name !== 'get_columns');

/**
 * @param {Handsontable} hot
 * @param {string} prompt
 * @param {{ today?: string, token?: string, variant?: string }} options
 * @returns {Promise<object>}
 */
export async function translatePrompt(hot, prompt, options = {}) {
  const started = performance.now();
  const today = options.today || localToday();
  const token = options.token || '';
  const fast = options.variant === 'fast';
  const tools = fast ? TOOLS_FAST : TOOLS;
  const session = createSession(hot, today);
  const trace = [];
  let costUsd = 0;
  let tokens = 0;
  let turns = 0;
  let upstreamMs = 0;
  let strippedReasoning = false;
  const messages = [
    { role: 'system', content: fast ? systemPromptFast(session) : systemPrompt(today) },
    { role: 'user', content: String(prompt) },
  ];

  const pack = (status, explanation, state) => ({
    result: {
      status,
      state,
      explanation,
      ms: Math.round(performance.now() - started),
      costUsd,
      tokens,
      turns,
    },
    debug: { trace, upstreamMs, strippedReasoning, today, variant: fast ? 'fast' : 'default' },
  });

  if (!token) {
    return pack('error', 'No proxy token. Open the page with #t=<token> or set localStorage nl-view-token.', null);
  }

  try {
    for (let turn = 0; turn < MAX_TURNS; turn += 1) {
      const response = await complete(messages, token, tools);

      turns += response.llmCalls;
      costUsd += response.costUsd;
      tokens += response.tokens;
      upstreamMs += response.upstreamMs;
      strippedReasoning = strippedReasoning || response.strippedReasoning;

      const assistant = forwardAssistant(response.message);

      messages.push(assistant);

      const calls = Array.isArray(assistant.tool_calls) ? assistant.tool_calls : [];
      const step = {
        turn: turns,
        upstreamMs: response.upstreamMs,
        costUsd: response.costUsd,
        tokens: response.tokens,
        finishReason: response.finishReason,
        reasoningItems: reasoningCount(response.message),
        strippedReasoning: response.strippedReasoning,
        calls: [],
      };

      trace.push(step);

      if (!calls.length) {
        messages.push({
          role: 'user',
          content: fast
            ? 'Call the mutation tools in this turn, or not_expressible when it cannot be done. finish is optional when the mutations are already in this turn.'
            : 'Call a tool. Use finish when the pending view is right, or not_expressible when it cannot be done.',
        });
        continue;
      }

      const terminal = [];
      const mutations = [];

      calls.forEach((call) => {
        const name = call.function?.name;

        if (name === 'finish' || name === 'not_expressible') {
          terminal.push(call);
        } else {
          mutations.push(call);
        }
      });

      mutations.forEach((call) => {
        const args = parseArgs(call);
        const output = args.__parseError
          ? { ok: false, error: 'Arguments were not valid JSON.' }
          : runTool(session, call.function.name, args);

        messages.push(toolMessage(call.id, output));
        step.calls.push({ name: call.function.name, args, output });
      });

      if (!terminal.length) {
        const reads = mutations.filter(call => READ_TOOLS.has(call.function?.name));
        const writes = mutations.filter(call => !READ_TOOLS.has(call.function?.name));
        const failed = step.calls.some(call => call.output && call.output.ok === false);

        if (fast && writes.length && !reads.length && !failed) {
          const explanation = textExplanation(assistant);
          const applied = applyPending(session, step, { explanation, implicit: true });

          if (applied.ok) {
            return pack('applied', explanation, applied.state);
          }

          if (applied.state) {
            return pack('error', applied.detail, applied.state);
          }

          messages.push({
            role: 'user',
            content: `Pending view was rejected. Fix it with tool calls. ${applied.detail}`,
          });

          if (turn === MAX_TURNS - 1) {
            return pack('error', applied.detail, null);
          }
        }

        continue;
      }

      const stop = terminal.find(call => call.function?.name === 'not_expressible') || terminal[0];
      const args = parseArgs(stop);

      if (stop.function.name === 'not_expressible') {
        terminal.forEach((call) => {
          messages.push(toolMessage(call.id, { ok: true, status: 'not_expressible' }));
        });
        step.calls.push({ name: 'not_expressible', args, output: { ok: true } });

        return pack('not_expressible', args.reason || 'Not expressible on a flat grid.', null);
      }

      const applied = applyPending(session, step, {
        explanation: args.explanation || 'Applied.',
        implicit: false,
      });

      terminal.forEach((call) => {
        messages.push(toolMessage(call.id, applied.toolOutput));
      });

      if (!applied.ok) {
        if (applied.state || turn === MAX_TURNS - 1) {
          return pack('error', applied.detail, applied.state || null);
        }

        continue;
      }

      return pack('applied', args.explanation || 'Applied.', applied.state);
    }
  } catch (error) {
    if (error && typeof error.costUsd === 'number') {
      costUsd += error.costUsd;
      upstreamMs += error.upstreamMs || 0;
    }

    return pack('error', error instanceof Error ? error.message : String(error), null);
  }

  return pack('error', `Stopped after ${MAX_TURNS} model calls without finish.`, null);
}

/**
 * Apply the pending view once. Implicit finish uses the assistant text.
 *
 * @param {object} session
 * @param {object} step
 * @param {{ explanation: string, implicit: boolean }} meta
 * @returns {{ ok: boolean, state: object|null, detail: string, toolOutput: object }}
 */
function applyPending(session, step, meta) {
  const check = validatePending(session);
  const name = meta.implicit ? 'implicit_finish' : 'finish';

  if (!check.valid) {
    const toolOutput = {
      ok: false,
      error: check.error?.message || 'Pending view was rejected.',
      issues: (check.skipped || []).map(issue => ({
        part: issue.part,
        path: issue.path,
        reason: issue.reason,
        message: issue.message,
      })),
    };
    const detail = toolOutput.issues.map(issue => `${issue.path}: ${issue.message}`).join(' ') || toolOutput.error;

    step.calls.push({ name, args: { explanation: meta.explanation }, output: toolOutput });

    return { ok: false, state: null, detail, toolOutput };
  }

  const state = check.state;

  if (Object.keys(state).length > 1) {
    const applied = session.hot.getPlugin('viewState').setViewState(state, { atomic: true, undo: 'record' });

    if (applied.error) {
      const toolOutput = { ok: false, error: applied.error.message };

      step.calls.push({ name, args: { explanation: meta.explanation }, output: toolOutput });

      return { ok: false, state, detail: applied.error.message, toolOutput };
    }
  }

  const recorded = pendingState(session);
  const toolOutput = { ok: true, state: recorded };

  step.calls.push({ name, args: { explanation: meta.explanation }, output: toolOutput });

  return { ok: true, state: recorded, detail: '', toolOutput };
}

/**
 * @param {object} message
 * @returns {string}
 */
function textExplanation(message) {
  const content = message && message.content;

  if (typeof content === 'string' && content.trim()) {
    return content.trim();
  }

  return 'Applied.';
}

/**
 * @param {string} today
 * @returns {string}
 */
function systemPrompt(today) {
  return [
    'You change a Handsontable view by calling tools. The grid updates only when you call finish, as one undo step.',
    `Today is ${today}.`,
    'Workflow: get_columns, then any get_distinct_values you need, then the mutations, then finish. Do as much as you can in one turn.',
    'Condition names come only from that column\'s conditions array (Filters#getAvailableConditions). Never invent one.',
    'by_value is the exception: it is not in that array. Use it to keep specific cell values. Call get_distinct_values and copy value fields exactly, including case. Pass them as a flat args array. Blank cells are null. To keep blanks, prefer the empty condition when the column lists it.',
    'set_filter replaces one column. operator is conjunction (AND) or disjunction (OR). Filters on different columns all apply together.',
    'set_sort replaces the whole sort. sortOrder is asc or desc. hide_columns and show_columns take property names. reset_view clears filters, sort, and hidden columns.',
    'Relative dates: pass between with one arg, the phrase, and the tool rewrites it to two inclusive YYYY-MM-DD values. Phrases: today, yesterday, tomorrow, last N days, next N days, this week, last week, this month, last month, this quarter, last quarter, this year, last year, year to date. Weeks start Monday. last N days includes today. You may pass the two absolute dates yourself instead.',
    'Call not_expressible, and do not mutate, when the request needs grouping, a pivot, a chart, or an aggregate (sum, average, count, min, max across rows). Flat filters, sorts, and hidden columns are supported.',
    'If a tool returns issues, fix the call using path and message. Then finish with one sentence saying what the view shows.',
  ].join('\n');
}

/**
 * Fast variant: schema is already in the prompt, so get_columns is not offered.
 * A turn that only mutates is an implicit finish.
 *
 * @param {object} session
 * @returns {string}
 */
function systemPromptFast(session) {
  const listed = runTool(session, 'get_columns', {});
  const schema = {
    today: session.today,
    view: session.pending,
    columns: (listed.columns || []).map(column => ({
      column: column.column,
      type: column.inferredType,
      conditions: column.conditions,
    })),
  };

  return [
    'You change a Handsontable view by calling tools. The grid updates at the end of a turn that contains the mutations, as one undo step.',
    'Emit ALL mutation tool calls in this single response, in parallel. Do not split them across turns. finish is optional: if you call it in the same turn, its explanation is used; otherwise your message text is the explanation.',
    'get_columns is not available. Props, inferred types, allowed conditions, the current view, and today are below. Condition names come only from that column\'s conditions array. Never invent one.',
    JSON.stringify(schema),
    'Call get_distinct_values only when you use by_value, and call it alone, with no mutations in that turn. Then send every mutation on the next turn. by_value is not in the conditions array. Copy value fields exactly, including case, as a flat args array. Blank cells are null.',
    'For eq, neq, contains, gt, between, and the other listed conditions, do not call get_distinct_values. Use the condition directly.',
    'set_filter replaces one column. operator is conjunction (AND) or disjunction (OR). Filters on different columns all apply together.',
    'set_sort replaces the whole sort. sortOrder is asc or desc. hide_columns and show_columns take property names. reset_view clears filters, sort, and hidden columns.',
    'Relative dates: pass between with one arg, the phrase, and the tool rewrites it to two inclusive YYYY-MM-DD values. Phrases: today, yesterday, tomorrow, last N days, next N days, this week, last week, this month, last month, this quarter, last quarter, this year, last year, year to date. Weeks start Monday. last N days includes today. You may pass the two absolute dates yourself instead.',
    'Call not_expressible, and do not mutate, when the request needs grouping, a pivot, a chart, or an aggregate (sum, average, count, min, max across rows). Flat filters, sorts, and hidden columns are supported.',
    'If a tool returns issues, fix the call using path and message in the next turn.',
  ].join('\n');
}

/**
 * @param {object[]} messages
 * @param {string} token
 * @param {object[]} tools
 * @returns {Promise<object>}
 */
async function complete(messages, token, tools) {
  try {
    const first = await post(messages, token, tools);

    return { ...first, llmCalls: 1, strippedReasoning: false };
  } catch (error) {
    const body = error && error.rawText ? error.rawText : '';

    if (error && error.status === 400 && /reasoning/i.test(body)) {
      const second = await post(messages.map(stripReasoning), token, tools);

      return {
        ...second,
        llmCalls: 2,
        strippedReasoning: true,
        costUsd: (error.costUsd || 0) + second.costUsd,
        upstreamMs: (error.upstreamMs || 0) + second.upstreamMs,
        tokens: (error.tokens || 0) + second.tokens,
      };
    }

    throw error;
  }
}

/**
 * @param {object[]} messages
 * @param {string} token
 * @param {object[]} tools
 * @returns {Promise<object>}
 */
async function post(messages, token, tools) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;

  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-poc-token': token,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        tools,
        tool_choice: 'auto',
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new Error('Proxy request timed out.');
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }

  const costHeader = Number(response.headers.get('x-litellm-response-cost'));
  const upstreamHeader = Number(response.headers.get('x-upstream-ms'));
  const costUsd = Number.isFinite(costHeader) ? costHeader : 0;
  const upstreamMs = Number.isFinite(upstreamHeader) ? upstreamHeader : 0;
  const rawText = await response.text();

  if (!response.ok) {
    const failure = new Error(`Proxy HTTP ${response.status}: ${rawText.slice(0, 400)}`);

    failure.status = response.status;
    failure.rawText = rawText;
    failure.costUsd = costUsd;
    failure.upstreamMs = upstreamMs;
    throw failure;
  }

  const body = JSON.parse(rawText);
  const choice = body.choices && body.choices[0] ? body.choices[0] : {};
  const message = choice.message || {};

  if (Array.isArray(choice.reasoning_items) && !message.reasoning_items) {
    message.reasoning_items = choice.reasoning_items;
  }

  return {
    message,
    finishReason: choice.finish_reason || '',
    costUsd,
    upstreamMs,
    tokens: body.usage && body.usage.total_tokens ? body.usage.total_tokens : 0,
  };
}

/**
 * Keep reasoning_items on the assistant message so the next turn can read them.
 *
 * @param {object} message
 * @returns {object}
 */
function forwardAssistant(message) {
  const copy = { role: 'assistant' };

  if (message.content !== undefined) {
    copy.content = message.content;
  }

  if (Array.isArray(message.tool_calls)) {
    copy.tool_calls = message.tool_calls.map(call => ({
      id: call.id,
      type: call.type || 'function',
      function: {
        name: call.function.name,
        arguments: call.function.arguments,
      },
    }));
  }

  ['reasoning_items', 'reasoning', 'reasoning_content'].forEach((key) => {
    if (message[key] !== undefined) {
      copy[key] = message[key];
    }
  });

  return copy;
}

/**
 * @param {object} message
 * @returns {object}
 */
function stripReasoning(message) {
  if (!message || message.role !== 'assistant') {
    return message;
  }

  const copy = { ...message };

  delete copy.reasoning_items;
  delete copy.reasoning;
  delete copy.reasoning_content;

  return copy;
}

/**
 * @param {object} message
 * @returns {number}
 */
function reasoningCount(message) {
  return Array.isArray(message.reasoning_items) ? message.reasoning_items.length : 0;
}

/**
 * @param {object} call
 * @returns {object}
 */
function parseArgs(call) {
  const raw = call.function ? call.function.arguments : null;

  if (raw && typeof raw === 'object') {
    return raw;
  }

  try {
    return JSON.parse(raw || '{}');
  } catch (error) {
    return { __parseError: true };
  }
}

/**
 * @param {string} id
 * @param {object} output
 * @returns {object}
 */
function toolMessage(id, output) {
  return { role: 'tool', tool_call_id: id, content: JSON.stringify(output) };
}

/**
 * @returns {string}
 */
function localToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${now.getFullYear()}-${month}-${day}`;
}
