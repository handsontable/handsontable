/**
 * A minimal OpenAI-compatible chat client for the LiteLLM proxy.
 *
 * No SDK: the repository avoids third-party dependencies, and the call is one
 * POST. `fetch` and `sleep` are injectable so the retry path is unit-tested
 * without a network or a wait.
 */

// The classifier's own malformed-response payload (our JSON) is cut here; it is
// small and self-authored, so a modest cap is enough.
const MAX_PAYLOAD_CHARS = 4096;

// A failed upstream call's body is NOT cut here -- the whole response goes to
// the diagnostic message so the job log carries it in full. The size-limited,
// un-masked step summary is bounded and fenced downstream at the summary sink
// (`log.mjs`'s `fenceForSummary`), not here, so the two sinks can differ.

// The response headers worth surfacing on a failed call -- the set the probe
// proved discriminates a Cloudflare edge block from a real API error. Every
// `x-ratelimit-*` header is kept too (rate-limit state is diagnostic and the
// exact names vary by provider). Allowlisted, not dumped: this string reaches
// the un-masked step summary, so an unanticipated header must never ride along.
const DIAGNOSTIC_HEADERS = [
  'server', 'cf-ray', 'cf-mitigated', 'cf-cache-status', 'retry-after',
  'x-litellm-model-id', 'content-type', 'date',
];

/**
 * The chat completions endpoint for a proxy base URL.
 *
 * @param {string} baseUrl With or without a trailing `/v1`.
 * @returns {string}
 */
export function completionsUrl(baseUrl) {
  const base = baseUrl.replace(/\/+$/, '');

  return base.endsWith('/v1') ? `${base}/chat/completions` : `${base}/v1/chat/completions`;
}

/**
 * A diagnostic message for a non-2xx response: the status, the headers that
 * tell an edge block apart from an API error, and the full body. This is the
 * job-log/exception text; the summary sink bounds and fences it downstream.
 *
 * Headers are allowlisted, never dumped: this string can reach the un-masked
 * step summary, so an unanticipated header must never ride along. It reads
 * `response.headers` defensively so a hand-rolled `fetchImpl` that omits it
 * degrades to "no headers" instead of throwing.
 *
 * @param {Response} response
 * @param {string} bodyText The already-read response body.
 * @returns {string}
 */
export function describeErrorResponse(response, bodyText) {
  const headers = response.headers ?? new Headers();
  const lines = [`LiteLLM responded ${response.status} ${response.statusText ?? ''}`.trimEnd()];

  // Do not assert which hop or whose zone Cloudflare fronts; the headers cannot
  // support that. `cf-mitigated` is set only when Cloudflare actually mitigates,
  // so it is the confident signal and holds even if a later proxy rewrote the
  // Server header. Server: cloudflare plus an HTML body is weaker -- it can be a
  // Cloudflare-fronted origin's own error page -- so word that case without
  // calling it an edge block.
  const cfMitigated = headers.get('cf-mitigated');
  const cfRay = headers.get('cf-ray') ?? '?';

  if (cfMitigated != null) {
    lines.push(`Looks like a Cloudflare edge block, not the model API; cf-ray=${cfRay}, cf-mitigated=${cfMitigated}.`);
  } else if (/cloudflare/i.test(headers.get('server') ?? '') && /text\/html/i.test(headers.get('content-type') ?? '')) {
    lines.push(`Cloudflare served this HTML, not the model API; cf-ray=${cfRay}.`);
  }

  const shown = [];
  let omitted = 0;

  for (const [name, value] of headers) {
    if (DIAGNOSTIC_HEADERS.includes(name) || name.startsWith('x-ratelimit-')) {
      shown.push(`  ${name}: ${value}`);
    } else {
      omitted += 1;
    }
  }

  if (shown.length > 0) {
    lines.push('Headers:', ...shown);
  }
  if (omitted > 0) {
    lines.push(`  (${omitted} other header${omitted === 1 ? '' : 's'} omitted)`);
  }

  lines.push('Body:', bodyText);

  return lines.join('\n');
}

/**
 * Build a client bound to one model.
 *
 * @param {object} options
 * @param {string} options.baseUrl
 * @param {string} options.apiKey
 * @param {string} options.model
 * @param {number} [options.temperature] Sampling temperature. Omitted from the
 *   request body entirely when undefined, so the provider's own default
 *   applies -- a reasoning-tier model that rejects any non-default temperature
 *   then accepts the call, while a model that honors it can be pinned (e.g. to
 *   `0`) for repeatable classifications.
 * @param {boolean} [options.jsonMode] Whether to ask for a JSON object via
 *   `response_format`. On by default. Turn it off for a model that rejects
 *   `response_format`; `parseDecision` extracts the JSON object out of prose
 *   either way, so this only trades a reliability aid, not correctness.
 * @param {typeof fetch} [options.fetchImpl]
 * @param {(ms: number) => Promise<void>} [options.sleep]
 * @param {number} [options.attempts] Total attempts, including the first.
 * @param {number} [options.timeoutMs] Per-attempt fetch timeout, in milliseconds.
 * @returns {{ complete: (turns: { system: string, user: string }) => Promise<string> }}
 */
export function createClient({
  baseUrl,
  apiKey,
  model,
  temperature,
  jsonMode = true,
  fetchImpl = fetch,
  sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); }),
  attempts = 3,
  timeoutMs = 60_000,
}) {
  const url = completionsUrl(baseUrl);

  /**
   * One attempt. Throws on any non-2xx status; the caller decides on retries.
   *
   * @param {{ system: string, user: string }} turns
   * @returns {Promise<string>}
   */
  async function once({ system, user }) {
    const response = await fetchImpl(url, {
      method: 'POST',
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        ...(temperature === undefined ? {} : { temperature }),
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!response.ok) {
      const error = new Error(describeErrorResponse(response, await response.text()));

      error.status = response.status;
      throw error;
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;

    if (typeof content !== 'string') {
      throw new Error(`LiteLLM response carried no message content: ${JSON.stringify(payload).slice(0, MAX_PAYLOAD_CHARS)}`);
    }

    return content;
  }

  return {
    async complete(turns) {
      let lastError;

      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
          return await once(turns);
        } catch (error) {
          lastError = error;

          const retryable = error.status === undefined || error.status === 429 || error.status >= 500;

          if (!retryable || attempt === attempts) {
            throw error;
          }

          await sleep(1000 * (2 ** (attempt - 1)));
        }
      }

      throw lastError;
    },
  };
}
