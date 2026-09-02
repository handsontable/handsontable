/**
 * Decides what to do when `visual-approved` lands on a pull request.
 *
 * The visual gate reads the label live (`visual.yml`, "Visual approval gate"),
 * so an approval only takes effect on a *new attempt* of the run that failed.
 * Nothing re-runs that attempt on its own, which is why applying the label on
 * its own looked like it did nothing.
 *
 * Pure: no network, file, or environment access, so the branching that decides
 * whether to spend a re-run is unit-testable.
 * `scripts/visual-approval-rerun.mjs` is the wrapper that fetches the run, the
 * jobs and the labels, polls, and calls the re-run endpoint.
 */

export const APPROVAL_LABEL = 'visual-approved';

/**
 * The job that carries the gate. `Visual / Compare` on a pull request, where
 * `test.yml` is the top-level orchestrator; one level deeper when `publish.yml`
 * calls `test.yml`, which is why the match also accepts a suffix.
 */
export const COMPARE_JOB = 'Visual / Compare';

/**
 * How long to keep waiting for a run to appear at all. A run is registered
 * within seconds of a push, so a longer absence means there is nothing coming —
 * a deleted run, or a label applied to a stale head — and polling to the full
 * deadline would hold a runner open for an hour over it.
 */
export const NO_RUN_GRACE_MS = 5 * 60 * 1000;

/**
 * @typedef {object} Decision
 * @property {'wait'|'rerun'|'skip'} action What the caller should do next.
 * @property {string} reason One line for the job log, explaining the action.
 */

/**
 * Decide whether the failed run may be re-run now.
 *
 * The checks are ordered so that the two states which end the wait — the label
 * is gone, or a newer commit arrived — are read before the "still running"
 * branch. Ordered the other way, a pull request that was pushed to during the
 * wait would poll to the deadline before noticing it had nothing left to do.
 *
 * @param {object} options Inputs, all read fresh on every poll.
 * @param {object|null} [options.run] The newest `test.yml` run for the head commit.
 * @param {Array<{name: string, conclusion: string|null}>} [options.jobs] That run's jobs, latest attempt.
 * @param {string[]} [options.labels] The pull request's labels, read live.
 * @param {string} [options.prHeadSha] The pull request's head commit, read live.
 * @param {number} [options.elapsedMs] How long the caller has been polling.
 * @param {string} [options.label] The approval label.
 * @param {string} [options.compareJob] The gate job's name.
 * @param {number} [options.noRunGraceMs] How long a missing run is still worth waiting for.
 * @returns {Decision} What to do.
 */
export function decide({
  run = null,
  jobs = [],
  labels = [],
  prHeadSha = '',
  elapsedMs = 0,
  label = APPROVAL_LABEL,
  compareJob = COMPARE_JOB,
  noRunGraceMs = NO_RUN_GRACE_MS,
}) {
  // `visual-cleanup.yml` strips the label on every push, so this is how a push
  // during the wait cancels the re-run rather than approving screenshots that
  // no longer exist.
  if (!labels.includes(label)) {
    return {
      action: 'skip',
      reason: `The \`${label}\` label is no longer on the pull request, so there is nothing to approve.`,
    };
  }

  if (!run) {
    return elapsedMs >= noRunGraceMs
      ? {
        action: 'skip',
        reason: `No Tests run for ${prHeadSha || 'this commit'} appeared within `
          + `${Math.round(noRunGraceMs / 60000)} minutes, so there is nothing to re-run.`,
      }
      : {
        action: 'wait',
        reason: `No Tests run for ${prHeadSha || 'this commit'} yet.`,
      };
  }

  // Belt and braces with the label check above: the label is stripped by a
  // separate workflow that can lag, and re-running a superseded attempt would
  // put an old commit's build back into `test.yml`'s per-ref concurrency group,
  // where it can cancel the run for the commit people are actually reviewing.
  if (run.head_sha !== prHeadSha) {
    return {
      action: 'skip',
      reason: `A newer commit (${prHeadSha}) was pushed, so run ${run.id} is superseded. `
        + 'Its own build reads the label when it reaches the gate.',
    };
  }

  if (run.status !== 'completed') {
    return {
      action: 'wait',
      reason: `Run ${run.id} is ${run.status}; the re-run endpoint rejects a run that has not finished.`,
    };
  }

  const compare = jobs.find(job => job.name === compareJob || job.name.endsWith(` / ${compareJob}`));

  if (!compare) {
    return {
      action: 'skip',
      reason: `\`${compareJob}\` did not run in this build, so there is no visual verdict to revisit.`,
    };
  }

  // `rerun-failed-jobs` re-runs failures only. A cancelled or timed-out gate
  // never produced a verdict, so it is not something an approval can accept —
  // and asking for a re-run would silently do nothing.
  if (compare.conclusion !== 'failure') {
    return {
      action: 'skip',
      reason: `\`${compare.name}\` ended as \`${compare.conclusion}\`, not \`failure\`, `
        + 'so the label has nothing to turn green.',
    };
  }

  return {
    action: 'rerun',
    reason: `\`${compare.name}\` failed and \`${label}\` is present; `
      + `re-running the failed jobs of run ${run.id}.`,
  };
}
