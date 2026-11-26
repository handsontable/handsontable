/**
 * Holds the scheduled screen reader audit back while an earlier run of the workflow is in flight
 * (`waitForRunsAhead()` of `lib/screenreader-queue.mjs`): one screen reader run at a time, on any ref, because
 * two share the organization's macOS slots and slow every VoiceOver step. A cron cannot see a proof run on a
 * branch, so the scheduled run waits here before its build, and at the bound it fails with an error annotation
 * instead of starting a second run. Re-running the failed job once the lanes are free starts the audit on the
 * commit the schedule read.
 *
 * Run by the `check-inputs` job of `.github/workflows/screenreader-nightly.yml`, on the `schedule` event only: a
 * dispatch does not wait, since its dispatcher checks for a run in flight first.
 *
 * Arguments: `--workflow <file name>` (the workflow whose runs to read), `--bound-minutes <n>` (how long to wait
 * at most), `--interval-seconds <n>` (the pause between two reads).
 *
 * Environment: `GITHUB_TOKEN` (with `actions: read`), `GITHUB_REPOSITORY`, `GITHUB_RUN_ID`, and optionally
 * `GITHUB_API_URL` and `GITHUB_STEP_SUMMARY`.
 *
 * Exits 0 when the lanes are free, 1 when they are not at the bound or the runs could not be read, 2 on a
 * missing argument.
 */
import { appendFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { workflowCommand } from '../lib/a11y-baseline.mjs';
import { describeRuns, listWorkflowRuns, waitForRunsAhead } from '../lib/screenreader-queue.mjs';

const env = process.env;
const { values } = parseArgs({
  options: {
    workflow: { type: 'string' },
    'bound-minutes': { type: 'string' },
    'interval-seconds': { type: 'string' },
  },
});
const workflow = values.workflow;
const boundMs = Number(values['bound-minutes']) * 60_000;
const intervalMs = Number(values['interval-seconds']) * 1000;
const say = line => process.stdout.write(`screenreader-wait: ${line}\n`);

/**
 * Says why the lanes did not start, as an error annotation.
 *
 * @param {string} message The reason.
 * @returns {number} The exit status of a refusal.
 */
function refuse(message) {
  process.stdout.write(`${workflowCommand('error', 'Screen reader lanes', message)}\n`);
  process.stderr.write(`screenreader-wait: ${message}\n`);

  return 1;
}

/**
 * Waits for the lanes and says how it went.
 *
 * @returns {Promise<number>} The exit status.
 */
async function wait() {
  if (!workflow || !(boundMs > 0) || !(intervalMs > 0)) {
    process.stderr.write('screenreader-wait: name --workflow, and a --bound-minutes and an --interval-seconds above zero.\n');

    return 2;
  }

  const unset = ['GITHUB_TOKEN', 'GITHUB_REPOSITORY', 'GITHUB_RUN_ID'].find(name => !env[name]);

  if (unset) {
    return refuse(`${unset} is not set, so the runs of ${workflow} could not be read.`);
  }

  let result;

  try {
    result = await waitForRunsAhead({
      list: () => listWorkflowRuns({ token: env.GITHUB_TOKEN, repository: env.GITHUB_REPOSITORY, workflow, apiUrl: env.GITHUB_API_URL || undefined }),
      runId: env.GITHUB_RUN_ID,
      boundMs,
      intervalMs,
      log: say,
    });
  } catch (error) {
    return refuse(error instanceof Error ? error.message : String(error));
  }

  const minutes = Math.round(result.waitedMs / 60_000);

  if (!result.free) {
    return refuse(`the scheduled audit waited ${minutes} minutes and ${describeRuns(result.ahead)} of ${workflow} did not finish. `
      + 'One screen reader run at a time, so the lanes did not start. Re-run this job once the lanes are free: it starts the audit '
      + 'on the commit the schedule read (tests/AGENTS.md, "A11y: the audit and the proof runs").');
  }
  if (result.reads === 1) {
    say('no earlier screen reader run is in flight; the lanes can start');

    return 0;
  }

  say(`the earlier screen reader runs finished after ${minutes} minutes; the lanes can start`);
  if (env.GITHUB_STEP_SUMMARY) {
    appendFileSync(env.GITHUB_STEP_SUMMARY, `The scheduled audit waited ${minutes} minutes for an earlier screen reader run to finish.\n`);
  }

  return 0;
}

process.exitCode = await wait();
