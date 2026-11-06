import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ANNOTATION_CAP,
  AUDIT_EVENTS,
  RED_SEVERITIES,
  VERDICT_SEVERITIES,
  WARNING_SEVERITIES,
  annotationLevel,
  capAnnotations,
  countingScope,
  renderRunVerdict,
  renderVerdict,
  runVerdict,
  severityOfImpact,
  verdictOf,
  verdictTitle,
} from '../a11y-verdict.mjs';

// tests/AGENTS.md, "A11y: the verdict of a check run": one rule for every accessibility check run (the axe
// scan, the checks beyond axe, the screen reader lanes). Red on a critical or serious finding, neutral with a
// warning on a moderate or minor one, green on none; advisory rows never raise it; a tooling failure is red
// for its own reason and says so.

const at = (severity, extra = {}) => ({ severity, ...extra });

test('the severities are axe\'s four plus advisory, and the rule splits them into red and warning', () => {
  assert.deepEqual(VERDICT_SEVERITIES, ['critical', 'serious', 'moderate', 'minor', 'advisory']);
  assert.deepEqual(RED_SEVERITIES, ['critical', 'serious']);
  assert.deepEqual(WARNING_SEVERITIES, ['moderate', 'minor']);
});

test('a critical or a serious finding is red, whatever else the run found', () => {
  for (const severity of RED_SEVERITIES) {
    const verdict = verdictOf({ findings: [at('minor'), at(severity), at('advisory')] });

    assert.equal(verdict.conclusion, 'failure', `${severity} turns the check red`);
    assert.equal(verdict.reason, 'red');
  }
});

test('a moderate or minor finding as the worst is neutral, a warning', () => {
  for (const severity of WARNING_SEVERITIES) {
    const verdict = verdictOf({ findings: [at(severity), at('advisory')] });

    assert.equal(verdict.conclusion, 'neutral', `${severity} turns the check neutral`);
    assert.equal(verdict.reason, 'warning');
  }
});

test('no finding is green, and advisory rows never raise the verdict', () => {
  assert.equal(verdictOf({ findings: [] }).conclusion, 'success');

  const advisory = verdictOf({ findings: [at('advisory'), at('advisory')] });

  assert.equal(advisory.conclusion, 'success', 'a golden that moved or a result axe could not decide is never a warning');
  assert.equal(advisory.reason, 'clean');
  assert.equal(advisory.advisory, 2);
});

test('a finding marked warning-only (tracked debt, a record below the target level) is a warning at most', () => {
  const tracked = verdictOf({ findings: [at('critical', { warningOnly: true }), at('serious', { warningOnly: true })] });

  assert.equal(tracked.conclusion, 'neutral', 'tracked debt shows as a warning, never red');
  assert.deepEqual(tracked.counted, { critical: 0, serious: 0, moderate: 0, minor: 0 });
  assert.deepEqual(tracked.warningOnly, { critical: 1, serious: 1, moderate: 0, minor: 0 });

  const mixed = verdictOf({ findings: [at('critical', { warningOnly: true }), at('serious')] });

  assert.equal(mixed.conclusion, 'failure', 'a counted serious finding beside tracked debt is still red');

  const advisoryOnly = verdictOf({ findings: [at('advisory', { warningOnly: true })] });

  assert.equal(advisoryOnly.conclusion, 'success', 'an advisory row stays advisory when it is also tracked');
});

test('a tooling failure is red for its own reason, apart from the findings', () => {
  const verdict = verdictOf({ findings: [at('minor')], tooling: ['the run left no transcript'] });

  assert.equal(verdict.conclusion, 'failure');
  assert.equal(verdict.reason, 'tooling');
  assert.deepEqual(verdict.tooling, ['the run left no transcript']);
  assert.deepEqual(verdict.counted, { critical: 0, serious: 0, moderate: 0, minor: 1 }, 'the findings it did measure are still counted');
  assert.equal(verdictTitle(verdict, 'ignored'), '✖ Tooling failure: the run left no transcript');
});

test('an unknown severity is a bug in the caller, never a silent green', () => {
  assert.throws(() => verdictOf({ findings: [at('blocker')] }), /unknown severity "blocker"/);
  assert.throws(() => verdictOf({ findings: [at(undefined)] }), /unknown severity/);
});

test('an axe impact is the severity; a violation axe gave no impact counts as serious', () => {
  assert.equal(severityOfImpact('critical'), 'critical');
  assert.equal(severityOfImpact('minor'), 'minor');
  assert.equal(severityOfImpact(null), 'serious');
  assert.equal(severityOfImpact(undefined), 'serious');
});

test('the title states the verdict, the counts per severity and the rule, then the check\'s own headline', () => {
  assert.equal(
    verdictTitle(verdictOf({ findings: [at('critical'), at('critical'), at('serious'), at('minor', { warningOnly: true }), at('advisory')] }), '5 findings on 9 targets measured'),
    '✖ Red: 2 critical, 1 serious, 0 moderate, 0 minor (critical/serious = red, moderate/minor = warning) · 1 warning only, 1 advisory · 5 findings on 9 targets measured',
  );
  assert.equal(
    verdictTitle(verdictOf({ findings: [at('moderate')] }), 'headline'),
    '⚠ Warning: 0 critical, 0 serious, 1 moderate, 0 minor (critical/serious = red, moderate/minor = warning) · headline',
  );
  assert.equal(
    verdictTitle(verdictOf({ findings: [] }), 'No findings on 3 targets measured'),
    '✔ Green: 0 critical, 0 serious, 0 moderate, 0 minor (critical/serious = red, moderate/minor = warning) · No findings on 3 targets measured',
  );
  assert.ok(verdictTitle(verdictOf({ findings: [] }), 'x'.repeat(400)).length <= 250, 'the Checks API takes a title of 255 characters at most');
});

test('the summary block states the rule, what the run counted, and the counts per severity', () => {
  const verdict = verdictOf({ findings: [at('serious'), at('moderate', { warningOnly: true }), at('advisory')] });
  const audit = renderVerdict(verdict, { scope: 'audit' });

  assert.match(audit, /^\*\*Verdict: red\.\*\* Red on a critical or serious finding, neutral with a warning on a moderate or minor one, green on none; advisory rows never raise it\./);
  assert.match(audit, /\*\*Audit run\*\* \(a schedule or a dispatch\): every open finding counts, tracked or not\./);
  assert.match(audit, /\| serious \| 1 \| 0 \|/);
  assert.match(audit, /\| moderate \| 0 \| 1 \|/);
  assert.match(audit, /1 advisory row, never counted\./);

  const change = renderVerdict(verdict, { scope: 'change', counting: 'only a finding that is new or grown against the baseline counts' });

  assert.match(change, /\*\*Change run\*\* \(a pull request or a push\): only a finding that is new or grown against the baseline counts; a finding whose cluster in `tests\/a11y\/issues\.json` has a tracker is a warning at most\./);

  const tooling = renderVerdict(verdictOf({ findings: [], tooling: ['scenario grid-core stopped at step arrow-down: timeout'] }), { scope: 'audit' });

  assert.match(tooling, /^\*\*Verdict: red, a tooling failure\.\*\* The run did not measure what it should/);
  assert.match(tooling, /- scenario grid-core stopped at step arrow-down: timeout/);
});

test('the counting scope comes from the event: a schedule or a dispatch is an audit, anything else a change', () => {
  assert.deepEqual(AUDIT_EVENTS, ['schedule', 'workflow_dispatch']);
  assert.equal(countingScope('schedule'), 'audit');
  assert.equal(countingScope('workflow_dispatch'), 'audit');
  assert.equal(countingScope('pull_request'), 'change');
  assert.equal(countingScope('push'), 'change');
  assert.equal(countingScope(undefined), 'change', 'a local run counts as a change unless it says otherwise');
});

test('the annotation level follows the verdict: red findings fail, warnings warn, advisory rows notify', () => {
  assert.equal(annotationLevel(at('critical')), 'failure');
  assert.equal(annotationLevel(at('serious')), 'failure');
  assert.equal(annotationLevel(at('moderate')), 'warning');
  assert.equal(annotationLevel(at('minor')), 'warning');
  assert.equal(annotationLevel(at('critical', { warningOnly: true })), 'warning');
  assert.equal(annotationLevel(at('advisory')), 'notice');
});

test('annotations are capped, the worst first, and the cap says how many it left out', () => {
  const make = (level, index) => ({ annotation_level: level, title: `${level} ${index}` });
  const list = [
    ...Array.from({ length: ANNOTATION_CAP }, (_, index) => make('notice', index)),
    make('warning', 0),
    make('failure', 0),
  ];
  const { annotations, omitted } = capAnnotations(list);

  assert.equal(annotations.length, ANNOTATION_CAP);
  assert.equal(omitted, 2);
  assert.deepEqual(annotations.slice(0, 2).map(item => item.title), ['failure 0', 'warning 0']);
  assert.deepEqual(capAnnotations([make('notice', 1)]), { annotations: [make('notice', 1)], omitted: 0 });
});

const RUN = 4242;
const posted = (name, conclusion, extra = {}) => ({
  id: extra.id ?? 1, name, conclusion, external_id: String(extra.run ?? RUN), html_url: `https://github.com/o/r/runs/${extra.id ?? 1}`,
  output: { title: `${conclusion} title` },
});

test('the run verdict follows its worst check run, read from the ones this run posted', () => {
  const runs = [
    posted('A11y / axe report', 'success', { id: 1 }),
    posted('A11y / reflow report', 'neutral', { id: 2 }),
    posted('A11y / pointer report', 'failure', { id: 3 }),
    posted('A11y / pointer report', 'failure', { id: 4, run: 1 }),
    posted('E2E / something', 'failure', { id: 5 }),
  ];
  const red = runVerdict({ checkRuns: runs, runId: RUN, prefixes: ['A11y / '] });

  assert.equal(red.conclusion, 'failure');
  assert.deepEqual(red.rows.map(row => [row.name, row.conclusion]), [
    ['A11y / axe report', 'success'],
    ['A11y / pointer report', 'failure'],
    ['A11y / reflow report', 'neutral'],
  ], 'one row per name, from this run only, and only under the prefixes');

  const warn = runVerdict({ checkRuns: runs.filter(run => run.id !== 3), runId: RUN, prefixes: ['A11y / '] });

  assert.equal(warn.conclusion, 'neutral');
});

test('a re-run check run replaces the earlier one of its name', () => {
  const runs = [posted('A11y / reflow report', 'failure', { id: 7 }), posted('A11y / reflow report', 'success', { id: 9 })];

  assert.equal(runVerdict({ checkRuns: runs, runId: RUN, prefixes: ['A11y / '] }).conclusion, 'success');
});

test('a check run the run should have posted and did not is red, and so is a run that posted none', () => {
  const missing = runVerdict({
    checkRuns: [posted('A11y / axe report', 'success')], runId: RUN, prefixes: ['A11y / '], expected: ['A11y / axe report', 'A11y / reflow report'],
  });

  assert.equal(missing.conclusion, 'failure');
  assert.deepEqual(missing.missing, ['A11y / reflow report']);

  const none = runVerdict({ checkRuns: [], runId: RUN, prefixes: ['Screen reader / '] });

  assert.equal(none.conclusion, 'failure');
  assert.match(none.problems[0], /posted no check run/);

  const odd = runVerdict({ checkRuns: [posted('A11y / axe report', 'cancelled')], runId: RUN, prefixes: ['A11y / '] });

  assert.equal(odd.conclusion, 'failure', 'a conclusion the posters never write is not read as a pass');
});

test('the run verdict renders a table a reader can scan, escaped', () => {
  const result = runVerdict({ checkRuns: [posted('A11y / axe report', 'failure'), posted('A11y / <b>x</b> report', 'success', { id: 2 })], runId: RUN, prefixes: ['A11y / '] });
  const markdown = renderRunVerdict(result);

  assert.match(markdown, /^## Run verdict: red/m);
  assert.match(markdown, /\| ✖ red \| \[A11y \/ axe report\]\(https:\/\/github\.com\/o\/r\/runs\/1\) \| failure title \|/);
  assert.doesNotMatch(markdown, /<b>/);
});
