export const PROXY_URL = 'https://poc-nl-view-proxy.handsontable-sandbox.workers.dev/v1/chat/completions';
export const MODEL = 'gpt-5.6-luna';
export const MODELS = ['gpt-5.6-luna', 'gpt-4.1-mini', 'gemini-3.5-flash-lite'];

const REASONING_MODELS = new Set(['gpt-5.6-luna']);
const TOKEN_KEY = 'nl-view-token';

export function readToken() {
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const fromHash = hash.get('t');

  if (fromHash) {
    localStorage.setItem(TOKEN_KEY, fromHash);
    hash.delete('t');
    const next = hash.toString();
    history.replaceState(null, '', `${location.pathname}${location.search}${next ? `#${next}` : ''}`);

    return fromHash;
  }

  const stored = localStorage.getItem(TOKEN_KEY);

  if (stored) {
    return stored;
  }

  const fromEnv = import.meta.env.VITE_NL_VIEW_TOKEN;

  return typeof fromEnv === 'string' ? fromEnv : '';
}

/**
 * Empty means the built-in proxy. A same-origin path or an http(s) URL is the
 * Worker endpoint. Anything else is rejected.
 */
export function resolveApi(api) {
  if (api == null) {
    return '';
  }

  const value = String(api).trim();

  if (!value) {
    return '';
  }

  if (value.startsWith('/') && !value.startsWith('//')) {
    return value;
  }

  try {
    const url = new URL(value);

    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Request body. reasoning_effort is set only for a reasoning model when effort
 * is one of minimal, low, or medium. Non-reasoning models never get the field.
 */
export function buildChatBody({ messages, responseFormat, model, effort }) {
  const resolved = model || MODEL;
  const body = {
    model: resolved,
    messages,
    max_tokens: 2000,
    response_format: responseFormat,
  };

  if (effort && REASONING_MODELS.has(resolved)) {
    body.reasoning_effort = effort;
  }

  return body;
}

export function messageText(message) {
  const content = message?.content;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content.map((part) => {
      if (typeof part === 'string') {
        return part;
      }

      return part?.text || part?.content || '';
    }).join('');
  }

  return '';
}

export function parseModelJson(text) {
  const trimmed = String(text).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');

    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }

    throw new Error('model output was not JSON');
  }
}

function headerNumber(response, name) {
  const raw = response.headers.get(name);

  if (raw == null || raw === '') {
    return null;
  }

  const value = Number(raw);

  return Number.isFinite(value) ? value : null;
}

function usageCount(usage, name) {
  const value = Number(usage?.[name]);

  return Number.isFinite(value) ? value : null;
}

/**
 * One OpenAI-compatible chat call. The default endpoint is the poc proxy and
 * sends x-poc-token. `api` switches to that URL, sends no token, and includes
 * cookies so a same-origin Worker can authenticate with a session cookie.
 */
export async function chatComplete({ token, messages, responseFormat, model, effort, api }) {
  const endpoint = resolveApi(api);
  const custom = Boolean(endpoint);
  const body = buildChatBody({ messages, responseFormat, model, effort });
  const headers = { 'content-type': 'application/json' };

  if (!custom) {
    headers['x-poc-token'] = token;
  }

  const init = {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  };

  if (custom) {
    init.credentials = 'include';
  }

  const response = await fetch(custom ? endpoint : PROXY_URL, init);
  const upstreamMs = headerNumber(response, 'x-upstream-ms');
  const costUsd = headerNumber(response, 'x-litellm-response-cost');
  const text = await response.text();
  let json = null;

  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  const usage = json?.usage ?? {};
  const promptTokens = usageCount(usage, 'prompt_tokens');
  const completionTokens = usageCount(usage, 'completion_tokens');
  const reasoningTokens = usageCount(usage.completion_tokens_details, 'reasoning_tokens');
  const tokens = Number.isFinite(usage.total_tokens)
    ? usage.total_tokens
    : (promptTokens || 0) + (completionTokens || 0);
  const call = {
    upstreamMs,
    costUsd,
    tokens,
    promptTokens,
    completionTokens,
    reasoningTokens,
    effortSent: Boolean(body.reasoning_effort),
  };

  if (!response.ok) {
    const message = json?.error?.message || text.slice(0, 600) || response.statusText;
    const error = new Error(`proxy ${response.status}: ${message}`);

    error.call = { ...call, status: response.status, body: text.slice(0, 800) };
    throw error;
  }

  return {
    json,
    text: messageText(json?.choices?.[0]?.message),
    ...call,
  };
}
