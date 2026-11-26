/**
 * The scheduled screen reader audit's place in line. One screen reader run at a time, on any ref
 * (`tests/AGENTS.md`, "A11y: the audit and the proof runs"): two runs share the organization's five macOS
 * slots, every VoiceOver step slows down, and the transcripts carry the timings. A person checks for a run in
 * flight before a dispatch. A cron cannot, so the scheduled run of `screenreader-nightly.yml` waits in its
 * `check-inputs` job, before the build (`scripts/screenreader-wait.mjs`), and gives up at a bound instead of
 * starting a second run.
 *
 * It waits for the runs that started before it, and no other. A run dispatched later is its dispatcher's to
 * hold back, since this run is in the list they read before a dispatch. A later run on develop is queued
 * behind this one by the workflow's concurrency group, so waiting for it would be waiting for itself.
 *
 * No I/O in `runsAhead()`; `waitForRunsAhead()` takes its clock, its pause and its list as arguments.
 */
import { setTimeout as pause } from 'node:timers/promises';

/**
 * The event of a run that validates the workflow file and skips every job, so it never takes a lane.
 */
const VALIDATION_EVENT = 'pull_request';

/**
 * How many reads of the runs list may fail in a row before the wait gives up: one answer lost on the way
 * must not cost the week's audit, and a token that cannot list runs must not wait out the bound.
 */
export const LIST_ATTEMPTS = 3;

/**
 * The runs of the workflow this run waits for: every run that started before it, has not completed, and can
 * reach the lanes. A run's id grows with the time it was created, and a re-run keeps its id.
 *
 * @param {Array<{id: number, status: string, event: string}>} runs The workflow's runs, as the API lists them.
 * @param {number|string} runId This run's id (`GITHUB_RUN_ID`).
 * @returns {Array<{id: number, status: string, event: string}>} The runs ahead, in the order given.
 * @throws {Error} On a run id that is not a positive integer: every run would read as later, and nothing as ahead.
 */
export function runsAhead(runs, runId) {
  const self = Number(runId);

  if (!Number.isSafeInteger(self) || self <= 0) {
    throw new Error(`the run id ${JSON.stringify(runId)} is not a positive integer, so no run can be told to be ahead of it`);
  }

  return runs.filter(run => Number.isSafeInteger(run.id) && run.id < self && run.status !== 'completed' && run.event !== VALIDATION_EVENT);
}

/**
 * The newest hundred runs of a workflow, on every ref. A run still in flight is among them.
 *
 * @param {object} input The request.
 * @param {string} input.token The token, with `actions: read`.
 * @param {string} input.repository The `owner/name`.
 * @param {string} input.workflow The workflow's file name.
 * @param {string} [input.apiUrl] The API root; defaults to `https://api.github.com`.
 * @param {typeof fetch} [input.fetchImpl] The fetch to use; tests pass a fake.
 * @returns {Promise<object[]>} The runs, newest first.
 */
export async function listWorkflowRuns({ token, repository, workflow, apiUrl = 'https://api.github.com', fetchImpl = fetch }) {
  const url = `${apiUrl}/repos/${repository}/actions/workflows/${encodeURIComponent(workflow)}/runs?per_page=100`;
  const response = await fetchImpl(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
  });

  if (!response.ok) {
    throw new Error(`GET ${url} answered ${response.status}: ${await response.text()}`);
  }

  const { workflow_runs: runs } = await response.json();

  if (!Array.isArray(runs)) {
    throw new Error(`GET ${url} answered without a list of runs`);
  }

  return runs;
}

/**
 * Waits until no run is ahead of this one, reading the list once per interval, and stops at the bound.
 *
 * @param {object} input The wait.
 * @param {() => Promise<object[]>} input.list Reads the workflow's runs (`listWorkflowRuns()`).
 * @param {number|string} input.runId This run's id.
 * @param {number} input.boundMs How long to wait at most.
 * @param {number} input.intervalMs The pause between two reads.
 * @param {(ms: number) => Promise<unknown>} [input.sleep] The pause; tests pass a fake.
 * @param {() => number} [input.now] The clock, in milliseconds; tests pass a fake.
 * @param {(line: string) => void} [input.log] Where a line per read goes.
 * @returns {Promise<{free: boolean, waitedMs: number, reads: number, ahead: object[]}>} Whether the lanes are
 * free, how long the wait took, how many times the list was read (once when nothing was ahead), and the runs
 * still ahead at the bound (empty when free).
 * @throws {Error} When the list could not be read `LIST_ATTEMPTS` times in a row.
 */
export async function waitForRunsAhead({ list, runId, boundMs, intervalMs, sleep = pause, now = Date.now, log = () => {} }) {
  const startedAt = now();
  let failures = 0;
  let reads = 0;
  let ahead = [];

  for (;;) {
    let read = false;

    reads += 1;

    try {
      ahead = runsAhead(await list(), runId);
      read = true;
      failures = 0;
    } catch (error) {
      failures += 1;

      if (failures >= LIST_ATTEMPTS) {
        throw new Error(`the runs could not be listed ${LIST_ATTEMPTS} times in a row, so it is not known whether a screen reader run is in flight: `
          + `${error instanceof Error ? error.message : String(error)}`);
      }
      log(`could not list the runs (${error instanceof Error ? error.message : String(error)}); reading again`);
    }

    const waitedMs = now() - startedAt;

    if (read && ahead.length === 0) {
      return { free: true, waitedMs, reads, ahead: [] };
    }
    if (waitedMs >= boundMs) {
      return { free: false, waitedMs, reads, ahead };
    }
    if (read) {
      log(`waiting for ${describeRuns(ahead)}; ${Math.floor(waitedMs / 60_000)} of ${Math.round(boundMs / 60_000)} minutes`);
    }

    // eslint-disable-next-line no-restricted-syntax -- the pause between two reads of a remote list, under a bound: a poll interval, not a fixed wait in a spec
    await sleep(intervalMs);
  }
}

/**
 * The runs as one phrase, by id: an id is a number, so the phrase is safe wherever it is printed.
 *
 * @param {Array<{id: number}>} runs The runs.
 * @returns {string} `run 1`, `run 1 and run 2`, or `no run that could be read` for an empty list.
 */
export function describeRuns(runs) {
  return runs.length === 0 ? 'no run that could be read' : runs.map(run => `run ${Number(run.id)}`).join(' and ');
}
