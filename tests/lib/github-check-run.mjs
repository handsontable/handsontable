/**
 * Posts a check run through the Checks API: the first request creates it with the first batch of
 * annotations, and each further batch is a `PATCH` on it, since the API takes at most fifty per
 * request. Shared by `scripts/a11y-check-run.mjs`, `scripts/a11y-evidence-report.mjs` and
 * `scripts/screenreader-report.mjs`, which build their payloads in their own pure modules and post them
 * here, each stamped with the workflow run that posted it (`external_id`). `listCheckRuns()` reads a
 * commit's check runs back for the run verdict (`scripts/a11y-run-verdict.mjs`), which keeps the ones its
 * own run stamped.
 */
import { annotationBatches } from './a11y-check-run.mjs';

/**
 * Creates the check run and returns what the API answered for the creation.
 *
 * @param {object} input The request.
 * @param {string} input.token The token, with `checks: write`.
 * @param {string} input.repository The `owner/name`.
 * @param {string} input.headSha The commit the check run goes on.
 * @param {{name: string, conclusion: string, title: string, summary: string, annotations: object[]}} input.payload The payload.
 * @param {string} [input.detailsUrl] The `details_url`.
 * @param {string} [input.externalId] The `external_id`: the workflow run's id, so the run verdict reads only
 * the check runs its own run posted.
 * @param {string} [input.apiUrl] The API root; defaults to `https://api.github.com`.
 * @param {typeof fetch} [input.fetchImpl] The fetch to use; tests pass a fake.
 * @returns {Promise<{id: number, html_url: string}>} The created check run.
 */
export async function postCheckRun({
  token, repository, headSha, payload, detailsUrl, externalId, apiUrl = 'https://api.github.com', fetchImpl = fetch,
}) {
  const api = `${apiUrl}/repos/${repository}/check-runs`;
  const [first, ...rest] = annotationBatches(payload.annotations);
  const output = annotations => ({ title: payload.title, summary: payload.summary, annotations });
  const send = async(url, method, body) => {
    const response = await fetchImpl(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`${method} ${url} answered ${response.status}: ${await response.text()}`);
    }

    return response.json();
  };
  const created = await send(api, 'POST', {
    name: payload.name,
    head_sha: headSha,
    status: 'completed',
    conclusion: payload.conclusion,
    ...(detailsUrl ? { details_url: detailsUrl } : {}),
    ...(externalId ? { external_id: String(externalId) } : {}),
    output: output(first),
  });

  for (const batch of rest) {
    await send(`${api}/${created.id}`, 'PATCH', { output: output(batch) });
  }

  return created;
}

/**
 * Every check run of a commit, every app's and every suite's (`filter=all` keeps a re-run's earlier check
 * runs too; the caller keeps the latest of each name), a hundred per page until a page comes back short.
 *
 * @param {object} input The request.
 * @param {string} input.token The token, with `checks: read`.
 * @param {string} input.repository The `owner/name`.
 * @param {string} input.sha The commit.
 * @param {string} [input.apiUrl] The API root; defaults to `https://api.github.com`.
 * @param {typeof fetch} [input.fetchImpl] The fetch to use; tests pass a fake.
 * @returns {Promise<object[]>} The check runs.
 */
export async function listCheckRuns({ token, repository, sha, apiUrl = 'https://api.github.com', fetchImpl = fetch }) {
  const runs = [];

  for (let page = 1; ; page += 1) {
    const url = `${apiUrl}/repos/${repository}/commits/${sha}/check-runs?filter=all&per_page=100&page=${page}`;
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    });

    if (!response.ok) {
      throw new Error(`GET ${url} answered ${response.status}: ${await response.text()}`);
    }

    const { check_runs: batch = [] } = await response.json();

    runs.push(...batch);

    if (batch.length < 100) {
      return runs;
    }
  }
}
