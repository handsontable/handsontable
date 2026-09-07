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
 * Polling rather than `on: workflow_run: [completed]`, which would need no wait
 * at all: a `workflow_run` workflow always runs the copy of itself on the
 * DEFAULT branch, so a change to it could never be exercised by the pull request
 * that makes the change — including the pull request that introduced this file.
 * The cost is one idle runner for the length of a pipeline. Minutes are free on
 * a public repository, but the concurrent-job slot is real; revisit this if
 * approvals ever become frequent enough to contend for one.
 *
 * All branching lives in `./lib/visual-approval-rerun.mjs`, which is pure and
 * unit-tested; this wrapper only talks to the API and sleeps.
 *
 * Usage: node .github/scripts/visual-approval-rerun.mjs
 */

import { setTimeout as sleep } from 'node:timers/promises';
import {
  APPROVAL_LABEL, COMPARE_JOB, decide, selectRun,
} from './lib/visual-approval-rerun.mjs';

const API = process.env.GITHUB_API_URL || 'https://api.github.com';
const token = process.env.GH_TOKEN;
const repo = process.env.GH_REPO;
const prNumber = process.env.PR_NUMBER;
const workflowFile = process.env.WORKFLOW_FILE || 'test.yml';
const pollSeconds = Number(process.env.POLL_INTERVAL_SECONDS || 60);
const deadlineMs = Date.now() + (Number(process.env.WAIT_TIMEOUT_MINUTES || 90) * 60 * 1000);
// The head commit as it was when the label was applied. An approval covers the
// screenshots someone actually looked at, so if the head moves the approval no
// longer applies. Nothing derives this from the run: the run is looked up BY the
// live head, so its own `head_sha` can never disagree with it.
const labeledHeadSha = process.env.LABELED_HEAD_SHA || '';
// No workflow sets this. It exists so the whole decision path can be exercised
// against a real pull request from a shell, without spending a build.
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

  // Set from a `retry-after` when the server names its own delay, so the loop
  // waits that long INSTEAD of the linear backoff rather than on top of it.
  let backoffMs = 0;
  let response;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (attempt > 1) {
      await sleep(backoffMs || attempt * 5000);
    }

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

    // GitHub reports BOTH rate limits as 403, not 429: a primary exhaustion
    // zeroes `x-ratelimit-remaining`, a secondary one sets `retry-after`. Since
    // this poller spends two requests a minute for up to an hour and a half
    // against a budget shared with every other workflow, that is the failure it
    // is most likely to meet — treating it as fatal would throw away the
    // approval over the one error worth waiting out.
    const retryAfter = Number(response.headers.get('retry-after'));
    const rateLimited = response.status === 429
      || (response.status === 403
        && (response.headers.get('x-ratelimit-remaining') === '0' || retryAfter > 0));

    // Any other 4xx is a real answer — a deleted run, a token without the grant
    // — and repeating it only delays the report.
    if (response.status < 500 && !rateLimited) {
      break;
    }

    backoffMs = retryAfter > 0 ? Math.min(retryAfter, 60) * 1000 : 0;
  }

  throw lastError;
}

/**
 * Read the pull request's live head commit and labels.
 *
 * The event payload carries both, but it is a snapshot of the moment the label
 * was applied — the very staleness this script exists to work around.
 *
 * @returns {Promise<{headSha: string, headRef: string, state: string, labels: string[]}>} The live state.
 */
async function readPullRequest() {
  const pr = await api(`/repos/${repo}/pulls/${prNumber}`);

  return {
    headSha: pr.head.sha,
    headRef: pr.head.ref,
    state: pr.state,
    labels: pr.labels.map(({ name }) => name),
  };
}

/**
 * Fetch the `test.yml` runs for a commit and hand them to `selectRun`.
 *
 * @param {string} headSha The commit to look for.
 * @param {string} headRef The pull request's head branch.
 * @returns {Promise<object|null>} The run, or `null` when none exists yet.
 */
async function readRun(headSha, headRef) {
  const query = `head_sha=${headSha}&event=pull_request&per_page=10`;
  const { workflow_runs: runs } = await api(
    `/repos/${repo}/actions/workflows/${workflowFile}/runs?${query}`
  );

  return selectRun(runs, headRef);
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

/**
 * The message every unhappy ending shares: say what to do instead.
 *
 * @param {string} why What went wrong.
 * @returns {undefined}
 */
function giveUp(why) {
  console.error(`::error::${why} Re-run the \`${COMPARE_JOB}\` job by hand to apply the `
    + `\`${APPROVAL_LABEL}\` label.`);
  process.exitCode = 1;
}

try {
  while (Date.now() < deadlineMs) {
    const { headSha, headRef, state, labels } = await readPullRequest();

    run = await readRun(headSha, headRef);
    decision = decide({
      run,
      jobs: run && run.status === 'completed' ? await readJobs(run.id) : [],
      labels,
      prHeadSha: headSha,
      prState: state,
      labeledHeadSha,
      elapsedMs: Date.now() - startedAt,
    });

    if (decision.action !== 'wait') {
      break;
    }

    console.log(`Waiting: ${decision.reason}`);
    await sleep(pollSeconds * 1000);
  }
} catch (error) {
  // Without this the poll loop's rejection reaches the top level as a bare
  // stack trace: a red check, no annotation, and nothing telling the
  // contributor their approval was dropped or what to do about it.
  giveUp(`The GitHub API call failed: ${error.message}.`);
}

if (process.exitCode) {
  // The catch above already reported; do not also act on a stale decision.
} else if (!decision || decision.action === 'wait') {
  giveUp(`Gave up waiting for the ${workflowFile} run to finish.`);
} else if (decision.action === 'skip') {
  console.log(`::notice::${decision.reason}`);
} else if (dryRun) {
  console.log(`::notice::[dry run] ${decision.reason}`);
} else {
  console.log(decision.reason);

  // Inside its own try for the same reason the poll loop has one: this is the
  // call the whole workflow exists to make, and it is not retried, so a 403 or
  // a 409 here would otherwise end as a bare stack trace — a red check with no
  // annotation and nothing telling the contributor the approval was dropped.
  try {
    await api(`/repos/${repo}/actions/runs/${run.id}/rerun-failed-jobs`, { method: 'POST' });
    console.log(`::notice::Re-running the failed jobs of ${run.html_url}. `
      + `The gate reads \`${APPROVAL_LABEL}\` on this attempt and turns green.`);
  } catch (error) {
    giveUp(`Could not re-run ${run.html_url}: ${error.message}.`);
  }
}
