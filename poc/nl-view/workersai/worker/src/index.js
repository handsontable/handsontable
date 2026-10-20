/**
 * poc-nl-view-workersai
 *
 * POST /translate calls Workers AI (env.AI.run) with guided JSON and returns
 * { state, explanation, model, usage } or { not_expressible, reason, model, usage }.
 * It does not compute dollars. The browser does, from usage and pricing.js.
 *
 * LOCAL_AI_STUB=1 (wrangler dev --local --var LOCAL_AI_STUB:1) skips env.AI
 * and returns 501. That path is for routing, auth, and CORS only.
 * Do not set LOCAL_AI_STUB on the deployed worker. Do not report its output.
 */

import { MODELS, resolveModel, USD_PER_THOUSAND_NEURONS } from './pricing.js';
import { buildJsonSchema, buildMessages, interpretModel, parseModelContent, readUsage } from './prompt.js';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type, x-poc-token',
  'access-control-max-age': '86400',
};

const KV_BINDING = 'poc-nl-view-workersai-kv';

export default {
  fetch: (request, env) => handleRequest(request, env),
};

/**
 * @param {Request} request
 * @param {object} env
 * @returns {Promise<Response>}
 */
export async function handleRequest(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  const url = new URL(request.url);

  if (request.method === 'GET' && url.pathname === '/health') {
    return json({ ok: true, service: 'poc-nl-view-workersai', models: Object.keys(MODELS) });
  }

  if (request.method === 'GET' && url.pathname === '/pricing') {
    return json({
      usdPerThousandNeurons: USD_PER_THOUSAND_NEURONS,
      formula: 'neurons = prompt_tokens/1e6*inputNeuronsPerMillion + completion_tokens/1e6*outputNeuronsPerMillion; costUsd = neurons/1000*usdPerThousandNeurons',
      models: MODELS,
    });
  }

  if (url.pathname !== '/translate') {
    return json({ error: 'not_found' }, 404);
  }

  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  if (!authorized(request, env)) {
    return json({ error: 'unauthorized' }, 401);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }

  const problem = validateBody(body);

  if (problem) {
    return json({ error: 'bad_request', message: problem }, 400);
  }

  const model = resolveModel(body.model);

  if (!model) {
    return json({ error: 'unknown_model', allowlist: Object.keys(MODELS) }, 400);
  }

  const cap = await consumeCap(env);

  if (cap.error) {
    return json({ error: cap.error }, 500);
  }

  if (cap.limited) {
    return json({ error: 'daily_cap', limit: cap.limit, used: cap.used }, 429);
  }

  const today = body.today || new Date().toISOString().slice(0, 10);
  const messages = buildMessages({
    prompt: body.prompt.trim(),
    today,
    columns: body.context.columns,
    currentState: body.context.currentState,
    repair: body.repair,
  });
  const schema = buildJsonSchema(body.context.columns);
  const aiInput = {
    messages,
    temperature: 0,
    max_tokens: 1500,
    response_format: {
      type: 'json_schema',
      json_schema: schema,
    },
  };

  // Local routing stub. Not a model. Never enable this on the deployed worker.
  if (env.LOCAL_AI_STUB === '1') {
    return json({
      error: 'local_stub',
      message: 'LOCAL_STUB is enabled. This worker did not call Workers AI. Do not report this response.',
      model: 'local-stub',
    }, 501);
  }

  if (!env.AI || typeof env.AI.run !== 'function') {
    return json({ error: 'ai_binding_missing' }, 500);
  }

  let raw;

  try {
    raw = await env.AI.run(model, aiInput);
  } catch (error) {
    return json({
      error: 'model_error',
      message: error instanceof Error ? error.message : String(error),
      model,
      called: true,
      usage: null,
    }, 502);
  }

  const usage = readUsage(raw);

  try {
    const parsed = interpretModel(parseModelContent(raw));

    if (parsed.not_expressible) {
      return json({
        not_expressible: true,
        reason: parsed.reason,
        model,
        usage,
        called: true,
      });
    }

    return json({
      state: parsed.state,
      explanation: parsed.explanation,
      model,
      usage,
      called: true,
    });
  } catch (error) {
    return json({
      error: 'model_output',
      message: error instanceof Error ? error.message : String(error),
      model,
      usage,
      called: true,
    }, 502);
  }
}

/**
 * @param {Request} request
 * @param {object} env
 * @returns {boolean}
 */
function authorized(request, env) {
  const secret = env.POC_TOKEN;

  if (typeof secret !== 'string' || secret.length === 0) {
    return false;
  }

  return timingSafeEqual(request.headers.get('x-poc-token') || '', secret);
}

/**
 * @param {string} left
 * @param {string} right
 * @returns {boolean}
 */
function timingSafeEqual(left, right) {
  const length = Math.max(left.length, right.length);
  let diff = left.length === right.length ? 0 : 1;

  for (let i = 0; i < length; i++) {
    diff |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  }

  return diff === 0;
}

/**
 * @param {object} env
 * @returns {Promise<{ error?: string, limited?: boolean, used?: number, limit?: number }>}
 */
async function consumeCap(env) {
  const kv = env[KV_BINDING];

  if (!kv || typeof kv.get !== 'function' || typeof kv.put !== 'function') {
    return { error: 'kv_missing' };
  }

  const parsed = Number(env.DAILY_CAP || 300);
  const limit = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 300;
  const key = `cap:${new Date().toISOString().slice(0, 10)}`;
  const current = Number(await kv.get(key) || '0');
  const used = Number.isFinite(current) && current > 0 ? current : 0;

  if (used >= limit) {
    return { limited: true, used, limit };
  }

  await kv.put(key, String(used + 1), { expirationTtl: 172800 });

  return { limited: false, used: used + 1, limit };
}

/**
 * @param {unknown} body
 * @returns {string|null}
 */
function validateBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'body must be a JSON object';
  }

  if (typeof body.prompt !== 'string' || body.prompt.trim() === '') {
    return 'prompt is required';
  }

  if (body.prompt.length > 4000) {
    return 'prompt is too long';
  }

  if (body.today != null && !/^\d{4}-\d{2}-\d{2}$/.test(body.today)) {
    return 'today must be YYYY-MM-DD';
  }

  const columns = body.context && body.context.columns;

  if (!Array.isArray(columns) || columns.length === 0) {
    return 'context.columns is required';
  }

  if (columns.length > 80) {
    return 'too many columns';
  }

  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];

    if (!column || typeof column.prop !== 'string' || column.prop === '') {
      return 'each column needs a prop';
    }

    if (!Array.isArray(column.conditions)) {
      return `column ${column.prop} needs a conditions array`;
    }
  }

  return null;
}

/**
 * @param {object} body
 * @param {number} [status]
 * @returns {Response}
 */
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...CORS,
    },
  });
}
