import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareViolations } from '../a11y-baseline.mjs';
import {
  EXCEPTION_LABEL, approverList, baselineGuard, guardFromFiles, guardOf, headAt, judgeGrowth, kindCounts, readLabel,
} from '../a11y-baseline-guard.mjs';
import { baselineLines, buildCheckRun, pageLines } from '../a11y-check-run.mjs';
import { renderComment } from '../a11y-pr-comment.mjs';

// tests/AGENTS.md, "Baselining a finding, and fixing one": a pull request that adds its own finding to the baseline
// reads clean to the scan, so the check run judges every entry it adds. Inherited and approved exceptions pass; the
// rest is the pull request's own finding, and the check run is red.

const REPO_API = 'https://api.github.com/repos/o/r';
const GRID = { page: 'grid', theme: 'main', rule: 'aria-required-children', target: 'div.ht-wrapper[role="treegrid"]', impact: 'critical', nodes: 1, issue: 'grid-roles' };
const CONTRAST = { page: 'formula-builder', theme: 'horizon', rule: 'color-contrast', target: 'span.hfe-ref-mark', impact: 'serious', nodes: 2, issue: 'formula-contrast' };
const ISSUES = [
  { id: 'grid-roles', title: 'The grid root holds children its role does not allow', tracker: 'DEV-2964' },
  { id: 'formula-contrast', title: 'Formula colors are below 4.5:1', tracker: 'DEV-3989' },
  { id: 'untracked', title: 'Something nobody owns yet' },
];
const BASE = { axeCoreVersion: '4.14.0', issues: ISSUES, entries: [GRID, CONTRAST] };
const BASE_PAGES = new Set(['grid', 'formula-builder']);
const entry = overrides => ({ ...GRID, ...overrides });
const headWith = (...entries) => ({ ...BASE, entries: [...BASE.entries, ...entries] });
const growthOf = (...entries) => ({ added: entries, raised: [] });
const approval = (...entries) => ({ by: 'a-person', at: '2026-11-20T10:00:00Z', entries: new Map(entries.map(item => [keyOf(item), item])) });
const keyOf = item => [item.page, item.theme, item.rule, item.target].join('|');
const judge = (growth, head, extra = {}) => judgeGrowth({ growth, base: BASE, head, basePages: BASE_PAGES, approval: null, ...extra });

test('an entry on a page this pull request adds, showing a finding the base has on another page, is inherited', () => {
  const added = entry({ page: 'side-layout-slots' });
  const [judged] = judge(growthOf(added), headWith(added));

  assert.equal(judged.kind, 'inherited');
  assert.equal(judged.change, 'added');
  assert.match(judged.reason, /"side-layout-slots" is new, and the base baseline has aria-required-children on div\.ht-wrapper\[role="treegrid"\] in main under "grid-roles" on another page/);
});

test('an entry on a page the base already scans is the pull request\'s own, whatever its issue', () => {
  const added = entry({ page: 'formula-builder', rule: 'color-contrast', target: 'span.new-accent', issue: 'formula-contrast' });
  const [judged] = judge(growthOf(added), headWith(added));

  assert.equal(judged.kind, 'own');
  assert.match(judged.reason, /^the base branch already scans "formula-builder", and the pull request has no a11y-exception-approved label$/);
});

test('a new page is not a pass: the same issue on another element, theme or rule, or an issue the base lacks, is the pull request\'s own', () => {
  const cases = [
    [{ target: 'div.hfe-error__message', rule: 'color-contrast', issue: 'grid-roles' }, /no color-contrast on div\.hfe-error__message in main under "grid-roles"/],
    [{ theme: 'classic' }, /no aria-required-children on div\.ht-wrapper\[role="treegrid"\] in classic under "grid-roles"/],
    [{ issue: 'brand-new', rule: 'aria-valid-attr-value' }, /"new-page" is new, but the base baseline has no issue "brand-new"/],
  ];

  for (const [overrides, reason] of cases) {
    const added = entry({ page: 'new-page', ...overrides });
    const [judged] = judge(growthOf(added), { ...headWith(added), issues: [...ISSUES, { id: 'brand-new', title: 'New', tracker: 'DEV-1' }] });

    assert.equal(judged.kind, 'own', JSON.stringify(overrides));
    assert.match(judged.reason, reason);
  }
});

test('a raised count is the pull request\'s own: the page is one the base scans', () => {
  const raised = { ...CONTRAST, nodes: 5, baseNodes: 2 };
  const [judged] = judge({ added: [], raised: [raised] }, { ...BASE, entries: [GRID, { ...CONTRAST, nodes: 5 }] });

  assert.equal(judged.kind, 'own');
  assert.equal(judged.change, 'raised');
  assert.match(judged.reason, /^it raises the count on "formula-builder", a page the base branch already scans, and the pull request has no a11y-exception-approved label$/);
});

test('an approved exception needs a tracker on its issue and the label covering the entry at its count', () => {
  const added = entry({ page: 'formula-builder', rule: 'color-contrast', target: 'span.new-accent', issue: 'formula-contrast', nodes: 3 });
  const head = headWith(added);
  const [approved] = judge(growthOf(added), head, { approval: approval(added) });

  assert.equal(approved.kind, 'exception');
  assert.equal(approved.tracker, 'DEV-3989');
  assert.equal(approved.reason, 'approved by a-person with the a11y-exception-approved label on 2026-11-20T10:00:00Z');

  const untracked = { ...added, issue: 'untracked' };
  const cases = [
    [{ approval: approval(untracked) }, untracked, /its issue "untracked" names no tracker, so no task owns the fix/],
    [{ approval: approval() }, added, /the entry was not in the baseline when the a11y-exception-approved label went on \(2026-11-20T10:00:00Z\), so the label does not cover it/],
    [{ approval: approval({ ...added, nodes: 2 }) }, added, /the a11y-exception-approved label covers 2 nodes, and the entry now has 3/],
    [{ approval: { by: 'a-person', at: '2026-11-20T10:00:00Z', problem: 'the head it approved is unknown' } }, added, /the a11y-exception-approved label covers nothing: the head it approved is unknown/],
  ];

  for (const [extra, item, reason] of cases) {
    const [judged] = judge(growthOf(item), headWith(item), extra);

    assert.equal(judged.kind, 'own', String(reason));
    assert.match(judged.reason, reason);
  }
});

test('a raised count the label approved at that count is an exception, and one raised after the label is not', () => {
  const head = { ...BASE, entries: [GRID, { ...CONTRAST, nodes: 5 }] };
  const raised = { ...CONTRAST, nodes: 5, baseNodes: 2 };

  assert.equal(judge({ added: [], raised: [raised] }, head, { approval: approval({ ...CONTRAST, nodes: 5 }) })[0].kind, 'exception');
  assert.equal(judge({ added: [], raised: [raised] }, head, { approval: approval({ ...CONTRAST, nodes: 4 }) })[0].kind, 'own');
});

test('the judged entries list the own ones first, then the exceptions, then the inherited ones', () => {
  const inherited = entry({ page: 'new-page' });
  const own = entry({ page: 'grid', theme: 'horizon' });
  const exception = entry({ page: 'formula-builder', rule: 'color-contrast', target: 'span.x', issue: 'formula-contrast' });
  const judged = judge(growthOf(inherited, exception, own), headWith(inherited, exception, own), { approval: approval(exception) });

  assert.deepEqual(judged.map(item => item.kind), ['own', 'exception', 'inherited']);
  assert.deepEqual(kindCounts(judged), { own: 1, exception: 1, inherited: 1 });
});

test('guardOf reads the base page list only when the baseline grew, and an unreadable input is an error, never a pass', () => {
  const base = { text: JSON.stringify(BASE) };
  const pageIds = source => pageLines(source).keys();

  assert.deepEqual(guardOf({ base, head: BASE, pageIds }), { label: EXCEPTION_LABEL, growth: { added: [], raised: [], moved: [] }, judged: [], approval: null });

  const added = entry({ page: 'new-page' });

  assert.deepEqual(guardOf({ base, head: headWith(added), pageIds }), { error: 'the base commit\'s tests/a11y/pages.mjs was not read' });
  assert.deepEqual(guardOf({ base, basePages: { error: 'boom' }, head: headWith(added), pageIds }), { error: 'boom' });
  assert.deepEqual(guardOf({ base: { error: 'no base' }, head: BASE, pageIds }), { error: 'no base' });

  const guard = guardOf({ base, basePages: { text: "  { id: 'grid' },\n  { id: 'formula-builder' },\n" }, head: headWith(added), pageIds });

  assert.equal(guard.judged[0].kind, 'inherited');
});

test('A11Y_EXCEPTION_APPROVERS limits who may approve; empty, anyone who can label may', () => {
  const base = { text: JSON.stringify(BASE) };
  const basePages = { text: "  { id: 'grid' },\n  { id: 'formula-builder' },\n" };
  const added = entry({ page: 'grid', theme: 'horizon' });
  const label = { by: 'Someone', at: '2026-11-20T10:00:00Z', approvedText: JSON.stringify(headWith(added)) };
  const judgedBy = approvers => guardOf({ base, basePages, head: headWith(added), pageIds: source => pageLines(source).keys(), label, approvers }).judged[0];

  assert.deepEqual(approverList(' Someone , other,,'), ['someone', 'other']);
  assert.deepEqual(approverList(undefined), []);
  assert.equal(judgedBy([]).kind, 'exception');
  assert.equal(judgedBy(['someone']).kind, 'exception');
  assert.equal(judgedBy(['lead']).kind, 'own');
  assert.match(judgedBy(['lead']).reason, /the a11y-exception-approved label covers nothing: Someone added it, and only lead may approve an exception \(A11Y_EXCEPTION_APPROVERS\)/);
});

/**
 * A REST client that answers from a route table and records every call.
 *
 * @param {Array<[RegExp, Function]>} routes The routes.
 * @returns {{request: Function, calls: string[]}} The client and its calls.
 */
function stubApi(routes) {
  const calls = [];
  const request = async(url, { method = 'GET', raw = false } = {}) => {
    calls.push(`${method} ${url}${raw ? ' (raw)' : ''}`);

    const route = routes.find(([pattern]) => pattern.test(`${method} ${url}`));

    if (!route) {
      throw Object.assign(new Error(`${method} ${url} answered 404`), { status: 404 });
    }

    return route[1](url);
  };

  return { request, calls };
}

test('readLabel reads the label from the pull request\'s events: the last time it was added, unless it was removed after', async() => {
  let id = 0;
  const event = (kind, name, at, login = 'a-person') => ({ id: (id += 1), event: kind, label: { name }, actor: { login }, created_at: at });
  const labeled = (name, at, login) => event('labeled', name, at, login);
  const unlabeled = (name, at) => event('unlabeled', name, at);
  const page = events => stubApi([[/\/issues\/7\/events\?per_page=100&page=1$/, () => events]]).request;
  const read = events => readLabel({ request: page(events), repoApi: REPO_API, prNumber: 7 });
  const T1 = '2026-11-20T10:00:00Z';
  const T2 = '2026-11-20T11:00:00Z';
  const T3 = '2026-11-20T12:00:00Z';

  assert.deepEqual(await read([labeled(EXCEPTION_LABEL, T1), labeled('Accessibility', T2), labeled(EXCEPTION_LABEL, T3, 'other')]), { by: 'other', at: T3 });
  assert.equal(await read([labeled(EXCEPTION_LABEL, T1), unlabeled(EXCEPTION_LABEL, T2)]), null);
  assert.equal(await read([labeled('Accessibility', T1)]), null);

  // GitHub documents no order for the events. Listed newest first, a label added and then removed is still absent,
  // and one removed and then added again is still on.
  const added = labeled(EXCEPTION_LABEL, T1);
  const removed = unlabeled(EXCEPTION_LABEL, T2);
  const again = labeled(EXCEPTION_LABEL, T3, 'other');

  assert.equal(await read([removed, added]), null, 'removed after it was added, listed newest first');
  assert.deepEqual(await read([again, removed, added]), { by: 'other', at: T3 }, 'added again, listed newest first');
  // The API gives times to the second; within one, the later id is the later event.
  // Removed in the same second it was added (the higher id), and listed before the add.
  assert.equal(await read([labeled(EXCEPTION_LABEL, T1), unlabeled(EXCEPTION_LABEL, T1)].reverse()), null, 'same second: the higher id wins');

  const paged = stubApi([
    [/page=1$/, () => Array.from({ length: 100 }, () => ({ id: 0, event: 'mentioned' }))],
    [/page=2$/, () => [labeled(EXCEPTION_LABEL, '2026-11-20T13:00:00Z')]],
  ]);

  assert.deepEqual(await readLabel({ request: paged.request, repoApi: REPO_API, prNumber: 7 }), { by: 'a-person', at: '2026-11-20T13:00:00Z' });
  assert.equal(paged.calls.length, 2);

  const newestFirst = stubApi([
    [/page=1$/, () => [unlabeled(EXCEPTION_LABEL, T2), ...Array.from({ length: 99 }, () => ({ id: 0, event: 'mentioned' }))]],
    [/page=2$/, () => [labeled(EXCEPTION_LABEL, T1)]],
  ]);

  assert.equal(await readLabel({ request: newestFirst.request, repoApi: REPO_API, prNumber: 7 }), null, 'the latest event wins across pages too');
});

test('headAt is the head of the latest pull request run of this repository\'s branch created before the label', async() => {
  const run = (sha, at, repo = 'o/r') => ({ head_sha: sha, created_at: at, head_repository: { full_name: repo } });
  const { request, calls } = stubApi([[/\/actions\/runs\?/, () => ({ workflow_runs: [
    run('older', '2026-11-20T08:00:00Z'), run('fork', '2026-11-20T09:30:00Z', 'someone/r'), run('latest', '2026-11-20T09:00:00Z'), run('after', '2026-11-20T11:00:00Z'),
  ] })]]);

  assert.equal(await headAt({ request, repoApi: REPO_API, repository: 'o/r', headRef: 'feature/DEV-1_x', at: '2026-11-20T10:00:00Z' }), 'latest');
  assert.deepEqual(calls, [`GET ${REPO_API}/actions/runs?branch=feature%2FDEV-1_x&event=pull_request&created=%3C%3D2026-11-20T10%3A00%3A00Z&per_page=50`]);
  assert.equal(await headAt({ request: stubApi([[/./, () => ({ workflow_runs: [] })]]).request, repoApi: REPO_API, repository: 'o/r', headRef: 'b', at: 'T' }), null);
});

test('baselineGuard reads the base, and the page list, the label and the approved head only when the baseline grew', async() => {
  const exception = entry({ page: 'formula-builder', rule: 'color-contrast', target: 'span.x', issue: 'formula-contrast' });
  const routes = [
    [/^GET .*\/commits\/merge$/, () => ({ parents: [{ sha: 'base' }, { sha: 'head' }] })],
    [/contents\/tests\/a11y\/axe-baseline\.json\?ref=base$/, () => JSON.stringify(BASE)],
    [/contents\/tests\/a11y\/pages\.mjs\?ref=base$/, () => "{ id: 'grid' },\n{ id: 'formula-builder' },\n"],
    [/\/issues\/7\/events/, () => [{ event: 'labeled', label: { name: EXCEPTION_LABEL }, actor: { login: 'a-person' }, created_at: '2026-11-20T10:00:00Z' }]],
    [/\/actions\/runs\?/, () => ({ workflow_runs: [{ head_sha: 'approved', created_at: '2026-11-20T09:00:00Z', head_repository: { full_name: 'o/r' } }] })],
    [/contents\/tests\/a11y\/axe-baseline\.json\?ref=approved$/, () => JSON.stringify(headWith(exception))],
  ];
  const input = { repoApi: REPO_API, repository: 'o/r', prNumber: 7, checkedOut: 'merge', headRef: 'branch', pageIds: source => pageLines(source).keys() };
  const quiet = stubApi(routes);

  assert.deepEqual((await baselineGuard({ ...input, request: quiet.request, head: BASE })).judged, []);
  assert.equal(quiet.calls.length, 2, 'a pull request that adds nothing reads the merge commit and the base baseline, nothing more');

  const grown = stubApi(routes);
  const guard = await baselineGuard({ ...input, request: grown.request, head: headWith(exception) });

  assert.deepEqual(guard.judged.map(item => item.kind), ['exception']);
  assert.deepEqual(guard.approval.by, 'a-person');
  assert.equal(grown.calls.length, 6);

  const failing = stubApi([...routes.slice(0, 3), [/\/issues\/7\/events/, () => { throw Object.assign(new Error('no'), { status: 403 }); }]]);

  assert.deepEqual(await baselineGuard({ ...input, request: failing.request, head: headWith(exception) }),
    { error: 'reading the a11y-exception-approved label answered 403' });
});

test('guardFromFiles judges from saved files, the way a dry run does', () => {
  const added = entry({ page: 'grid', theme: 'horizon' });
  const files = {
    'base.json': JSON.stringify(BASE),
    'pages.mjs': "{ id: 'grid' },\n",
    'approval.json': JSON.stringify({ by: 'a-person', at: '2026-11-20T10:00:00Z', baseline: 'approved.json' }),
    'approved.json': JSON.stringify(headWith(added)),
  };
  const readText = (file) => {
    if (!(file in files)) {
      throw new Error('ENOENT');
    }

    return files[file];
  };
  const pageIds = source => pageLines(source).keys();

  assert.equal(guardFromFiles({ basePath: 'base.json', basePagesPath: 'pages.mjs', head: headWith(added), pageIds, readText }).judged[0].kind, 'own');
  assert.equal(guardFromFiles({ basePath: 'base.json', basePagesPath: 'pages.mjs', approvalPath: 'approval.json', head: headWith(added), pageIds, readText }).judged[0].kind, 'exception');
  assert.deepEqual(guardFromFiles({ basePath: 'missing.json', head: BASE, pageIds, readText }), { error: 'missing.json could not be read (ENOENT)' });
});

test('guardFromFiles turns an unreadable --approval file into a tooling error, never a throw', () => {
  const added = entry({ page: 'grid', theme: 'horizon' });
  const files = {
    'base.json': JSON.stringify(BASE),
    'pages.mjs': "{ id: 'grid' },\n",
    'broken.json': '{',
    'array.json': '[]',
    'no-at.json': JSON.stringify({ by: 'a-person', baseline: 'approved.json' }),
  };
  const readText = (file) => {
    if (!(file in files)) {
      throw new Error('ENOENT');
    }

    return files[file];
  };
  const judge = (approvalPath, head = headWith(added)) => guardFromFiles({ basePath: 'base.json', basePagesPath: 'pages.mjs', approvalPath, head, pageIds: source => pageLines(source).keys(), readText });

  assert.deepEqual(judge('missing.json'), { error: 'missing.json could not be read (ENOENT)' });
  assert.match(judge('broken.json').error, /^broken\.json is not valid JSON \(/);
  assert.match(judge('array.json').error, /^array\.json must be a JSON object with "by" and "at" strings/);
  assert.match(judge('no-at.json').error, /^no-at\.json must be a JSON object/);
  // As in CI, where the label is read only when the baseline grew: nothing to judge, nothing to fail.
  assert.deepEqual(judge('missing.json', BASE).judged, []);
});

const PAGES_SOURCE = "export const A11Y_PAGES = [\n  { id: 'grid', fixture: 'grid.html' },\n  { id: 'formula-builder', fixture: 'f.html' },\n];\n";
const baselineSource = entries => `{\n  "axeCoreVersion": "4.14.0",\n  "issues": [],\n  "entries": [\n${entries.map(item => `    ${JSON.stringify(item)}`).join(',\n')}\n  ]\n}\n`;

/**
 * The check run of a scan whose findings all match the pull request's baseline, with what the guard judged.
 *
 * @param {object[]} entries The pull request's baseline entries.
 * @param {object} guard The guard.
 * @returns {object} The payload.
 */
function checkRunOf(entries, guard) {
  const scanned = [...new Set(entries.map(item => `${item.page}|${item.theme}`))].map((pair) => {
    const [page, theme] = pair.split('|');

    return { page, theme };
  });
  const violations = entries.map(item => ({ ...item, help: 'h', helpUrl: 'https://dequeuniversity.com/x' }));
  const comparison = { ...compareViolations({ baseline: entries, issues: ISSUES, violations, scanned, mode: 'warn' }), problems: [], notes: [] };

  return buildCheckRun({ comparison, pages: pageLines(PAGES_SOURCE), baseline: baselineLines(baselineSource(entries)), guard });
}

test('the check run is red on an own entry whatever its severity, annotated on its baseline line', () => {
  const own = entry({ page: 'grid', theme: 'horizon', impact: 'minor' });
  const head = headWith(own);
  const guard = { label: EXCEPTION_LABEL, growth: growthOf(own), judged: judge(growthOf(own), head), approval: null };
  const payload = checkRunOf(head.entries, guard);

  assert.equal(payload.conclusion, 'failure');
  assert.match(payload.title, /^✖ Baseline growth: 1 entry is this pull request's own · ✔ Green: 0 critical/);
  assert.match(payload.summary, /^\*\*Baseline growth: red\.\*\*/);
  assert.match(payload.summary, /#### What this pull request adds to the baseline\n\n1 own, 0 approved exceptions, 0 inherited\./);
  assert.match(payload.summary, /An exception is approved by a person, never by an agent: the accessibility lead adds the `a11y-exception-approved` label by hand/);
  assert.match(payload.summary, /\| ✖ Own finding \| grid \| horizon \| aria-required-children \|/);
  assert.match(payload.summary, /This pull request has no `a11y-exception-approved` label\./);
  assert.deepEqual(payload.annotations.map(item => [item.path, item.start_line, item.annotation_level]), [['tests/a11y/axe-baseline.json', 7, 'failure']]);
  assert.match(payload.annotations[0].title, /^Own finding added to the baseline/);
});

test('an approved exception passes and is listed with who approved it; an inherited entry passes quietly', () => {
  const exception = entry({ page: 'formula-builder', rule: 'color-contrast', target: 'span.x', issue: 'formula-contrast', impact: 'serious' });
  const inherited = entry({ page: 'new-page' });
  const head = headWith(exception, inherited);
  const growth = growthOf(exception, inherited);
  const judged = judge(growth, head, { approval: approval(exception) });
  const payload = checkRunOf(head.entries, { label: EXCEPTION_LABEL, growth, judged, approval: approval(exception) });

  assert.equal(payload.conclusion, 'success');
  assert.match(payload.summary, /0 own, 1 approved exception, 1 inherited\./);
  assert.match(payload.summary, /\| ⚠ Approved exception \| formula-builder \| main \| color-contrast \| <code>span\.x<\/code> \| 1 \| Formula colors are below 4\.5:1 \(DEV‑3989\) \|/);
  assert.match(payload.summary, /\| ✔ Inherited \| new-page \|/);
  assert.match(payload.summary, /The label is on, added by <code>a-person<\/code> on 2026-11-20T10:00:00Z\./);
  assert.deepEqual(payload.annotations.map(item => [item.annotation_level, item.title]), [['notice', 'Approved baseline exception']]);
  assert.doesNotMatch(JSON.stringify(payload), /DEV-3989/, 'a task id reaches the check run only broken, never as a link the ClickUp integration would follow');
});

test('a pull request that adds nothing says so, and growth that could not be judged is a tooling failure', () => {
  const clean = checkRunOf(BASE.entries, { label: EXCEPTION_LABEL, growth: growthOf(), judged: [], approval: null });

  assert.equal(clean.conclusion, 'success');
  assert.match(clean.summary, /\*\*Baseline growth:\*\* this pull request adds nothing to `tests\/a11y\/axe-baseline\.json`\./);

  const broken = checkRunOf(BASE.entries, { error: 'reading tests/a11y/pages.mjs at abc answered 502' });

  assert.equal(broken.conclusion, 'failure');
  assert.equal(broken.title, '✖ Tooling failure: the baseline growth was not judged: reading tests/a11y/pages.mjs at abc answered 502');
});

test('the comment labels each added entry with its kind, own first, and counts the own ones in its headline', () => {
  const own = entry({ page: 'grid', theme: 'horizon' });
  const inherited = entry({ page: 'new-page' });
  const head = headWith(own, inherited);
  const growth = growthOf(own, inherited);
  const guard = { label: EXCEPTION_LABEL, growth: { ...growth, moved: [] }, judged: judge(growth, head), approval: null };
  const scanned = [{ page: 'grid', theme: 'main' }, { page: 'grid', theme: 'horizon' }, { page: 'new-page', theme: 'main' }, { page: 'formula-builder', theme: 'horizon' }];
  const violations = head.entries.map(item => ({ ...item, help: 'h', helpUrl: 'https://dequeuniversity.com/x' }));
  const comparison = { ...compareViolations({ baseline: head.entries, issues: ISSUES, violations, scanned, mode: 'warn' }), problems: [] };
  const body = renderComment(comparison, { guard });

  assert.match(body, /this pull request grows the baseline: 2 added \(1 its own\)\n/);
  assert.match(body, /\*\*1 entry is this pull request's own finding\*\*, so the `A11y \/ axe report` check run is red/);
  assert.match(body, /\| Kind \| Page \| Theme \| Rule \| Element \| Elements \| Known issue \|\n\|---\|---\|---\|---\|---\|---\|---\|\n\| ✖ Own finding \| grid \| horizon \|[^\n]*\n\| ✔ Inherited \| new-page \| main \|/);
  assert.match(renderComment(comparison, { guard: { error: 'boom' } }), /\*\*Baseline growth unknown:\*\* boom/);
});

test('the comment\'s headline is red whenever the check run is red for the baseline', () => {
  const own = entry({ page: 'grid', theme: 'horizon', impact: 'minor' });
  const inherited = entry({ page: 'new-page' });
  const scanned = [{ page: 'grid', theme: 'main' }, { page: 'grid', theme: 'horizon' }, { page: 'new-page', theme: 'main' }, { page: 'formula-builder', theme: 'horizon' }];
  const commentOf = (head, guard) => {
    const violations = head.entries.map(item => ({ ...item, help: 'h', helpUrl: 'https://dequeuniversity.com/x' }));
    const comparison = { ...compareViolations({ baseline: head.entries, issues: ISSUES, violations, scanned, mode: 'warn' }), problems: [] };

    return renderComment(comparison, { guard }).split('\n')[1];
  };
  const judgedGuard = added => ({ label: EXCEPTION_LABEL, growth: { ...growthOf(added), moved: [] }, judged: judge(growthOf(added), headWith(added)), approval: null });
  const ownHead = headWith(own);
  const inheritedHead = headWith(inherited);

  // An own entry turns the check run red at any severity, so the comment over it is red too.
  assert.equal(checkRunOf(ownHead.entries, judgedGuard(own)).conclusion, 'failure');
  assert.match(commentOf(ownHead, judgedGuard(own)), /^### ♿ A11y \/ axe: ❌ No new accessibility findings: .* · this pull request grows the baseline: 1 added \(1 its own\)$/);

  // Growth the guard could not read is a tooling failure of the check run, and a red comment that says why.
  const error = { error: 'reading tests/a11y/pages.mjs at abc answered 502' };

  assert.equal(checkRunOf(BASE.entries, error).conclusion, 'failure');
  assert.match(commentOf(BASE, error), /^### ♿ A11y \/ axe: ❌ No new accessibility findings: .* · the baseline growth could not be judged$/);

  // Growth that is only inherited leaves the check run green and the comment a warning that names the growth.
  assert.equal(checkRunOf(inheritedHead.entries, judgedGuard(inherited)).conclusion, 'success');
  assert.match(commentOf(inheritedHead, judgedGuard(inherited)), /^### ♿ A11y \/ axe: ⚠️ No new accessibility findings: .* · this pull request grows the baseline: 1 added$/);
});
