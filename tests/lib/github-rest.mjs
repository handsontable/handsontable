/**
 * A small REST client for the scripts that read a pull request through the GitHub API (the axe scan's check run and
 * its sticky comment). The jobs run in the Playwright container, which has no `gh`, so it is `fetch`.
 */

/**
 * A REST client: `request(url, {method, payload, raw})` sends one request and returns its body, rejecting with an
 * error that carries `status` on an error status.
 *
 * @param {object} input The client.
 * @param {string} [input.token] The token.
 * @param {typeof fetch} [input.fetchImpl] The fetch to use; tests pass a fake.
 * @returns {(url: string, options?: {method?: string, payload?: object, raw?: boolean}) => Promise<any>} The client:
 * parsed JSON, or the text when `raw` (a file's raw content).
 */
export function restClient({ token, fetchImpl = fetch } = {}) {
  return async function request(url, { method = 'GET', payload, raw = false } = {}) {
    const response = await fetchImpl(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(payload ? { 'Content-Type': 'application/json' } : {}),
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    if (!response.ok) {
      throw Object.assign(new Error(`${method} ${url} answered ${response.status}: ${await response.text()}`), { status: response.status });
    }

    return raw ? response.text() : response.json();
  };
}
