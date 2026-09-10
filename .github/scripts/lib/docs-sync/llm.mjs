/**
 * A minimal OpenAI-compatible chat client for the LiteLLM proxy.
 *
 * No SDK: the repository avoids third-party dependencies, and the call is one
 * POST. `fetch` and `sleep` are injectable so the retry path is unit-tested
 * without a network or a wait.
 */

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
 * @param {typeof fetch} [options.fetchImpl]
 * @param {(ms: number) => Promise<void>} [options.sleep]
 * @param {number} [options.attempts] Total attempts, including the first.
 * @returns {{ complete: (turns: { system: string, user: string }) => Promise<string> }}
 */
export function createClient({
  baseUrl,
  apiKey,
  model,
  fetchImpl = fetch,
  sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); }),
  attempts = 3,
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
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!response.ok) {
      const error = new Error(`LiteLLM responded ${response.status}: ${(await response.text()).slice(0, 200)}`);

      error.status = response.status;
      throw error;
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;

    if (typeof content !== 'string') {
      throw new Error(`LiteLLM response carried no message content: ${JSON.stringify(payload).slice(0, 200)}`);
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
