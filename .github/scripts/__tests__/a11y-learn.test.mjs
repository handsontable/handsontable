import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  LEARN_CATALOG_FIELDS,
  LEARN_CATALOG_FILE,
  LEARN_MAX_AGE_HOURS,
  LEARN_RULES_FILE,
  LEARN_SKILL_DIR,
  auditPairs,
  candidatesOf,
  catalogProblems,
  defectIdentity,
  docsGuideFolders,
  guardProblems,
  learnPacket,
  parseGitLog,
  parseRawDiff,
  pullRequestOf,
  refusalsOf,
  renderPacket,
  scrubTaskIds,
  secondStrikes,
  strikeCount,
  surfaceMaps,
  surfaceOf,
  taskIdsIn,
  textProblems,
} from '../lib/a11y-learn.mjs';
import { repoRoot } from '../lib/repo-root.mjs';
import { compileIssuesCatalog } from '../../../tests/lib/a11y-issues.mjs';
import { CATALOG, a11yNight, readerNight, record, siteNight, walker } from './fixtures/a11y-nights.mjs';

// The learning routine: which new findings of a weekly audit sit on code changed since the audit before it
// (tests/AGENTS.md, "A11y: the learning routine"). The two fixtures are cuts of the ledger as gh-pages published it.

const SCRIPT = path.join(repoRoot(), '.github/scripts/a11y-learn.mjs');
const FIXTURES = path.join(repoRoot(), '.github/scripts/__tests__/fixtures/a11y-learn');
const fixture = name => JSON.parse(readFileSync(path.join(FIXTURES, name), 'utf8'));
const TASK_ID = /\b[A-Z][A-Z0-9]*-\d+\b/;
const FORMULA_PAGES = ['formula-builder', 'formula-builder-suggestions', 'formula-builder-function-help', 'formula-builder-tokens',
  'formula-builder-named-expression'];
// Where the pages of the fixtures live, in the shape of the repository's own tables.
const MAPS = surfaceMaps({
  plugins: { formulaBuilder: { pages: FORMULA_PAGES }, autoLink: { pages: ['auto-link'] }, dropdownMenu: { pages: ['dropdown-menu'] },
    autoColumnSize: { none: 'draws nothing' } },
  editors: { dateEditor: { pages: ['date-editor'] } },
  pages: FORMULA_PAGES.map(id => ({ id, fixture: 'formula-builder.html' })),
  readerFeatures: { dateEditor: { scenarios: ['date-editor'] }, columnSummary: { scenarios: ['column-summary'] } },
  readerProjects: ['nvda-chromium', 'vo-webkit'],
  checks: { 'axe-discovery': { spec: 'axe-discovery.spec.ts' }, 'docs-reflow': { spec: 'reflow.spec.ts', site: 'docs' } },
  docsGuides: [{ id: 'js-layout-slots', folder: 'docs/content/guides/accessories-and-menus/layout-slots/' }],
});
// The defect class each cluster of the fixtures names, as the catalog will carry it.
const CLASS_OF = { 'contrast-and-focus-visibility': 'C08', 'docs-link-color-only': 'C13', 'target-size': 'C08' };
// The skill's rules in the shape of `.claude/skills/handsontable-a11y/rules.json`.
const RULES = {
  schema: 1,
  budget: { skillLines: 120, buildRules: 20 },
  classes: [
    { id: 'C08', name: 'Theme tokens: contrast and target size', wcag: ['1.4.3', '1.4.11', '2.5.8'], home: 'skill',
      rule: 'Every color pair clears 4.5:1 for text and 3:1 for a boundary in the three themes.',
      enforcedBy: [{ check: 'axe', runs: 'pull-request' }, { check: 'focus-contrast', runs: 'weekly' }], strikes: [] },
    { id: 'C13', name: 'State or annotation not exposed', wcag: ['1.3.1', '4.1.2', '1.4.1'], home: 'skill',
      rule: 'A state a class draws is also an ARIA attribute or hidden text.', enforcedBy: [{ check: 'tree-snapshots', runs: 'weekly' }], strikes: [] },
  ],
  notPreventable: [],
};

/**
 * A fixture's catalog, compiled, each cluster with its defect class.
 *
 * @param {object} cut The fixture.
 * @returns {object} The catalog.
 */
function catalogOfCut(cut) {
  const catalog = compileIssuesCatalog(cut.catalog);

  return { ...catalog, clusters: catalog.clusters.map(cluster => ({ ...cluster, defectClass: CLASS_OF[cluster.id] ?? null })) };
}

/**
 * The packet of a fixture, with the inputs the script would read for it.
 *
 * @param {object} cut The fixture.
 * @param {object} [overrides] Inputs to replace.
 * @returns {object} The packet.
 */
function packetOfCut(cut, overrides = {}) {
  const commits = parseGitLog(cut.gitLog);
  const coverage = Object.fromEntries(cut.before.flatMap(state => state.nights.filter(night => night.coverage).map(night => [night.source, night])));

  return learnPacket({ ledger: cut.after, coverage, commits: { a11y: commits, reader: commits, docs: commits.slice(0, cut.docsCommits) },
    catalog: catalogOfCut(cut), rules: RULES, maps: MAPS, now: '2026-11-17T14:00:00Z', ...overrides });
}

/**
 * Two audits of every source, a week apart, the second with one more lost focus on page b, which the first measured
 * and found nothing on.
 *
 * @param {object} [options] Options.
 * @param {object[]} [options.extra] Findings the second grid audit adds.
 * @param {string[]} [options.measured] The pages the second grid audit measured.
 * @returns {{before: object, after: object, coverage: object}} The ledger before and after the second audit, and what
 * the first measured.
 */
function twoAudits({ extra = [walker('focus-lost', 'b')], measured = ['a', 'b', 'c'] } = {}) {
  const known = [walker('focus-lost', 'a')];
  const { doc: before } = record(null, [
    [101, '2026-11-16T01:00:00Z', readerNight(['one'])],
    [102, '2026-11-16T02:00:00Z', a11yNight(known)],
    [103, '2026-11-16T03:00:00Z', siteNight('docs', 'aria-required-parent', ['p'])],
    [104, '2026-11-16T04:00:00Z', siteNight('website', 'color-contrast', ['q'])],
  ]);
  const { doc: after } = record(before, [
    [201, '2026-11-23T01:00:00Z', readerNight(['one'])],
    [202, '2026-11-23T02:00:00Z', a11yNight([...known, ...extra], measured)],
    [203, '2026-11-23T03:00:00Z', siteNight('docs', 'aria-required-parent', ['p'])],
    [204, '2026-11-23T04:00:00Z', siteNight('website', 'color-contrast', ['q'])],
  ]);

  return { before, after, coverage: Object.fromEntries(before.nights.filter(night => night.coverage).map(night => [night.source, night])) };
}

const NOW = '2026-11-23T08:30:00Z';
const commit = (pullRequest, files) => ({ sha: `${pullRequest}`.padStart(40, 'a'), pullRequest, title: `Change ${pullRequest}`, files });
const NO_COMMITS = { a11y: [], reader: [], docs: [] };

/**
 * The packet of the synthetic two audits.
 *
 * @param {object} audits `twoAudits()`.
 * @param {object} [overrides] Inputs to replace.
 * @returns {object} The packet.
 */
function packetOf(audits, overrides = {}) {
  return learnPacket({ ledger: audits.after, coverage: audits.coverage, commits: NO_COMMITS, catalog: CATALOG, rules: RULES, maps: {}, now: NOW, ...overrides });
}

// ---------------------------------------------------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------------------------------------------------

test('the audits compared are the latest and the previous night of each source, with the commits they audited', () => {
  const pairs = auditPairs(fixture('audit-2026-11-17.json').after);

  assert.deepEqual(pairs.map(pair => [pair.source, pair.latest?.runId ?? null, pair.previous?.runId ?? null]), [
    ['a11y', '44077688383', '42763025203'],
    ['reader', '44077683661', '42756854209'],
    ['docs', '44077693860', '43862304876'],
    ['website', '44077699783', null],
  ]);
  assert.equal(pairs[0].previous.headSha.slice(0, 10), '8b36d60903');
  assert.equal(pairs[0].latest.headSha.slice(0, 10), '6db6aee014');
  assert.equal(pairs[2].previous.headSha.slice(0, 10), '9dacae8278', 'each source has its own range: the docs were audited the day before too');
});

test('selection: only the rows first seen in the latest audit of their source are sorted, each once', () => {
  const cut = fixture('audit-2026-11-17.json');
  const packet = packetOfCut(cut);
  const latest = new Set(['44077688383', '44077683661', '44077693860', '44077699783']);
  const fresh = cut.after.rows.filter(row => latest.has(row.firstRun));
  const sorted = Object.values(packet.counts.outcomes).reduce((sum, count) => sum + count, 0);

  // One more row is sorted: a screen reader row that was resolved and came back in this audit.
  const back = cut.after.rows.filter(row => row.gaps > 0 && row.seenSinceGap === 1 && latest.has(row.lastRun) && !latest.has(row.firstRun));

  assert.equal(fresh.length, 98);
  assert.deepEqual(back.map(row => [row.source, row.page, row.where, row.status]), [['reader', 'grid-core', 'open-context-menu', 'flapping']]);
  assert.equal(cut.after.rows.length - fresh.length - back.length, 15, 'the cut also holds persisting and resolved rows');
  assert.deepEqual([packet.counts.new, packet.counts.returned], [98, 1]);
  assert.equal(sorted, 99, 'every new row and every row that came back has exactly one outcome');
  assert.deepEqual(packet.audits.map(audit => [audit.source, audit.newFindings, audit.returnedFindings]),
    [['a11y', 70, 0], ['reader', 20, 1], ['docs', 2, 0], ['website', 6, 0]]);

  const attributed = new Set(packet.attributable.flatMap(group => group.keys));

  assert.ok([...attributed].every(key => latest.has(cut.after.rows.find(row => row.key === key).firstRun)), 'no older row is ever attributed');
});

test('selection: a finding that comes back after it was resolved is sorted like a new one, and the packet says it came back', () => {
  // Audit 1 finds a lost focus on page b. Audit 2 measures page b and finds nothing: resolved. Audit 3 finds it again.
  const lost = walker('focus-lost', 'b');
  const { doc: fixed } = record(null, [[101, '2026-11-09T02:00:00Z', a11yNight([lost])], [102, '2026-11-16T02:00:00Z', a11yNight([])]]);
  const { doc: after } = record(fixed, [[202, '2026-11-23T02:00:00Z', a11yNight([lost])]]);
  const [row] = after.rows;
  const input = { ledger: after, coverage: { a11y: fixed.nights.find(night => night.runId === '102') }, catalog: CATALOG, rules: RULES, now: NOW };

  // The ledger keeps the row's first night: only its return says it is back.
  assert.deepEqual([after.rows.length, row.firstRun, row.lastRun, row.status, row.backAt], [1, '101', '202', 'flapping', '2026-11-23T02:00:00Z']);

  const regression = learnPacket({ ...input, commits: { a11y: [commit(11, ['handsontable/src/core.ts'])] } });
  const [group] = regression.attributable;

  assert.deepEqual([regression.counts.new, regression.counts.returned, regression.counts.outcomes.attributable], [0, 1, 1]);
  assert.deepEqual([group.page, group.cluster, group.findings, group.returned, group.returnedBefore, group.tier], ['b', 'focus-lost', 1, 1, 0, 'shared']);
  assert.deepEqual(group.candidates.map(candidate => candidate.pullRequest), [11]);
  assert.deepEqual(regression.audits.find(audit => audit.source === 'a11y').returnedFindings, 1);

  const text = renderPacket(regression);

  assert.match(text, /\| a11y \| 2026-11-23, run 202 \| 2026-11-16, run 102 \| .+ \| 1 \| 0 \| 1 \|/);
  assert.match(text, /- New findings: 0\n- Findings that came back after they were resolved: 1\n/);
  assert.match(text, /- Came back after it was resolved: 1 of 1, for the first time\n/);

  // With no change to the page's code it is a finding on code nobody changed, counted and named as one that came back.
  const quiet = learnPacket({ ...input, commits: { a11y: [] } });

  assert.deepEqual(quiet.dropped.notOnChangedCode.map(item => [item.page, item.findings, item.returned]), [['b', 1, 1]]);
  assert.match(renderPacket(quiet), /- 1 · <code>b<\/code> \(a11y\) · focus-lost · surface-unchanged 1; 1 came back\n/);

  // A row that came back in an earlier audit and is still there is neither new nor back.
  const { doc: later } = record(after, [[302, '2026-11-30T02:00:00Z', a11yNight([lost])]]);
  const next = learnPacket({ ...input, ledger: later, coverage: { a11y: after.nights.find(night => night.runId === '202') },
    commits: { a11y: [commit(11, ['handsontable/src/core.ts'])] }, now: '2026-11-30T08:30:00Z' });

  assert.deepEqual([next.counts.new, next.counts.returned, next.attributable.length], [0, 0, 0]);

  // The same two ledgers as a file written before the return time existed: the gap count says the same, the audit the
  // row came back in and not the one after.
  const older = doc => ({ ...doc, rows: doc.rows.map(({ backAt, lastResolvedAt, ...rest }) => rest) });
  const changed = { a11y: [commit(11, ['handsontable/src/core.ts'])] };

  assert.deepEqual([row.gaps, row.seenSinceGap, later.rows[0].gaps, later.rows[0].seenSinceGap], [1, 1, 1, 2]);
  assert.equal(learnPacket({ ...input, ledger: older(after), commits: changed }).counts.returned, 1);
  assert.equal(learnPacket({ ...input, ledger: older(later), coverage: { a11y: after.nights.find(night => night.runId === '202') }, commits: changed,
    now: '2026-11-30T08:30:00Z' }).counts.returned, 0);
});

test('selection: a row of the older ledger shape, with no return time, is read as back from its gap count', () => {
  const cut = fixture('audit-2026-11-17.json');
  const packet = packetOfCut(cut);
  const drift = packet.dropped.notADefect.find(group => group.page === 'grid-core');

  // The published file of 2026-11-17 has no `backAt`: the row went missing twice and was seen again this audit. It is a
  // golden difference, which the catalog calls no defect, so it is set aside and named as one that came back.
  assert.ok(cut.after.rows.every(row => row.backAt === undefined));
  assert.deepEqual([drift.cluster, drift.findings, drift.returned, drift.reasons], ['reader-golden-drift', 1, 1, { 'reader-behavior': 1 }]);
  assert.deepEqual(packet.dropped.needsTriage.map(group => group.returned), [0]);
});

test('a finding that came back is not an open twin of itself: it was not open before this audit', () => {
  // The lost focus on page a was resolved and comes back in the audit that first measures page d, where it shows too.
  const { doc: fixed } = record(null, [[101, '2026-11-09T02:00:00Z', a11yNight([walker('focus-lost', 'a')])], [102, '2026-11-16T02:00:00Z', a11yNight([])]]);
  const { doc: after } = record(fixed, [[202, '2026-11-23T02:00:00Z', a11yNight([walker('focus-lost', 'a'), walker('focus-lost', 'd')], ['a', 'b', 'c', 'd'])]]);
  const packet = learnPacket({ ledger: after, coverage: { a11y: fixed.nights.find(night => night.runId === '102') }, commits: { a11y: [] }, catalog: CATALOG,
    rules: RULES, now: NOW });

  assert.deepEqual(packet.dropped.newlyMeasured.map(group => [group.page, group.reasons]), [['d', { page: 1 }]], 'no defect was open on another page before');
  assert.deepEqual(packet.dropped.inherited, []);
});

// ---------------------------------------------------------------------------------------------------------------------
// Attribution
// ---------------------------------------------------------------------------------------------------------------------

test('attribution: the new contrast rows on the three older formula builder pages are tied to the pull requests that changed the formula builder', () => {
  const packet = packetOfCut(fixture('audit-2026-11-17.json'));
  const groups = packet.attributable.filter(group => group.source === 'a11y');

  assert.deepEqual(groups.map(group => [group.page, group.findings, group.tier]), [
    ['formula-builder', 7, 'page'],
    ['formula-builder-function-help', 10, 'page'],
    ['formula-builder-suggestions', 7, 'page'],
  ]);
  assert.equal(packet.counts.bySource.a11y.attributable, 24);

  for (const group of groups) {
    assert.equal(group.cluster, 'contrast-and-focus-visibility');
    assert.deepEqual(group.surface, ['handsontable/src/plugins/formulaBuilder/', 'handsontable/src/styles/components/plugins/_formula-builder.scss']);
    // The two pull requests that changed the plugin's colors, by its style partial, and two that changed its code.
    assert.deepEqual(group.candidates.map(candidate => candidate.pullRequest), [14270, 14280, 14206, 14268]);
    assert.deepEqual(group.candidates[0].files, ['handsontable/src/styles/components/plugins/_formula-builder.scss']);
    assert.ok(!group.candidates.some(candidate => candidate.pullRequest === 14284),
      'a pull request that touched only the generated feature manifest and the plugin notes changed nothing the page draws');
    assert.ok(group.sharedPullRequests.includes(14296) && !group.sharedPullRequests.includes(14270), 'shared code is named apart, by number');
    // The group holds rows of the axe scan and of the axe discovery run: the fixture both read changed in the range, and
    // so did the discovery run's own spec, which only its rows name.
    assert.deepEqual(group.checks, ['axe', 'axe-discovery']);
    assert.deepEqual(group.measurementChanges.map(change => [change.pullRequest, change.files]),
      [[14270, ['tests/fixtures/demo/formula-builder.html']], [14284, ['tests/a11y/checks/axe-discovery.spec.ts']]],
      'what is measured changed in the range too, which the group says for every check it holds, rather than dropping the rows');
    assert.equal(group.openOnOtherPages, 0);
    assert.equal(group.tracked, true);
  }

  assert.deepEqual(groups[1].elements, ['span.hfe-fn-help__arg.hfe-fn-help__arg--active', 'span.hfe-fn-help__param-name.hfe-fn-help__param-name--active']);
  assert.deepEqual(groups[0].checks, ['axe', 'axe-discovery']);
  assert.deepEqual(groups[0].themes, ['classic', 'horizon', 'main']);
  assert.equal(groups[0].severity, 'serious');
});

test('attribution: a group carries its defect class, the rule, the checks that enforce it and its strikes', () => {
  const struck = { ...RULES, classes: RULES.classes.map(entry => (entry.id === 'C08'
    ? { ...entry, strikes: [{ cluster: 'contrast-and-focus-visibility', audit: '2026-11-10', pullRequest: 14100 }] } : entry)) };
  const packet = packetOfCut(fixture('audit-2026-11-17.json'), { rules: struck });
  const [group] = packet.attributable;

  assert.equal(group.defectClass, 'C08');
  assert.equal(group.class.rule, 'Every color pair clears 4.5:1 for text and 3:1 for a boundary in the three themes.');
  assert.deepEqual(group.class.enforcedBy.map(item => item.check), ['axe', 'focus-contrast']);
  assert.deepEqual([group.class.strikes.length, group.class.pullRequests, group.class.audits, group.class.becomesCheck], [1, 1, 1, false]);
  assert.equal(packet.rules.present, true);
});

test('attribution: a docs finding is tied to the pull request that changed the guide, and says the defect was already open elsewhere', () => {
  const packet = packetOfCut(fixture('audit-2026-11-17.json'));
  const [group] = packet.attributable.filter(item => item.source === 'docs');

  assert.deepEqual([group.page, group.cluster, group.findings, group.tier], ['js-layout-slots', 'docs-link-color-only', 2, 'page']);
  assert.deepEqual(group.candidates.map(candidate => [candidate.pullRequest, candidate.files]),
    [[13749, ['docs/content/guides/accessories-and-menus/layout-slots/layout-slots.md']]]);
  assert.equal(group.openOnOtherPages, 1, 'the cut holds one of the other pages that showed the same link finding before');
});

test('attribution: a finding with no change to its page\'s own source is tied to the shared code that changed, every candidate listed', () => {
  const audits = twoAudits();
  const core = commit(11, ['handsontable/src/core.ts', 'handsontable/src/__tests__/core.unit.js']);
  const other = commit(12, ['handsontable/src/plugins/comments/comments.ts', 'handsontable/src/styles/components/plugins/_comments.scss']);
  const packet = packetOf(audits, { commits: { ...NO_COMMITS, a11y: [core, other] } });
  const [group] = packet.attributable;

  assert.deepEqual([group.page, group.cluster, group.findings, group.tier], ['b', 'focus-lost', 1, 'shared']);
  assert.deepEqual(group.candidates.map(candidate => [candidate.pullRequest, candidate.files]), [[11, ['handsontable/src/core.ts']]],
    'another plugin\'s folder and style partial are no part of this page, and a unit test changes nothing it draws');
  assert.deepEqual(group.surface, ['handsontable/src/']);
  assert.equal(packet.result, 'packet');
});

test('attribution: the page\'s own folder outranks shared code, and a commit pushed without a pull request is named by its hash', () => {
  const audits = twoAudits();
  const own = { ...commit(13, ['handsontable/src/plugins/filters/filters.ts']), pullRequest: null };
  const core = commit(11, ['handsontable/src/core.ts']);
  const packet = packetOf(audits, { commits: { ...NO_COMMITS, a11y: [core, own] }, maps: { pageFolders: { b: ['handsontable/src/plugins/filters/'] } } });
  const [group] = packet.attributable;

  assert.equal(group.tier, 'page');
  assert.deepEqual(group.candidates.map(candidate => [candidate.pullRequest, candidate.sha]), [[null, 'aaaaaaaaaa']]);
  assert.deepEqual(group.sharedPullRequests, [11]);
  assert.match(renderPacket(packet), /commit aaaaaaaaaa Change 13/);
});

test('a finding on a measured target whose surface no commit touched is not on changed code', () => {
  const audits = twoAudits();
  const packet = packetOf(audits, { commits: { ...NO_COMMITS, a11y: [commit(14, ['docs/content/guides/a/a.md', 'handsontable/src/plugins/comments/comments.ts'])] } });

  assert.equal(packet.counts.outcomes['not-on-changed-code'], 1);
  assert.deepEqual(packet.dropped.notOnChangedCode.map(group => [group.page, group.reasons]), [['b', { 'surface-unchanged': 1 }]]);
  assert.equal(packet.attributable.length, 0);
  assert.equal(packet.result, 'nothing-attributable');
});

test('the website\'s code is in another repository, so a new finding there is never tied to a commit here', () => {
  const { doc: before } = record(null, [[104, '2026-11-16T04:00:00Z', siteNight('website', 'color-contrast', ['q'])]]);
  const { doc: after } = record(before, [[204, '2026-11-23T04:00:00Z', siteNight('website', 'color-contrast', ['q', 'r'])]]);
  // The scan keeps no page list, so the page is known through a check that measured it.
  const previous = { ...before.nights[0], coverage: { ...before.nights[0].coverage, checks: { 'website-reflow': ['q|light|', 'r|light|'] } } };
  const packet = learnPacket({ ledger: after, coverage: { website: previous }, commits: {}, catalog: CATALOG, rules: RULES, now: NOW });

  assert.equal(surfaceOf({ source: 'website', page: 'r' }, MAPS), null);
  assert.deepEqual(packet.dropped.notOnChangedCode.map(group => [group.page, group.reasons]), [['r', { 'other-repository': 1 }]]);
});

// ---------------------------------------------------------------------------------------------------------------------
// The two drops
// ---------------------------------------------------------------------------------------------------------------------

test('drop, newly measured: a finding on a page the previous audit did not know is a first reading, whatever changed', () => {
  const packet = packetOfCut(fixture('audit-2026-11-17.json'));
  const tokens = packet.dropped.newlyMeasured.find(group => group.page === 'formula-builder-tokens' && group.cluster === 'contrast-and-focus-visibility');

  // The design's colors of #14270 on the page #14270 added: no earlier reading exists to compare with.
  assert.deepEqual([tokens.findings, tokens.reasons], [13, { page: 13 }]);
  assert.deepEqual(tokens.sourceChangedBy, [14270, 14280, 14206, 14268], 'dropped, and the packet still says its own source changed in the range');
  assert.equal(packet.counts.bySource.a11y['newly-measured'], 22);
  assert.equal(packet.counts.bySource.reader['newly-measured'], 3, 'scenarios the previous audit did not read');
  assert.ok(!packet.attributable.some(group => group.page === 'formula-builder-tokens' || group.page === 'side-layout-slots'));
});

test('drop, newly measured: the first audit of a source measures everything for the first time', () => {
  const packet = packetOfCut(fixture('audit-2026-11-17.json'));

  assert.deepEqual(packet.counts.bySource.website, { 'newly-measured': 6 });
  assert.equal(packet.counts.newlyMeasuredBy['first-audit'], 6);
  assert.equal(packet.audits.find(audit => audit.source === 'website').range, null);
});

test('drop, inherited: a newly measured finding whose defect was already open on another page is an old defect in a new place', () => {
  const cut = fixture('audit-2026-11-17.json');
  const packet = packetOfCut(cut);
  const roles = packet.dropped.inherited.find(group => group.page === 'formula-builder-tokens' && group.cluster === 'grid-roles');
  const reader = packet.dropped.inherited.find(group => group.source === 'reader' && group.cluster === 'focus-not-returned-after-escape');

  // The treegrid root every grid page shows, on a page added in the range.
  assert.deepEqual([roles.findings, roles.reasons], [3, { page: 3 }]);
  // A screen reader row names a step, not an element: its defect is its cluster, open in older scenarios.
  assert.deepEqual([reader.page, reader.findings, reader.reasons], ['context-menu-submenu', 4, { page: 4 }]);
  assert.deepEqual([packet.counts.outcomes.inherited, packet.counts.bySource.a11y.inherited, packet.counts.bySource.reader.inherited], [28, 24, 4]);

  const treegrid = cut.after.rows.find(row => row.page === 'formula-builder-tokens' && row.rule === 'aria-required-children' && row.source === 'axe');
  const elsewhere = cut.after.rows.filter(row => row.firstRun !== treegrid.firstRun && defectIdentity({ ...row, cluster: 'grid-roles' })
    === defectIdentity({ ...treegrid, cluster: 'grid-roles' }));

  assert.ok(elsewhere.length > 0 && elsewhere.every(row => row.page !== treegrid.page), 'the same rule, cause and element, on another page, before this audit');
});

test('both drops together are what the audit of 2026-11-17 mostly was: new pages, a new source and new scenarios', () => {
  const packet = packetOfCut(fixture('audit-2026-11-17.json'));

  // 98 new rows and one that came back. The golden difference of a new scenario is newly measured, not inherited: the
  // only other row of its cluster in the cut is the one that came back, which was resolved before this audit.
  assert.deepEqual(packet.counts.outcomes, { attributable: 26, inherited: 28, 'newly-measured': 31, 'not-on-changed-code': 0, 'not-a-defect': 6,
    'needs-triage': 8, unsorted: 0 });
  assert.deepEqual(packet.counts.newlyMeasuredBy, { 'first-audit': 6, page: 53, check: 0, target: 0, step: 0, selector: 0 });
});

test('drop, newly measured: a row whose twin on the same target was resolved the same night is a re-key, never a new defect', () => {
  const cut = fixture('audit-2026-11-10.json');
  const packet = packetOfCut(cut, { now: '2026-11-10T08:00:00Z' });
  const fresh = cut.after.rows.filter(row => row.firstRun === '42763025203');
  const menu = fresh.filter(row => row.page === 'dropdown-menu');

  // One class added to the checkbox label's span (#14220) gave every row on it a new selector.
  assert.equal(menu.length, 14);
  assert.ok(menu.every(row => row.where.includes('htCheckboxRendererLabelText')));
  assert.equal(cut.after.rows.filter(row => row.status === 'resolved' && row.page === 'dropdown-menu').length, 14);
  assert.deepEqual(packet.dropped.newlyMeasured.map(group => [group.page, group.findings, group.reasons]), [['dropdown-menu', 14, { selector: 14 }]]);
  assert.equal(packet.counts.newlyMeasuredBy.selector, 14);
  // What no resolved twin explains goes on: two target-size rows on another page, for the agent to read the diffs of.
  assert.deepEqual(packet.attributable.map(group => [group.page, group.cluster, group.findings, group.tier]), [['auto-link', 'target-size', 2, 'shared']]);
  assert.ok(packet.attributable[0].candidates.some(candidate => candidate.pullRequest === 14220));
});

test('a re-key pairs one new row with one resolved row: a target that gained more rows than it lost keeps the rest', () => {
  const audits = twoAudits({ extra: [walker('focus-lost', 'a', { where: 'Tab 2' }), walker('focus-lost', 'a', { where: 'Tab 3' })] });
  // The second audit no longer sees page a's row at `Tab 1`: resolved the night two rows on the same target are new.
  const { doc: after } = record(audits.before, [[202, '2026-11-23T02:00:00Z',
    a11yNight([walker('focus-lost', 'a', { where: 'Tab 2' }), walker('focus-lost', 'a', { where: 'Tab 3' })])]]);
  const packet = packetOf({ ...audits, after }, { commits: { ...NO_COMMITS, a11y: [commit(11, ['handsontable/src/core.ts'])] } });

  assert.equal(packet.counts.newlyMeasuredBy.selector, 1);
  assert.equal(packet.counts.outcomes.attributable, 1);
});

test('newly measured names what was new: a page, a check, a target of a known check, a step of a known scenario', () => {
  const pointer = walker('focus-lost', 'a', { check: 'pointer' });
  const base = a11yNight([walker('focus-lost', 'a')], ['a', 'b']);
  // The previous audit: the walker measured pages a and b, and another check measured page c.
  const previousNight = { ...base, problems: 0, coverage: { ...base.coverage, checks: { ...base.coverage.checks, reflow: ['c|main|'] } } };
  const latestBase = a11yNight([walker('focus-lost', 'a'), walker('focus-lost', 'c'), walker('focus-lost', 'd'), pointer], ['a', 'b', 'c', 'd']);
  const latestNight = { ...latestBase, coverage: { ...latestBase.coverage, checks: { ...latestBase.coverage.checks, pointer: ['a|main|'] } } };
  const { doc: before } = record(null, [[101, '2026-11-16T01:00:00Z', readerNight(['one'])], [102, '2026-11-16T02:00:00Z', previousNight]]);
  const { doc: after } = record(before, [[201, '2026-11-23T01:00:00Z', readerNight(['one', 'three'])], [202, '2026-11-23T02:00:00Z', latestNight]]);
  const coverage = Object.fromEntries(before.nights.map(night => [night.source, night]));
  const packet = learnPacket({ ledger: after, coverage, commits: { a11y: [commit(11, ['handsontable/src/core.ts'])], reader: [] }, catalog: CATALOG,
    rules: RULES, now: NOW });
  const reasons = Object.fromEntries([...packet.dropped.newlyMeasured, ...packet.dropped.inherited].map(group => [`${group.source}:${group.page}`, group.reasons]));

  assert.deepEqual(packet.counts.newlyMeasuredBy, { 'first-audit': 0, page: 1, check: 1, target: 1, step: 1, selector: 0 });
  assert.deepEqual(reasons['a11y:d'], { page: 1 }, 'no check of the previous audit named page d');
  assert.deepEqual(reasons['a11y:c'], { target: 1 }, 'the page was known, and the walker had not measured it');
  assert.deepEqual(reasons['a11y:a'], { check: 1 }, 'the page was known, and no pointer check had run');
  assert.deepEqual(reasons['reader:grid-core'], { step: 1 }, 'the scenario was read, without the step `three`');
  // The lost focus was open on page a before, so on pages c and d it is the old defect in a new place. The pointer
  // check's finding repeats it on page a itself, which is no other page: a first reading and nothing more.
  assert.deepEqual(packet.dropped.inherited.map(group => group.page), ['c', 'd']);
  assert.deepEqual(packet.dropped.newlyMeasured.map(group => `${group.source}:${group.page}`), ['a11y:a', 'reader:grid-core']);
  assert.equal(packet.counts.outcomes.attributable, 0);
});

test('what the catalog calls no defect, and what no cluster matches yet, is set aside for the catalog', () => {
  const packet = packetOfCut(fixture('audit-2026-11-17.json'));

  assert.deepEqual(packet.dropped.notADefect.map(group => [group.page, group.cluster, group.findings, group.reasons]), [
    ['date-editor', 'reader-golden-drift', 3, { 'reader-behavior': 3 }],
    ['column-summary', 'reader-golden-drift', 2, { 'reader-behavior': 2 }],
    ['grid-core', 'reader-golden-drift', 1, { 'reader-behavior': 1 }],
  ]);
  assert.deepEqual(packet.dropped.needsTriage.map(group => [group.page, group.cluster, group.findings]), [['grid-core', 'needs-triage', 8]]);
});

// ---------------------------------------------------------------------------------------------------------------------
// Refusals and results
// ---------------------------------------------------------------------------------------------------------------------

test('it refuses unless every audit source has a night in the last 24 hours with no problem recorded', () => {
  const { after } = twoAudits();
  const pairs = auditPairs(after);

  assert.equal(LEARN_MAX_AGE_HOURS, 24);
  assert.deepEqual(refusalsOf(pairs, { now: NOW }), []);
  assert.deepEqual(refusalsOf(pairs, { now: '2026-11-24T00:59:00Z' }), [], 'the oldest night is 23 hours and 59 minutes old');

  const stale = refusalsOf(pairs, { now: '2026-11-24T01:30:00Z' });

  assert.equal(stale.length, 1);
  assert.match(stale[0], /^Screen reader nightly \(reader\) was last audited 2026-11-23T01:00:00Z, 24 hours ago: the routine needs an audit of every source in the last 24 hours$/);
  assert.equal(refusalsOf(pairs, { now: '2026-11-25T08:30:00Z' }).length, 4, 'a day later every source is stale');
  assert.deepEqual(refusalsOf(pairs, { now: '2026-11-25T08:30:00Z', maxAgeHours: 72 }), [], 'a person who runs a missed Monday late says so');
  assert.match(refusalsOf(pairs, { now: '2026-11-23T00:00:00Z' })[0], /after the time of this run/);

  const withProblem = pairs.map(pair => (pair.source === 'a11y' ? { ...pair, latest: { ...pair.latest, problems: 2 } } : pair));

  assert.deepEqual(refusalsOf(withProblem, { now: NOW }), ['A11y nightly (a11y) run 202 recorded 2 tooling problems: a target that was not measured '
    + 'resolves nothing and makes its findings new next time']);

  const missing = pairs.map(pair => (pair.source === 'website' ? { ...pair, latest: null, previous: null } : pair));

  assert.deepEqual(refusalsOf(missing, { now: NOW }), ['Website a11y (website) has no audit in the ledger']);
  assert.match(refusalsOf(pairs.map(pair => ({ ...pair, latest: { ...pair.latest, headSha: '' } })), { now: NOW })[0], /names no audited commit/);
  assert.match(refusalsOf(pairs.map(pair => ({ ...pair, latest: { ...pair.latest, branch: 'feature/x' } })), { now: NOW })[0], /audited feature\/x, not develop/);
});

test('the real audit of 2026-11-17 is refused: the A11y nightly recorded two targets it could not measure', () => {
  const packet = packetOfCut(fixture('audit-2026-11-17.json'));

  assert.equal(packet.result, 'refused');
  assert.deepEqual(packet.refusals, ['A11y nightly (a11y) run 44077688383 recorded 2 tooling problems: a target that was not measured resolves nothing '
    + 'and makes its findings new next time']);
  assert.equal(packet.counts.outcomes.attributable, 26, 'a refused packet is still sorted, for a dry run to report');
});

test('a run ends in one of three results: a packet to sort, nothing attributable, or refused with the reasons', () => {
  const audits = twoAudits();
  const changed = { ...NO_COMMITS, a11y: [commit(11, ['handsontable/src/core.ts'])] };

  assert.equal(packetOf(audits, { commits: changed }).result, 'packet');
  assert.equal(packetOf(audits).result, 'nothing-attributable');
  assert.equal(packetOf(twoAudits({ extra: [] }), { commits: changed }).result, 'nothing-attributable', 'a quiet week');

  const late = packetOf(audits, { commits: changed, now: '2026-11-25T08:30:00Z' });

  assert.equal(late.result, 'refused');
  assert.equal(late.refusals.length, 4);
  assert.equal(late.attributable.length, 1);
  assert.equal(packetOf(audits, { commits: changed, dryRun: true }).dryRun, true);
});

test('it refuses when the skill has no rules.json, when the previous audit\'s coverage is not known, and when the range cannot be read', () => {
  const audits = twoAudits();
  const changed = { ...NO_COMMITS, a11y: [commit(11, ['handsontable/src/core.ts'])] };
  const noRules = packetOf(audits, { commits: changed, rules: null });

  assert.deepEqual(noRules.refusals, [`${LEARN_RULES_FILE} is missing: the defect classes and their rules are what a finding is sorted against`]);
  assert.equal(noRules.attributable[0].class, null);
  assert.equal(noRules.rules.present, false);

  const { a11y: _dropped, ...others } = audits.coverage;
  const blind = packetOf(audits, { commits: changed, coverage: others });

  assert.equal(blind.result, 'refused');
  assert.match(blind.refusals[0], /^A11y nightly \(a11y\): what run 102 measured is not known/);
  assert.deepEqual([blind.counts.outcomes.unsorted, blind.counts.outcomes.attributable], [1, 0], 'nothing is guessed');
  assert.deepEqual(blind.dropped.unsorted.map(group => group.reasons), [{ 'coverage-unknown': 1 }]);

  // A night of another run is not the previous one's coverage.
  const wrong = packetOf(audits, { commits: changed, coverage: { ...others, a11y: { ...audits.coverage.a11y, runId: '999' } } });

  assert.equal(wrong.counts.outcomes.unsorted, 1);

  const unread = packetOf(audits, { commits: { ...NO_COMMITS, a11y: null }, rangeErrors: { a11y: 'commit abc is not in this clone' } });

  assert.equal(unread.result, 'refused');
  assert.match(unread.refusals[0], /the commits between .+ and .+ cannot be read \(commit abc is not in this clone\)$/);
  assert.deepEqual(unread.dropped.unsorted.map(group => group.reasons), [{ 'range-unknown': 1 }]);
});

// ---------------------------------------------------------------------------------------------------------------------
// The packet's text
// ---------------------------------------------------------------------------------------------------------------------

test('no task id leaves the packet: clusters are tracked or not, and pull request titles lose the ids they carry', () => {
  const cut = fixture('audit-2026-11-17.json');
  const packet = packetOfCut(cut);

  assert.match(cut.gitLog, /DEV-3763: Use the design's colors in the formula builder \(#14270\)/, 'the range names tasks, as squash subjects do');
  assert.ok(cut.catalog.clusters.some(cluster => TASK_ID.test(String(cluster.tracker))), 'and so does the catalog');
  assert.equal(TASK_ID.exec(JSON.stringify(packet)), null);
  assert.equal(TASK_ID.exec(renderPacket(packet)), null);
  assert.equal(packet.attributable[0].candidates[0].title, 'Use the design\'s colors in the formula builder');
});

test('the packet reads as one page: the result, the audits, where the rows went, and each group with its candidates', () => {
  const text = renderPacket(packetOfCut(fixture('audit-2026-11-17.json'), { dryRun: true }));

  assert.match(text, /^# Accessibility learning packet\n\nResult: \*\*refused\*\*\. Refused\. Nothing here may become a pull request\.\n\nA dry run: /);
  assert.match(text, /\| a11y \| 2026-11-17, run 44077688383 \| 2026-11-10, run 42763025203 \| <code>8b36d60903\.\.6db6aee014<\/code> \| 85 \| 70 \|/);
  assert.match(text, /\| website \| 2026-11-17, run 44077699783 \| none \| none \| not read \| 6 \|/);
  assert.match(text, /- New findings: 98\n- Findings that came back after they were resolved: 1\n/);
  assert.match(text, /- Dropped, inherited \(an old defect read in a new place\): 28\n- Dropped, newly measured: 31\n- Both drops by what was new: first-audit 6, page 53\n/);
  assert.match(text, /- 1 · <code>grid-core<\/code> \(reader\) · reader-golden-drift · reader-behavior 1; 1 came back\n/);
  assert.match(text, /- \*\*Attributable, to sort: 26 in 4 groups\*\*/);
  assert.match(text, /### contrast-and-focus-visibility on <code>formula-builder-suggestions<\/code> \(a11y\)/);
  assert.match(text, /- Class C08, Theme tokens: contrast and target size \(rule lives in: skill\)\n- Rule: Every color pair clears 4\.5:1/);
  assert.match(text, /- Enforced by: axe \(pull-request\), focus-contrast \(weekly\)\n- Strikes so far: 0 \(0 pull requests, 0 audits\)/);
  // An underscore is one of the characters Markdown reads, so the path's own is escaped inside the code element.
  assert.ok(text.includes('  - #14270 Use the design\'s colors in the formula builder: '
    + '<code>handsontable/src/styles/components/plugins/\\_formula-builder.scss</code>'));
  assert.ok(text.includes('- Elements: <code>span.hfe-fn-help\\_\\_arg.hfe-fn-help\\_\\_arg--active</code>, '
    + '<code>span.hfe-fn-help\\_\\_param-name.hfe-fn-help\\_\\_param-name--active</code>'));
  assert.ok(text.includes('- What is measured changed too, so check the finding is the code\'s: #14270 (<code>tests/fixtures/demo/formula-builder.html</code>)'));
  assert.match(text, /- The same finding was already open on 1 other page before this audit/);
  assert.ok(text.includes('## Dropped: newly measured\n\n- 13 · <code>formula-builder-tokens</code> (a11y) · contrast-and-focus-visibility · page 13; '
    + 'its source changed in the range: #14270, #14280, #14206, #14268'));
  assert.ok(!text.replace('`handsontable/src` or `wrappers`', '').includes('`'), 'no backtick span holds a value: a span cannot escape one');
  assert.ok(text.endsWith('\n') && !text.includes('\n\n\n'));

  const quiet = renderPacket(packetOf(twoAudits({ extra: [] })));

  assert.match(quiet, /Result: \*\*nothing-attributable\*\*\. Nothing attributable: no new finding sits on code changed since the previous audit\./);
  assert.match(quiet, /## Attributable groups\n\nNone\./);
});

test('every value the page writes is escaped for where it lands: the backslash with the rest, a selector in a code element', () => {
  // What an audit or a commit can carry: a pipe that is already escaped, markup, a code fence, a line break, a heading.
  const where = 'td.x\\|y`z`<img src=x>';
  const reason = 'a | b \\| c\n# Heading <script>alert(1)</script>\r# Lone\t**bold** [link](https://example.com)';
  const audits = twoAudits({ extra: [walker('focus-lost', 'b', { where, reason })] });
  const hostile = { ...commit(11, ['handsontable/src/co`re|.ts']), title: 'Fix `x` | y \\| z <b>bold</b>' };
  const text = renderPacket(packetOf(audits, { commits: { ...NO_COMMITS, a11y: [hostile] } }));
  const line = start => text.split('\n').find(item => item.startsWith(start));

  assert.equal(line('- Elements: '), '- Elements: <code>td.x\\\\\\|y\\`z\\`\\<img src=x\\></code>');
  assert.equal(line('- Says: '),
    '- Says: a \\| b \\\\\\| c # Heading \\<script\\>alert(1)\\</script\\> # Lone \\*\\*bold\\*\\* \\[link\\](https://example.com)');
  assert.equal(line('  - #11 '), '  - #11 Fix \\`x\\` \\| y \\\\\\| z \\<b\\>bold\\</b\\>: <code>handsontable/src/co\\`re\\|.ts</code>');

  // The values alone, without the page's own words and code elements around them. With every escaped pair taken out,
  // nothing is left that Markdown or HTML reads.
  const [title, file] = line('  - #11 ').slice('  - #11 '.length, -'</code>'.length).split(': <code>');
  const values = [line('- Elements: ').slice('- Elements: <code>'.length, -'</code>'.length), line('- Says: ').slice('- Says: '.length), title, file];

  for (const written of values) {
    assert.doesNotMatch(written.replace(/\\[\s\S]/g, ''), /[`|<>*[\]]/, written);
  }

  assert.ok(!text.includes('\n# Heading') && !/[\r\t]/.test(text), 'a line break in a value starts no line of its own, a lone carriage return included');
  assert.equal(text.split('\n').filter(item => item.startsWith('#') && !item.startsWith('# Accessibility') && !item.startsWith('## ') && !item.startsWith('### ')).length, 0);
});

test('the rate reads the grid\'s attributable findings against the pull requests that changed the grid\'s own code', () => {
  const packet = packetOfCut(fixture('audit-2026-11-17.json'));

  // The two docs findings are attributable too, to a pull request that changed a guide: they are no part of a rate
  // whose other side counts changes to `handsontable/src` and `wrappers`.
  assert.equal(packet.counts.outcomes.attributable, 26);
  assert.deepEqual([packet.counts.bySource.a11y.attributable, packet.counts.bySource.docs.attributable], [24, 2]);
  // 57 pull requests in the real range: the cut leaves out the unit test folders, and one changed nothing else there.
  assert.deepEqual(packet.metric, { attributableFindings: 24, sourcePullRequests: 56, per10PullRequests: 4.3 });
  assert.match(renderPacket(packet), /\nRate: 24 attributable findings on the grid against 56 pull requests that changed `handsontable\/src` or `wrappers` \(4\.3 per 10\)\.\n/);
  assert.equal(packetOf(twoAudits()).metric.per10PullRequests, null, 'no pull request, no rate');
});

test('a week whose only attributable findings are on the docs has a grid rate of zero', () => {
  // Two audits of the docs: the second finds the rule on page r, which a check of the first had measured.
  const { doc: before } = record(null, [[103, '2026-11-16T03:00:00Z', siteNight('docs', 'aria-required-parent', ['p'])]]);
  const { doc: after } = record(before, [[203, '2026-11-23T03:00:00Z', siteNight('docs', 'aria-required-parent', ['p', 'r'])]]);
  const previous = { ...before.nights[0], coverage: { ...before.nights[0].coverage, checks: { 'docs-reflow': ['p|light|', 'r|light|'] } } };
  const guide = commit(21, ['docs/content/guides/r/r.md']);
  const core = commit(22, ['handsontable/src/core.ts']);
  const packet = learnPacket({ ledger: after, coverage: { docs: previous }, commits: { a11y: [core], reader: [core], docs: [guide, core] }, catalog: CATALOG,
    rules: RULES, maps: { docsFolders: { r: ['docs/content/guides/r/'] } }, now: NOW });

  assert.deepEqual(packet.attributable.map(group => [group.source, group.page, group.findings, group.candidates.map(candidate => candidate.pullRequest)]),
    [['docs', 'r', 1, [21]]]);
  assert.deepEqual(packet.metric, { attributableFindings: 0, sourcePullRequests: 1, per10PullRequests: 0 });
});

// ---------------------------------------------------------------------------------------------------------------------
// The helpers
// ---------------------------------------------------------------------------------------------------------------------

test('a git log is read into commits: the pull request from the subject, the title without it and without a task id', () => {
  const log = '\x1eabc123\x1fDEV-3763: Use the design\'s colors (#14270)\n\nhandsontable/src/a.ts\ntests/b.ts\n'
    + '\x1edef456\x1fRestore the 19.0 deprecation (#5409) (#14183)\n\nhandsontable/src/c.ts\n\x1e0a1b2c\x1fBump astro\n';

  assert.deepEqual(parseGitLog(log), [
    { sha: 'abc123', pullRequest: 14270, title: 'Use the design\'s colors', files: ['handsontable/src/a.ts', 'tests/b.ts'] },
    { sha: 'def456', pullRequest: 14183, title: 'Restore the 19.0 deprecation (#5409)', files: ['handsontable/src/c.ts'] },
    { sha: '0a1b2c', pullRequest: null, title: 'Bump astro', files: [] },
  ]);
  assert.deepEqual(parseGitLog(''), []);
  assert.equal(pullRequestOf('No number here'), null);
  assert.equal(scrubTaskIds('PRO-1329: Add slots, after DEV-12 and SU-7'), 'Add slots, after (task) and (task)');
  assert.deepEqual(taskIdsIn('DEV-1 then DEV-22, DEV-1 again, and #14270'), ['DEV-1', 'DEV-22']);
  assert.deepEqual(taskIdsIn('feature/DEV-3679_A11y-learning-routine'), ['DEV-3679'], 'an underscore ends an id, as a branch name writes it');
  assert.deepEqual(taskIdsIn('WCAG 2.2, 4.5:1, aria-1, x-DEV-1y'), []);
  // A character set, a standard and a hash are no tasks, though they are shaped like one.
  assert.deepEqual(taskIdsIn('Export as UTF-8 and ISO-8859, hash with SHA-256, per RFC-4180 and CVE-2026, at UTC-5'), []);
  assert.deepEqual(taskIdsIn('UTF-8 for DEV-12, and IT-555 too'), ['DEV-12', 'IT-555'], 'a prefix nobody listed still counts: a missed id is attached for good');
  assert.equal(scrubTaskIds('Fix UTF-8 export of ISO-8859 files'), 'Fix UTF-8 export of ISO-8859 files');
  assert.equal(scrubTaskIds('UTF-8: keep the byte order mark'), 'UTF-8: keep the byte order mark');
  assert.equal(scrubTaskIds('DEV-9: Read UTF-8, after SU-7'), 'Read UTF-8, after (task)');
});

test('the surface maps come from the repository\'s tables: a feature\'s folder and its style partial, per page and per scenario', () => {
  assert.deepEqual(MAPS.pageFolders['formula-builder-tokens'], ['handsontable/src/plugins/formulaBuilder/', 'handsontable/src/styles/components/plugins/_formula-builder.scss']);
  assert.deepEqual(MAPS.pageFolders['date-editor'], ['handsontable/src/editors/dateEditor/', 'handsontable/src/styles/components/editors/_date-editor.scss']);
  assert.deepEqual(MAPS.scenarioFolders['date-editor'], MAPS.pageFolders['date-editor']);
  assert.equal(MAPS.scenarioFolders['column-summary'], undefined, 'a feature no table knows as a plugin or an editor has no folder');
  assert.deepEqual(MAPS.pageMeasurement['formula-builder'], ['tests/fixtures/demo/formula-builder.html']);
  assert.deepEqual(MAPS.scenarioMeasurement['date-editor'], ['tests/screenreader/goldens/nvda-chromium/date-editor.json',
    'tests/screenreader/goldens/vo-webkit/date-editor.json', 'tests/screenreader/scenarios/date-editor.scenario.json']);
  assert.deepEqual(MAPS.checkMeasurement, { axe: ['tests/a11y/axe-scan.ts', 'tests/a11y/axe.spec.ts'], 'axe-discovery': ['tests/a11y/checks/axe-discovery.spec.ts'],
    'docs-axe': ['tests/a11y/docs/'], 'docs-reflow': ['tests/a11y/sites/reflow.spec.ts'] });
  assert.deepEqual(MAPS.docsFolders, { 'js-layout-slots': ['docs/content/guides/accessories-and-menus/layout-slots/'] });

  const surface = surfaceOf({ source: 'checks', check: 'axe-discovery', page: 'formula-builder' }, MAPS);

  assert.deepEqual(surface.measurement, ['tests/fixtures/demo/formula-builder.html', 'tests/a11y/checks/axe-discovery.spec.ts']);
  assert.deepEqual(surfaceOf({ source: 'axe', check: 'axe', page: 'constructor' }, MAPS).page, [], 'a page id is never read through the prototype');
  assert.deepEqual(candidatesOf(null, [commit(1, ['handsontable/src/core.ts'])]), { page: [], shared: [], measurement: [] });
});

test('a docs page gets the folder its guide really lives in: where the list says, or where the slug it is served at is declared', () => {
  // Three guides of the docs visual list, as they are at this head: one where the list says, and two the list names
  // by the slug they are served at, in a folder that does not exist.
  const files = ['docs/content/guides/accessories-and-menus/layout-slots/layout-slots.md', 'docs/content/guides/cell-features/clipboard/clipboard.md',
    'docs/content/guides/getting-started/react-redux/react-redux.mdx'];
  const permalinks = { 'layout-slots': files[0], 'basic-clipboard': files[1], redux: files[2] };
  const guides = [
    { id: 'js-layout-slots', listPath: 'guides/accessories-and-menus/layout-slots/layout-slots', slug: 'layout-slots' },
    { id: 'js-basic-clipboard', listPath: 'guides/cell-features/basic-clipboard/basic-clipboard', slug: 'basic-clipboard' },
    { id: 'react-redux', listPath: 'guides/getting-started/redux/redux', slug: 'redux' },
    { id: 'js-gone', listPath: 'guides/gone/gone', slug: 'gone' },
  ];
  const resolved = docsGuideFolders(guides, { files, permalinks });

  assert.deepEqual(resolved.guides, [
    { id: 'js-layout-slots', folder: 'docs/content/guides/accessories-and-menus/layout-slots/' },
    { id: 'js-basic-clipboard', folder: 'docs/content/guides/cell-features/clipboard/' },
    { id: 'react-redux', folder: 'docs/content/guides/getting-started/react-redux/' },
  ]);
  assert.deepEqual(resolved.missing, ['js-gone'], 'a page with no guide to find is reported, never given a folder that is not there');

  const maps = surfaceMaps({ docsGuides: resolved.guides });
  const moved = candidatesOf(surfaceOf({ source: 'docs', check: 'docs-axe', page: 'js-basic-clipboard' }, maps),
    [commit(31, ['docs/content/guides/cell-features/clipboard/clipboard.md'])]);

  assert.deepEqual(moved.page.map(hit => hit.commit.pullRequest), [31], 'a change to the guide ties to the page that serves it');
});

test('a second strike is two distinct pull requests or two audits among a class\'s strikes', () => {
  const strike = (audit, pullRequest) => ({ cluster: 'contrast-and-focus-visibility', audit, pullRequest });

  assert.deepEqual(strikeCount(), { count: 0, pullRequests: 0, audits: 0, becomesCheck: false });
  assert.equal(strikeCount([strike('2026-11-23', 1)]).becomesCheck, false);
  assert.equal(strikeCount([strike('2026-11-23', 1), strike('2026-11-23', 1)]).becomesCheck, false, 'the same pull request found twice in one audit is one strike');
  assert.equal(strikeCount([strike('2026-11-23', 1), strike('2026-11-23', 2)]).becomesCheck, true);
  assert.equal(strikeCount([strike('2026-11-23', 1), strike('2026-11-30', 1)]).becomesCheck, true);

  const withStrikes = (...strikes) => ({ ...RULES, classes: RULES.classes.map(entry => (entry.id === 'C08' ? { ...entry, strikes } : entry)) });

  assert.deepEqual(secondStrikes(RULES, withStrikes(strike('2026-11-23', 1))), []);
  assert.deepEqual(secondStrikes(withStrikes(strike('2026-11-23', 1)), withStrikes(strike('2026-11-23', 1), strike('2026-11-30', 2))), ['C08']);
  assert.deepEqual(secondStrikes(withStrikes(strike('2026-11-23', 1), strike('2026-11-30', 2)), withStrikes(strike('2026-11-23', 1), strike('2026-11-30', 2))), [],
    'a class that was already there gains nothing in this change');
  assert.deepEqual(secondStrikes(null, null), []);
});

// ---------------------------------------------------------------------------------------------------------------------
// The path guard
// ---------------------------------------------------------------------------------------------------------------------

const CATALOG_DOC = {
  schema: 1,
  about: 'A catalog.',
  triage: [{ shape: 'reader|a', reason: 'Not sorted yet.' }],
  clusters: [
    { id: 'menu-semantics', title: 'Menu items have no menu parent', tracker: 'TASK-1', match: [{ source: 'checks', kinds: ['menu-role'] }] },
    { id: 'reader-quirk', title: 'The reader words it its own way', match: [{ source: 'reader', kinds: ['golden-differs'] }] },
  ],
};
const changed = (file, status = 'M', mode = '100644') => ({ path: file, status, mode });

test('the path guard allows the accessibility skill\'s folder and nothing beside it but two fields of the catalog', () => {
  const allowed = [changed(`${LEARN_SKILL_DIR}SKILL.md`), changed(LEARN_RULES_FILE), changed(`${LEARN_SKILL_DIR}references/classes.md`),
    changed(`${LEARN_SKILL_DIR}references/new-trap.md`, 'A'), changed(`${LEARN_SKILL_DIR}references/old.md`, 'D', '000000')];

  // The change edits rules.json, so the guard reads it on both sides.
  const rules = { rulesBefore: RULES, rulesAfter: { ...RULES, notPreventable: [{ cluster: 'reader-quirk', reason: 'The reader words it its own way.' }] } };

  assert.equal(LEARN_SKILL_DIR, '.claude/skills/handsontable-a11y/');
  assert.deepEqual(guardProblems({ changes: allowed, ...rules }), []);

  for (const file of ['handsontable/src/core.ts', 'wrappers/react-wrapper/src/hotTable.tsx', 'tests/a11y/axe-baseline.json',
    'tests/a11y/tree-goldens/grid.yml', '.github/workflows/a11y.yml', '.github/scripts/a11y-learn.mjs', 'tests/AGENTS.md', 'docs/AGENTS.md',
    '.claude/skills/handsontable-a11y-learn/SKILL.md', '.claude/skills/handsontable-a11y', '.claude/settings.json', 'tests/a11y/issues.json.bak']) {
    const problems = guardProblems({ changes: [...allowed, changed(file)], ...rules });

    assert.equal(problems.length, 1, file);
    assert.equal(problems[0], `${file}: outside what the routine may change (.claude/skills/handsontable-a11y/ and defectClass, notDefect in tests/a11y/issues.json)`);
  }
});

test('the path guard takes plain files only: no link, submodule or executable, even inside the skill', () => {
  for (const mode of ['120000', '160000', '100755']) {
    assert.deepEqual(guardProblems({ changes: [changed(`${LEARN_SKILL_DIR}references/x.md`, 'A', mode)] }),
      [`${LEARN_SKILL_DIR}references/x.md: a plain file only, not a link, a submodule or an executable (mode ${mode})`]);
  }
});

test('the path guard reads the catalog field by field: defectClass and notDefect may change, nothing else may', () => {
  const edit = change => ({ ...CATALOG_DOC, clusters: CATALOG_DOC.clusters.map((cluster, index) => change(cluster, index)) });
  const guard = after => guardProblems({ changes: [changed(LEARN_CATALOG_FILE)], catalogBefore: CATALOG_DOC, catalogAfter: after });

  assert.deepEqual(LEARN_CATALOG_FIELDS, ['defectClass', 'notDefect']);
  assert.deepEqual(guard(edit((cluster, index) => (index === 0 ? { defectClass: 'C02', ...cluster } : { ...cluster, notDefect: 'reader-behavior', defectClass: 'C16' }))), []);
  assert.deepEqual(guard(JSON.parse(JSON.stringify(CATALOG_DOC))), [], 'a reformatted file changes no field');
  assert.deepEqual(guard(edit(({ title, id, ...rest }) => ({ id, ...rest, title }))), [], 'nor does another order of a cluster\'s keys');

  assert.deepEqual(guard(edit((cluster, index) => (index === 0 ? { ...cluster, title: 'Another title' } : cluster))),
    ['tests/a11y/issues.json: cluster "menu-semantics" changed "title"; the routine changes only "defectClass" and "notDefect"']);
  assert.deepEqual(guard(edit(({ tracker, ...cluster }) => cluster)),
    ['tests/a11y/issues.json: cluster "menu-semantics" changed "tracker"; the routine changes only "defectClass" and "notDefect"'],
    'it cannot drop a tracker to make room for notDefect');
  assert.deepEqual(guard(edit((cluster, index) => (index === 1 ? { ...cluster, match: [{ source: 'reader' }] } : cluster))),
    ['tests/a11y/issues.json: cluster "reader-quirk" changed "match"; the routine changes only "defectClass" and "notDefect"']);
  assert.deepEqual(guard({ ...CATALOG_DOC, triage: [] }),
    ['tests/a11y/issues.json: "triage" changed; the routine changes only "defectClass" and "notDefect" of a cluster']);
  assert.deepEqual(guard({ ...CATALOG_DOC, clusters: [...CATALOG_DOC.clusters, { id: 'new-one', title: 'New', match: [{ source: 'checks' }] }] }),
    ['tests/a11y/issues.json: the routine adds, removes and moves no cluster (added new-one)']);
  assert.deepEqual(guard({ ...CATALOG_DOC, clusters: CATALOG_DOC.clusters.slice(1) }),
    ['tests/a11y/issues.json: the routine adds, removes and moves no cluster (removed menu-semantics)']);
  assert.deepEqual(guard({ ...CATALOG_DOC, clusters: [...CATALOG_DOC.clusters].reverse() }),
    ['tests/a11y/issues.json: the routine adds, removes and moves no cluster (the clusters are in another order)']);
  assert.deepEqual(catalogProblems(CATALOG_DOC, []), ['tests/a11y/issues.json must stay a catalog with its "clusters" list']);

  assert.deepEqual(guardProblems({ changes: [changed(LEARN_CATALOG_FILE, 'D', '000000')] }),
    ['tests/a11y/issues.json: the routine edits the catalog in place; it never adds or deletes it']);
  assert.deepEqual(guardProblems({ changes: [changed(LEARN_CATALOG_FILE)], catalogBefore: CATALOG_DOC, catalogAfter: null }),
    ['tests/a11y/issues.json: cannot be read as JSON on both sides, so its fields cannot be compared']);
});

test('the path guard keeps the skill\'s size budget where a person set it', () => {
  const raised = { ...RULES, budget: { skillLines: 200, buildRules: 20 } };

  assert.deepEqual(guardProblems({ changes: [changed(LEARN_RULES_FILE)], rulesBefore: RULES, rulesAfter: raised }),
    ['.claude/skills/handsontable-a11y/rules.json: "budget" changed; the routine never raises its own limits']);
  assert.deepEqual(guardProblems({ changes: [changed(LEARN_RULES_FILE)], rulesBefore: RULES, rulesAfter: { ...RULES, notPreventable: [{ cluster: 'a', reason: 'b' }] } }), []);
  assert.deepEqual(guardProblems({ changes: [changed(`${LEARN_SKILL_DIR}SKILL.md`)], rulesBefore: RULES, rulesAfter: RULES }), [], 'an untouched rules.json is not read');
});

test('the path guard does not fail open on rules.json: the routine never deletes it, adds it, or leaves it unreadable', () => {
  const inPlace = '.claude/skills/handsontable-a11y/rules.json: the routine edits the skill\'s rules in place; it never adds or deletes them';
  const unreadable = '.claude/skills/handsontable-a11y/rules.json: cannot be read as JSON on both sides, so its budget cannot be compared';

  // Deleted: the budget, every class and every strike would go with it.
  assert.deepEqual(guardProblems({ changes: [changed(LEARN_RULES_FILE, 'D', '000000')], rulesBefore: RULES, rulesAfter: null }), [inPlace]);
  assert.deepEqual(guardProblems({ changes: [changed(LEARN_RULES_FILE, 'A')], rulesBefore: null, rulesAfter: RULES }), [inPlace]);
  // Edited into something that is not JSON, or was not JSON at the base.
  assert.deepEqual(guardProblems({ changes: [changed(LEARN_RULES_FILE)], rulesBefore: RULES, rulesAfter: null }), [unreadable]);
  assert.deepEqual(guardProblems({ changes: [changed(LEARN_RULES_FILE)], rulesBefore: null, rulesAfter: RULES }), [unreadable]);
  // JSON that is no longer the rules document has no budget to keep.
  assert.deepEqual(guardProblems({ changes: [changed(LEARN_RULES_FILE)], rulesBefore: RULES, rulesAfter: [] }),
    ['.claude/skills/handsontable-a11y/rules.json: "budget" changed; the routine never raises its own limits']);
});

test('the raw diff is read with each path\'s status and new mode', () => {
  const raw = [':100644 100644 1111111 2222222 M', '.claude/skills/handsontable-a11y/SKILL.md', ':000000 120000 0000000 3333333 A', 'a link',
    ':100644 000000 4444444 0000000 D', 'handsontable/src/core.ts', ''].join('\0');

  assert.deepEqual(parseRawDiff(raw), [
    { path: '.claude/skills/handsontable-a11y/SKILL.md', status: 'M', mode: '100644' },
    { path: 'a link', status: 'A', mode: '120000' },
    { path: 'handsontable/src/core.ts', status: 'D', mode: '000000' },
  ]);
  assert.deepEqual(parseRawDiff(''), []);
});

test('the raw diff as git prints it: the second field is the new mode, which is the one the guard judges', () => {
  // `git diff --raw --no-renames --no-abbrev -z HEAD` in a repository where SKILL.md was made executable, a link and a
  // script were added and a note was deleted, copied as git printed it. The fields are the old mode, the new mode, the
  // old object, the new object and the status.
  const zero = '0'.repeat(40);
  const raw = [
    ':100644 100755 78981922613b2afb6025042ff6bd878ac1994e85 78981922613b2afb6025042ff6bd878ac1994e85 M', `${LEARN_SKILL_DIR}SKILL.md`,
    `:000000 120000 ${zero} d69512cfc83b99237b23cf465aecb450d8df1a73 A`, `${LEARN_SKILL_DIR}link.md`,
    `:100644 000000 61780798228d17af2d34fce4cfbdf35556832472 ${zero} D`, `${LEARN_SKILL_DIR}notes.md`,
    `:000000 100755 ${zero} 1a2485251c33a70432394c93fb89330ef214bfc9 A`, `${LEARN_SKILL_DIR}run.sh`,
    '',
  ].join('\0');
  const changes = parseRawDiff(raw);

  assert.deepEqual(changes.map(change => [change.path.slice(LEARN_SKILL_DIR.length), change.status, change.mode]),
    [['SKILL.md', 'M', '100755'], ['link.md', 'A', '120000'], ['notes.md', 'D', '000000'], ['run.sh', 'A', '100755']]);
  assert.deepEqual(guardProblems({ changes }), [
    `${LEARN_SKILL_DIR}SKILL.md: a plain file only, not a link, a submodule or an executable (mode 100755)`,
    `${LEARN_SKILL_DIR}link.md: a plain file only, not a link, a submodule or an executable (mode 120000)`,
    `${LEARN_SKILL_DIR}run.sh: a plain file only, not a link, a submodule or an executable (mode 100755)`,
  ], 'a file made executable, an added link and an added script fail; a deleted plain file does not');
});

test('the text of the routine\'s pull request names no task but the branch\'s own, and names a rule at its second strike', () => {
  const branch = 'feature/DEV-100_A11y-learning-2026-11-23';
  const fine = [{ name: 'a commit message', text: 'DEV-100: Record the audit of 2026-11-23\n\nStrike on C08 from #14270.' }];

  assert.deepEqual(textProblems({ branch, texts: fine }), []);
  assert.deepEqual(textProblems({ branch, texts: [{ name: 'the pull request body', text: 'The rule covers UTF-8 names and ISO-8601 dates.' }] }), []);
  assert.deepEqual(textProblems({ branch, texts: [{ name: 'the pull request body', text: 'Tracked by DEV-2964 and DEV-3652, see #14270.' }] }),
    ['the pull request body names DEV-2964, DEV-3652: the ClickUp integration attaches every task id it finds in a pull request, for good; '
      + 'name another task in words or a pull request by its number']);
  assert.match(textProblems({ branch: 'feature/DEV-100_DEV-200_x', texts: [] })[0], /names 2 task ids \(DEV-100, DEV-200\)/);
  assert.deepEqual(textProblems({ branch: 'feature/issue-123', texts: [{ name: 'a commit message', text: 'DEV-100: x' }] }).length, 1,
    'a branch with no task allows none');
  assert.deepEqual(textProblems({ branch, texts: fine, body: 'C08 needs a check: the token contrast test.', promoted: ['C08'] }), []);
  assert.deepEqual(textProblems({ branch, texts: fine, body: 'Recorded two strikes.', promoted: ['C08'] }),
    ['the pull request body does not name C08, which reached its second strike in this change: say which check the rule needs']);
  assert.deepEqual(textProblems({ branch, texts: fine, promoted: ['C08'] }), [], 'with no body yet there is nothing to read');
});

// ---------------------------------------------------------------------------------------------------------------------
// The skill
// ---------------------------------------------------------------------------------------------------------------------

test('the skill tells the agent what the script enforces: the three results, the allowed paths, the guard and a draft pull request', () => {
  const skill = readFileSync(path.join(repoRoot(), '.claude/skills/handsontable-a11y-learn/SKILL.md'), 'utf8');
  const policy = readFileSync(path.join(repoRoot(), 'tests/AGENTS.md'), 'utf8');

  assert.match(skill, /^---\nname: handsontable-a11y-learn\ndescription: .+\n---\n/);

  for (const text of [skill, policy]) {
    assert.ok(text.includes(LEARN_SKILL_DIR) && text.includes(LEARN_CATALOG_FILE));
    assert.ok(LEARN_CATALOG_FIELDS.every(field => text.includes(`\`${field}\``)));
    assert.ok(text.includes('node .github/scripts/a11y-learn.mjs') && text.includes('--guard'));
    assert.ok(text.includes(`last ${LEARN_MAX_AGE_HOURS} hours`) || text.includes('result: refused'));
  }
  for (const result of ['result: refused', 'result: nothing-attributable', 'result: packet', 'exit status 3']) {
    assert.ok(skill.includes(result), result);
  }

  assert.ok(skill.includes('.claude/a11y-learn/learn-packet.md'), 'where the script writes the packet');
  assert.ok(skill.includes('gh pr create --draft'));
  assert.ok(skill.includes('{ "cluster": "<id>", "audit": "<date of the audit, YYYY-MM-DD>", "pullRequest": <number> }'), 'a strike in the shape rules.json keeps');
  assert.match(skill, /two distinct pull requests, or two audits, is at its \*\*second strike\*\*/);
  assert.equal(TASK_ID.exec(skill), null, 'the skill names no task: the run is given its own');
  assert.ok(!/\bgh workflow run\b|--force/.test(skill.replace('no force-push', '')), 'no command that dispatches or forces');
});

// ---------------------------------------------------------------------------------------------------------------------
// The script
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Runs the script.
 *
 * @param {string[]} args The arguments.
 * @returns {{status: number, stdout: string, stderr: string}} The result.
 */
function run(args) {
  const env = { ...process.env };

  // A git hook exports these, and they would point the script's git at the hook's tree.
  delete env.GIT_DIR;
  delete env.GIT_WORK_TREE;

  return spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', env });
}

/**
 * A fixture written as the files the script reads.
 *
 * @param {string} dir The folder.
 * @returns {string[]} The arguments that name them.
 */
function filesOfCut(dir) {
  const cut = fixture('audit-2026-11-17.json');
  const commits = parseGitLog(cut.gitLog);
  const args = ['--ledger', path.join(dir, 'after.json'), '--commits', path.join(dir, 'commits.json')];

  writeFileSync(path.join(dir, 'after.json'), JSON.stringify(cut.after));
  writeFileSync(path.join(dir, 'commits.json'), JSON.stringify({ a11y: commits, reader: commits, docs: commits.slice(0, cut.docsCommits) }));
  cut.before.forEach((state, index) => {
    writeFileSync(path.join(dir, `before-${index}.json`), JSON.stringify(state));
    args.push('--before', path.join(dir, `before-${index}.json`));
  });

  return args;
}

test('the script writes the packet as JSON and Markdown on a dry run, and says the result in its first line', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'a11y-learn-'));

  try {
    const out = path.join(dir, 'out');
    const result = run([...filesOfCut(dir), '--dry-run', '--now', '2026-11-17T14:00:00Z', '--out', out]);

    assert.equal(result.status, 0, result.stderr);

    const [first, ...rest] = result.stdout.trim().split('\n');

    assert.equal(first, 'result: refused (dry run)');
    assert.ok(rest.some(line => line.startsWith('refused: A11y nightly (a11y) run 44077688383 recorded 2 tooling problems')));
    assert.ok(rest.some(line => line.startsWith('new findings: 98; came back: 1; attributable: ')));
    assert.equal(rest.at(-1), `packet: ${path.join(out, 'learn-packet.md')}`);

    const packet = JSON.parse(readFileSync(path.join(out, 'learn-packet.json'), 'utf8'));

    assert.deepEqual([packet.schema, packet.dryRun, packet.result, packet.counts.new], [1, true, 'refused', 98]);
    assert.equal(packet.generatedAt, '2026-11-17T14:00:00.000Z');
    assert.ok(readFileSync(path.join(out, 'learn-packet.md'), 'utf8').startsWith('# Accessibility learning packet\n'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the script refuses a stale audit with exit status 3, writes no packet and removes one an earlier run left', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'a11y-learn-'));

  try {
    const out = path.join(dir, 'out');

    mkdirSync(out);
    writeFileSync(path.join(out, 'learn-packet.json'), '{"result":"packet"}');
    writeFileSync(path.join(out, 'learn-packet.md'), 'stale');

    // The clock is the real one: the cut is of 2026-11-17, long past the window.
    const result = run([...filesOfCut(dir), '--out', out]);

    assert.equal(result.status, 3, result.stderr);
    assert.equal(result.stdout.split('\n')[0], 'result: refused');
    assert.match(result.stdout, /refused: Screen reader nightly \(reader\) was last audited 2026-11-17T13:35:31Z, \d+ hours ago/);
    assert.ok(!result.stdout.includes('packet: '));
    assert.ok(!existsSync(path.join(out, 'learn-packet.json')) && !existsSync(path.join(out, 'learn-packet.md')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the script ends on the caller\'s own errors with exit status 2', () => {
  const now = run(['--now', '2026-11-17T14:00:00Z']);

  assert.equal(now.status, 2);
  assert.match(now.stderr, /--now replays an older ledger, so it goes with --dry-run/);
  assert.equal(run(['--dry-run', '--now', 'yesterday']).status, 2);
  assert.equal(run(['--max-age-hours', '0']).status, 2);
  assert.equal(run(['--ledger', path.join(tmpdir(), 'no-such-ledger.json')]).status, 2);
  assert.equal(run(['--no-such-flag']).status, 2);
});

/**
 * A scratch repository shaped like this one where the routine works: the skill, the catalog and a product file on
 * `develop`, and the routine's branch off it.
 *
 * @returns {{dir: string, git: (...args: string[]) => string, write: (file: string, text: string) => void}} The repository.
 */
function scratchRepo() {
  const dir = mkdtempSync(path.join(tmpdir(), 'a11y-learn-guard-'));
  const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' };

  delete env.GIT_DIR;
  delete env.GIT_WORK_TREE;

  const git = (...args) => execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', '-c', 'commit.gpgsign=false', ...args],
    { cwd: dir, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const write = (file, text) => {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), text);
  };

  git('init', '--quiet', '--initial-branch=develop');
  write(`${LEARN_SKILL_DIR}SKILL.md`, '# The skill\n');
  write(LEARN_RULES_FILE, `${JSON.stringify(RULES, null, 2)}\n`);
  write(LEARN_CATALOG_FILE, `${JSON.stringify(CATALOG_DOC, null, 2)}\n`);
  write('handsontable/src/core.ts', 'export const core = 1;\n');
  git('add', '-A');
  git('commit', '--quiet', '-m', 'Base');
  git('switch', '--quiet', '-c', 'feature/DEV-100_A11y-learning-2026-11-23');

  return { dir, git, write };
}

test('the guard passes the routine\'s own change, read from git: the skill, a strike, and two catalog fields', () => {
  const repo = scratchRepo();

  try {
    const strike = { cluster: 'menu-semantics', audit: '2026-11-23', pullRequest: 14270 };

    repo.write(`${LEARN_SKILL_DIR}SKILL.md`, '# The skill\n\n- A new rule line.\n');
    repo.write(LEARN_RULES_FILE, `${JSON.stringify({ ...RULES, classes: RULES.classes.map(entry => (entry.id === 'C08' ? { ...entry, strikes: [strike] } : entry)) }, null, 2)}\n`);
    repo.write(LEARN_CATALOG_FILE, `${JSON.stringify({ ...CATALOG_DOC, clusters: CATALOG_DOC.clusters.map(cluster => (cluster.id === 'reader-quirk'
      ? { ...cluster, notDefect: 'reader-behavior' } : cluster)) }, null, 2)}\n`);
    repo.git('add', '-A');
    repo.git('commit', '--quiet', '-m', 'DEV-100: Record the audit of 2026-11-23');
    // Part of it not committed yet: the guard reads the working tree.
    repo.write(`${LEARN_SKILL_DIR}references/patterns.md`, 'A trap.\n');

    const result = run(['--guard', '--repo', repo.dir, '--base', 'develop']);

    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(result.stdout, 'guard: ok (4 changed paths)\n');
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('the guard fails on product code, an untracked file, a link, a forbidden catalog field and another task\'s id', () => {
  const repo = scratchRepo();

  try {
    repo.write('handsontable/src/core.ts', 'export const core = 2;\n');
    repo.write('notes/plan.md', 'A plan.\n');
    symlinkSync('../../../handsontable/src/core.ts', path.join(repo.dir, LEARN_SKILL_DIR, 'core.ts'));
    repo.write(LEARN_CATALOG_FILE, `${JSON.stringify({ ...CATALOG_DOC, clusters: CATALOG_DOC.clusters.map(({ tracker, ...cluster }) => cluster) }, null, 2)}\n`);
    repo.git('add', LEARN_CATALOG_FILE);
    repo.git('commit', '--quiet', '-m', 'DEV-100: Sort the audit\n\nFixes what DEV-2964 tracks.');

    const result = run(['--guard', '--repo', repo.dir, '--base', 'develop']);
    const lines = result.stdout.trim().split('\n');

    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.equal(lines[0], 'guard: 5 problems');
    assert.deepEqual(lines.slice(1).map(line => line.split(':')[0]).sort(), ['- .claude/skills/handsontable-a11y/core.ts', '- a commit message names DEV-2964',
      '- handsontable/src/core.ts', '- notes/plan.md', '- tests/a11y/issues.json']);
    assert.ok(lines.some(line => line.includes('cluster "menu-semantics" changed "tracker"')));
    assert.ok(lines.some(line => line.includes('core.ts: a plain file only') && line.includes('mode 120000')));
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('the guard, read from git: a tracked file made executable, a staged link and a deleted rules.json all fail', () => {
  const repo = scratchRepo();

  try {
    chmodSync(path.join(repo.dir, LEARN_SKILL_DIR, 'SKILL.md'), 0o755);
    symlinkSync('SKILL.md', path.join(repo.dir, LEARN_SKILL_DIR, 'link.md'));
    repo.git('rm', '--quiet', LEARN_RULES_FILE);
    repo.git('add', '-A');
    repo.git('commit', '--quiet', '-m', 'DEV-100: Change modes');

    const result = run(['--guard', '--repo', repo.dir, '--base', 'develop']);
    const lines = result.stdout.trim().split('\n');

    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.equal(lines[0], 'guard: 3 problems');
    assert.deepEqual(lines.slice(1).sort(), [
      `- ${LEARN_SKILL_DIR}SKILL.md: a plain file only, not a link, a submodule or an executable (mode 100755)`,
      `- ${LEARN_SKILL_DIR}link.md: a plain file only, not a link, a submodule or an executable (mode 120000)`,
      `- ${LEARN_RULES_FILE}: the routine edits the skill's rules in place; it never adds or deletes them`,
    ].sort());
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('the guard, read from git: a rules.json edited into something that is not JSON fails', () => {
  const repo = scratchRepo();

  try {
    repo.write(LEARN_RULES_FILE, '{ "schema": 1, "budget": ');

    const result = run(['--guard', '--repo', repo.dir, '--base', 'develop']);

    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.equal(result.stdout, `guard: 1 problem\n- ${LEARN_RULES_FILE}: cannot be read as JSON on both sides, so its budget cannot be compared\n`);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('the guard names a class at its second strike, and wants the pull request body to name it too', () => {
  const repo = scratchRepo();

  try {
    const strikes = [{ cluster: 'menu-semantics', audit: '2026-11-23', pullRequest: 14270 }, { cluster: 'menu-semantics', audit: '2026-11-23', pullRequest: 14206 }];

    repo.write(LEARN_RULES_FILE, `${JSON.stringify({ ...RULES, classes: RULES.classes.map(entry => (entry.id === 'C08' ? { ...entry, strikes } : entry)) }, null, 2)}\n`);
    repo.write('../body.md', 'Two strikes recorded.\n');

    const silent = run(['--guard', '--repo', repo.dir, '--base', 'develop', '--body', path.join(repo.dir, '../body.md')]);

    assert.equal(silent.status, 1);
    assert.match(silent.stdout, /^second strike: C08\nguard: 1 problem\n- the pull request body does not name C08/);

    repo.write('../body.md', 'C08 reached its second strike: it needs the token contrast test.\n');

    const named = run(['--guard', '--repo', repo.dir, '--base', 'develop', '--body', path.join(repo.dir, '../body.md')]);

    assert.equal(named.status, 0, named.stdout);
    assert.equal(named.stdout, 'second strike: C08\nguard: ok (1 changed path)\n');
  } finally {
    rmSync(path.join(repo.dir, '../body.md'), { force: true });
    rmSync(repo.dir, { recursive: true, force: true });
  }
});
