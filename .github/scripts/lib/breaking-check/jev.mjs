/**
 * A minimal client for TypeSafe's Jev model ("System One"), reached through the
 * LiteLLM passthrough. Jev answers "Noul" questions -- a probability in [0, 1]
 * that a yes/no statement about the given `state` is true.
 *
 * No SDK: the repository avoids third-party dependencies, and the call is one
 * POST. `fetch` and `sleep` are injectable, mirroring `docs-sync/llm.mjs`, so
 * the retry path is unit-tested without a network or a wait.
 */

// A malformed or oversized response body is cut here before it enters a thrown
// Error's message or a log line; the size is generous enough to keep a useful
// excerpt without repeating a multi-KB payload verbatim.
const MAX_PAYLOAD_CHARS = 4096;

/**
 * Thrown when Jev rejects a request because `state` plus the longest question
 * exceeds its input budget (HTTP 400 with `max_tokens_exceeded` in the body).
 * Never retried; the breaking-check detector falls back to code-only detection.
 */
export class JevInputTooLargeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'JevInputTooLargeError';
  }
}

/**
 * The System One endpoint for a LiteLLM base URL, joined so there is exactly
 * one slash regardless of whether the base already ends with one.
 *
 * @param {string} baseUrl
 * @returns {string}
 */
export function systemOneUrl(baseUrl) {
  const base = baseUrl.replace(/\/+$/, '');

  return `${base}/typesafe/v1/systemone`;
}

/**
 * Build a client bound to one Jev model.
 *
 * @param {object} options
 * @param {string} options.baseUrl
 * @param {string} options.apiKey
 * @param {string} [options.model] Defaults to `jev-latest`.
 * @param {typeof fetch} [options.fetchImpl]
 * @param {(ms: number) => Promise<void>} [options.sleep]
 * @param {number} [options.attempts] Total attempts, including the first.
 * @param {number} [options.timeoutMs] Per-attempt fetch timeout, in milliseconds.
 * @returns {{ ask: (state: object, questions: object) => Promise<{ answers: object, usage: object, model: string }> }}
 */
export function createJevClient({
  baseUrl,
  apiKey,
  model = 'jev-latest',
  fetchImpl = fetch,
  sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); }),
  attempts = 3,
  timeoutMs = 60_000,
}) {
  const url = systemOneUrl(baseUrl);

  /**
   * One attempt. Throws `JevInputTooLargeError` on the input-too-large 400,
   * and a plain Error (with a `status`) on any other non-2xx response. The
   * caller decides on retries.
   *
   * @param {object} state
   * @param {object} questions
   * @returns {Promise<{ answers: object, usage: object, model: string }>}
   */
  async function once(state, questions) {
    const response = await fetchImpl(url, {
      method: 'POST',
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, state, questions }),
    });

    if (!response.ok) {
      const bodyText = await response.text();

      if (response.status === 400 && bodyText.includes('max_tokens_exceeded')) {
        throw new JevInputTooLargeError(
          `Jev input too large (state + longest question exceeds the 32k-token limit): `
          + `${bodyText.slice(0, MAX_PAYLOAD_CHARS)}`,
        );
      }

      const statusLine = `Jev responded ${response.status} ${response.statusText ?? ''}`.trimEnd();
      const error = new Error(`${statusLine}: ${bodyText.slice(0, MAX_PAYLOAD_CHARS)}`);

      error.status = response.status;
      throw error;
    }

    const payload = await response.json();

    if (!payload || typeof payload !== 'object' || typeof payload.answers !== 'object' || payload.answers === null) {
      throw new Error(`Jev response carried no answers: ${JSON.stringify(payload).slice(0, MAX_PAYLOAD_CHARS)}`);
    }

    return { answers: payload.answers, usage: payload.usage ?? {}, model: payload.model };
  }

  return {
    /**
     * Ask Jev the given questions about the given state, retrying on a
     * network error, 429, or 5xx (including 529) with 1s/2s/... backoff.
     * A `JevInputTooLargeError` is never retried.
     *
     * @param {object} state
     * @param {object} questions
     * @returns {Promise<{ answers: object, usage: object, model: string }>}
     */
    async ask(state, questions) {
      let lastError;

      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
          return await once(state, questions);
        } catch (error) {
          if (error instanceof JevInputTooLargeError) {
            throw error;
          }

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
