// Turns the gate's verdict into the job's result: the workflow's last step, after the report is
// deployed and the comment is posted, so a red job never hides the numbers that made it red.
//
// Kept apart from lib/gate.mjs, which decides the verdict inside the teardown. This side only reads
// it back, together with the one input the teardown cannot see: the pull request's live description,
// where an author accepts a slowdown on purpose.

import { stripHtmlComments } from '../../.github/scripts/lib/strip-html-comments.mjs';
import { gateMode } from './gate.mjs';

// Outside any HTML comment, like `[skip changelog]` and `[visual budget: N – reason]`: the pull
// request template documents it inside a comment, and that example must never accept anything.
const ACCEPT_MARKER = /\[accept perf regression:\s*([^\]]*\S)\s*\]/i;

export const ACCEPT_MARKER_TEMPLATE = '[accept perf regression: why the slowdown is intended]';

/**
 * @param {string | null | undefined} body -- the pull request description
 * @returns {{ reason: string } | null} the accepted reason, or null when the description has none
 */
export function readAcceptMarker(body) {
  const match = ACCEPT_MARKER.exec(stripHtmlComments(body ?? ''));

  return match ? { reason: match[1].trim() } : null;
}

/**
 * A workflow command. The message is percent-encoded the way the runner expects, so a reason that
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
 * @param {number | null | undefined} value
 * @param {string} unit
 * @returns {string} e.g. "+26.8%", or "" when unknown
 */
function signed(value, unit) {
  return value == null || !Number.isFinite(value) ? '' : `${value >= 0 ? '+' : ''}${value.toFixed(1)}${unit}`;
}

/**
 * @param {object} verdict -- from decideGate
 * @returns {string} what failed, in one line
 */
export function describeFailure(verdict) {
  const parts = verdict.failing.map((scenario) => {
    const metrics = [];

    if (scenario.overTiming) {
      metrics.push(`${signed(scenario.timingPct, '%')} (${signed(scenario.deltaMs, ' ms')})`);
    }

    if (scenario.overHeap) {
      metrics.push(`heap ${signed(scenario.heapPct, '%')}`);
    }

    return `${scenario.title} ${metrics.join(', ')}`;
  });

  if (verdict.shiftFailed) {
    parts.push(verdict.reason);
  }

  return parts.join('; ');
}

/**
 * What the enforce step prints and how it exits.
 *
 * - No verdict: the teardown never wrote one, so nothing was judged. In block mode that fails (the
 *   gate never passes what it could not see); in warn mode it is a warning, since a run that died
 *   before its teardown is already red for its own reason.
 * - `fail` with the accept marker in the live description: passes, and says what was accepted.
 * - `fail` in block mode: fails. In warn mode: a warning that names what would have failed.
 * - Everything else passes; `not-assessed` says why.
 *
 * @param {object} input
 * @param {object | null} input.verdict -- the parsed verdict file, or null when it is missing
 * @param {string | null} [input.body] -- the pull request's live description
 * @param {Record<string, string | undefined>} [input.env] -- for the mode when there is no verdict
 * @returns {{ exitCode: 0 | 1, lines: string[] }}
 */
export function enforcement({ verdict, body = null, env = process.env }) {
  if (!verdict) {
    const mode = gateMode(env);
    const message = 'the performance teardown wrote no verdict, so nothing was judged. Check the '
      + '"Run performance tests" step.';

    return mode === 'block'
      ? { exitCode: 1, lines: [command('error', 'Performance gate', message)] }
      : { exitCode: 0, lines: [command('warning', 'Performance gate', message)] };
  }

  if (verdict.status === 'fail') {
    const failure = describeFailure(verdict);
    const accepted = readAcceptMarker(body);

    if (accepted) {
      return {
        exitCode: 0,
        lines: [command('notice', 'Performance gate', 'slowdown accepted in the pull request description '
          + `("${accepted.reason}"): ${failure}`)],
      };
    }

    if (verdict.mode === 'block') {
      return {
        exitCode: 1,
        lines: [command('error', 'Performance gate', `${failure}. If the slowdown is intended, write `
          + `${ACCEPT_MARKER_TEMPLATE} in the pull request description and re-run this job.`)],
      };
    }

    return {
      exitCode: 0,
      lines: [command('warning', 'Performance gate (warn mode)', `would fail: ${failure}`)],
    };
  }

  if (verdict.status === 'not-assessed') {
    return { exitCode: 0, lines: [command('notice', 'Performance gate', `not assessed: ${verdict.reason}`)] };
  }

  return { exitCode: 0, lines: [`Performance gate: ${verdict.status} (${verdict.mode} mode).`] };
}
