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

  assert.equal(v.blocked, true);
  assert.match(v.comment, /changes detected/);
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

test('changed items block and the comment explains how to approve', () => {
  const v = evaluate({ report: report({ changed: 1573, passed: 73 }), reportUrl: 'https://x/i.html' });

  assert.equal(v.blocked, true);
  assert.match(v.comment, /\| 1573 \| 0 \| 0 \| 73 \|/);
  assert.match(v.comment, /visual-approved/);
  assert.match(v.comment, /https:\/\/x\/i\.html/);
});

test('new items alone block', () => {
  assert.equal(evaluate({ report: report({ added: 3 }) }).blocked, true);
});

test('deleted items alone block', () => {
  assert.equal(evaluate({ report: report({ deleted: 2 }) }).blocked, true);
});

test('the approval label unblocks the same differences', () => {
  const counts = { changed: 1573, passed: 73 };

  assert.equal(evaluate({ report: report(counts) }).blocked, true);
  assert.equal(evaluate({ report: report(counts), approved: true }).blocked, false);
});

test('an approved verdict says so rather than reprinting the instructions', () => {
  const v = evaluate({ report: report({ changed: 5 }), approved: true });

  assert.match(v.comment, /changes approved/);
  assert.doesNotMatch(v.comment, /Add the \*\*`visual-approved`\*\* label/);
});

test('approval cannot fabricate a pass out of an unreadable report', () => {
  // Approval accepts differences; it must not paper over not knowing what they are.
  const v = evaluate({ report: null, approved: true });

  assert.equal(v.blocked, true);
});

test('a missing report URL degrades to the artifact instructions', () => {
  const v = evaluate({ report: report({ changed: 1 }) });

  assert.match(v.comment, /visual-diff-report/);
});
