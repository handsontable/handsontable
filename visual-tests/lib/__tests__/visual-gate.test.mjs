import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from '../visual-gate.mjs';

// This module decides whether a pull request can merge, so each branch is
// pinned: a silent flip from `blocked: true` to `false` would let unreviewed
// screenshots through with a green check and no other signal.

const report = (counts = {}) => ({
  failedItems: Array(counts.changed ?? 0).fill('a.png'),
  newItems: Array(counts.added ?? 0).fill('b.png'),
  deletedItems: Array(counts.deleted ?? 0).fill('c.png'),
  passedItems: Array(counts.passed ?? 0).fill('d.png'),
});

test('seeding a baseline passes without comparing', () => {
  const v = evaluate({ report: null, bootstrap: true });

  assert.equal(v.blocked, false);
  assert.match(v.comment, /baseline created/);
});

test('bootstrap covers a missing report', () => {
  // The credential-free path writes no report when there are no golden records,
  // so bootstrap has to be honoured before the report is required.
  const v = evaluate({ report: null, bootstrap: true, approved: false });

  assert.equal(v.blocked, false);
});

test('an empty report blocks even on the bootstrap path', () => {
  // The composition that made the two fixes cancel out: a first run that globbed
  // nothing has no failed and no passed items, so it looks identical to a
  // legitimate first build. Passing it seeds a blank manifest, after which the
  // probe returns 200 forever and nothing is ever compared again.
  const v = evaluate({ report: report({}), bootstrap: true });

  assert.equal(v.blocked, true);
  assert.match(v.comment, /nothing was compared/i);
  assert.doesNotMatch(v.comment, /baseline created/);
});

test('bootstrap covers an all-new report', () => {
  // The normal seeding shape: everything is new because nothing existed.
  const v = evaluate({ report: report({ added: 1646 }), bootstrap: true });

  assert.equal(v.blocked, false);
  assert.match(v.comment, /baseline created/);
});

test('a real comparison overrides a stale bootstrap probe', () => {
  // A base build killed mid-publish can leave `actual/**` up with no manifest.
  // The probe then reports "no baseline" while reg-suit compares against those
  // actuals for real. Passing that would overwrite the baseline with this build.
  const v = evaluate({ report: report({ changed: 12, passed: 1634 }), bootstrap: true });

  // The differences go to the approval job like any other; what must never
  // happen is the `bootstrap` verdict, which the workflow seeds on.
  assert.equal(v.verdict, 'changed');
  assert.match(v.comment, /changes detected/);
  assert.doesNotMatch(v.comment, /baseline created/);
});

test('deleted-only differences count as a real comparison', () => {
  // A build that renames every screenshot produces only deletions plus new
  // items. Those deletions prove a baseline existed, so a stale probe must not
  // be able to seed over it.
  const v = evaluate({ report: report({ deleted: 1646, added: 1646 }), bootstrap: true });

  assert.equal(v.verdict, 'changed');
  assert.doesNotMatch(v.comment, /baseline created/);
});

test('a run that cannot seed says so instead of claiming a baseline was created', () => {
  const v = evaluate({ report: null, bootstrap: true, seeded: false });

  assert.equal(v.blocked, false);
  assert.match(v.comment, /nothing to compare/i);
  assert.doesNotMatch(v.comment, /became the baseline/);
});

test('an unreadable report blocks rather than passing silently', () => {
  const v = evaluate({ report: null });

  assert.equal(v.blocked, true);
  assert.match(v.comment, /could not compare/);
});

test('no differences passes', () => {
  const v = evaluate({ report: report({ passed: 1646 }) });

  assert.equal(v.blocked, false);
  assert.match(v.comment, /All 1646 screenshots match/);
});

test('an empty report blocks instead of reporting a pass', () => {
  // reg-suit exits 0 having globbed nothing when the config or the screenshots
  // are missing. Reading that as "no changes" would merge a broken setup.
  const v = evaluate({ report: report({}) });

  assert.equal(v.blocked, true);
  assert.match(v.comment, /nothing was compared/i);
  assert.doesNotMatch(v.comment, /All 0 screenshots match/);
});

test('changed items yield the approval verdict and the comment explains where to approve', () => {
  // Differences no longer fail the gate step; they hand the run to the
  // environment-protected `approve` job in visual.yml. The step must therefore
  // stay green AND say `changed`, or the job never waits and the check passes
  // with nothing reviewed.
  const v = evaluate({
    report: report({ changed: 1573, passed: 73 }),
    reportUrl: 'https://x/i.html',
    runUrl: 'https://r/1',
  });

  assert.equal(v.blocked, false);
  assert.equal(v.verdict, 'changed');
  assert.match(v.comment, /\| 1573 \| 0 \| 0 \| 73 \|/);
  assert.match(v.comment, /Review pending\s+deployments → visual-approval → Approve/);
  assert.match(v.comment, /https:\/\/x\/i\.html/);
  assert.match(v.comment, /https:\/\/r\/1/);
  assert.doesNotMatch(v.comment, /visual-approved/, 'the label is gone; the comment must not send anyone to apply it');
});

test('new items alone need approval', () => {
  assert.equal(evaluate({ report: report({ added: 3 }) }).verdict, 'changed');
});

test('deleted items alone need approval', () => {
  assert.equal(evaluate({ report: report({ deleted: 2 }) }).verdict, 'changed');
});

test('no differences is the clean verdict', () => {
  assert.equal(evaluate({ report: report({ passed: 4 }) }).verdict, 'clean');
});

test('the error verdicts are the only blocking ones', () => {
  // The gate blocks only when it cannot tell what the visual state is; a human
  // decides the rest through the environment approval.
  assert.equal(evaluate({ report: null }).verdict, 'error');
  assert.equal(evaluate({ report: null }).blocked, true);
  assert.equal(evaluate({ report: report({}) }).verdict, 'error');
  assert.equal(evaluate({ report: report({}) }).blocked, true);
  assert.equal(evaluate({ report: null, bootstrap: true }).verdict, 'bootstrap');
  assert.equal(evaluate({ report: null, bootstrap: true }).blocked, false);
});

test('a fork run is told where its images are and that a maintainer approves the same way', () => {
  // Fork and Dependabot runs read this in the job summary — the sticky comment
  // is guarded off there. The environment gate does not depend on their token,
  // so the instructions are the same; only the report location differs.
  const v = evaluate({ report: report({ changed: 5 }), seeded: false });

  assert.equal(v.verdict, 'changed');
  assert.match(v.comment, /### What to do next/);
  assert.match(v.comment, /visual-diff-report/);
  assert.match(v.comment, /A maintainer approves the/);
});

test('a missing report URL degrades to the artifact instructions', () => {
  const v = evaluate({ report: report({ changed: 1 }) });

  assert.match(v.comment, /visual-diff-report/);
});
