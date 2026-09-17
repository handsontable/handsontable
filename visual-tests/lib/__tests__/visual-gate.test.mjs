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
  const v = evaluate({ report: report({ changed: 5 }), seeded: false, reportUrl: '' });

  assert.equal(v.verdict, 'changed');
  assert.match(v.comment, /### What to do next/);
  assert.match(v.comment, /visual-diff-report/);
  assert.match(v.comment, /A maintainer approves the/);
});

test('the no-report note follows the missing report, not the seeding flag', () => {
  // The two say different things — `seeded` is whether a run may WRITE the
  // baseline — and the workflow happens to set both from one condition today, so
  // a bug here is invisible until it is not. A run that cannot seed but did
  // publish must NOT be told it published nothing.
  const seededWithReport = evaluate({
    report: report({ changed: 5 }), seeded: false, reportUrl: 'https://example.test/index.html',
  });

  assert.doesNotMatch(seededWithReport.comment, /published no hosted report/,
    'the fork notice is keyed on `seeded`, so it shows on a run that did publish');
  assert.match(seededWithReport.comment, /Open the visual report/);

  // And the mirror: a run that may seed but published nothing still gets it.
  const publishedNothing = evaluate({
    report: report({ changed: 5 }), seeded: true, reportUrl: '',
  });

  assert.match(publishedNothing.comment, /published no hosted report/);
});

test('a missing report URL degrades to the artifact instructions', () => {
  const v = evaluate({ report: report({ changed: 1 }) });

  assert.match(v.comment, /visual-diff-report/);
});

// The docs suite (DEV-2860) runs this same evaluator over a manifest built from Playwright's report,
// and only three names differ. Pinned because the alternative is a second copy of every branch above,
// and because a docs comment naming the CORE environment would send a reviewer to an approval that
// does not exist on that run.
const DOCS_LABELS = {
  title: 'Docs visual tests',
  environment: 'docs-visual-approval',
  artifact: 'docs-visual-report',
};

test('the labels rename the suite in every verdict that has a heading', () => {
  const headings = [
    [{ report: report({}) }, /^## Docs visual tests — nothing was compared$/m],
    [{ report: null, bootstrap: true }, /^## Docs visual tests — baseline created$/m],
    [{ report: null, bootstrap: true, seeded: false }, /^## Docs visual tests — nothing to compare$/m],
    [{ report: null }, /^## Docs visual tests — could not compare$/m],
    [{ report: report({ passed: 441 }) }, /^## Docs visual tests — no changes$/m],
    [{ report: report({ changed: 1 }) }, /^## Docs visual tests — changes detected, approval pending$/m],
  ];

  headings.forEach(([options, heading]) => {
    const v = evaluate({ ...options, labels: DOCS_LABELS });

    assert.match(v.comment, heading);
    assert.doesNotMatch(v.comment, /## Visual tests —/);
  });
});

test('the labels rename the environment and the artifact wherever a reviewer is instructed', () => {
  const v = evaluate({ report: report({ changed: 2, added: 1 }), runUrl: 'https://r/1', labels: DOCS_LABELS });

  assert.match(v.summary, /Waiting for a reviewer to approve the docs-visual-approval deployment\./);
  assert.match(v.comment, /Review pending deployments → docs-visual-approval → Approve/);
  assert.match(v.comment, /`docs-visual-report` artifact/);
  // The lookbehind matters: `docs-visual-approval` contains `visual-approval`, so a bare negative
  // would pass on the very string it is meant to forbid.
  assert.doesNotMatch(v.comment, /(?<!docs-)visual-approval →/);
  assert.doesNotMatch(v.comment, /`visual-diff-report`/);

  const fork = evaluate({ report: report({ changed: 1 }), seeded: false, labels: DOCS_LABELS });

  assert.match(fork.comment, /`docs-visual-report` artifact holds the images/);
});

test('a partial labels object keeps the core defaults for the rest', () => {
  const v = evaluate({ report: report({ changed: 1 }), labels: { title: 'Docs visual tests' } });

  assert.match(v.comment, /^## Docs visual tests — changes detected/m);
  assert.match(v.comment, /visual-approval → Approve/, 'the environment falls back to the core one');
  assert.match(v.comment, /`visual-diff-report`/);
});

test('the verdicts and the blocking flag do not depend on the labels', () => {
  // The names are cosmetic by construction: relabeling must never change what a run is allowed to do.
  const cases = [{ report: null }, { report: report({}) }, { report: null, bootstrap: true },
    { report: report({ passed: 10 }) }, { report: report({ changed: 1 }) }];

  cases.forEach((options) => {
    const core = evaluate(options);
    const docs = evaluate({ ...options, labels: DOCS_LABELS });

    assert.equal(docs.verdict, core.verdict);
    assert.equal(docs.blocked, core.blocked);
  });
});

test('a run with pages that never rendered blocks, instead of reporting a visual verdict', () => {
  // The docs adapter writes `erroredItems` for a test that failed before reaching
  // `toHaveScreenshot`. Its CLI already exits non-zero, but the action's verdict step runs on
  // `!cancelled()`, so it executes anyway and reads the manifest that was already written. Without
  // this branch it would report `clean` or `changed` over a run where pages never rendered, ask for
  // an approval on a build whose own job had failed, and link a report the publish step — which has
  // no status function of its own, so it skips — never uploaded.
  const v = evaluate({
    report: {
      ...report({ changed: 2, passed: 400 }),
      erroredItems: ['visualDocs.spec.ts/js-a.png', 'visualDocs.spec.ts/js-b.png'],
    },
    runUrl: 'https://r/1',
  });

  assert.equal(v.blocked, true);
  assert.equal(v.verdict, 'error', 'an errored run must never reach the approval job');
  assert.match(v.comment, /could not compare/);
  assert.match(v.comment, /visualDocs\.spec\.ts\/js-a\.png/, 'the pages that failed must be named');
  assert.match(v.summary, /failed without comparing a screenshot/);
});

test('a run where EVERY page failed still names them, rather than the generic empty-report message', () => {
  // The ordering case. A preview that is down fails every page before its screenshot, so all four
  // reg-suit buckets are empty and the "nothing was compared" branch would answer first — blocking
  // correctly, but with a message that explains nothing, in exactly the situation the errored branch
  // exists for. Both verdicts are `error`, so only the comment tells them apart, which is what makes
  // the order easy to undo by accident.
  const v = evaluate({
    report: {
      ...report({}),
      erroredItems: ['visualDocs.spec.ts/js-a.png', 'visualDocs.spec.ts/js-b.png'],
    },
    runUrl: 'https://r/1',
  });

  assert.equal(v.blocked, true);
  assert.equal(v.verdict, 'error');
  assert.match(v.comment, /could not compare/);
  assert.doesNotMatch(v.comment, /nothing was compared/,
    'the errored branch must be evaluated before the empty-report branch');
  assert.match(v.comment, /visualDocs\.spec\.ts\/js-a\.png/);
  assert.match(v.comment, /visualDocs\.spec\.ts\/js-b\.png/);
});

test('an empty report with no errored pages keeps its own message', () => {
  // The other side of that boundary: reg-suit globbing nothing is a different failure, and its
  // message must not be replaced by the errored one.
  const v = evaluate({ report: report({}) });

  assert.equal(v.verdict, 'error');
  assert.match(v.comment, /nothing was compared/);
  assert.doesNotMatch(v.comment, /could not compare/);
});

test('reg-suit reports carry no erroredItems, so the core suite is untouched', () => {
  // The key is the docs adapter's, not reg-suit's. A core report has no such field, and an empty
  // list must not block either.
  assert.equal(evaluate({ report: report({ changed: 3, passed: 10 }) }).verdict, 'changed');
  assert.equal(evaluate({
    report: { ...report({ changed: 3, passed: 10 }), erroredItems: [] },
  }).verdict, 'changed');
  assert.equal(evaluate({ report: report({ passed: 10 }) }).verdict, 'clean');
});
