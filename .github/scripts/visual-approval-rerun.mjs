#!/usr/bin/env node

/**
 * Re-runs the failed visual gate once `visual-approved` is applied.
 *
 * The gate in `visual.yml` reads the label live, so an approval is only read on
 * a new attempt — and nothing starts one. Applying the label therefore left the
 * red `Visual / Compare` (and with it `CI Gate`) exactly as it was until someone
 * pressed "Re-run jobs" by hand. This closes that gap.
 *
 * Two things make this more than a single API call:
 *
 * 1. The sticky comment that prompts the approval is posted by `Compare`, which
 *    is not the last job in the pipeline. So at label time the run is usually
 *    still `in_progress`, and `rerun-failed-jobs` rejects a run that has not
 *    finished. This polls until it has.
 * 2. Everything is re-read on every poll — the label, the head commit, the run,
 *    the job. A push during the wait strips the label (`visual-cleanup.yml`) and
 *    moves the head, and re-running a superseded attempt would rejoin
 *    `test.yml`'s per-ref concurrency group and could cancel the newer run.
 *
 * `rerun-failed-jobs` rather than a single-job re-run: `CI Gate` lives in the
 * calling workflow and is failed too, so this endpoint picks both up with their
 * `needs` order intact. Whether a single-job re-run reaches across the reusable
 * workflow boundary to the caller's dependent job is not something to bet the
 * merge gate on.
 *
 * All branching lives in `./lib/visual-approval-rerun.mjs`, which is pure and
 * unit-tested; this wrapper only talks to the API and sleeps.
 *
 * Usage: node .github/scripts/visual-approval-rerun.mjs
 */

import { setTimeout as sleep } from 'node:timers/promises';
import { APPROVAL_LABEL, COMPARE_JOB, decide } from './lib/visual-approval-rerun.mjs';

const API = process.env.GITHUB_API_URL || 'https://api.github.com';
const token = process.env.GH_TOKEN;
const repo = process.env.GH_REPO;
const prNumber = process.env.PR_NUMBER;
const workflowFile = process.env.WORKFLOW_FILE || 'test.yml';
const pollSeconds = Number(process.env.POLL_INTERVAL_SECONDS || 60);
const deadlineMs = Date.now() + (Number(process.env.WAIT_TIMEOUT_MINUTES || 90) * 60 * 1000);
// Set by the unit-testable dry run in CI debugging and by local invocations, so
// the decision can be exercised without spending a build.
const dryRun = process.env.DRY_RUN === 'true';

if (!token || !repo || !prNumber) {
  throw new Error('GH_TOKEN, GH_REPO and PR_NUMBER are all required.');
}

/**
 * Call the GitHub REST API and parse the response.
 *
 * Reads are retried on a rate limit, a server error, or a dropped connection:
 * this polls for up to an hour and a half, so a single blip must not throw away
 * an approval and send the contributor back to re-running the job by hand.
 * Writes are never retried — the only write here is the re-run itself, and it is
 * not worth risking a second trigger to save a re-label.
 *
 * @param {string} path Path below the API root, starting with a slash.
 * @param {object} [init] `fetch` options.
 * @returns {Promise<object|null>} The parsed body, or `null` for an empty one.
 */
async function api(path, init = {}) {
  const method = init.method || 'GET';
  const attempts = method === 'GET' ? 3 : 1;
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (attempt > 1) {
      await sleep(attempt * 5000);
    }

    let response;

    try {
      response = await fetch(`${API}${path}`, {
        ...init,
        headers: {
          accept: 'application/vnd.github+json',
          authorization: `Bearer ${token}`,
          'x-github-api-version': '2022-11-28',
          ...init.headers,
        },
      });
    } catch (error) {
      lastError = new Error(`${method} ${path} -> ${error.message}`);
      continue;
    }

    if (response.ok) {
      const body = await response.text();

      return body ? JSON.parse(body) : null;
    }

    lastError = new Error(`${method} ${path} -> ${response.status} ${await response.text()}`);

    // A 4xx other than a rate limit is a real answer — a deleted run, a token
    // without the grant — and repeating it only delays the report.
    if (response.status < 500 && response.status !== 429) {
      break;
    }
  }

  throw lastError;
}

/**
 * Read the pull request's live head commit and labels.
 *
 * The event payload carries both, but it is a snapshot of the moment the label
 * was applied — the very staleness this script exists to work around.
 *
 * @returns {Promise<{headSha: string, labels: string[]}>} The live state.
 */
async function readPullRequest() {
  const pr = await api(`/repos/${repo}/pulls/${prNumber}`);

  return { headSha: pr.head.sha, labels: pr.labels.map(({ name }) => name) };
}

/**
 * Find the newest `test.yml` run for a commit.
 *
 * @param {string} headSha The commit to look for.
 * @returns {Promise<object|null>} The run, or `null` when none exists yet.
 */
async function readRun(headSha) {
  const query = `head_sha=${headSha}&event=pull_request&per_page=1`;
  const { workflow_runs: runs } = await api(
    `/repos/${repo}/actions/workflows/${workflowFile}/runs?${query}`
  );

  return runs[0] ?? null;
}

/**
 * Read a run's jobs for its latest attempt, following pagination.
 *
 * @param {number} runId The run.
 * @returns {Promise<Array<object>>} Every job of the latest attempt.
 */
async function readJobs(runId) {
  const jobs = [];

  for (let page = 1; ; page += 1) {
    const result = await api(`/repos/${repo}/actions/runs/${runId}/jobs?filter=latest&per_page=100&page=${page}`);

    jobs.push(...result.jobs);

    if (jobs.length >= result.total_count || result.jobs.length === 0) {
      break;
    }
  }

  return jobs;
}

const startedAt = Date.now();
let decision = null;
let run = null;

while (Date.now() < deadlineMs) {
  const { headSha, labels } = await readPullRequest();

  run = await readRun(headSha);
  decision = decide({
    run,
    jobs: run && run.status === 'completed' ? await readJobs(run.id) : [],
    labels,
    prHeadSha: headSha,
    elapsedMs: Date.now() - startedAt,
  });

  if (decision.action !== 'wait') {
    break;
  }

  console.log(`Waiting: ${decision.reason}`);
  await sleep(pollSeconds * 1000);
}

if (!decision || decision.action === 'wait') {
  console.error(`::error::Gave up waiting for the ${workflowFile} run to finish. `
    + `Re-run the \`${COMPARE_JOB}\` job by hand to apply the \`${APPROVAL_LABEL}\` label.`);
  process.exitCode = 1;
} else if (decision.action === 'skip') {
  console.log(`::notice::${decision.reason}`);
} else if (dryRun) {
  console.log(`::notice::[dry run] ${decision.reason}`);
} else {
  console.log(decision.reason);
  await api(`/repos/${repo}/actions/runs/${run.id}/rerun-failed-jobs`, { method: 'POST' });
  console.log(`::notice::Re-running the failed jobs of ${run.html_url}. `
    + `The gate reads \`${APPROVAL_LABEL}\` on this attempt and turns green.`);
}
