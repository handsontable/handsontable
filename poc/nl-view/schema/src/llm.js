export const PROXY_URL = 'https://poc-nl-view-proxy.handsontable-sandbox.workers.dev/v1/chat/completions';
export const MODEL = 'gpt-5.6-luna';

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

/**
 * One OpenAI-compatible chat call. Records proxy timing and cost headers.
 */
export async function chatComplete({ token, messages, responseFormat }) {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-poc-token': token,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: 2000,
      response_format: responseFormat,
    }),
  });
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
  const tokens = Number.isFinite(usage.total_tokens)
    ? usage.total_tokens
    : (Number(usage.prompt_tokens) || 0) + (Number(usage.completion_tokens) || 0);

  if (!response.ok) {
    const message = json?.error?.message || text.slice(0, 600) || response.statusText;
    const error = new Error(`proxy ${response.status}: ${message}`);

    error.call = { upstreamMs, costUsd, tokens, status: response.status, body: text.slice(0, 800) };
    throw error;
  }

  return {
    json,
    text: messageText(json?.choices?.[0]?.message),
    upstreamMs,
    costUsd,
    tokens,
  };
}
