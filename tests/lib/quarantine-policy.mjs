/**
 * The quarantine policy for known-flaky Playwright specs: the pure half.
 *
 * `tests/playwright.config.ts` runs with `retries: 1` and `failOnFlakyTests` in
 * CI, so a test that passes only on retry fails the leg. That is the right
 * default (a retry that hides a flake is worse than a red job that names it),
 * but with no quarantine a known flake reddens every unrelated pull request
 * until someone fixes it. Quarantine is the narrow, expiring, capped exception:
 *
 * - A quarantined test still RUNS and still REPORTS. Its flaky verdict is
 *   downgraded from "fail the job" to "report", never to "skip". A test that
 *   fails outright is not covered: quarantine is for flakes, not for failures.
 * - Every entry names the owning task and an expiry date, at most
 *   `QUARANTINE_MAX_DAYS` ahead of the day it is written. Once expired, a flaky
 *   verdict fails the job again, and the tag on a passing test asks to be
 *   removed.
 * - At most `QUARANTINE_CAP` tests are quarantined at once; the next one fails
 *   the job until one is fixed, so quarantine cannot become the new normal.
 * - Playwright tier only. The frozen Jasmine suite migrates instead.
 *
 * `tests/fixtures/quarantine.ts` is the spec-side helper, `tests/reporters/
 * quarantine.ts` the reporter that applies `evaluateRun()` to the finished run.
 * No I/O in here. The policy is written up in `tests/AGENTS.md`.
 */

// eslint-disable-next-line no-restricted-syntax -- this defines the tag the rule bans elsewhere
export const QUARANTINE_TAG = '@quarantine';
export const QUARANTINE_ANNOTATION = 'quarantine';
export const QUARANTINE_CAP = 6;
export const QUARANTINE_MAX_DAYS = 30;

const TASK_ID = /^[A-Z][A-Z0-9]*-\d+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DESCRIPTION = /^([A-Z][A-Z0-9]*-\d+) until (\d{4}-\d{2}-\d{2})(?: — (.+))?$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The annotation text a quarantine entry carries: `DEV-1234 until 2026-10-08`,
 * optionally followed by ` — <why>`.
 *
 * @param {string} taskId The owning task.
 * @param {string} expires The expiry date, `YYYY-MM-DD`.
 * @param {string} [why] One line on what flakes and why it is parked.
 * @returns {string} The description.
 */
export function describeQuarantine(taskId, expires, why) {
  return `${taskId} until ${expires}${why ? ` — ${why}` : ''}`;
}

/**
 * The entry behind an annotation text, or `null` when the text is not one.
 *
 * @param {string|undefined} description The annotation description.
 * @returns {{taskId: string, expires: string, why: string|null}|null} The entry.
 */
export function parseQuarantine(description) {
  const match = DESCRIPTION.exec(description ?? '');

  return match ? { taskId: match[1], expires: match[2], why: match[3] ?? null } : null;
}

/**
 * Why a quarantine entry is not acceptable, or `null` when it is. Checked when
 * the spec file loads (`quarantined()` throws), so a malformed entry never
 * reaches a run.
 *
 * @param {unknown} taskId The owning task id.
 * @param {unknown} expires The expiry date.
 * @param {Date} now The current time.
 * @returns {string|null} The problem, or `null`.
 */
export function validateQuarantine(taskId, expires, now) {
  if (typeof taskId !== 'string' || !TASK_ID.test(taskId)) {
    return 'a quarantine names the owning task id (`DEV-1234`)';
  }
  if (typeof expires !== 'string' || !ISO_DATE.test(expires)
    || Number.isNaN(Date.parse(`${expires}T00:00:00Z`))
    || new Date(`${expires}T00:00:00Z`).toISOString().slice(0, 10) !== expires) {
    // The round-trip catches a real day that rolled: `Date.parse('2026-02-30')` is March 2, not NaN.
    return 'a quarantine carries an expiry date (`YYYY-MM-DD`)';
  }
  if (Date.parse(`${expires}T00:00:00Z`) > now.getTime() + (QUARANTINE_MAX_DAYS * DAY_MS)) {
    return `a quarantine expires within ${QUARANTINE_MAX_DAYS} days; ${expires} is further away`;
  }

  return null;
}

/**
 * Whether an entry has expired. The expiry day itself still counts (UTC).
 *
 * @param {string} expires The expiry date, `YYYY-MM-DD`.
 * @param {Date} now The current time.
 * @returns {boolean} `true` once the day after the expiry date has begun.
 */
export function isExpired(expires, now) {
  return now.getTime() >= Date.parse(`${expires}T00:00:00Z`) + DAY_MS;
}

/**
 * @typedef {object} RunTest
 * @property {string} title The test's title path below the file, ` › `-joined.
 * @property {string} file The spec file, relative to the tests package.
 * @property {string} project The Playwright project the test ran in.
 * @property {'skipped'|'expected'|'unexpected'|'flaky'} outcome Playwright's outcome for the test.
 * @property {Array<{type: string, description?: string}>} annotations The test's annotations.
 */

/**
 * The quarantine entry of a test, when it carries one.
 *
 * @param {RunTest} test The test.
 * @returns {{entry: object|null, error: string|null}} The parsed entry, or why the annotation is unusable.
 */
function quarantineOf(test) {
  const annotation = (test.annotations ?? []).find(candidate => candidate.type === QUARANTINE_ANNOTATION);

  if (!annotation) {
    return { entry: null, error: null };
  }

  const entry = parseQuarantine(annotation.description);

  return entry
    ? { entry, error: null }
    : { entry: null, error: `unreadable quarantine annotation ${JSON.stringify(annotation.description ?? '')}; `
      + 'write it with quarantined() from fixtures/quarantine' };
}

/**
 * Apply the policy to a finished run and decide its status.
 *
 * @param {object} input The run.
 * @param {RunTest[]} input.tests Every test of the run, all projects.
 * @param {Date} input.now The current time.
 * @param {'passed'|'failed'|'timedout'|'interrupted'} input.runStatus Playwright's own verdict.
 * @param {boolean} [input.hadErrors] Whether the run reported an error outside any test (a crashed worker,
 * a config problem). Such a run is never downgraded.
 * @param {number} [input.cap] Override of `QUARANTINE_CAP`.
 * @returns {{
 *   status: 'passed'|'failed'|'timedout'|'interrupted',
 *   downgraded: boolean,
 *   quarantineCount: number,
 *   quarantinedFlaky: number,
 *   problems: string[],
 *   notes: string[],
 *   warnings: string[],
 * }} The verdict: `problems` fail the run and are printed as errors, `notes` are printed, `warnings` are
 * GitHub `::warning` lines for the checks tab.
 */
export function evaluateRun({ tests, now, runStatus, hadErrors = false, cap = QUARANTINE_CAP }) {
  const quarantined = new Map();
  const problems = [];
  const notes = [];
  const warnings = [];
  let quarantinedFlaky = 0;
  let unexplainedFailures = 0;

  for (const test of tests) {
    const where = `${test.file} › ${test.title}${test.project ? ` [${test.project}]` : ''}`;
    const { entry, error } = quarantineOf(test);

    if (error) {
      problems.push(`${where}: ${error}`);
    }
    if (entry) {
      quarantined.set(`${test.file}|${test.title}`, entry);
    }

    const expired = entry ? isExpired(entry.expires, now) : false;
    // Re-check the horizon at run time: `quarantined()` checks it when the spec loads, but a
    // hand-written annotation (via the exported `describeQuarantine`, or a raw push) could carry a
    // far-future date and be downgraded forever. A live quarantine is unexpired AND within horizon.
    const live = entry && !expired
      && Date.parse(`${entry.expires}T00:00:00Z`) <= now.getTime() + (QUARANTINE_MAX_DAYS * DAY_MS);

    if (test.outcome === 'unexpected') {
      unexplainedFailures += 1;

      if (entry && !expired) {
        // Quarantine covers a flake, not a genuine failure — say so, or the log reads as
        // "quarantine is broken" next to a red leg that a real failure caused.
        notes.push(`${where}: FAILED outright (not flaky), which quarantine (${entry.taskId}) does not cover`);
      }
    } else if (test.outcome === 'flaky') {
      if (live) {
        quarantinedFlaky += 1;
        notes.push(`quarantined flaky test, reported and not failing the run: ${where} `
          + `(${entry.taskId} until ${entry.expires})`);
        warnings.push(`::warning title=Quarantined flaky test (${entry.taskId})::${where} passed only on retry; `
          + `quarantined until ${entry.expires}.`);
      } else if (entry) {
        unexplainedFailures += 1;
        const why = expired
          ? `expired on ${entry.expires}`
          : `expires ${entry.expires}, beyond the ${QUARANTINE_MAX_DAYS}-day horizon`;

        problems.push(`${where}: flaky, and its quarantine (${entry.taskId}) ${why} `
          + '— fix it, or re-quarantine it with a valid expiry');
      } else {
        unexplainedFailures += 1;
      }
    } else if (entry && expired) {
      notes.push(`quarantine expired on ${entry.expires} and the test passes: remove the tag `
        + `(${where}, ${entry.taskId})`);
      warnings.push(`::warning title=Expired quarantine (${entry.taskId})::${where} passes; `
        + `its quarantine expired on ${entry.expires}, remove the tag.`);
    }
  }

  if (quarantined.size > cap) {
    problems.push(`quarantine cap exceeded: ${quarantined.size} tests are quarantined and the cap is ${cap}; `
      + 'fix one before parking another');
  }

  let status = runStatus;

  if (runStatus === 'passed' || runStatus === 'failed') {
    if (problems.length > 0 || unexplainedFailures > 0 || hadErrors) {
      status = 'failed';
    } else if (runStatus === 'failed' && quarantinedFlaky > 0) {
      status = 'passed';
    }
  }

  return {
    status,
    downgraded: status !== runStatus,
    quarantineCount: quarantined.size,
    quarantinedFlaky,
    problems,
    notes,
    warnings,
  };
}
