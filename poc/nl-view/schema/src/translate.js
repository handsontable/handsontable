import { buildGridSchema, checkByValue, resolveRelativeDates, responseFormat, SYSTEM_PROMPT } from './schema.js';
import { LEAN_SYSTEM_PROMPT, leanUserMessage } from './lean.js';
import { MODEL, MODELS, buildChatBody, chatComplete, parseModelJson, resolveApi } from './llm.js';

const EFFORTS = ['minimal', 'low', 'medium'];

function todayIso() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function promptPayload(gridSchema, prompt) {
  return JSON.stringify({
    request: prompt,
    today: gridSchema.today,
    calendar: gridSchema.calendar,
    rowCount: gridSchema.rowCount,
    columns: gridSchema.columns,
    currentViewState: gridSchema.currentViewState,
  });
}

/**
 * URL and translate() options. Omitted knobs keep the original request:
 * full schema, gpt-5.6-luna, no reasoning_effort, poc proxy with x-poc-token.
 */
export function resolveKnobs(options) {
  const schema = options?.schema || 'full';
  const model = options?.model || MODEL;
  const effort = options?.effort || '';
  const api = resolveApi(options?.api);

  if (schema !== 'full' && schema !== 'lean') {
    return { error: `Unknown schema "${schema}". Use full or lean.` };
  }

  if (!MODELS.includes(model)) {
    return { error: `Unknown model "${model}".` };
  }

  if (effort && !EFFORTS.includes(effort)) {
    return { error: `Unknown effort "${effort}". Use minimal, low, or medium.` };
  }

  if (api == null) {
    return { error: 'api must be a path like /api/chat, or an http(s) URL.' };
  }

  return { schema, model, effort, api };
}

function messagesFor(schema, gridSchema, prompt) {
  if (schema === 'lean') {
    return [
      { role: 'system', content: LEAN_SYSTEM_PROMPT },
      { role: 'user', content: leanUserMessage(gridSchema, prompt) },
    ];
  }

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: promptPayload(gridSchema, prompt) },
  ];
}

function sumNumbers(values) {
  const nums = values.filter(value => value != null && Number.isFinite(value));

  return nums.length ? nums.reduce((sum, value) => sum + value, 0) : null;
}

function normalizeState(parsed) {
  const state = parsed?.state ?? {};

  return {
    version: 1,
    sort: state.sort && Array.isArray(state.sort.columns) ? { columns: state.sort.columns } : { columns: [] },
    filters: Array.isArray(state.filters) ? state.filters : [],
    hiddenColumns: Array.isArray(state.hiddenColumns) ? state.hiddenColumns : [],
  };
}

function collectIssues(hot, state, gridSchema) {
  const validation = hot.getPlugin('viewState').validateViewState(state);
  const issues = [];

  if (validation.error) {
    issues.push({ path: 'state', message: validation.error.message });
  }

  validation.skipped.forEach((skipped) => {
    issues.push({
      path: skipped.path,
      message: skipped.message,
      part: skipped.part,
      reason: skipped.reason,
    });
  });

  checkByValue(state, gridSchema.valueIndex, gridSchema).forEach(issue => issues.push(issue));

  return issues;
}

function addCall(tally, call) {
  tally.turns += 1;
  tally.tokens += call?.tokens || 0;

  if (call && call.costUsd != null && Number.isFinite(call.costUsd)) {
    tally.costUsd += call.costUsd;
  }

  if (call?.upstreamMs != null) {
    tally.upstreamMs.push(call.upstreamMs);
  }

  if (call?.promptTokens != null) {
    tally.promptTokens = (tally.promptTokens ?? 0) + call.promptTokens;
  }

  if (call?.completionTokens != null) {
    tally.completionTokens = (tally.completionTokens ?? 0) + call.completionTokens;
  }

  if (call?.reasoningTokens != null) {
    tally.reasoningTokens = (tally.reasoningTokens ?? 0) + call.reasoningTokens;
  }

  if (call?.effortSent) {
    tally.effortSent = true;
  }
}

function prepareState(parsed, gridSchema, tally) {
  if (parsed?.not_expressible === true) {
    return { notExpressible: parsed.reason || parsed.explanation || 'Not expressible.' };
  }

  let state = normalizeState(parsed);
  const resolved = resolveRelativeDates(state, gridSchema);

  state = resolved.state;
  tally.rewritten += resolved.rewritten;

  return { state, parsed };
}

/**
 * One schema call, one validation retry, then setViewState as a single undo step.
 */
export async function translateView(hot, columns, prompt, options, token) {
  const started = performance.now();
  const tally = {
    turns: 0,
    tokens: 0,
    costUsd: 0,
    upstreamMs: [],
    promptTokens: null,
    completionTokens: null,
    reasoningTokens: null,
    effortSent: false,
    rewritten: 0,
    raw: [],
  };
  const today = options?.today || todayIso();
  const current = () => hot.getPlugin('viewState').getViewState();
  const knobs = resolveKnobs(options);
  const finish = (status, state, explanation, extra = {}) => ({
    status,
    state,
    explanation,
    ms: Math.round(performance.now() - started),
    upstreamMs: sumNumbers(tally.upstreamMs),
    costUsd: tally.costUsd,
    tokens: tally.tokens,
    promptTokens: tally.promptTokens,
    completionTokens: tally.completionTokens,
    turns: tally.turns,
    debug: {
      upstreamMs: tally.upstreamMs,
      promptTokens: tally.promptTokens,
      completionTokens: tally.completionTokens,
      reasoningTokens: tally.reasoningTokens,
      effortSent: tally.effortSent,
      knobs: knobs.schema ? {
        schema: knobs.schema,
        model: knobs.model,
        effort: knobs.effort || null,
        api: knobs.api || null,
      } : null,
      rewrittenRelativeDates: tally.rewritten,
      raw: tally.raw,
      ...extra,
    },
  });

  if (knobs.error) {
    return finish('error', current(), knobs.error);
  }

  if (!knobs.api && !token) {
    return finish('error', current(), 'Missing proxy token. Pass #t= or localStorage nl-view-token.');
  }

  const gridSchema = buildGridSchema(hot, columns, {
    today,
    sampleValues: options?.sampleValues !== false,
  });
  const format = responseFormat(columns.map(column => column.data));
  const messages = messagesFor(knobs.schema, gridSchema, prompt);

  async function callModel() {
    try {
      const result = await chatComplete({
        token,
        messages,
        responseFormat: format,
        model: knobs.model,
        effort: knobs.effort,
        api: knobs.api,
      });

      addCall(tally, result);
      tally.raw.push(result.text);

      return { text: result.text };
    } catch (error) {
      addCall(tally, error.call);
      tally.raw.push(error.call?.body || error.message);

      return { error };
    }
  }

  const first = await callModel();

  if (first.error) {
    return finish('error', current(), first.error.message);
  }

  let parsed;

  try {
    parsed = parseModelJson(first.text);
  } catch (error) {
    messages.push({ role: 'assistant', content: first.text });
    messages.push({
      role: 'user',
      content: `The view state was rejected. ${error.message}. Return the JSON object only.`,
    });
    const retry = await callModel();

    if (retry.error) {
      return finish('error', current(), retry.error.message);
    }

    try {
      parsed = parseModelJson(retry.text);
    } catch (secondError) {
      return finish('error', current(), secondError.message);
    }
  }

  let prepared = prepareState(parsed, gridSchema, tally);

  if (prepared.notExpressible) {
    return finish('not_expressible', current(), prepared.notExpressible);
  }

  let issues = collectIssues(hot, prepared.state, gridSchema);

  if (issues.length > 0 && tally.turns < 2) {
    messages.push({ role: 'assistant', content: JSON.stringify(parsed) });
    messages.push({
      role: 'user',
      content: `The view state was rejected. Fix every issue and return the full JSON again.\n${issues.map(issue => `- ${issue.path}: ${issue.message}`).join('\n')}`,
    });
    const retry = await callModel();

    if (retry.error) {
      return finish('error', prepared.state, retry.error.message, { issues });
    }

    try {
      parsed = parseModelJson(retry.text);
    } catch (error) {
      return finish('error', prepared.state, error.message, { issues });
    }

    prepared = prepareState(parsed, gridSchema, tally);

    if (prepared.notExpressible) {
      return finish('not_expressible', current(), prepared.notExpressible);
    }

    issues = collectIssues(hot, prepared.state, gridSchema);
  }

  if (issues.length > 0) {
    return finish(
      'error',
      prepared.state,
      issues.map(issue => `${issue.path}: ${issue.message}`).join(' '),
      { issues },
    );
  }

  const applied = hot.getPlugin('viewState').setViewState(prepared.state, { atomic: true, undo: 'record' });

  if (applied.error) {
    return finish('error', prepared.state, applied.error.message, { skipped: applied.skipped });
  }

  return finish('applied', prepared.state, parsed.explanation || parsed.reason || '', {
    applied: applied.applied,
  });
}

/**
 * The request that translate() would send. Does not call the network.
 */
export function previewRequest(hot, columns, prompt, options) {
  const knobs = resolveKnobs(options);

  if (knobs.error) {
    return { error: knobs.error };
  }

  const today = options?.today || todayIso();
  const gridSchema = buildGridSchema(hot, columns, {
    today,
    sampleValues: options?.sampleValues !== false,
  });
  const messages = messagesFor(knobs.schema, gridSchema, prompt);
  const format = responseFormat(columns.map(column => column.data));
  const body = buildChatBody({
    messages,
    responseFormat: format,
    model: knobs.model,
    effort: knobs.effort,
  });

  return {
    schema: knobs.schema,
    model: body.model,
    reasoningEffort: body.reasoning_effort || null,
    api: knobs.api || null,
    messages,
    messageChars: messages.reduce((sum, message) => sum + message.content.length, 0),
    schemaChars: JSON.stringify(format).length,
  };
}
