// Turns the gate's verdict into the job's outcome: the composite's last step, after the report is
// deployed and the comment is posted, so nothing it decides can hide the numbers behind it.
//
// Kept apart from lib/gate.mjs, which decides the verdict inside the teardown. This side reads it
// back and says what the workflow does next. A regression in block mode does not fail the job: it
// hands over to performance.yml's `approve` job, which waits on the `performance-approval`
// environment, the same mechanism as the visual and manual QA gates. A reviewer approves an intended
// slowdown there; rejecting it fails the job and `CI Gate` with it.

import { gateMode } from './gate.mjs';
import { fmtMsDelta, fmtPct } from './thresholds.mjs';

// What the step exports as its `verdict` output. `approve` runs on REGRESSED only.
export const OUTCOMES = Object.freeze({
  REGRESSED: 'regressed',
  WARNED: 'warned',
  PASSED: 'passed',
  NOT_ASSESSED: 'not-assessed',
  MISSING: 'missing',
});

export const APPROVAL_ENVIRONMENT = 'performance-approval';

/**
 * A workflow command. The message is percent-encoded the way the runner expects, so a value that
 * holds a newline or a `%` stays one annotation.
 *
 * @param {'error' | 'warning' | 'notice'} level
 * @param {string} title -- a constant with no `,` or `:`
 * @param {string} message
 * @returns {string}
 */
function command(level, title, message) {
  const encoded = message.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

  return `::${level} title=${title}::${encoded}`;
}

/**
 * @param {object} verdict -- from decideGate
 * @returns {string} what failed, in one line
 */
export function describeFailure(verdict) {
  const parts = verdict.failing.map((scenario) => {
    const metrics = [];

    if (scenario.overTiming) {
      metrics.push(`${fmtPct(scenario.timingPct)} (${fmtMsDelta(scenario.deltaMs)})`);
    }

    if (scenario.overHeap) {
      metrics.push(`heap ${fmtPct(scenario.heapPct)}`);
    }

    return `${scenario.title} ${metrics.join(', ')}`;
  });

  if (verdict.shiftFailed) {
    parts.push(verdict.reason);
  }

  return parts.join('; ');
}

/**
 * What the enforce step exports, prints, and how it exits.
 *
 * - No verdict: the teardown never wrote one, so nothing was judged. In block mode that fails the
 *   job (the gate never passes what it could not see); in warn mode it is a warning, since a run that
 *   died before its teardown is already red for its own reason.
 * - `fail` in block mode: REGRESSED, and the job stays green so `approve` can ask a reviewer.
 * - `fail` in warn mode: WARNED, a warning that names what would have needed an approval.
 * - Everything else passes; `not-assessed` says why.
 *
 * Only a missing verdict in block mode exits non-zero, so an unset output never comes with a green
 * job: an empty `verdict` skips `approve`, which is only safe when the run is red anyway.
 *
 * @param {object} input
 * @param {object | null} input.verdict -- the parsed verdict file, or null when it is missing
 * @param {Record<string, string | undefined>} [input.env] -- for the mode when there is no verdict
 * @returns {{ outcome: string, exitCode: 0 | 1, lines: string[] }}
 */
export function enforcement({ verdict, env = process.env }) {
  if (!verdict) {
    const message = 'the performance teardown wrote no verdict, so nothing was judged. Check the '
      + '"Run performance tests" step.';

    return gateMode(env) === 'block'
      ? { outcome: OUTCOMES.MISSING, exitCode: 1, lines: [command('error', 'Performance gate', message)] }
      : { outcome: OUTCOMES.MISSING, exitCode: 0, lines: [command('warning', 'Performance gate', message)] };
  }

  if (verdict.status === 'fail') {
    const failure = describeFailure(verdict);

    if (verdict.mode === 'block') {
      return {
        outcome: OUTCOMES.REGRESSED,
        exitCode: 0,
        lines: [command('warning', 'Performance gate', `${failure}. Waiting for a reviewer on the `
          + `${APPROVAL_ENVIRONMENT} environment: approve the pending deployment on this run if the `
          + 'slowdown is intended, or push a fix.')],
      };
    }

    return {
      outcome: OUTCOMES.WARNED,
      exitCode: 0,
      lines: [command('warning', 'Performance gate (warn mode)', `would need an approval: ${failure}`)],
    };
  }

  if (verdict.status === 'not-assessed') {
    return {
      outcome: OUTCOMES.NOT_ASSESSED,
      exitCode: 0,
      lines: [command('notice', 'Performance gate', `not assessed: ${verdict.reason}`)],
    };
  }

  return {
    outcome: OUTCOMES.PASSED,
    exitCode: 0,
    lines: [`Performance gate: ${verdict.status} (${verdict.mode} mode).`],
  };
}
