import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DIGEST_DAYS, DIGEST_LISTED, DIGEST_PAGE_URL, DIGEST_TITLE, a11yDigest, renderA11yDigest, slackText, trackerAddress } from '../lib/a11y-digest.mjs';
import { nightMeasured, serializeA11yLedger } from '../lib/a11y-ledger.mjs';
import { repoRoot } from '../lib/repo-root.mjs';
import { job, steps } from '../lib/workflow-text.mjs';
import { CATALOG, a11yNight, catalogOf, readerNight, record, siteNight, threeAuditNights, walker } from './fixtures/a11y-nights.mjs';

// The weekly accessibility digest: what changed between two published states of the findings ledger, in the words
// Slack gets (tests/AGENTS.md, "A11y: the weekly digest").

const V1_FIXTURE = path.join(repoRoot(), '.github/scripts/__tests__/fixtures/a11y-ledger-v1.json');
const WORKFLOW = '.github/workflows/a11y-digest.yml';
const TRACKERS = 'https://tracker.example/t/1234/';

// The ledger after the three audits of the shared nights (2026-11-03, 2026-11-10 with all four workflows, 2026-11-12 the
// grid alone, 2026-11-17 with all four): the state every case here starts from.
const lastWeek = () => record(null, threeAuditNights()).doc;
// What the grid's night of 2026-11-17 held, to carry into a later night unchanged.
const GRID = [walker('menu-role', 'a'), walker('menu-role', 'b', { severity: 'advisory' }), walker('target-small', 'a', { criteria: ['2.5.5'] }),
  walker('target-small', 'b'), walker('mystery', 'c')];
const linesOf = text => text.split('\n');

test('a planted regression shows as declined: one more night with a new finding on a target the earlier audit measured', () => {
  const before = lastWeek();
  // A week later the grid is audited again. Everything is as it was, and page c, which the earlier night measured and
  // found no menu row on, now shows one.
  const { doc: after } = record(before, [[131, '2026-11-24T05:00:00Z', a11yNight([...GRID, walker('menu-role', 'c')])]]);
  const digest = a11yDigest(before, after, CATALOG);

  assert.equal(digest.declined.new.count, 1);
  assert.deepEqual(digest.declined.new.clusters, [{ id: 'menu-roles', title: 'Menu items have no menu parent', count: 1, trackers: ['TASK-2', 'TASK-3'] }]);
  assert.deepEqual(digest.declined.new.more, { count: 0, clusters: 0 });
  assert.equal(digest.firstMeasured.count, 0, 'the earlier night looked at page c, so the finding is no baseline');
  assert.deepEqual([digest.improved.resolved.count, digest.improved.cleared, digest.declined.back.count, digest.declined.reopened], [0, [], 0, []]);

  const text = renderA11yDigest(digest, { trackerUrl: TRACKERS });
  const declined = linesOf(text).slice(linesOf(text).indexOf('*Declined*'));

  assert.equal(declined[1], '• 1 new finding');
  assert.equal(declined[2], `      ◦ 1 · Menu items have no menu parent (<${TRACKERS}TASK-2|TASK-2>, <${TRACKERS}TASK-3|TASK-3>)`);
  assert.equal(declined[3], '• 0 findings came back after being resolved');
  assert.ok(!text.includes('Newly measured'));
});

test('a finding on a target the earlier audit had not measured is newly measured, a baseline and not a decline', () => {
  const before = lastWeek();
  // The walker gains a page, d, and finds a lost focus there on its first look.
  const { doc: after } = record(before, [[131, '2026-11-24T05:00:00Z', a11yNight([...GRID, walker('focus-lost', 'd')], ['a', 'b', 'c', 'd'])]]);
  const digest = a11yDigest(before, after, CATALOG);

  assert.equal(nightMeasured(before.nights.find(night => night.runId === '121'), walker('focus-lost', 'd')), false);
  assert.equal(nightMeasured(before.nights.find(night => night.runId === '121'), walker('focus-lost', 'c')), true);
  assert.equal(nightMeasured(before.nights.find(night => night.runId === '111'), walker('focus-lost', 'c')), null,
    'an older night no longer says what it measured, and a finding it cannot speak for counts as a decline');
  assert.equal(digest.declined.new.count, 0);
  assert.deepEqual(digest.firstMeasured, { count: 1, checks: [['keyboard-walker', 1]] });
  // Its task had no open finding and has one now, on a page nobody had looked at: that is no decline either.
  assert.deepEqual(digest.declined.reopened, []);

  const text = renderA11yDigest(digest);

  assert.ok(linesOf(text).includes('• 0 new findings'));
  assert.ok(!text.includes('findings again'));
  assert.ok(linesOf(text).includes('• 1 finding on targets the earlier audit had not measured, a new check, scenario or page: keyboard-walker 1'));
  // The surface still counts it: outstanding is what is open, however it got there. Five were open on the grid
  // (three at the target level: a menu row, a small target and the triage row), and the lost focus makes six.
  assert.ok(linesOf(text).includes('• Grid: 6 (4 at the target level), +1'));
});

test('where the earlier state does not say what it measured, a new finding counts as a decline: nothing is hidden as a baseline', () => {
  const before = lastWeek();
  const { doc: after } = record(before, [[131, '2026-11-24T05:00:00Z', a11yNight([...GRID, walker('focus-lost', 'd')], ['a', 'b', 'c', 'd'])]]);
  // The earlier state as a cut of it would hold it: its nights without their coverage.
  const mute = { ...before, nights: before.nights.map(({ coverage, ...night }) => night) };
  const digest = a11yDigest(mute, after, CATALOG);

  assert.deepEqual([digest.declined.new.count, digest.firstMeasured.count], [1, 0]);
  assert.deepEqual(digest.declined.new.clusters.map(item => item.id), ['focus-lost']);
});

test('the triage queue counts the open findings no cluster claims, and its change over the window', () => {
  const before = lastWeek();
  // The unsorted finding on page c is gone, measured gone.
  const { doc: after } = record(before, [[131, '2026-11-24T05:00:00Z', a11yNight(GRID.filter(item => item.kind !== 'mystery'))]]);
  const digest = a11yDigest(before, after, CATALOG);

  assert.deepEqual(digest.triage, { open: 0, shapes: 0, delta: -1 }, 'a resolved row has left the queue');
  assert.deepEqual(digest.improved.resolved.clusters.map(item => [item.id, item.title, item.trackers]),
    [['needs-triage', 'Needs triage: not sorted into a cluster yet', []]]);
  assert.ok(linesOf(renderA11yDigest(digest)).includes('*Needs triage*: 0 findings in 0 shapes (−1)'));
});

test('the digest says what improved: findings resolved, by cluster, and the fix tasks left with no open finding', () => {
  // From the first full audit (2026-11-10) to the second (2026-11-17), with the grid-only night in between.
  const nights = threeAuditNights();
  const before = record(null, nights.slice(0, 6)).doc;
  const after = record(before, nights.slice(6)).doc;
  const digest = a11yDigest(before, after, CATALOG);

  // The two lost focuses are gone. Page b's small target was resolved on the 12th and is back on the 17th: open in
  // both states, so the week neither resolved it nor brought it back.
  assert.equal(digest.improved.resolved.count, 2);
  assert.deepEqual(digest.improved.resolved.clusters, [{ id: 'focus-lost', title: 'The focus is lost', count: 2, trackers: ['TASK-1'] }]);
  assert.deepEqual(digest.improved.cleared, ['TASK-1']);
  assert.deepEqual([digest.declined.back.count, digest.declined.reopened], [0, []]);
  // New on measured targets: the triage row on page c and the website's third page (a scan covers every page or none).
  assert.deepEqual(digest.declined.new.clusters.map(item => [item.id, item.count, item.trackers]), [['needs-triage', 1, []], ['site-contrast', 1, ['TASK-4']]]);
  // The reader's wording is not a defect: its one resolved difference is counted apart.
  assert.deepEqual(digest.notDefect, { new: 0, resolved: 1, back: 0 });
  assert.deepEqual(digest.triage, { open: 1, shapes: 1, delta: 1 });

  const text = renderA11yDigest(digest, { trackerUrl: TRACKERS });
  const lines = linesOf(text);

  assert.equal(lines[0], ':bar_chart: *Accessibility findings: weekly digest* (2026-11-10 to 2026-11-17)');
  // What was compared, by run and date, for every workflow.
  assert.equal(lines[1], 'Compared: A11y nightly run 121 (2026-11-17) against run 111 (2026-11-10); Screen reader nightly run 120 (2026-11-17) against run 110 '
    + '(2026-11-10); Docs a11y run 122 (2026-11-17) against run 112 (2026-11-10); Website a11y run 123 (2026-11-17) against run 113 (2026-11-10).');
  assert.deepEqual(lines.slice(lines.indexOf('*Improved*'), lines.indexOf('*Declined*') - 1), [
    '*Improved*',
    '• 2 findings resolved',
    `      ◦ 2 · The focus is lost (<${TRACKERS}TASK-1|TASK-1>)`,
    `• 1 fix task cleared, no open finding left: <${TRACKERS}TASK-1|TASK-1>`,
  ]);
  assert.ok(lines.includes('Not counted above, in clusters the catalog marks as not a defect: 0 new, 1 resolved, 0 back.'));
  assert.ok(lines.includes('*Needs triage*: 1 finding in 1 shape (+1)'));
  assert.deepEqual(lines.slice(lines.indexOf('*Outstanding*, open defect findings per surface') + 1, lines.indexOf('*Outstanding*, open defect findings per surface') + 4), [
    '• Grid: 5 (3 at the target level), −1',
    '• Docs site: 1 (1 at the target level), no change',
    '• Website: 3 (3 at the target level), +1',
  ]);
  // The page's headline, in one line, and the chain from the first full audit.
  assert.equal(lines.at(-3), '*Fix progress*: 1 of 4 fix tasks with no open finding · 9 open (7 at the target level) · 4 resolved in the last 30 days · '
    + '1 came back and still open · median 14 days from first seen to resolved, as fine as the gap between audits');
  assert.equal(lines.at(-2), 'Against the first full audit (2026-11-10): 9 open then, 2 new since, 1 came back, 3 resolved, 9 open now.');
  assert.equal(lines.at(-1), `<${DIGEST_PAGE_URL}|Fix progress on the test-health page>`);
});

test('a finding that came back, and a fix task with findings again, show as declined', () => {
  const before = lastWeek();
  // Page a's lost focus, resolved on the 17th, is back a week later.
  const { doc: after } = record(before, [[131, '2026-11-24T05:00:00Z', a11yNight([...GRID, walker('focus-lost', 'a')])]]);
  const digest = a11yDigest(before, after, CATALOG);

  assert.deepEqual([digest.declined.new.count, digest.declined.back.count], [0, 1], 'a return is not a new finding');
  assert.deepEqual(digest.declined.back.clusters, [{ id: 'focus-lost', title: 'The focus is lost', count: 1, trackers: ['TASK-1'] }]);
  assert.deepEqual(digest.declined.reopened, ['TASK-1']);

  const lines = linesOf(renderA11yDigest(digest));

  assert.ok(lines.includes('• 1 finding came back after being resolved'));
  assert.ok(lines.includes('      ◦ 1 · The focus is lost (TASK-1)'), 'a task is named, and not linked, without the trackers\' address');
  assert.ok(lines.includes('• 1 fix task has findings again: TASK-1'));
});

test('a workflow with no new night was not audited: the digest names it, and leaves its rows out of improved and declined', () => {
  const before = lastWeek();
  const { doc: after } = record(before, [[131, '2026-11-24T05:00:00Z', a11yNight(GRID)]]);
  const digest = a11yDigest(before, after, CATALOG);

  assert.deepEqual(digest.sources.map(item => [item.source, item.state, item.before?.runId, item.after?.runId]), [
    ['a11y', 'audited', '121', '131'],
    ['reader', 'idle', '120', '120'],
    ['docs', 'idle', '122', '122'],
    ['website', 'idle', '123', '123'],
  ]);
  assert.equal(digest.compared, true);
  assert.deepEqual(digest.surfaces.map(item => [item.surface, item.state, item.delta]), [['grid', 'audited', 0], ['docs', 'idle', 0], ['website', 'idle', 0]]);

  const lines = linesOf(renderA11yDigest(digest));

  assert.equal(lines[1], 'Compared: A11y nightly run 131 (2026-11-24) against run 121 (2026-11-17); Screen reader nightly: not audited in the window, latest run 120 '
    + '(2026-11-17); Docs a11y: not audited in the window, latest run 122 (2026-11-17); Website a11y: not audited in the window, latest run 123 (2026-11-17).');
  assert.ok(lines.includes('• Docs site: 1 (1 at the target level), not audited in the window'));
  assert.ok(lines.includes('• Grid: 5 (3 at the target level), no change'), 'the grid counts as audited when one of its two workflows ran');
});

test('with no night at all in the window, the digest says no audit was collected, and still says what is outstanding', () => {
  const state = lastWeek();
  const digest = a11yDigest(state, state, CATALOG);

  assert.equal(digest.compared, false);
  assert.ok(digest.sources.every(item => item.state === 'idle'));

  const text = renderA11yDigest(digest);

  assert.ok(text.includes(`*No audit was collected in the last ${DIGEST_DAYS} days*, so nothing can have improved or declined.`));
  assert.ok(!text.includes('*Improved*') && !text.includes('*Declined*'), 'no list of zeros that would read as a quiet week');
  assert.ok(text.includes('• Grid: 5 (3 at the target level), not audited in the window'));
  assert.ok(text.includes('*Fix progress*: 1 of 4 fix tasks with no open finding'));
});

test('a workflow\'s first night is its first audit: its findings are named as a baseline, never as new findings', () => {
  // Before: the grid and the docs site only. After: the website is audited for the first time.
  const before = record(null, threeAuditNights().filter(([, , night]) => night.source !== 'website')).doc;
  const { doc: after } = record(before, [
    [131, '2026-11-24T05:00:00Z', a11yNight(GRID)],
    [133, '2026-11-24T06:10:00Z', siteNight('website', 'color-contrast', ['home', 'pricing'])],
  ]);
  const digest = a11yDigest(before, after, CATALOG);

  assert.deepEqual(digest.firstAudits, [{ source: 'website', workflow: 'Website a11y', open: 2 }]);
  assert.equal(digest.declined.new.count, 0);
  assert.deepEqual(digest.surfaces.find(item => item.surface === 'website'), { surface: 'website', state: 'first', open: 2, atTarget: 2, delta: 2 });

  const lines = linesOf(renderA11yDigest(digest));

  assert.ok(lines[1].endsWith('Website a11y run 133 (2026-11-24), its first audit.'));
  assert.deepEqual(lines.slice(lines.indexOf('*Newly measured*, a baseline and not a decline'), lines.indexOf('*Newly measured*, a baseline and not a decline') + 2),
    ['*Newly measured*, a baseline and not a decline', '• Website a11y, its first audit: 2 findings']);
  assert.ok(lines.includes('• Website: 2 (2 at the target level), first audit'));
});

test('a first digest has no earlier state: it says where things stand, and an empty ledger says so', () => {
  const digest = a11yDigest(null, lastWeek(), CATALOG);

  assert.deepEqual([digest.first, digest.from, digest.compared], [true, null, false]);
  assert.ok(digest.surfaces.every(item => item.delta === null));

  const text = renderA11yDigest(digest);
  const lines = linesOf(text);

  assert.equal(lines[0], ':bar_chart: *Accessibility findings: weekly digest* (2026-11-17)');
  assert.equal(lines[1], 'The latest nights: A11y nightly run 121 (2026-11-17); Screen reader nightly run 120 (2026-11-17); Docs a11y run 122 (2026-11-17); '
    + 'Website a11y run 123 (2026-11-17).');
  assert.equal(lines[2], 'No earlier state of the ledger within reach, 7 days back, to compare with: this digest says where things stand.');
  assert.ok(!text.includes('*Improved*') && !text.includes('first audit'));
  assert.ok(lines.includes('• Website: 3 (3 at the target level)'));
  assert.ok(lines.includes('*Needs triage*: 1 finding in 1 shape'));

  for (const empty of [null, { version: 2, nights: [], history: [], rows: [] }]) {
    assert.deepEqual(a11yDigest(null, empty, CATALOG), { days: DIGEST_DAYS, empty: true });
  }
  assert.equal(renderA11yDigest({ days: 7, empty: true }),
    `:bar_chart: *Accessibility findings: weekly digest*\nThe findings ledger holds no audit yet.\n<${DIGEST_PAGE_URL}|Fix progress on the test-health page>`);
});

test('both states are read under today\'s catalog, so a cluster renamed between them is one cluster, and a split is not a change', () => {
  const nights = threeAuditNights();
  const before = record(null, nights.slice(0, 6)).doc;
  const after = record(before, nights.slice(6)).doc;
  // Since the earlier state was published, the catalog renamed the lost-focus cluster and gave it another owner.
  const renamed = catalogOf([{ id: 'focus-escapes', title: 'The focus escapes', tracker: 'TASK-7', match: [{ source: 'checks', kinds: ['focus-lost'] }] }]);
  const digest = a11yDigest(before, after, renamed);

  assert.ok(before.rows.filter(row => row.kind === 'focus-lost').every(row => row.cluster === 'focus-lost'), 'the earlier state still files the rows under the old id');
  assert.deepEqual(digest.improved.resolved.clusters, [{ id: 'focus-escapes', title: 'The focus escapes', count: 2, trackers: ['TASK-7'] }]);
  assert.deepEqual(digest.improved.cleared, ['TASK-7'], 'the task the catalog names today is the one that was cleared');
  assert.equal(digest.declined.new.clusters.some(item => item.id === 'focus-escapes'), false, 'a row under a new cluster id is the same row, not a new finding');
});

test('the lists name the largest clusters and sum up the rest', () => {
  const kinds = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'];
  const catalog = catalogOf(kinds.map(kind => ({ id: `cluster-${kind}`, title: `Cluster ${kind}`, match: [{ source: 'checks', kinds: [`kind-${kind}`] }] })));
  const before = record(null, [[101, '2026-11-17T05:00:00Z', a11yNight([]), { catalog }]]).doc;
  // Seven clusters: the first gets two findings, the others one each.
  const findings = kinds.flatMap((kind, index) => (index === 0 ? ['a', 'b'] : ['a']).map(page => walker(`kind-${kind}`, page)));
  const { doc: after } = record(before, [[131, '2026-11-24T05:00:00Z', a11yNight(findings), { catalog }]]);
  const digest = a11yDigest(before, after, catalog);

  assert.equal(DIGEST_LISTED, 5);
  assert.equal(digest.declined.new.count, 8);
  assert.deepEqual(digest.declined.new.clusters.map(item => [item.id, item.count]),
    [['cluster-one', 2], ['cluster-five', 1], ['cluster-four', 1], ['cluster-seven', 1], ['cluster-six', 1]], 'most first, then by id');
  assert.deepEqual(digest.declined.new.more, { count: 2, clusters: 2 });
  assert.ok(linesOf(renderA11yDigest(digest)).includes('      ◦ … and 2 more in 2 clusters'));
});

test('every text that reaches Slack is escaped for it, a long title is cut, and a task is linked only with an https address', () => {
  assert.equal(slackText('a <b> & "c"  >\n d'), 'a &lt;b&gt; &amp; "c" &gt; d');
  assert.equal(slackText(null), '');

  const long = `Menus <@channel> & ${'x'.repeat(120)}`;
  const catalog = catalogOf([{ id: 'hostile', title: long, tracker: 'TASK-8', match: [{ source: 'checks', kinds: ['hostile'] }] }]);
  const before = record(null, [[101, '2026-11-17T05:00:00Z', a11yNight([]), { catalog }]]).doc;
  const { doc: after } = record(before, [[131, '2026-11-24T05:00:00Z', a11yNight([walker('hostile', 'a')]), { catalog }]]);
  const digest = a11yDigest(before, after, catalog);
  const line = linesOf(renderA11yDigest(digest, { trackerUrl: TRACKERS })).find(item => item.includes('Menus'));

  assert.equal(DIGEST_TITLE, 90);
  // The title's first 19 characters are `Menus <@channel> & `; 70 more and the ellipsis make the 90 a line carries.
  assert.equal(line, `      ◦ 1 · Menus &lt;@channel&gt; &amp; ${'x'.repeat(DIGEST_TITLE - 20)}… (<${TRACKERS}TASK-8|TASK-8>)`,
    'a title cannot mention a channel or open a link, and is cut to its limit before it is escaped');

  for (const bad of ['http://tracker.example/t/', 'javascript:alert(1)', 'https://tracker.example/t/|x>', 'https://tracker.example/?q=', '', null, 7,
    `https://tracker.example/${'a'.repeat(200)}`]) {
    const plain = renderA11yDigest(digest, { trackerUrl: bad });

    assert.equal(trackerAddress(bad), null, String(bad));
    assert.ok(plain.includes('(TASK-8)') && !plain.includes('TASK-8|'), `${bad}: the task is named, never linked to an address the digest cannot trust`);
  }
  assert.equal(trackerAddress(TRACKERS), TRACKERS);
  // The page link is the caller's own option, the workflow's constant.
  assert.ok(renderA11yDigest(digest, { pageUrl: 'https://example.test/page' }).endsWith('<https://example.test/page|Fix progress on the test-health page>'));
});

test('a state of an older ledger version is read through the migration, and one of a newer version is refused', () => {
  const v1 = JSON.parse(readFileSync(V1_FIXTURE, 'utf8'));
  const digest = a11yDigest(v1, v1, CATALOG);

  assert.equal(digest.empty, false);
  assert.equal(digest.compared, false, 'the same file twice holds no new night');
  assert.deepEqual(digest.sources.map(item => [item.source, item.after.runId]),
    [['a11y', '44077688383'], ['reader', '42756854209'], ['docs', '44077693860'], ['website', '44077699783']]);
  assert.throws(() => a11yDigest(null, { version: 99, nights: [{}], rows: [] }, CATALOG), /a11y\.json has version 99/);
});

/**
 * Runs the digest CLI.
 *
 * @param {string[]} args The arguments.
 * @returns {{status: number, stdout: string, stderr: string}} The result.
 */
function cli(args) {
  const result = spawnSync(process.execPath, [path.join(repoRoot(), '.github/scripts/a11y-digest.mjs'), ...args], { cwd: repoRoot(), encoding: 'utf8' });

  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

test('the CLI prints the digest of two ledger files and writes the Slack payload, and refuses only the caller\'s own errors', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'a11y-digest-'));
  const file = name => path.join(dir, name);
  const catalog = path.join(repoRoot(), 'tests/a11y/issues.json');

  try {
    const before = lastWeek();
    const { doc: after } = record(before, [[131, '2026-11-24T05:00:00Z', a11yNight([...GRID, walker('menu-role', 'c')])]]);

    writeFileSync(file('before.json'), serializeA11yLedger(before));
    writeFileSync(file('after.json'), serializeA11yLedger(after));
    writeFileSync(file('empty.json'), '');

    const run = cli(['--before', file('before.json'), '--after', file('after.json'), '--catalog', catalog, '--tracker-url', TRACKERS, '--payload', file('payload.json')]);

    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /^:bar_chart: \*Accessibility findings: weekly digest\* \(2026-11-17 to 2026-11-24\)\n/);
    // The committed catalog has no rule for the test's kinds: the planted row is new all the same, in the triage queue.
    assert.match(run.stdout, /^• 1 new finding$/m);
    assert.deepEqual(JSON.parse(readFileSync(file('payload.json'), 'utf8')), { text: run.stdout.slice(0, -1) }, 'the payload is the printed text, as JSON');

    // No earlier state, as a missing file, an empty one or no argument: a first digest, never an error.
    for (const args of [['--before', file('missing.json')], ['--before', file('empty.json')], []]) {
      const first = cli([...args, '--after', file('after.json'), '--catalog', catalog]);

      assert.equal(first.status, 0, first.stderr);
      assert.match(first.stdout, /No earlier state of the ledger within reach, 7 days back/);
    }

    const window = cli(['--after', file('after.json'), '--catalog', catalog, '--days', '14']);

    assert.match(window.stdout, /within reach, 14 days back/);

    for (const [args, message] of [
      [['--catalog', catalog], /^Missing --after$/m],
      [['--after', file('after.json')], /^Missing --catalog$/m],
      [['--after', file('after.json'), '--catalog', catalog, '--days', 'seven'], /--days must be a whole number of days from 1 to 366, got "seven"/],
      [['--after', file('after.json'), '--catalog', catalog, '--days', '0'], /--days must be a whole number/],
      [['--after', file('missing.json'), '--catalog', catalog], /Cannot read the ledger \(.*missing\.json\)/],
      [['--after', file('empty.json'), '--catalog', catalog], /Cannot read the ledger/],
      [['--after', file('after.json'), '--catalog', file('after.json')], /does not validate/],
      [['--after', file('after.json'), '--catalog', catalog, '--post'], /Unknown option '--post'/],
    ]) {
      const refused = cli(args);

      assert.equal(refused.status, 2, `${args.join(' ')}: ${refused.stdout}`);
      assert.match(refused.stderr, message);
      assert.equal(refused.stdout, '', 'nothing is printed that a step could take for a digest');
    }

    writeFileSync(file('newer.json'), JSON.stringify({ version: 99, nights: [{}], rows: [] }));

    const newer = cli(['--after', file('newer.json'), '--catalog', catalog]);

    assert.equal(newer.status, 2);
    assert.match(newer.stderr, /^Cannot build the digest: a11y\.json has version 99/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the digest comes after the audit it reports: later than the screen reader run\'s latest start, its run and its collection', () => {
  // The weekly audit's workflows get their crons from the audit's own schedule; until a workflow has one, there is
  // nothing to come after. The screen reader run is the long one: a scheduled run waits for an earlier run still in
  // flight, up to the bound its wait step names (180 minutes as planned), takes about 150 minutes, and its night is
  // collected a few minutes later.
  const READER = '.github/workflows/screenreader-nightly.yml';
  const code = file => readFileSync(path.join(repoRoot(), file), 'utf8').split('\n').filter(line => !line.trimStart().startsWith('#')).join('\n');
  const minutesOf = (file) => {
    const cron = code(file).match(/^ {4}- cron: '(\d+) (\d+) \* \* (\d)'/m);

    return cron ? { minutes: (Number(cron[2]) * 60) + Number(cron[1]), day: Number(cron[3]) } : null;
  };
  const digest = minutesOf(WORKFLOW);

  assert.deepEqual(digest, { minutes: 8 * 60, day: 1 }, 'Mondays at 08:00 UTC');

  // The wait's bound is read from the workflow that owns it, so a longer wait there moves this check with it.
  const bound = Number(code(READER).match(/--bound-minutes (\d+)/)?.[1] ?? 0);
  const waits = { [READER]: bound + 150 + 15, '.github/workflows/a11y-nightly.yml': 60, '.github/workflows/docs-a11y.yml': 60,
    '.github/workflows/website-a11y.yml': 60 };

  for (const [file, minutes] of Object.entries(waits)) {
    const audit = minutesOf(file);

    if (audit !== null) {
      assert.equal(audit.day, digest.day, `${file} runs on the digest's day, before it`);
      assert.ok(audit.minutes + minutes <= digest.minutes,
        `${file} starts at ${audit.minutes} minutes past midnight UTC and needs up to ${minutes} to reach the ledger: the digest at ${digest.minutes} would report a week without it`);
    }
  }
  // With the planned 180-minute bound the digest's hour holds for the audit's planned start, 01:07 UTC, and the reader
  // run may start as late as 02:15 before it breaks.
  const planned = 180 + 150 + 15;

  assert.ok(((1 * 60) + 7) + planned <= digest.minutes);
  assert.ok(((2 * 60) + 15) + planned <= digest.minutes);
  assert.ok(((2 * 60) + 16) + planned > digest.minutes);
});

test('a11y-digest.yml runs weekly and on demand, posts only from a schedule or a dispatch that asks, and reads gh-pages with a read-only token', () => {
  const workflow = readFileSync(path.join(repoRoot(), WORKFLOW), 'utf8');
  const digest = job(workflow, 'digest');
  const digestSteps = steps(digest);
  const read = digestSteps.find(step => step.startsWith('- name: Read the two ledger states from gh-pages\n'));
  const build = digestSteps.find(step => step.startsWith('- name: Build the digest\n'));
  const post = digestSteps.find(step => step.startsWith('- name: Post the digest to Slack\n'));

  assert.ok(read && build && post, 'lost a step');
  assert.match(workflow, /^name: A11y digest$/m);
  // Monday morning, after the weekly audit and its collection; a dispatch is a dry run unless it asks to post.
  assert.match(workflow, /^ {2}schedule:\n {4}- cron: '0 8 \* \* 1'$/m, `${WORKFLOW}: Mondays at 08:00 UTC`);
  assert.match(workflow, /^ {6}dry-run:\n(?: {8}.*\n)* {8}type: boolean\n {8}default: true$/m, 'a dispatch posts nothing unless dry-run is turned off');
  // A pull request that touches anything the job runs or reads gets the dry run: the workflow, the catalog, and every
  // module the script imports, directly or not. A module left out would let a change that breaks the digest pass its
  // pull request and first show on a Monday.
  const [, listed = ''] = /^ {2}pull_request:\n {4}paths:\n((?: {6}- .*\n)+)/m.exec(workflow) ?? [];
  const paths = [...listed.matchAll(/- '([^']+)'/g)].map(([, file]) => file);
  const imported = new Set();
  const walk = (file) => {
    if (imported.has(file)) {
      return;
    }
    imported.add(file);

    for (const [, specifier] of readFileSync(path.join(repoRoot(), file), 'utf8').matchAll(/^(?:import|export)\s+(?:[\w*{}\s,$]+?\s+from\s+)?['"]([^'"]+)['"]/gm)) {
      if (specifier.startsWith('.')) {
        walk(path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier)));
      }
    }
  };

  walk('.github/scripts/a11y-digest.mjs');
  assert.ok(imported.has('.github/scripts/lib/a11y-ledger.mjs') && imported.has('tests/lib/a11y-issues.mjs') && imported.size > 10, 'walked the imports');
  assert.deepEqual([...paths].sort(), [WORKFLOW, 'tests/a11y/issues.json', ...imported].sort(),
    'the pull request trigger lists the workflow, the catalog and every module the digest script imports, and nothing else');
  assert.match(build, /--catalog tests\/a11y\/issues\.json/, 'the catalog the trigger lists is the one the job reads');
  // A pull request's newer push replaces its dry run; the schedule and a dispatch never cancel each other, so a dry-run
  // dispatch on a Monday cannot cancel that week's post.
  assert.match(workflow, /^concurrency:\n {2}group: a11y-digest-\$\{\{ github\.ref \}\}\n {2}cancel-in-progress: \$\{\{ github\.event_name == 'pull_request' \}\}$/m);
  // Read-only: the digest reads the repository, gh-pages and its own earlier runs, and writes nowhere but Slack.
  assert.match(workflow, /^permissions:\n {2}contents: read\n {2}actions: read {3}# .*\n\n/m);
  assert.ok(!/: write\b/.test(workflow), 'no write scope of any kind');
  assert.match(digest, /^ {4}runs-on: ubuntu-26\.04$/m);

  // Both states come through the API: the published file now, and the last commit of it at least the window old.
  assert.ok(read.includes('contents/test-health/a11y.json?ref=gh-pages'));
  assert.ok(read.includes('commits?sha=gh-pages&path=test-health/a11y.json&until=${since}&per_page=1'));
  assert.ok(read.includes("Accept: application/vnd.github.raw"), 'the file is over the 1 MB the default media type returns');
  assert.match(read, /case "\$DAYS" in\n\s+''\|\*\[!0-9\]\*\)/, 'the window is checked to be a number before a command reads it');
  // A scheduled digest's window starts where the previous successful scheduled one started, so two windows meet: with
  // a fixed "7 days ago", a night landing between this Monday's read and next Monday's later start would be in
  // neither digest. A dispatch, and the first scheduled run, take `days`.
  assert.match(read, /if \[ "\$GITHUB_EVENT_NAME" = 'schedule' \]; then\n\s+since=\$\(gh api "repos\/\$\{GITHUB_REPOSITORY\}\/actions\/workflows\/a11y-digest\.yml\/runs\?event=schedule&status=success&per_page=1" --jq '\.workflow_runs\[0\]\.run_started_at \/\/ empty'\)\n\s+fi\n\s+if \[ -z "\$since" \]; then\n\s+since=\$\(date -u -d "\$\{DAYS\} days ago" \+%Y-%m-%dT%H:%M:%SZ\)\n\s+fi/);
  assert.ok(read.includes('echo "WINDOW_DAYS=${window}" >> "$GITHUB_ENV"') && build.includes('--days "$WINDOW_DAYS"'),
    'the digest words the window it was given, in whole days');
  assert.ok(!/\$\{\{ *inputs\./.test(read.replace(/^ {8}env:\n(?: {10}.*\n)+/m, '')), 'an input reaches the script through the environment, never interpolated into it');

  assert.ok(build.includes('node .github/scripts/a11y-digest.mjs') && build.includes('--catalog tests/a11y/issues.json')
    && build.includes('--payload "$RUNNER_TEMP/slack-payload.json"'));
  assert.ok(build.includes('>> "$GITHUB_STEP_SUMMARY"'), 'a dry run still shows the digest, on the run\'s summary');

  // The post: only with the webhook, from the schedule or from a dispatch that turned the dry run off, and from the
  // payload file. Each event is named: on a pull request `inputs.dry-run` is null, which an expression takes for false.
  assert.match(post, /^ {8}if: >-\n {10}env\.SLACK_WEBHOOK_URL != ''\n {10}&& \(github\.event_name == 'schedule'\n {14}\|\| \(github\.event_name == 'workflow_dispatch' && inputs\.dry-run == false\)\)$/m);
  assert.ok(!/inputs\.dry-run == false/.test(post.replace("github.event_name == 'workflow_dispatch' && inputs.dry-run == false", '')),
    'the input is never read without its event beside it');
  assert.ok(post.includes('uses: slackapi/slack-github-action@03ea5433c137af7c0495bc0cad1af10403fc800c'), 'the action the other notify jobs pin');
  assert.ok(post.includes('payload-file-path: ${{ runner.temp }}/slack-payload.json') && post.includes('webhook-type: incoming-webhook'));
  assert.match(digest, /^ {6}SLACK_WEBHOOK_URL: \$\{\{ secrets\.SLACK_A11Y_WEBHOOK_URL \}\}$/m, 'the accessibility channel\'s own webhook; absent, the step skips itself');
  assert.ok(!/secrets\./.test(workflow.replace('${{ secrets.SLACK_A11Y_WEBHOOK_URL }}', '')), 'no other secret, and no token that could read the tracker');
});
