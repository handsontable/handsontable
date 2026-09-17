import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pullNumberOf, summarizeBuild } from '../seed-report.mjs';

// The nightly's red run is decided here, and the seed's summary is the only place a develop push
// says what it changed; the blocking flag is pinned per tier so a silent flip cannot make the
// nightly green on a wrapper regression or make a seed red on its own change.

const report = (counts = {}) => ({
  failedItems: Array.from({ length: counts.changed ?? 0 }, (_, i) => `js/chromium-theme-main/changed-${i}.png`),
  newItems: Array.from({ length: counts.added ?? 0 }, (_, i) => `js/chromium-theme-main/new-${i}.png`),
  deletedItems: Array.from({ length: counts.deleted ?? 0 }, (_, i) => `js/chromium-theme-main/gone-${i}.png`),
  passedItems: Array.from({ length: counts.passed ?? 0 }, (_, i) => `js/chromium-theme-main/ok-${i}.png`),
});
const build = overrides => summarizeBuild({
  report: report({ passed: 1646 }), tier: 'seed', branch: 'develop', sha: 'abc1234def5678', ...overrides,
});

test('pullNumberOf reads the squash-merge suffix off the first line only', () => {
  assert.equal(pullNumberOf('DEV-2797: Visual tiers (#13471)'), '13471');
  assert.equal(pullNumberOf('DEV-2797: Visual tiers (#13471)\n\nCloses (#1)'), '13471');
  assert.equal(pullNumberOf('DEV-2797: Visual tiers (#13471)  '), '13471');
  assert.equal(pullNumberOf('Merge branch develop (#13471) into x'), null);
  assert.equal(pullNumberOf('DEV-2797: Visual tiers'), null);
  assert.equal(pullNumberOf(''), null);
  assert.equal(pullNumberOf(undefined), null);
});

test('a missing report is a blocking error in both tiers', () => {
  ['seed', 'full'].forEach((tier) => {
    const s = build({ report: null, tier });

    assert.equal(s.verdict, 'error', tier);
    assert.equal(s.blocking, true, tier);
    assert.match(s.markdown, /produced no report/);
    assert.match(s.summary, /nothing was compared/);
    assert.deepEqual(s.changedItems, []);
  });
});

test('an empty report is a blocking error, not a clean pass', () => {
  // reg-suit exits 0 having globbed nothing when the config or the screenshots are missing.
  const s = build({ report: report({}) });

  assert.equal(s.verdict, 'error');
  assert.equal(s.blocking, true);
  assert.match(s.markdown, /The report lists no passing, changed, new, or deleted screenshots/);
  assert.doesNotMatch(s.markdown, /All 0 screenshots match/);
});

test('a clean seed', () => {
  const s = build({});

  assert.equal(s.verdict, 'clean');
  assert.equal(s.blocking, false);
  assert.deepEqual(s.changedItems, []);
  assert.equal(s.summary, 'Visual seed on develop @ abc1234: 0 changed, 0 new, 0 deleted, 1646 passing.');
  assert.match(s.markdown, /^## Visual seed — develop @ abc1234$/m);
  assert.match(s.markdown, /\| 0 \| 0 \| 0 \| 1646 \|/);
  assert.match(s.markdown, /All 1646 screenshots match the golden records\./);
  assert.doesNotMatch(s.markdown, /<details>/);
});

test('a clean nightly does not block', () => {
  const s = build({ tier: 'full' });

  assert.equal(s.verdict, 'clean');
  assert.equal(s.blocking, false);
  assert.match(s.markdown, /^## Visual nightly — develop @ abc1234$/m);
});

test('a changed seed reports and never blocks', () => {
  // Its differences are what the merged commit changed; the seed must land.
  const s = build({ report: report({ changed: 3, passed: 1643 }) });

  assert.equal(s.verdict, 'changed');
  assert.equal(s.blocking, false);
  assert.equal(s.summary, 'Visual seed on develop @ abc1234: 3 changed, 0 new, 0 deleted, 1643 passing.');
  assert.match(s.markdown, /\| 3 \| 0 \| 0 \| 1643 \|/);
  assert.match(s.markdown, /<details><summary>3 items<\/summary>/);
  assert.match(s.markdown, /- `js\/chromium-theme-main\/changed-0\.png`/);
  assert.match(s.markdown, /These differences are what this commit changed; the golden records now hold this render\./);
  assert.doesNotMatch(s.markdown, /never written to the golden records/);
});

test('a changed nightly blocks and says where the difference can come from', () => {
  const s = build({ tier: 'full', report: report({ changed: 1, passed: 1645 }) });

  assert.equal(s.verdict, 'changed');
  assert.equal(s.blocking, true);
  assert.match(s.summary, /^Visual nightly on develop @ abc1234: 1 changed/);
  assert.match(s.markdown, /<details><summary>1 item<\/summary>/);
  assert.match(s.markdown, /A full render is never written to the golden records\./);
  assert.match(s.markdown, /js-copied baseline gotcha in visual-tests\/AGENTS\.md/);
  assert.match(s.markdown, /dispatch `Visual seed` on develop/);
  assert.doesNotMatch(s.markdown, /what this commit changed/);
});

test('new and deleted items alone are differences, and are tagged in the list', () => {
  const s = build({ tier: 'full', report: report({ added: 1, deleted: 1, passed: 10 }) });

  assert.equal(s.verdict, 'changed');
  assert.equal(s.blocking, true);
  assert.deepEqual(s.changedItems, [
    'js/chromium-theme-main/new-0.png (new)',
    'js/chromium-theme-main/gone-0.png (deleted)',
  ]);
  assert.match(s.markdown, /- `js\/chromium-theme-main\/new-0\.png \(new\)`/);
  assert.match(s.markdown, /- `js\/chromium-theme-main\/gone-0\.png \(deleted\)`/);
});

test('the item list truncates at 60 and says how many more there are', () => {
  const s = build({ report: report({ changed: 61, passed: 1 }) });
  const listed = s.markdown.match(/^- `/gm);

  assert.equal(listed.length, 60);
  assert.match(s.markdown, /…and 1 more/);
  assert.equal(s.changedItems.length, 61, 'the full list is still returned for the caller');

  const exact = build({ report: report({ changed: 60, passed: 1 }) });

  assert.equal(exact.markdown.match(/^- `/gm).length, 60);
  assert.doesNotMatch(exact.markdown, /more$/m);
});

test('the heading links the squash-merged pull request when the commit message names one', () => {
  const s = build({ headCommitMessage: 'DEV-2797: Visual tiers (#13471)\n\nBody' });
  const heading = '## Visual seed — develop @ abc1234 '
    + '([#13471](https://github.com/handsontable/handsontable/pull/13471))';

  assert.ok(s.markdown.split('\n').includes(heading), s.markdown);
});

test('a schedule or a dispatch has no commit message and no link', () => {
  const s = build({ tier: 'full', headCommitMessage: '' });

  assert.match(s.markdown, /^## Visual nightly — develop @ abc1234$/m);
  assert.doesNotMatch(s.markdown, /pull\//);
});

test('the report link falls back to the run URL, then to nothing', () => {
  const both = build({ reportUrl: 'https://v/base/develop/index.html', runUrl: 'https://r/1' });
  const runOnly = build({ runUrl: 'https://r/1' });
  const neither = build({});

  assert.match(both.markdown, /\*\*\[Open the report\]\(https:\/\/v\/base\/develop\/index\.html\)\*\*/);
  assert.doesNotMatch(both.markdown, /https:\/\/r\/1/);
  assert.match(runOnly.markdown, /\*\*\[Open the workflow run\]\(https:\/\/r\/1\)\*\*/);
  assert.doesNotMatch(neither.markdown, /Open the/);
  // The error branch carries the same link so the reader can get to the failed step.
  assert.match(build({ report: null, runUrl: 'https://r/1' }).markdown, /https:\/\/r\/1/);
});

test('the heading survives a missing sha', () => {
  assert.match(build({ sha: undefined }).markdown, /^## Visual seed — develop @ $/m);
});

// The attribution half: a pull request renders js × {main, main-dark} only, so the seed is where a
// merge's horizon, classic, cross-browser or wrapper-copy differences first show, and it comments them on
// the merged pull request. The split is by the pr tier's real prefixes unless a test injects its own.
const PR_PREFIXES = ['js/chromium-theme-main/', 'js/chromium-theme-main-dark/'];
const mixed = () => ({
  failedItems: [
    'js/chromium-theme-main/js-only/dialog/dialog-focus-2.png',
    'js/chromium-theme-horizon/js-only/dialog/dialog-focus-2.png',
    'cross-browser/webkit/columns-filter-2.png',
  ],
  newItems: ['react-wrapper/chromium/multi-frameworks/tab-navigation-1.png'],
  deletedItems: ['js/chromium-theme-main-dark/js-only/gone-1.png'],
  passedItems: Array.from({ length: 10 }, (_, i) => `js/chromium/ok-${i}.png`),
});

test('outsidePrItems keeps the differences the pr tier never rendered, tags included', () => {
  const s = build({ report: mixed(), prPrefixes: PR_PREFIXES });

  assert.deepEqual(s.outsidePrItems, [
    'js/chromium-theme-horizon/js-only/dialog/dialog-focus-2.png',
    'cross-browser/webkit/columns-filter-2.png',
    'react-wrapper/chromium/multi-frameworks/tab-navigation-1.png (new)',
  ]);
  assert.equal(s.changedItems.length, 5);
});

test('the pr prefixes default to the tier table, so the split follows VISUAL_TIERS.pr', () => {
  const s = build({ report: mixed() });

  assert.equal(s.outsidePrItems.length, 3);
  assert.ok(!s.outsidePrItems.some(item => item.startsWith('js/chromium-theme-main/')));
});

test('a seed with out-of-tier differences and a pull request number comments on it', () => {
  const s = build({
    report: mixed(),
    prPrefixes: PR_PREFIXES,
    headCommitMessage: 'DEV-2797: Tiers (#13471)',
    reportUrl: 'https://v/base/develop/index.html',
  });

  assert.equal(s.pull, '13471');
  // "may not have rendered", not "did not render". The split is computed from the raw `pr` table row,
  // which carries no wrapper, but the `pr` tier does render one when `VISUAL_WRAPPERS` names it — so a
  // wrapper item here can be one this pull request rendered and its author already reviewed.
  assert.match(s.comment,
    /^## Visual seed — this merge changed screenshots the pull request may not have rendered$/m);
  assert.doesNotMatch(s.comment, /a pull request does not render\s+these variants/,
    'the comment must not tell an author their check could not have shown a wrapper it did render');
  assert.match(s.comment, /The `develop` seed for #13471 \(`abc1234`\) found 3 differences in/);
  assert.match(s.comment, /- `cross-browser\/webkit\/columns-filter-2\.png`/);
  assert.match(s.comment, /- `react-wrapper\/chromium\/multi-frameworks\/tab-navigation-1\.png \(new\)`/);
  // The variants the pull request rendered are counted, not listed.
  assert.doesNotMatch(s.comment, /js\/chromium-theme-main\/js-only\/dialog\/dialog-focus-2/);
  assert.match(s.comment, /2 more differences were in the variants the pull request rendered/);
  assert.match(s.comment, /\*\*\[Open the seed report\]\(https:\/\/v\/base\/develop\/index\.html\)\*\*/);
  assert.match(s.comment, /cached for four hours/);
  assert.match(s.comment, /fix forward or revert/);
  // The sticky action adds its own header marker; the body must not carry one.
  assert.doesNotMatch(s.comment, /Sticky Pull Request Comment/);
  // The summary points at the comment.
  assert.match(s.markdown, /3 of them are in variants a pull request may not render.*commented on #13471/);
});

test('no comment without a pull request number, without out-of-tier differences, or on the nightly', () => {
  const noPull = build({ report: mixed(), prPrefixes: PR_PREFIXES });
  const inTierOnly = build({
    report: report({ changed: 2, passed: 5 }), prPrefixes: PR_PREFIXES, headCommitMessage: 'x (#1)',
  });
  const nightly = build({
    report: mixed(), prPrefixes: PR_PREFIXES, tier: 'full', headCommitMessage: 'x (#1)',
  });
  const clean = build({ prPrefixes: PR_PREFIXES, headCommitMessage: 'x (#1)' });

  assert.equal(noPull.comment, '');
  assert.equal(noPull.pull, null);
  assert.match(noPull.markdown, /3 of them are in variants a pull request may not render/);
  assert.match(noPull.markdown, /may not have shown them\.$/m, 'no number, so no "commented on" suffix');
  assert.doesNotMatch(noPull.markdown, /commented on #/);
  assert.equal(inTierOnly.comment, '');
  assert.deepEqual(inTierOnly.outsidePrItems, []);
  assert.doesNotMatch(inTierOnly.markdown, /of them are in variants/);
  assert.equal(nightly.comment, '', 'the nightly is not a merge; its differences are the red run');
  assert.equal(nightly.outsidePrItems.length, 3, 'the split is still reported');
  assert.doesNotMatch(nightly.markdown, /of them are in variants/);
  assert.equal(clean.comment, '');
  assert.equal(build({ report: null, headCommitMessage: 'x (#1)' }).comment, '');
});

test('the comment falls back to the run link, and to no link', () => {
  const runOnly = build({
    report: mixed(), prPrefixes: PR_PREFIXES, headCommitMessage: 'x (#7)', runUrl: 'https://r/1',
  });
  const none = build({ report: mixed(), prPrefixes: PR_PREFIXES, headCommitMessage: 'x (#7)' });

  assert.match(runOnly.comment, /\*\*\[Open the seed run\]\(https:\/\/r\/1\)\*\* — the `visual-diff-report` artifact/);
  assert.doesNotMatch(none.comment, /Open the/);
});
