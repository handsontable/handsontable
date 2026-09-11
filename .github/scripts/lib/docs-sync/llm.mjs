/**
 * A minimal OpenAI-compatible chat client for the LiteLLM proxy.
 *
 * No SDK: the repository avoids third-party dependencies, and the call is one
 * POST. `fetch` and `sleep` are injectable so the retry path is unit-tested
 * without a network or a wait.
 */

// An upstream error body (a proxy 4xx, an HTML block page) is the one string in
// this module that a diagnostic needs in full, so it is cut generously rather
// than at a token-frugal 200: 4096 matches the classifier's own body budget in
// `classify.mjs`. Every such message passes through `docs-sync.mjs`'s
// `scrubSecrets` before it reaches a log line or the public step summary, so a
// key echoed back in the body is redacted regardless of this cap.
const MAX_ERROR_CHARS = 4096;

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
 * Build a client bound to one model.
 *
 * @param {object} options
 * @param {string} options.baseUrl
 * @param {string} options.apiKey
 * @param {string} options.model
 * @param {number} [options.temperature] Sampling temperature. Omitted from the
 *   request body entirely when undefined, so the provider's own default
 *   applies -- a reasoning-tier model that rejects any non-default temperature
 *   then accepts the call, while a model that honours it can be pinned (e.g. to
 *   `0`) for repeatable classifications.
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
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!response.ok) {
      const error = new Error(`LiteLLM responded ${response.status}: ${(await response.text()).slice(0, MAX_ERROR_CHARS)}`);

      error.status = response.status;
      throw error;
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;

    if (typeof content !== 'string') {
      throw new Error(`LiteLLM response carried no message content: ${JSON.stringify(payload).slice(0, MAX_ERROR_CHARS)}`);
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
