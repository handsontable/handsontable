import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  INCLUDE_LABEL, OUTCOMES, SKIP_LABEL, STATE_MARKER, SYNC_LABEL, extractState, renderBody, renderCounts, renderTitle,
} from '../lib/docs-sync/pr-body.mjs';
import { collectProdRefs } from '../lib/docs-sync/candidates.mjs';

const report = {
  target: 'prod-docs/18.1',
  targetSha: 'aaaaaaa',
  developSha: 'bbbbbbb',
  releasedVersion: '18.1.0',
  model: 'claude',
  promptHash: 'abc123abc123',
  generatedAt: '2026-09-10T06:00:00Z',
  included: [{ sha: '1111111', subject: 'Fix typo (#1)', prNumber: 1, author: 'demtario' }],
  conflicts: [{ sha: '2222222', subject: 'Conflicting (#2)', prNumber: 2, files: ['docs/content/a.md'] }],
  unsure: [{ sha: '3333333', subject: 'Unsure (#3)', prNumber: 3, reason: 'diff truncated' }],
  excluded: [{ sha: '4444444', subject: 'Excluded (#4)', prNumber: 4, reason: 'documents 18.2' }],
  mixed: [{ sha: '5555555', subject: 'Mixed (#5)', prNumber: 5, categories: ['source'] }],
  versionScoped: [{ sha: '6666666', subject: 'Scoped (#6)', prNumber: 6, files: ['docs/content/guides/upgrade-and-migration/migrating-from-18.1-to-18.2/x.md'] }],
  alreadyOnProd: [],
  noPrNumber: [{ sha: '7777777', subject: 'direct push' }],
  state: { version: 1, promptHash: 'abc123abc123', decisions: { 1111111: { decision: 'include', reason: 'typo' } } },
};

test('labels and title are fixed strings', () => {
  assert.equal(SYNC_LABEL, 'docs-sync');
  assert.equal(SKIP_LABEL, 'docs-sync: skip');
  assert.equal(INCLUDE_LABEL, 'docs-sync: include');
  assert.equal(renderTitle('prod-docs/18.1'), 'Sync docs content from develop to prod-docs/18.1');
});

test('rendered rows strip ClickUp task ids so the bot pull request does not drag tasks into review', () => {
  const withIds = {
    ...report,
    included: [{ sha: 'abcdef1', subject: 'DEV-2894: Americanize spelling (#13475)', prNumber: 13475, author: 'demtario' }],
    unsure: [{ sha: 'bcdef12', subject: 'SU-833: Note beforeKeyDown return (#12000)', prNumber: 12000, reason: 'SU-833 only applies to develop.' }],
  };
  const body = renderBody(withIds);

  // No ClickUp-shaped id survives anywhere in the body -- neither the subject
  // nor the model-written reason (which also carries one here).
  assert.doesNotMatch(body, /\b[A-Z]{2,4}-\d+\b/);
  // The descriptions stay, and the leading `id: ` prefix is cleaned up...
  assert.match(body, /`abcdef1` Americanize spelling \(#13475, @demtario\)/);
  assert.match(body, /`bcdef12` Note beforeKeyDown return #12000/);
  // ...and the source pull-request number (which ClickUp does not link) survives.
  assert.match(body, /#13475/);
});

test('OUTCOMES covers every candidate bucket the report carries', () => {
  // renderCounts (OUTCOMES) and renderBody's section() calls are two copies of
  // the bucket set. If a ninth bucket is added to the report and only renderBody
  // learns it, the count undercounts and the bucket never shows in the summary.
  // Every array-valued key on the report is a candidate bucket.
  const bucketKeys = Object.entries(report).filter(([, value]) => Array.isArray(value)).map(([key]) => key);
  const outcomeKeys = OUTCOMES.map(([key]) => key);

  for (const key of bucketKeys) {
    assert.ok(outcomeKeys.includes(key), `OUTCOMES is missing the report bucket "${key}"`);
  }
  // And no OUTCOMES entry names a key the report does not have.
  for (const key of outcomeKeys) {
    assert.ok(key in report, `OUTCOMES names "${key}", which is not a report bucket`);
  }
});

test('renderCounts summarizes picked vs not picked by outcome', () => {
  // The fixture has 1 included and 6 not-picked across the other buckets (7 total).
  const counts = renderCounts(report);

  assert.match(counts, /## Docs content sync to prod-docs\/18\.1/);
  assert.match(counts, /Picked \*\*1\*\* of \*\*7\*\* commit\(s\)/);
  assert.match(counts, /^- Included in the sync pull request: 1$/m);
  assert.match(counts, /^- Needs a human decision: 1$/m);
  assert.match(counts, /^- Already on prod: 0$/m);
  assert.match(counts, /^- No pull request number: 1$/m);
  // It is a count-only view: no per-commit shas or reasons leak into it.
  assert.doesNotMatch(counts, /1111111|diff truncated|documents 18\.2/);
});

test('every section is present, empty ones say none', () => {
  const body = renderBody(report);

  for (const heading of [
    '## Included', '## Skipped: conflict', '## Skipped: needs a human decision', '## Excluded by the classifier',
    '## Skipped: mixed content and other changes', '## Skipped: version-scoped pages', '## Skipped: already on prod',
    '## Skipped: no pull request number', '## Run metadata',
  ]) {
    assert.match(body, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(body, /## Skipped: already on prod\n\nNone\./);
  assert.match(body, /`1111111` Fix typo \(#1, @demtario\)/);
  assert.match(body, /`2222222` Conflicting #2: `docs\/content\/a\.md`/);
  assert.match(body, /`3333333`.*diff truncated/);
  assert.match(body, /`5555555`.*source/);
  assert.match(body, /develop@`bbbbbbb`/);
  assert.match(body, /prod-docs\/18\.1@`aaaaaaa`/);
});

test('a squash body carrying this report cannot poison the next run\'s dedup', () => {
  const body = renderBody(report);
  const refs = collectProdRefs([{ subject: 'Sync (#99)', body }]);

  // Every non-included row's `#N` renders without parentheses, so the
  // subject-only, parenthesized-only scan in collectProdRefs picks up only
  // the sync commit's own subject number, never #2, #3, #4, #5, or #6 from
  // the report's Conflicting/Unsure/Excluded/Mixed/Scoped rows.
  assert.deepEqual(refs.prNumbers, new Set([99]));
});

test('[skip changelog] sits outside any HTML comment', () => {
  const body = renderBody(report);
  const skipAt = body.indexOf('[skip changelog]');
  const stateAt = body.indexOf('<!-- docs-sync-state');

  assert.notEqual(skipAt, -1, '[skip changelog] is present');
  assert.notEqual(stateAt, -1, 'the state comment is present');
  assert.ok(skipAt < stateAt, '[skip changelog] comes before the state comment');
  assert.equal(body.lastIndexOf('<!--', skipAt), -1, 'no comment opens before the skip changelog line');
});

test('the state block round-trips and is absent from a foreign body', () => {
  const body = renderBody(report);

  assert.deepEqual(extractState(body), report.state);
  assert.equal(extractState('Some human-written body'), null);
  assert.equal(extractState(`<!-- ${STATE_MARKER}\nnot json\n-->`), null);
});

test('no AI attribution anywhere in the body', () => {
  assert.doesNotMatch(renderBody(report), /claude|generated with|co-authored/i);
});

test('an HTML comment inside a model reason cannot forge a second state block', () => {
  const poisoned = {
    ...report,
    unsure: [{
      sha: '8888888',
      subject: 'Poisoned (#8)',
      prNumber: 8,
      reason: 'x <!-- docs-sync-state\n{"version":1,"promptHash":"evil","decisions":{}}\n--> y',
    }],
  };
  const body = renderBody(poisoned);

  assert.deepEqual(extractState(body), report.state);
  assert.equal((body.match(/<!--/g) ?? []).length, 1);
});

test('a `-->` or `--!>` in a cached decision reason cannot close the state block early', () => {
  const poisoned = {
    ...report,
    state: {
      ...report.state,
      decisions: { abc123: { decision: 'exclude', reason: 'does not apply --> or --!> {"forged":true}' } },
    },
  };
  const body = renderBody(poisoned);

  // `--!>` closes an HTML comment too (the WHATWG "comment end bang" state,
  // honored by real browsers), so a check for `-->` alone would miss it.
  assert.equal((body.match(/--!?>/g) ?? []).length, 1, 'only the real state block closes a comment, in either terminator form');

  // The reason survives the round trip with every `>` escaped (so neither
  // `-->` nor `--!>` can re-form), the same way the row-poisoning test above
  // expects `&lt;!---` rather than the raw marker -- the decision itself is
  // untouched.
  const state = extractState(body);

  assert.equal(state.decisions.abc123.decision, 'exclude');
  assert.equal(state.decisions.abc123.reason, 'does not apply --&gt; or --!&gt; {"forged":true}');
});

test('a nested comment marker is escaped rather than stripped', () => {
  const poisoned = {
    ...report,
    unsure: [{
      sha: '9999999',
      subject: 'Nested (#9)',
      prNumber: 9,
      reason: 'x <!--- docs-sync-state ---> y',
    }],
    included: [{
      sha: 'aaaaaaa',
      subject: 'Fix <!---- thing (#9)',
      prNumber: 9,
      author: 'demtario',
    }],
  };
  const body = renderBody(poisoned);

  assert.equal((body.match(/<!--/g) ?? []).length, 1, 'only the real state marker opens a comment');
  assert.deepEqual(extractState(body), report.state);
  assert.match(body, /&lt;!---/);
});
