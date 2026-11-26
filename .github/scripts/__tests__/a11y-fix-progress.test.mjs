import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  A11Y_AUDIT_WINDOW_HOURS,
  A11Y_HISTORY_DAYS,
  A11Y_NIGHTLY_WORKFLOW,
  A11Y_RECENT_DAYS,
  A11Y_SURFACES,
  A11Y_VERSION,
  NIGHT_SOURCES,
  a11yAudits,
  a11yView,
  assertA11yVersion,
  countsAtTarget,
  fixProgress,
  mergeA11yLedger,
  migrateA11yLedger,
  serializeA11yLedger,
  surfaceOf,
} from '../lib/a11y-ledger.mjs';
import { runContextFromRun } from '../lib/test-health.mjs';
import { TRIAGE_ID } from '../../../tests/lib/a11y-issues.mjs';
import { repoRoot } from '../lib/repo-root.mjs';
import { CATALOG, HEAD_SHA, a11yNight, catalogOf, record, siteNight, threeAuditNights, walker } from './fixtures/a11y-nights.mjs';

// The fix progress of the accessibility findings ledger: the history that outlives the rows, the migration that
// rebuilds it for the published version 1 file, the audits, and what the page says per tracker
// (tests/AGENTS.md, "A11y: fix progress over time").

const V1_FIXTURE = path.join(repoRoot(), '.github/scripts/__tests__/fixtures/a11y-ledger-v1.json');

const historyOf = (doc, runId) => doc.history.find(entry => entry.runId === String(runId));

test('a night\'s history entry counts, per cluster, the rows of its source that are open, new, resolved and back', () => {
  const { doc } = record(null, [
    [101, '2026-11-03T05:00:00Z', a11yNight([walker('focus-lost', 'a'), walker('focus-lost', 'b'), walker('menu-role', 'a')])],
    // Page a's lost focus is gone and measured gone; a small target is new.
    [111, '2026-11-10T05:00:00Z', a11yNight([walker('focus-lost', 'b'), walker('menu-role', 'a'), walker('target-small', 'c')])],
    // It is back: one finding resolved once and seen again, never a second finding.
    [121, '2026-11-17T05:00:00Z', a11yNight([walker('focus-lost', 'a'), walker('focus-lost', 'b'), walker('menu-role', 'a'), walker('target-small', 'c')])],
  ]);

  assert.deepEqual(doc.history.map(entry => entry.runId), ['121', '111', '101'], 'newest first, like the nights');
  assert.deepEqual(historyOf(doc, 101), { runId: '101', source: 'a11y', seenAt: '2026-11-03T05:00:00Z', headSha: HEAD_SHA.slice(0, 10),
    clusters: { 'focus-lost': [2, 2, 0, 0], 'menu-roles': [1, 1, 0, 0] } });
  assert.deepEqual(historyOf(doc, 111).clusters, { 'focus-lost': [1, 0, 1, 0], 'menu-roles': [1, 0, 0, 0], 'target-small': [1, 1, 0, 0] });
  assert.deepEqual(historyOf(doc, 121).clusters, { 'focus-lost': [2, 0, 0, 1], 'menu-roles': [1, 0, 0, 0], 'target-small': [1, 0, 0, 0] },
    'the returned row is open again and counted as back, not as new');
  assert.ok(doc.history.every(entry => Object.values(entry.clusters).every(counts => counts.length === 4 && counts.some(count => count > 0))),
    'a cluster with nothing open and nothing moved is left out of an entry');
});

test('a target that was not measured resolves nothing in the history: the entry is counted from the rows, and a row needs evidence of absence', () => {
  const { doc } = record(null, [
    [101, '2026-11-03T05:00:00Z', a11yNight([walker('focus-lost', 'a'), walker('focus-lost', 'b')])],
    // The second night shows neither finding, and measured page b only: page a had a tooling problem.
    [111, '2026-11-10T05:00:00Z', a11yNight([], ['b', 'c'])],
  ]);

  assert.deepEqual(doc.rows.map(row => [row.page, row.status]), [['a', 'new'], ['b', 'resolved']]);
  assert.deepEqual(historyOf(doc, 111).clusters, { 'focus-lost': [1, 0, 1, 0] }, 'page a stays open, sighted or not: nothing measured it gone');

  const progress = fixProgress(doc, CATALOG).trackers.find(item => item.tracker === 'TASK-1');

  assert.deepEqual([progress.open, progress.resolved, progress.clearedAt], [1, 1, null], 'and its task is not cleared by a night that could not look');
});

test('a later attempt of a night replaces the night\'s history entry instead of adding to it', () => {
  const first = [101, '2026-11-03T05:00:00Z', a11yNight([walker('focus-lost', 'a'), walker('focus-lost', 'b')])];
  const { doc, results } = record(null, [
    first,
    [111, '2026-11-10T05:00:00Z', a11yNight([], ['b'])],
    // The re-run measured page a too, and the finding was gone there as well.
    [111, '2026-11-10T07:00:00Z', a11yNight([], ['a', 'b', 'c']), { attempt: 2 }],
  ]);

  assert.deepEqual(results.map(result => result.changed), [true, true, true]);
  assert.deepEqual(doc.history.map(entry => [entry.runId, entry.seenAt]), [['111', '2026-11-10T05:00:00Z'], ['101', '2026-11-03T05:00:00Z']],
    'one entry per night, at the night\'s own time');
  assert.deepEqual(historyOf(doc, 111).clusters, { 'focus-lost': [0, 0, 2, 0] }, 'recounted from the rows after the amendment');
});

test('an entry holds its own source\'s rows, and a cluster\'s total over time folds the latest entry of each source', () => {
  const { doc } = record(null, [
    [101, '2026-11-03T05:00:00Z', a11yNight([walker('menu-role', 'a'), walker('menu-role', 'b')])],
    [102, '2026-11-03T06:00:00Z', siteNight('docs', 'aria-required-parent', ['intro', 'guide', 'api'])],
    // The grid's two are fixed; the docs site still shows its three, and no docs night ran since.
    [111, '2026-11-10T05:00:00Z', a11yNight([])],
    [122, '2026-11-17T06:00:00Z', siteNight('docs', 'aria-required-parent', [])],
  ]);

  assert.deepEqual(historyOf(doc, 101).clusters, { 'menu-roles': [2, 2, 0, 0] });
  assert.deepEqual(historyOf(doc, 102).clusters, { 'menu-roles': [3, 3, 0, 0] }, 'the docs night counts the docs rows only');
  assert.deepEqual(historyOf(doc, 111).clusters, { 'menu-roles': [0, 0, 2, 0] });

  const [first, second] = fixProgress(doc, CATALOG).trackers;

  // Two tasks own the one cluster, so each row counts all of it: the catalog does not say whose finding is whose.
  assert.deepEqual([first.tracker, second.tracker], ['TASK-2', 'TASK-3']);
  assert.deepEqual([first.sharedWith, second.sharedWith], [['TASK-3'], ['TASK-2']]);

  for (const item of [first, second]) {
    assert.equal(item.peak, 5, 'two on the grid and three on the docs site at once');
    assert.equal(item.resolved, 5);
    assert.equal(item.open, 0);
    assert.equal(item.firstSeen, '2026-11-03T05:00:00Z');
    assert.deepEqual(item.clearedAt, { seenAt: '2026-11-17T06:00:00Z', runId: '122', source: 'docs' },
      'cleared by the docs night, the first night after the last one that left a finding open: the grid night did not clear it');
    assert.equal(item.days, 14);
    assert.deepEqual(item.surfaces, ['grid', 'docs']);
  }
});

test('a row the catalog moves to another cluster takes its past along: a split, a rename or a sorted triage shape is never a fix', () => {
  const before = record(null, [
    [101, '2026-11-03T05:00:00Z', a11yNight([walker('focus-lost', 'a'), walker('focus-lost', 'b'), walker('focus-lost', 'c'), walker('mystery', 'a')])],
    [111, '2026-11-10T05:00:00Z', a11yNight([walker('focus-lost', 'a'), walker('focus-lost', 'b'), walker('mystery', 'a')])],
  ]).doc;

  assert.deepEqual(historyOf(before, 101).clusters, { 'focus-lost': [3, 3, 0, 0], [TRIAGE_ID]: [1, 1, 0, 0] });
  assert.deepEqual(historyOf(before, 111).clusters, { 'focus-lost': [2, 0, 1, 0], [TRIAGE_ID]: [1, 0, 0, 0] });

  // The catalog now says page b's lost focus is the reader's own behavior, and names the triage shape's cause.
  const split = catalogOf([
    { id: 'focus-lost-by-design', title: 'The focus leaves on purpose', notDefect: 'documented-exit',
      match: [{ source: 'checks', kinds: ['focus-lost'], pages: ['b'] }] },
    { id: 'mystery-solved', title: 'What the mystery was', tracker: 'TASK-9', match: [{ source: 'checks', kinds: ['mystery'] }] },
  ]);
  const { doc, results } = record(before, [
    [121, '2026-11-17T05:00:00Z', a11yNight([walker('focus-lost', 'a'), walker('focus-lost', 'b'), walker('mystery', 'a')]), { catalog: split }],
  ]);

  assert.match(results[0].notes.join('\n'), /^2 row\(s\) moved to another cluster by the catalog; the history moved with them$/m);
  assert.deepEqual(historyOf(doc, 101).clusters, { 'focus-lost': [2, 2, 0, 0], 'focus-lost-by-design': [1, 1, 0, 0], 'mystery-solved': [1, 1, 0, 0] },
    'the first night, as the catalog sorts its rows today');
  assert.deepEqual(historyOf(doc, 111).clusters, { 'focus-lost': [1, 0, 1, 0], 'focus-lost-by-design': [1, 0, 0, 0], 'mystery-solved': [1, 0, 0, 0] },
    'page c\'s resolution stays with the cluster that still holds its row');
  assert.deepEqual(historyOf(doc, 121).clusters, { 'focus-lost': [1, 0, 0, 0], 'focus-lost-by-design': [1, 0, 0, 0], 'mystery-solved': [1, 0, 0, 0] });

  const progress = fixProgress(doc, split);
  const task = progress.trackers.find(item => item.tracker === 'TASK-1');

  // Without the re-keying the task would read 3 at most and 1 now with 1 resolved: a finding fixed by an edit to a JSON file.
  assert.deepEqual([task.open, task.peak, task.resolved], [1, 2, 1]);
  assert.deepEqual(progress.others.find(item => item.kind === 'triage').peak, 0, 'the sorted shape left the queue\'s past too');
  assert.deepEqual(progress.trackers.find(item => item.tracker === 'TASK-9').firstSeen, '2026-11-03T05:00:00Z',
    'and a task named today owns its cluster\'s whole past');
});

test('a renamed cluster names its former id, and takes the past of rows the ledger no longer holds', () => {
  // Page a's lost focus is seen in January and measured gone a week later; by April its row has left the ledger.
  const before = record(null, [
    [101, '2026-01-05T05:00:00Z', a11yNight([walker('focus-lost', 'a'), walker('focus-lost', 'b')])],
    [111, '2026-01-12T05:00:00Z', a11yNight([walker('focus-lost', 'b')])],
    [121, '2026-04-20T05:00:00Z', a11yNight([walker('focus-lost', 'b')])],
  ]).doc;
  const taskOf = (doc, catalog) => fixProgress(doc, catalog).trackers.find(item => item.tracker === 'TASK-1');

  assert.deepEqual(before.rows.map(row => row.page), ['b'], 'the resolved row is gone, and only the history remembers it');
  assert.deepEqual([taskOf(before, CATALOG).open, taskOf(before, CATALOG).peak, taskOf(before, CATALOG).resolved], [1, 2, 1]);

  // The catalog renames the cluster, same rule and same tracker, and the new cluster names what it was.
  const renamed = formerIds => catalogOf([{ id: 'focus-leaves-grid', title: 'The focus leaves the grid', tracker: 'TASK-1', ...(formerIds ? { formerIds } : {}),
    match: [{ source: 'checks', kinds: ['focus-lost'] }] }], ['focus-lost']);
  const night = [131, '2026-04-27T05:00:00Z', a11yNight([walker('focus-lost', 'b')])];
  const withFormer = renamed(['focus-lost']);
  const { doc } = record(before, [[...night, { catalog: withFormer }]]);

  assert.deepEqual(historyOf(doc, 101).clusters, { 'focus-leaves-grid': [2, 2, 0, 0] });
  assert.deepEqual(historyOf(doc, 111).clusters, { 'focus-leaves-grid': [1, 0, 1, 0] }, 'the resolution of the row that left follows the rename');
  assert.ok(doc.history.every(entry => !Object.hasOwn(entry.clusters, 'focus-lost')), 'nothing is left under the former id');

  const task = taskOf(doc, withFormer);

  assert.deepEqual([task.open, task.peak, task.resolved, task.firstSeen], [1, 2, 1, '2026-01-05T05:00:00Z'], 'the task reads as it did before the rename');
  assert.deepEqual(fixProgress(doc, withFormer).others.find(item => item.kind === 'untracked').clusters.map(cluster => cluster.id), ['target-small'],
    'and the former id is not listed as a cluster no tracker owns');

  // Without the former id the rename takes along only what the rows still say: the limit the field exists for.
  const plain = renamed(null);
  const lost = record(before, [[...night, { catalog: plain }]]).doc;

  assert.deepEqual(historyOf(lost, 111).clusters, { 'focus-leaves-grid': [1, 0, 0, 0], 'focus-lost': [0, 0, 1, 0] });
  assert.deepEqual([taskOf(lost, plain).peak, taskOf(lost, plain).resolved], [1, 0]);
});

test('a task is cleared only by a night that measured a finding of it gone: findings that left the ledger unmeasured clear nothing', () => {
  const { doc } = record(null, [
    [101, '2026-01-01T05:00:00Z', a11yNight([walker('focus-lost', 'c')])],
    // Page c is not measured again, and after 90 days its row leaves the ledger, unresolved.
    [111, '2026-01-02T05:00:00Z', a11yNight([], ['a', 'b'])],
    [121, '2026-04-15T05:00:00Z', a11yNight([], ['a', 'b'])],
  ]);
  const task = fixProgress(doc, CATALOG).trackers.find(item => item.tracker === 'TASK-1');

  assert.deepEqual(doc.rows, []);
  assert.deepEqual([task.open, task.peak, task.resolved], [0, 1, 0]);
  assert.deepEqual([task.clearedAt, task.days], [null, null], 'no audit looked at the finding again, so no night fixed it and no fix took 104 days');
  assert.deepEqual(fixProgress(doc, CATALOG).headline.trackers, { total: 1, clear: 1 }, 'it has no open finding, which is all the headline says');
});

test('a moved row that had come back takes its earlier resolution along with its return', () => {
  const before = record(null, [
    [101, '2026-11-03T05:00:00Z', a11yNight([walker('focus-lost', 'a')])],
    [111, '2026-11-10T05:00:00Z', a11yNight([])],
    [121, '2026-11-17T05:00:00Z', a11yNight([walker('focus-lost', 'a')])],
  ]).doc;
  const row = before.rows[0];

  // The row keeps the resolution its return undid, and when it returned: its other fields say neither any more.
  assert.deepEqual([row.status, row.resolvedAt, row.lastResolvedAt, row.backAt], ['flapping', null, '2026-11-10T05:00:00Z', '2026-11-17T05:00:00Z']);
  assert.deepEqual([historyOf(before, 111).clusters, historyOf(before, 121).clusters], [{ 'focus-lost': [0, 0, 1, 0] }, { 'focus-lost': [1, 0, 0, 1] }]);

  // The catalog moves page a's finding to a cluster of another task, and a docs night is the next to be recorded.
  const moved = catalogOf([{ id: 'focus-lost-on-a', title: 'The focus is lost on page a', tracker: 'TASK-6',
    match: [{ source: 'checks', kinds: ['focus-lost'], pages: ['a'] }] }]);
  const { doc } = record(before, [[122, '2026-11-17T06:00:00Z', siteNight('docs', 'aria-required-parent', []), { catalog: moved }]]);

  assert.deepEqual([historyOf(doc, 101).clusters, historyOf(doc, 111).clusters, historyOf(doc, 121).clusters],
    [{ 'focus-lost-on-a': [1, 1, 0, 0] }, { 'focus-lost-on-a': [0, 0, 1, 0] }, { 'focus-lost-on-a': [1, 0, 0, 1] }],
    'the first sighting, the resolution and the return all moved: the old cluster keeps no fix it did not make');

  const progress = fixProgress(doc, moved);

  assert.equal(progress.trackers.some(item => item.tracker === 'TASK-1'), false, 'the old task has nothing on record');
  assert.deepEqual(progress.trackers.filter(item => item.tracker === 'TASK-6').map(item => [item.open, item.peak, item.resolved]), [[1, 1, 0]]);

  // The return stays on its night when the row is seen again before the catalog moves it.
  const seenAgain = record(before, [[128, '2026-11-24T05:00:00Z', a11yNight([walker('focus-lost', 'a')])]]).doc;
  const later = record(seenAgain, [[129, '2026-11-24T06:00:00Z', siteNight('docs', 'aria-required-parent', []), { catalog: moved }]]).doc;

  assert.deepEqual([historyOf(later, 111).clusters, historyOf(later, 121).clusters, historyOf(later, 128).clusters],
    [{ 'focus-lost-on-a': [0, 0, 1, 0] }, { 'focus-lost-on-a': [1, 0, 0, 1] }, { 'focus-lost-on-a': [1, 0, 0, 0] }]);

  // A row that returned before it kept the pair reads the old way: open since its first sighting, back on its last night.
  const { lastResolvedAt, backAt, ...legacy } = row;
  const old = record({ ...before, rows: [legacy] }, [[122, '2026-11-17T06:00:00Z', siteNight('docs', 'aria-required-parent', []), { catalog: moved }]]).doc;

  assert.deepEqual([historyOf(old, 101).clusters, historyOf(old, 111).clusters, historyOf(old, 121).clusters],
    [{ 'focus-lost-on-a': [1, 1, 0, 0] }, { 'focus-lost': [0, 0, 1, 0], 'focus-lost-on-a': [1, 0, 0, 0] }, { 'focus-lost-on-a': [1, 0, 0, 1] }]);
});

test('migrateA11yLedger rebuilds the history of a version 1 file from its rows, and returns a current document as it is', () => {
  // A cut of the published file of 2026-11-17 (24 nights, 88 of 8,432 rows: a third of the resolved or returned rows
  // and an even sample of the open ones), in the published version 1 shape.
  const v1 = JSON.parse(readFileSync(V1_FIXTURE, 'utf8'));

  assert.equal(v1.version, 1, 'the fixture is the version the site published before the history existed');
  assert.equal(v1.history, undefined);
  assert.throws(() => assertA11yVersion(v1), /a11y\.json has version 1/, 'nothing reads a version 1 file but the migration');

  const doc = migrateA11yLedger(v1);

  assert.equal(doc.version, A11Y_VERSION);
  assert.equal(doc.historyDays, A11Y_HISTORY_DAYS);
  assert.doesNotThrow(() => assertA11yVersion(doc));
  assert.deepEqual(doc.rows, v1.rows, 'the rows are untouched');
  assert.deepEqual(doc.nights, v1.nights, 'and so are the nights');
  assert.deepEqual(doc.history.map(entry => [entry.runId, entry.source, entry.seenAt]), v1.nights.map(night => [night.runId, night.source, night.seenAt]),
    'one entry per recorded night, newest first');
  assert.ok(doc.history.every(entry => /^[0-9a-f]{10}$/.test(entry.headSha)));

  // The A11y night of 2026-11-10 resolved 62 rows on the site; the cut keeps 21 of them, 19 contrast and 2 target-size.
  const audit = historyOf(doc, '42763025203');

  assert.deepEqual([audit.clusters['contrast-and-focus-visibility'][2], audit.clusters['target-size'][2]], [19, 2]);
  assert.equal(Object.values(audit.clusters).reduce((sum, counts) => sum + counts[2], 0), 21);

  // What an entry says agrees with the rows it was counted from, for every night and every source.
  const sourceOf = { checks: 'a11y', axe: 'a11y', reader: 'reader', docs: 'docs', 'docs-checks': 'docs', website: 'website', 'website-checks': 'website' };
  const total = (entry, index) => Object.values(entry.clusters).reduce((sum, counts) => sum + counts[index], 0);

  for (const entry of doc.history) {
    const ofSource = v1.rows.filter(row => sourceOf[row.source] === entry.source);

    assert.equal(total(entry, 1), ofSource.filter(row => row.firstRun === entry.runId).length, `the rows new on ${entry.runId}`);
    assert.equal(total(entry, 2), ofSource.filter(row => row.status === 'resolved' && row.resolvedAt === entry.seenAt).length,
      `the rows ${entry.runId} resolved`);
  }
  for (const source of NIGHT_SOURCES) {
    const latest = doc.history.find(entry => entry.source === source);

    assert.equal(total(latest, 0), v1.rows.filter(row => sourceOf[row.source] === source && row.status !== 'resolved').length,
      `the latest ${source} entry leaves open what the rows leave open`);
  }

  // A document of this version comes back as the same object, so a collection that records nothing rewrites nothing.
  assert.equal(migrateA11yLedger(doc), doc);
  assert.equal(migrateA11yLedger(null), null);
  assert.throws(() => migrateA11yLedger({ version: A11Y_VERSION + 1, nights: [], rows: [] }), new RegExp(`a11y\\.json has version ${A11Y_VERSION + 1}`),
    'a newer file is never read by an older collector');
  assert.throws(() => migrateA11yLedger({ nights: [], rows: [] }), /a11y\.json has version undefined/);
});

test('a merge reads a version 1 ledger through the migration: a night that records nothing leaves it unwritten, the next recorded one writes version 2', () => {
  const v1 = JSON.parse(readFileSync(V1_FIXTURE, 'utf8'));
  const stale = runContextFromRun({ id: 42763025203, run_attempt: 1, name: A11Y_NIGHTLY_WORKFLOW, head_branch: 'develop', head_sha: HEAD_SHA,
    event: 'workflow_dispatch', updated_at: '2026-11-10T05:54:42Z', conclusion: 'success', html_url: 'https://github.com/handsontable/handsontable/actions/runs/42763025203' });
  const again = mergeA11yLedger(v1, a11yNight([]), stale, CATALOG, { now: new Date('2026-11-18T00:00:00Z') });

  assert.equal(again.changed, false, 'a night already recorded changes nothing, so the published file stays as it is');
  assert.equal(again.doc.version, A11Y_VERSION, 'while the page is drawn from the migrated document');
  assert.equal(again.doc.history.length, 24);

  const { doc, results } = record(v1, [[45000000001, '2026-11-24T05:00:00Z', a11yNight([walker('focus-lost', 'a')])]]);

  assert.equal(results[0].changed, true);
  assert.equal(doc.version, A11Y_VERSION);
  assert.equal(doc.history.length, 25, 'the rebuilt entries and the new night\'s');
  assert.equal(doc.history[0].runId, '45000000001');
  assert.deepEqual(JSON.parse(serializeA11yLedger(doc)), doc, 'and the written file reads back whole');
});

test('the history keeps its own retention, far past the rows\'', () => {
  const { doc } = record(null, [
    [101, '2026-01-05T05:00:00Z', a11yNight([walker('focus-lost', 'a')])],
    [111, '2026-01-12T05:00:00Z', a11yNight([])],
    // Ten months on: the resolved row and both nights are long gone, and the task's fix is still on record.
    [121, '2026-11-17T05:00:00Z', a11yNight([walker('menu-role', 'b')])],
  ]);

  assert.deepEqual(doc.rows.map(row => row.kind), ['menu-role']);
  assert.deepEqual(doc.nights.map(night => night.runId), ['121']);
  assert.deepEqual(doc.history.map(entry => entry.runId), ['121', '111', '101']);

  const task = fixProgress(doc, CATALOG).trackers.find(item => item.tracker === 'TASK-1');

  assert.deepEqual([task.open, task.peak, task.resolved, task.firstSeen, task.days], [0, 1, 1, '2026-01-05T05:00:00Z', 7]);
  assert.deepEqual(task.clearedAt, { seenAt: '2026-01-12T05:00:00Z', runId: '111', source: 'a11y' });
  assert.deepEqual(task.surfaces, ['grid'], 'read from the history once no row is left');

  // Past the history's own window the entry goes too.
  const later = record(doc, [[131, '2028-02-01T05:00:00Z', a11yNight([walker('menu-role', 'b')])]]).doc;

  assert.deepEqual(later.history.map(entry => entry.runId), ['131', '121'], `entries older than ${A11Y_HISTORY_DAYS} days are dropped`);
  assert.equal(fixProgress(later, CATALOG).trackers.some(item => item.tracker === 'TASK-1'), false, 'a task with nothing on record is not listed');
});

test('an entry counts what the ledger holds after the merge: a row that leaves unresolved is no longer open, and a resolution is kept even when its row leaves at once', () => {
  // Audits a long way apart. Page a's finding is seen in January; the walker then stops measuring page a.
  const stale = record(null, [
    [101, '2026-01-05T05:00:00Z', a11yNight([walker('focus-lost', 'a'), walker('focus-lost', 'b')])],
    [111, '2026-02-02T05:00:00Z', a11yNight([walker('focus-lost', 'b')], ['b', 'c'])],
    // More than 90 days after page a was last seen: its row leaves the ledger, unresolved.
    [121, '2026-04-20T05:00:00Z', a11yNight([walker('focus-lost', 'b')], ['b', 'c'])],
  ]).doc;

  assert.deepEqual(stale.rows.map(row => row.page), ['b']);
  assert.deepEqual(historyOf(stale, 111).clusters, { 'focus-lost': [2, 0, 0, 0] }, 'unmeasured, so still open');
  assert.deepEqual(historyOf(stale, 121).clusters, { 'focus-lost': [1, 0, 0, 0] }, 'the row that left is not counted open by the night it left on');

  // The next audit comes five months later and finds page b's finding gone. The row was last seen more than 90 days
  // before, so it leaves in the same merge: the history is the only place that keeps the fix.
  const { doc } = record(stale, [[131, '2026-09-21T05:00:00Z', a11yNight([], ['b', 'c'])]]);

  assert.deepEqual(doc.rows, []);
  assert.deepEqual(historyOf(doc, 131).clusters, { 'focus-lost': [0, 0, 1, 0] });

  const task = fixProgress(doc, CATALOG).trackers.find(item => item.tracker === 'TASK-1');

  assert.deepEqual([task.open, task.peak, task.resolved], [0, 2, 1]);
  assert.deepEqual(task.clearedAt, { seenAt: '2026-09-21T05:00:00Z', runId: '131', source: 'a11y' });
});

test('a11yAudits groups the nights that complete within half a day into one audit, and a full audit holds all four sources', () => {
  const entry = (runId, source, seenAt) => ({ runId: String(runId), source, seenAt, headSha: 'abc', clusters: {} });
  const audits = a11yAudits([
    // Newest first, as the ledger stores them.
    entry(9, 'reader', '2026-11-17T14:30:00Z'),
    entry(8, 'a11y', '2026-11-17T12:09:26Z'),
    entry(7, 'docs', '2026-11-17T12:05:20Z'),
    entry(6, 'website', '2026-11-17T12:01:27Z'),
    entry(5, 'docs', '2026-11-16T12:09:18Z'),
    entry(4, 'docs', '2026-11-10T10:13:17Z'),
    entry(3, 'a11y', '2026-11-10T05:54:42Z'),
    entry(2, 'reader', '2026-11-10T05:52:19Z'),
    entry(1, 'reader', '2026-11-09T17:52:20Z'),
  ]);

  assert.equal(A11Y_AUDIT_WINDOW_HOURS, 12);
  assert.deepEqual(audits.map(audit => [audit.startedAt, audit.endedAt, audit.sources, audit.full, audit.nights.map(night => night.runId)]), [
    // A second less than twelve hours before the next reader night, and still an audit of its own: the window
    // is measured from an audit's first night, so a chain of nights cannot stretch one audit over days.
    ['2026-11-09T17:52:20Z', '2026-11-10T05:52:19Z', ['reader'], false, ['1', '2']],
    ['2026-11-10T05:54:42Z', '2026-11-10T10:13:17Z', ['a11y', 'docs'], false, ['3', '4']],
    ['2026-11-16T12:09:18Z', '2026-11-16T12:09:18Z', ['docs'], false, ['5']],
    ['2026-11-17T12:01:27Z', '2026-11-17T14:30:00Z', ['a11y', 'reader', 'docs', 'website'], true, ['6', '7', '8', '9']],
  ]);
  assert.deepEqual(a11yAudits([]), []);
  assert.deepEqual(a11yAudits(undefined), []);
});

const threeAudits = () => record(null, threeAuditNights()).doc;

test('fixProgress gives one row per tracker, with what is open now, the most it had, what was resolved, and the night that cleared it', () => {
  const progress = fixProgress(threeAudits(), CATALOG);
  const byTracker = Object.fromEntries(progress.trackers.map(item => [item.tracker, item]));

  assert.deepEqual(progress.trackers.map(item => item.tracker), ['TASK-2', 'TASK-3', 'TASK-4', 'TASK-1'], 'most open first, then by id');
  assert.deepEqual(byTracker['TASK-1'], {
    kind: 'tracker',
    tracker: 'TASK-1',
    notDefect: null,
    sharedWith: [],
    clusters: [{ id: 'focus-lost', title: 'The focus is lost' }],
    open: 0,
    atTarget: 0,
    peak: 3,
    resolved: 3,
    firstSeen: '2026-11-03T05:00:00Z',
    // The A11y night of the second full audit: the first night after the last one that left a lost focus open.
    clearedAt: { seenAt: '2026-11-17T05:00:00Z', runId: '121', source: 'a11y' },
    days: 14,
    surfaces: ['grid'],
  });
  // The menu cluster: two rows on the grid, one of them advisory, and one on the docs site since the first full audit.
  assert.deepEqual([byTracker['TASK-2'].open, byTracker['TASK-2'].atTarget, byTracker['TASK-2'].peak, byTracker['TASK-2'].resolved], [3, 2, 3, 0]);
  assert.deepEqual([byTracker['TASK-2'].clearedAt, byTracker['TASK-2'].days], [null, null], 'nothing is cleared while a finding is open');
  assert.deepEqual(byTracker['TASK-2'].surfaces, ['grid', 'docs']);
  assert.deepEqual(byTracker['TASK-3'], { ...byTracker['TASK-2'], tracker: 'TASK-3', sharedWith: ['TASK-2'] }, 'the second owner of the cluster reads the same');
  assert.deepEqual([byTracker['TASK-4'].open, byTracker['TASK-4'].peak, byTracker['TASK-4'].firstSeen, byTracker['TASK-4'].surfaces],
    [3, 3, '2026-11-10T06:30:00Z', ['website']]);
});

test('fixProgress keeps three kinds of rows apart from the fix tasks: no tracker, needs triage, and not a defect by class', () => {
  const { others } = fixProgress(threeAudits(), CATALOG);

  assert.deepEqual(others.map(item => [item.kind, item.tracker, item.notDefect, item.clusters.map(cluster => cluster.id)]), [
    ['untracked', null, null, ['target-small']],
    ['triage', null, null, [TRIAGE_ID]],
    ['not-defect', null, 'reader-behavior', ['reader-wording']],
  ]);

  const [untracked, triage, readerOwn] = others;

  // Two small targets: one names an AAA criterion alone, so one counts at the target level. Page b's was resolved
  // and came back: the same finding, so nothing is left resolved.
  assert.deepEqual([untracked.open, untracked.atTarget, untracked.peak, untracked.resolved], [2, 1, 2, 0]);
  assert.deepEqual([triage.open, triage.peak, triage.firstSeen, triage.clusters[0].title], [1, 1, '2026-11-17T05:00:00Z', 'Needs triage']);
  assert.deepEqual([readerOwn.open, readerOwn.atTarget, readerOwn.peak, readerOwn.resolved, readerOwn.surfaces], [1, 0, 2, 1, ['grid']],
    'a golden difference is advisory: open, and never at the target level');
});

test('the headline counts each defect finding once, against the first full audit, and names the audits it speaks of', () => {
  const { headline, asOf, auditWindowHours, recentDays, historyDays } = fixProgress(threeAudits(), CATALOG);

  assert.deepEqual([asOf, auditWindowHours, recentDays, historyDays], ['2026-11-17T06:10:00Z', 12, A11Y_RECENT_DAYS, A11Y_HISTORY_DAYS]);
  assert.deepEqual(headline.trackers, { total: 4, clear: 1 }, 'four tasks have findings on record, and one has none open');
  // Menu 3 (once, though two tasks own it), website 3, small targets 2, triage 1: the reader's own wording is left out.
  assert.equal(headline.open, 9);
  assert.equal(headline.atTarget, 7, 'less the advisory menu row and the AAA target');
  assert.equal(headline.notDefect, 1);
  assert.equal(headline.audits, 4);
  // The audit of 2026-11-10 is the first with all four workflows. It left open: focus 2, menu 3, small targets 2, website 2.
  assert.deepEqual(headline.baseline, { startedAt: '2026-11-10T04:00:00Z', endedAt: '2026-11-10T06:30:00Z', open: 9, new: 2, resolved: 3, back: 1 },
    'since then: the website page and the triage row are new, the small target and two lost focuses were resolved, the small target came back');
  assert.equal(headline.baseline.open + headline.baseline.new + headline.baseline.back - headline.baseline.resolved, headline.open,
    'the chain adds up while nothing left the ledger unresolved');
  assert.deepEqual(headline.latestAudit, {
    startedAt: '2026-11-17T04:00:00Z', endedAt: '2026-11-17T06:10:00Z', sources: ['a11y', 'reader', 'docs', 'website'], full: true,
    nights: [{ runId: '120', source: 'reader', seenAt: '2026-11-17T04:00:00Z' }, { runId: '121', source: 'a11y', seenAt: '2026-11-17T05:00:00Z' },
      { runId: '122', source: 'docs', seenAt: '2026-11-17T06:00:00Z' }, { runId: '123', source: 'website', seenAt: '2026-11-17T06:10:00Z' }],
    new: 2, resolved: 2, back: 1,
  });
  assert.deepEqual([headline.previousAudit.startedAt, headline.previousAudit.sources, headline.previousAudit.full, headline.previousAudit.resolved],
    ['2026-11-12T05:00:00Z', ['a11y'], false, 1]);
  assert.equal(headline.gapDays, 5, 'the two latest audits are five days apart, which is as fine as a fix time can be read');
  // Every defect finding ever seen is new within the window: focus 3, menu 3, small targets 2, website 3, triage 1.
  assert.deepEqual(headline.recent, { new: 12, resolved: 4, back: 1 }, 'everything is within the last 30 days here');
  assert.equal(headline.cameBack, 1);
  // The three lost focuses took 7, 14 and 14 days from first seen to the night that found them gone.
  assert.deepEqual([headline.resolvedRows, headline.medianDays], [3, 14]);
});

test('before a full audit there is no baseline, and before any night no progress', () => {
  const { doc } = record(null, [[101, '2026-11-03T05:00:00Z', a11yNight([walker('focus-lost', 'a')])]]);
  const { headline } = fixProgress(doc, CATALOG);

  assert.equal(headline.baseline, null, 'one workflow is not a full audit');
  assert.deepEqual([headline.audits, headline.previousAudit, headline.gapDays, headline.medianDays, headline.resolvedRows], [1, null, null, null, 0]);
  assert.equal(fixProgress(null, CATALOG), null);
  assert.equal(fixProgress({ nights: [], rows: [] }, CATALOG), null);
});

test('the rows have the last word: a task with an open row is never cleared, whatever the history says', () => {
  const { doc } = record(null, [[101, '2026-11-03T05:00:00Z', a11yNight([walker('focus-lost', 'a')])]]);
  // A later entry that counts nothing open, as a history cut or written by other code could leave it.
  const tampered = { ...doc, history: [{ runId: '111', source: 'a11y', seenAt: '2026-11-10T05:00:00Z', headSha: 'abc', clusters: {} }, ...doc.history] };
  const task = fixProgress(tampered, CATALOG).trackers.find(item => item.tracker === 'TASK-1');

  assert.deepEqual([task.open, task.peak, task.clearedAt, task.days], [1, 1, null, null]);
});

test('countsAtTarget draws the check runs\' line: advisory never counts, a finding below A and AA never counts, a reader step counts at its severity', () => {
  const row = fields => ({ source: 'checks', severity: 'serious', criteria: ['2.4.3'], ...fields });

  assert.equal(countsAtTarget(row({})), true);
  assert.equal(countsAtTarget(row({ severity: 'minor', criteria: ['1.4.6', '1.4.3'] })), true, 'one criterion at the target level is enough');
  assert.equal(countsAtTarget(row({ severity: 'advisory' })), false, 'a result axe could not decide, a golden that moved');
  assert.equal(countsAtTarget(row({ criteria: ['1.4.6'] })), false, 'an AAA criterion alone');
  assert.equal(countsAtTarget(row({ criteria: [] })), false, 'a best-practice record names none');
  assert.equal(countsAtTarget(row({ source: 'reader', criteria: [] })), true, 'a reader row carries no criterion by design');
  assert.equal(countsAtTarget(row({ source: 'reader', criteria: [], severity: 'advisory' })), false);
  assert.equal(countsAtTarget(row({ source: 'axe', severity: null, criteria: ['1.3.1'] })), true, 'a scan row stored before the impact was read');
  assert.deepEqual(A11Y_SURFACES, ['grid', 'docs', 'website']);
  assert.deepEqual(['checks', 'axe', 'reader', 'docs', 'docs-checks', 'website', 'website-checks'].map(source => surfaceOf({ source })),
    ['grid', 'grid', 'grid', 'docs', 'docs', 'website', 'website']);
});

test('the page names no task: a row is named by its clusters, and the tasks that own the same clusters are one row', () => {
  const doc = threeAudits();
  const view = a11yView(doc, CATALOG);

  // The page is public, and a tracker is code in the catalog: no task id is in what the page inlines.
  assert.ok(!/TASK-\d/.test(JSON.stringify(view)), 'no task id reaches the page');
  assert.ok(view.fix.rows.every(row => !('tracker' in row) && !('sharedWith' in row)), 'not even as an empty field a later change could fill');
  assert.deepEqual(view.fix.rows.map(item => [item.kind, item.tasks, item.shared, item.clusters.map(cluster => cluster.id).join()]), [
    // The two owners of the menu cluster would read alike without their ids, so they are one row that stands for two tasks.
    ['tracker', 2, 0, 'menu-roles'],
    ['tracker', 1, 0, 'site-contrast'],
    ['tracker', 1, 0, 'focus-lost'],
    ['untracked', 0, 0, 'target-small'],
    ['triage', 0, 0, TRIAGE_ID],
    ['not-defect', 0, 0, 'reader-wording'],
  ]);
  assert.deepEqual(view.fix.headline.trackers, { total: 4, clear: 1 }, 'the headline still counts tasks');

  const menu = view.fix.rows[0];

  assert.deepEqual([menu.open, menu.atTarget, menu.peak, menu.resolved, menu.notDefect, menu.clearedAt], [3, 2, 3, 0, null, null], 'with the numbers of either task');
  assert.equal(view.fix.rows.find(item => item.kind === 'not-defect').notDefect, 'reader-behavior', 'a class is not a task id, and is named');

  // A task that shares only some of its clusters keeps a row of its own and says how many tasks it shares with.
  const partial = catalogOf([{ id: 'menu-roles-docs', title: 'Menu roles on the docs site', tracker: ['TASK-2', 'TASK-5'],
    match: [{ source: 'docs', rules: ['aria-required-parent'] }] }]);
  const rows = a11yView(record(null, threeAuditNights().map(([id, at, night]) => [id, at, night, { catalog: partial }])).doc, partial).fix.rows;

  assert.deepEqual(rows.filter(item => item.kind === 'tracker').map(item => [item.clusters.map(cluster => cluster.id).join(), item.open, item.tasks, item.shared]), [
    // Most open first, a tie in the order of the task ids the page does not print. One task owns both menu clusters,
    // three findings, and shares them with two others.
    ['menu-roles-docs,menu-roles', 3, 1, 2],
    ['site-contrast', 3, 1, 0],
    ['menu-roles', 2, 1, 1],
    ['menu-roles-docs', 1, 1, 1],
    ['focus-lost', 0, 1, 0],
  ]);
  assert.equal(a11yView(null, CATALOG), null);
});
