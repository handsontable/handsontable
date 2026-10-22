import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareViolations } from '../a11y-baseline.mjs';
import { FINDINGS_SCHEMA, agentFindings } from '../a11y-findings.mjs';
import {
  COMMENT_MARKER, baseCommit, baselineGrowth, neutralizeTaskIds, readBaseBaseline, renderComment, textBar, upsertComment,
} from '../a11y-pr-comment.mjs';

const PAGES = [
  { id: 'grid', fixture: 'grid.html', state: 'none' },
  { id: 'context-menu', fixture: 'context-menu-checked-items.html', state: 'context-menu', cell: [2, 1] },
];
const ISSUES = [{ id: 'grid-roles', title: 'The grid root holds children its role does not allow', tracker: 'DEV-2964' }];
const entry = overrides => ({ page: 'grid', theme: 'main', rule: 'aria-required-children', target: 'div.ht-wrapper[role="treegrid"]',
  impact: 'critical', nodes: 1, issue: 'grid-roles', ...overrides });
const finding = overrides => ({ page: 'grid', theme: 'main', rule: 'aria-required-children', target: 'div.ht-wrapper[role="treegrid"]',
  impact: 'critical', help: 'h', helpUrl: 'https://dequeuniversity.com/x', wcag: ['1.3.1'], html: '<div role="treegrid">',
  selector: ['#ht_1'], ancestry: ['html > body > div'], box: { x: 1, y: 2, width: 3, height: 4 }, failureSummary: 'Fix it', nodes: 1, ...overrides });
const scanned = [{ page: 'grid', theme: 'main' }, { page: 'grid', theme: 'horizon' }, { page: 'context-menu', theme: 'main' }];
const verdictOf = (baseline, violations, mode = 'warn') => compareViolations({ baseline, issues: ISSUES, violations, scanned, mode });

test('agentFindings lists what needs action with where to open it and the elements, and every known issue with its locations', () => {
  const document = agentFindings({
    verdict: verdictOf([entry(), entry({ theme: 'horizon' })], [
      finding(),
      finding({ theme: 'horizon' }), finding({ theme: 'horizon', selector: ['#ht_2'] }),
      finding({ page: 'context-menu', rule: 'label', target: 'textarea', selector: ['textarea'], box: null }),
    ]),
    pages: PAGES,
  });

  assert.equal(document.schema, FINDINGS_SCHEMA);
  assert.deepEqual(document.counts, { new: 1, grown: 1, matched: 1, improved: 0, stale: 0, unverified: 0, action: 2 });
  assert.match(document.reproduce.scan, /npm --prefix tests run test:a11y/);
  assert.deepEqual(document.needsAction.map(item => [item.status, item.page, item.theme, item.rule, item.nodes, item.recordedNodes]), [
    ['new', 'context-menu', 'main', 'label', 1, null],
    ['grown', 'grid', 'horizon', 'aria-required-children', 2, 1],
  ]);
  assert.deepEqual(document.needsAction[0].url, '/tests/fixtures/demo/context-menu-checked-items.html?theme=main');
  assert.equal(document.needsAction[0].steps, 'select cell (2, 1) (hot.selectCell(2, 1)), then press Shift+F10');
  assert.deepEqual(document.needsAction[0].elements, [{ selector: 'textarea', domPath: 'html > body > div', box: null, html: '<div role="treegrid">', why: 'Fix it' }]);
  assert.deepEqual(document.needsAction[1].elements.map(item => item.selector), ['#ht_1', '#ht_2']);
  assert.deepEqual(document.issues.map(issue => [issue.id, issue.tracker, issue.findings, issue.nodes, issue.wcag]), [['grid-roles', 'DEV-2964', 2, 3, ['1.3.1']]]);
  assert.deepEqual(document.issues[0].locations[0], { page: 'grid', theme: 'main', rule: 'aria-required-children',
    target: 'div.ht-wrapper[role="treegrid"]', nodes: 1, selector: '#ht_1', domPath: 'html > body > div' });
  assert.deepEqual(document.pages['context-menu'], { fixture: '/tests/fixtures/demo/context-menu-checked-items.html', query: null,
    steps: 'select cell (2, 1) (hot.selectCell(2, 1)), then press Shift+F10', surface: null });
});

test('agentFindings stays concise: at most ten elements per finding, one locator per known location', () => {
  const many = Array.from({ length: 14 }, (_, index) => finding({ rule: 'label', target: 'td', selector: [`td${index}`] }));
  const document = agentFindings({ verdict: verdictOf([entry()], [finding(), ...many]), pages: PAGES });

  assert.equal(document.needsAction[0].nodes, 14);
  assert.equal(document.needsAction[0].elements.length, 10);
  assert.equal(document.issues[0].locations.length, 1);
});

test('the comment leads with the headline and the report link, lists what needs action, and starts with its marker', () => {
  const body = renderComment({ ...verdictOf([entry(), entry({ theme: 'horizon', nodes: 1 })], [
    finding(), finding({ theme: 'horizon' }), finding({ theme: 'horizon' }),
    finding({ page: 'context-menu', rule: 'label', target: 'textarea.handsontableInput' }),
  ]), problems: [] }, {
    reportUrl: 'https://github.com/o/r/actions/runs/1/artifacts/2',
    runUrl: 'https://github.com/o/r/actions/runs/1',
    checkUrl: 'https://github.com/o/r/runs/3',
  });

  assert.ok(body.startsWith(`${COMMENT_MARKER}\n### ♿ A11y / axe: ⚠️ 1 new, 1 grown (warn mode)`), body.slice(0, 120));
  assert.match(body, /Warn mode: these findings never block the merge\./);
  assert.match(body, /📊 \*\*\[Open the HTML report\]\(https:\/\/github\.com\/o\/r\/actions\/runs\/1\/artifacts\/2\)\*\* to locate each element/);
  assert.match(body, /\| ✖ New \| context-menu \| main \| label \| <code>textarea\.handsontableInput<\/code> \| 1 \| – \|/);
  assert.match(body, /\| ▲ Grown \| grid \| horizon \| aria-required-children \| <code>div\.ht-wrapper\\\[role="treegrid"\\\]<\/code> \| 2 \(was 1\) \| The grid root holds children its role does not allow \|/);
  assert.match(body, /<sub>\[Workflow run\]\(https:\/\/github\.com\/o\/r\/actions\/runs\/1\) · \[Check run\]\(https:\/\/github\.com\/o\/r\/runs\/3\) · baseline: `tests\/a11y\/axe-baseline\.json`/);
  assert.doesNotMatch(body, /DEV-2964/, 'a tracker never reaches the comment');
});

test('a clean run\'s comment says so, and a block-mode or tooling failure is marked as one', () => {
  assert.match(renderComment({ ...verdictOf([entry()], [finding()]), problems: [] }), /### ♿ A11y \/ axe: ✅ No new accessibility findings: 1 known, in 1 known issues\n\nNothing needs action/);
  assert.match(renderComment({ ...verdictOf([], [finding()], 'block'), problems: [] }), /### ♿ A11y \/ axe: ❌ 1 new \(block mode\)\n\nBlock mode: these findings fail the job/);
  assert.match(renderComment({ ...verdictOf([entry()], [finding()]), problems: ['the <baseline> broke'] }), /### ♿ A11y \/ axe: ❌[\s\S]*> \*\*Tooling problem:\*\* the \\<baseline\\> broke/);
});

test('the comment lists fifteen rows and points to the report for the rest', () => {
  const many = Array.from({ length: 18 }, (_, index) => finding({ rule: `rule-${String(index).padStart(2, '0')}`, target: 'td' }));
  const body = renderComment({ ...verdictOf([], many), problems: [] });

  assert.equal((body.match(/^\| ✖ New /gm) ?? []).length, 15);
  assert.match(body, /…and 3 more in the report\./);
});

test('no task id can reach the comment, wherever it comes from', () => {
  assert.equal(neutralizeTaskIds('see DEV-1234 and PRO-7, not dev-1 or WCAG 2.2'), 'see DEV‑1234 and PRO‑7, not dev-1 or WCAG 2.2');

  const body = renderComment({ ...verdictOf([], [finding({ help: 'Fixed in DEV-1234', target: 'td.SU-99' })]), problems: ['IT-555 broke'] });

  assert.doesNotMatch(body, /\b[A-Z][A-Z0-9]*-\d+\b/, 'the ClickUp integration attaches every task id in a pull request comment');
});

test('a text bar is its share of the longest one, to an eighth of a character, and never empty above zero', () => {
  assert.equal(textBar(10, 10), '█'.repeat(20));
  assert.equal(textBar(5, 10), '█'.repeat(10));
  assert.equal(textBar(3, 8, 4), '█▌');
  assert.equal(textBar(1, 1000), '▏', 'a value above zero always shows');
  assert.equal(textBar(0, 10), '');
  assert.equal(textBar(20, 10), '█'.repeat(20), 'a bar never outgrows the chart');
});

test('the comment charts the findings by rule, with what needs action, in a clean run too', () => {
  const comparison = { ...verdictOf([entry(), entry({ theme: 'horizon' })], [
    finding(), finding({ theme: 'horizon' }), finding({ theme: 'horizon', selector: ['#ht_2'] }),
    finding({ page: 'context-menu', rule: 'label', target: 'textarea.handsontableInput' }),
  ]), problems: [] };
  const body = renderComment(comparison);
  const chart = body.slice(body.indexOf('#### Findings by rule'));

  assert.ok(body.indexOf('| ✖ New |') < body.indexOf('#### Findings by rule'), 'what needs action comes first');
  assert.match(chart, /\| Rule \| Findings \| Chart \| Elements \| Needs action \|\n\|---\|--:\|---\|--:\|---\|/);
  assert.match(chart, new RegExp(`\\| <code>aria-required-children</code> \\| 2 \\| ${'█'.repeat(20)} \\| 3 \\| ▲ 1 grown \\|`));
  assert.match(chart, new RegExp(`\\| <code>label</code> \\| 1 \\| ${'█'.repeat(10)} \\| 1 \\| ✖ 1 new \\|`));


  const clean = renderComment({ ...verdictOf([entry()], [finding()]), problems: [] });

  assert.match(clean, /<code>aria-required-children<\/code> \| 1 \| █+ \| 1 \| – \|/, 'a clean run is charted the same way');
  assert.doesNotMatch(renderComment({ ...verdictOf([], []), problems: ['broken'] }), /Findings by rule/, 'no chart without a finding');
});

test('the chart shows twelve rules and points to the report for the rest', () => {
  const many = Array.from({ length: 14 }, (_, index) => finding({ rule: `rule-${String(index).padStart(2, '0')}`, target: 'td' }));
  const body = renderComment({ ...verdictOf([], many), problems: [] });
  const chart = body.slice(body.indexOf('#### Findings by rule'));

  assert.equal((chart.match(/^\| <code>rule-/gm) ?? []).length, 12);
  assert.match(chart, /…and 2 more rules in the report\./);
});

const LINKS = {
  reportUrl: 'https://github.com/o/r/actions/runs/1/artifacts/2',
  runUrl: 'https://github.com/o/r/actions/runs/1',
  checkUrl: 'https://github.com/o/r/runs/3',
};
// A comparison as the reporter writes it: the verdict, the problems and the scan's shape.
const comparisonOf = (verdict, extra = {}) => ({ ...verdict, problems: [], engines: ['4.14.0'], scans: 3, scannedPages: 2, scannedThemes: 2, ...extra });
const MENU_ISSUE = { id: 'menu-labels', title: 'Menu items have no accessible name, unlike DEV-77 said' };
const baseText = entries => JSON.stringify({ axeCoreVersion: '4.14.0', issues: ISSUES, entries });

test('a clean run\'s comment is short: the headline, the scan, the links and the findings by rule', () => {
  const body = renderComment(comparisonOf(verdictOf([entry(), entry({ theme: 'horizon', nodes: 2 })], [
    finding(), finding({ theme: 'horizon' }), finding({ theme: 'horizon', selector: ['#ht_2'] }),
  ])), { ...LINKS, growth: { added: [], raised: [], moved: [] } });

  assert.ok(body.startsWith(`${COMMENT_MARKER}\n### ♿ A11y / axe: ✅ No new accessibility findings: 2 known, in 1 known issues\n`), body.slice(0, 120));
  assert.match(body, /3 scans \(2 pages × 2 themes\), axe-core 4\.14\.0\. This pull request adds nothing to the baseline\./);
  assert.match(body, /📊 \*\*\[Open the HTML report\]\(https:\/\/github\.com\/o\/r\/actions\/runs\/1\/artifacts\/2\)\*\*/);
  assert.match(body, /\[Workflow run\]\(https:\/\/github\.com\/o\/r\/actions\/runs\/1\) · \[Check run\]\(https:\/\/github\.com\/o\/r\/runs\/3\)/);
  assert.match(body, new RegExp(`#### Findings by rule\n[\\s\\S]*\\| <code>aria-required-children</code> \\| 2 \\| ${'█'.repeat(20)} \\| 3 \\| – \\|`));
  assert.doesNotMatch(body, /Known findings by issue/, 'the chart is the one overview');
  assert.doesNotMatch(body, /\| \| Page \|/, 'a clean comment lists no finding');
  assert.ok(body.split('\n').length <= 20, `a clean comment stays short, not ${body.split('\n').length} lines`);
});

test('a comparison from before the scan shape was recorded still renders its scan line', () => {
  const body = renderComment({ ...verdictOf([entry()], [finding()]), problems: [], engines: ['4.14.0'], scans: 3 });

  assert.match(body, /\n3 scans, axe-core 4\.14\.0\./);
  assert.doesNotMatch(body, /adds nothing to the baseline/, 'without the base branch\'s baseline the comment says nothing about growth');
});

test('baselineGrowth lists the entries the pull request adds, the counts it raises and the entries it moves to another issue', () => {
  const head = {
    issues: [...ISSUES, MENU_ISSUE],
    entries: [
      entry(), entry({ theme: 'horizon', nodes: 3 }), entry({ theme: 'classic', nodes: 1 }),
      entry({ page: 'context-menu', rule: 'label', target: 'td', issue: 'menu-labels' }),
      entry({ page: 'context-menu', theme: 'horizon', issue: 'menu-labels' }),
    ],
  };
  const growth = baselineGrowth({ text: baseText([entry(), entry({ theme: 'horizon', nodes: 1 }), entry({ page: 'context-menu', theme: 'horizon' })]) }, head);

  assert.deepEqual(growth.added.map(item => [item.page, item.theme, item.rule, item.issue]), [
    ['grid', 'classic', 'aria-required-children', 'grid-roles'],
    ['context-menu', 'main', 'label', 'menu-labels'],
  ]);
  assert.deepEqual(growth.raised.map(item => [item.theme, item.nodes, item.baseNodes]), [['horizon', 3, 1]]);
  assert.deepEqual(growth.moved.map(item => [item.page, item.theme, item.issue, item.baseIssue, item.baseIssueTitle]), [
    ['context-menu', 'horizon', 'menu-labels', 'grid-roles', ISSUES[0].title],
  ], 'an entry keyed as the comparator keys it, under another issue, is moved, not added');
  assert.deepEqual(baselineGrowth({ text: baseText(head.entries) }, head), { added: [], raised: [], moved: [] });
  assert.deepEqual(baselineGrowth({ text: baseText([entry({ nodes: 4 })]) }, { issues: ISSUES, entries: [entry({ nodes: 2 })] }),
    { added: [], raised: [], moved: [] }, 'a lowered count and a deleted entry are not growth');
});

test('renaming an issue moves its entries: no new debt, one line that says where they went', () => {
  const renamed = { id: 'grid-roles-renamed', title: 'The grid root, renamed' };
  const base = [entry(), entry({ theme: 'horizon' })];
  const head = { issues: [renamed], entries: base.map(item => ({ ...item, issue: renamed.id })) };
  const growth = baselineGrowth({ text: baseText(base) }, head);
  const verdict = compareViolations({ baseline: head.entries, issues: head.issues, scanned, mode: 'warn', violations: [finding(), finding({ theme: 'horizon' })] });
  const body = renderComment(comparisonOf(verdict), { growth });

  assert.deepEqual([growth.added.length, growth.raised.length, growth.moved.length], [0, 0, 2]);
  assert.match(body, /### ♿ A11y \/ axe: ✅ No new accessibility findings: 2 known, in 1 known issues\n/, 'a rename is not growth');
  assert.match(body, /This pull request adds nothing to the baseline\./);
  assert.match(body, /> \*\*Moved between issues,\*\* which adds no debt: 2 entries from The grid root holds children its role does not allow to The grid root, renamed\./);
  assert.doesNotMatch(body, /Added to the baseline/);
});

test('a move beside growth is listed after the additions', () => {
  const head = { issues: [...ISSUES, MENU_ISSUE], entries: [entry({ issue: 'menu-labels' }), entry({ theme: 'horizon' })] };
  const verdict = compareViolations({ baseline: head.entries, issues: head.issues, scanned, mode: 'warn', violations: [finding(), finding({ theme: 'horizon' })] });
  const body = renderComment(comparisonOf(verdict), { growth: baselineGrowth({ text: baseText([entry()]) }, head) });

  assert.match(body, /this pull request grows the baseline: 1 added\n/);
  assert.ok(body.indexOf('#### Added to the baseline') < body.indexOf('**Moved between issues,**'));
  assert.match(body, /1 entry from The grid root holds children its role does not allow to Menu items have no accessible name, unlike DEV‑77 said\./);
});

test('a missing or unreadable baseline on either side is reported as such, never thrown', () => {
  const head = { issues: ISSUES, entries: [entry()] };

  assert.deepEqual(baselineGrowth({ error: 'the base commit abc has no tests/a11y/axe-baseline.json' }, head),
    { error: 'the base commit abc has no tests/a11y/axe-baseline.json' });
  assert.match(baselineGrowth({ text: '{"entries": [' }, head).error, /^the base branch's baseline is not valid JSON/);
  assert.match(baselineGrowth({ text: '{"entries": 3}' }, head).error, /^the base branch's baseline has no entries list/);
  assert.match(baselineGrowth({ text: 'null' }, head).error, /^the base branch's baseline has no entries list/);
  assert.match(baselineGrowth({ text: baseText([]) }, null).error, /^this pull request's baseline could not be read/);

  const body = renderComment(comparisonOf(verdictOf([entry()], [finding()])), { growth: baselineGrowth({ text: '{' }, head) });

  assert.match(body, /### ♿ A11y \/ axe: ✅ No new accessibility findings/, 'an unknown growth is not a finding');
  assert.match(body, /> \*\*Baseline growth unknown:\*\* the base branch's baseline is not valid JSON[^\n]*, so this comment cannot say whether this pull request adds findings to the baseline\./);
});

test('a pull request that grows the baseline says so in the headline and lists what it accepted, by issue', () => {
  const head = {
    issues: [...ISSUES, MENU_ISSUE],
    entries: [
      entry(), entry({ theme: 'horizon', nodes: 3 }),
      ...Array.from({ length: 12 }, (_, index) => entry({ page: 'context-menu', rule: 'label', target: `td.item-${index}`, issue: 'menu-labels' })),
    ],
  };
  const growth = baselineGrowth({ text: baseText([entry(), entry({ theme: 'horizon', nodes: 1 })]) }, head);
  const verdict = compareViolations({ baseline: head.entries, issues: head.issues, scanned, mode: 'warn', violations: [
    finding(), ...Array.from({ length: 3 }, () => finding({ theme: 'horizon' })),
    ...Array.from({ length: 12 }, (_, index) => finding({ page: 'context-menu', rule: 'label', target: `td.item-${index}` })),
  ] });
  const body = renderComment(comparisonOf(verdict), { ...LINKS, growth });
  const section = body.slice(body.indexOf('#### Added to the baseline in this pull request'));

  assert.ok(body.startsWith(`${COMMENT_MARKER}\n### ♿ A11y / axe: ⚠️ No new accessibility findings: 14 known, in 2 known issues · `
    + 'this pull request grows the baseline: 12 added, 1 raised\n'), body.slice(0, 200));
  assert.ok(body.indexOf('#### Added to the baseline') < body.indexOf('#### Findings by rule'), 'what was accepted comes before the chart');
  assert.match(section, /Approving this pull request accepts them as known debt\./);
  assert.match(section, /\| Known issue \| Added \| Raised \|\n\|---\|--:\|--:\|\n\| Menu items have no accessible name, unlike DEV‑77 said \| 12 \| 0 \|\n\| The grid root holds children its role does not allow \| 0 \| 1 \|/);
  assert.match(section, /\| context-menu \| main \| label \| <code>td\.item-0<\/code> \| 1 \| Menu items have no accessible name, unlike DEV‑77 said \|/);
  assert.match(section, /\| grid \| horizon \| aria-required-children \| <code>div\.ht-wrapper\\\[role="treegrid"\\\]<\/code> \| 3 \(was 1\) \| The grid root holds children its role does not allow \|/);
  assert.equal((section.match(/^\| (context-menu|grid) \|/gm) ?? []).length, 10, 'the first ten are spelled out');
  assert.match(section, /…and 3 more in this pull request's diff of `tests\/a11y\/axe-baseline\.json`; the HTML report locates each one under its known issue\./);
  assert.doesNotMatch(body, /\b[A-Z][A-Z0-9]*-\d+\b/, 'no task id reaches the comment through an issue title');
});

test('a run that needs action keeps its rows and its chart, and lists baseline growth after them', () => {
  const head = { issues: ISSUES, entries: [entry(), entry({ theme: 'horizon' })] };
  const growth = baselineGrowth({ text: baseText([entry()]) }, head);
  const body = renderComment(comparisonOf(verdictOf(head.entries, [
    finding(), finding({ theme: 'horizon' }), finding({ page: 'context-menu', rule: 'label', target: 'textarea.handsontableInput' }),
  ])), { ...LINKS, growth });

  assert.match(body, /^### ♿ A11y \/ axe: ⚠️ 1 new \(warn mode\) · this pull request grows the baseline: 1 added$/m);
  assert.ok(body.indexOf('| ✖ New |') < body.indexOf('#### Added to the baseline'), 'what needs action comes first');
  assert.ok(body.indexOf('#### Added to the baseline') < body.indexOf('#### Findings by rule'));
});

/**
 * A stand-in for the REST client the script passes in: it answers from `routes` and records each call.
 *
 * @param {Array<[RegExp, Function]>} routes A pattern for `METHOD url` and what it answers.
 * @returns {{request: Function, calls: string[]}} The client and its calls.
 */
function stubApi(routes) {
  const calls = [];
  const request = async(url, { method = 'GET', payload, raw = false } = {}) => {
    calls.push(`${method} ${url}${raw ? ' (raw)' : ''}`);

    const route = routes.find(([pattern]) => pattern.test(`${method} ${url}`));

    if (!route) {
      throw Object.assign(new Error(`${method} ${url} answered 404`), { status: 404 });
    }

    return route[1](payload);
  };

  return { request, calls };
}

const REPO_API = 'https://api.github.com/repos/o/r';
const BOT = { login: 'github-actions[bot]' };

test('the comment is posted when no earlier one exists, whatever the run found', async() => {
  const { request, calls } = stubApi([
    [/^GET .*\/issues\/7\/comments\?per_page=100&page=1$/, () => [
      { id: 1, user: { login: 'someone' }, body: `${COMMENT_MARKER} pasted by a person` },
      { id: 2, user: BOT, body: 'another bot comment' },
    ]],
    [/^POST .*\/issues\/7\/comments$/, payload => ({ html_url: `https://github.com/o/r/pull/7#c-${payload.body.length}` })],
  ]);

  assert.deepEqual(await upsertComment({ request, repoApi: REPO_API, prNumber: '7', body: 'clean body' }),
    { action: 'posted', url: 'https://github.com/o/r/pull/7#c-10' });
  assert.deepEqual(calls, [`GET ${REPO_API}/issues/7/comments?per_page=100&page=1`, `POST ${REPO_API}/issues/7/comments`],
    'a marker only counts in the Actions bot\'s own comment');
});

test('an earlier comment is edited in place, found on whichever page it is', async() => {
  const filler = Array.from({ length: 100 }, (_, index) => ({ id: 100 + index, user: BOT, body: 'other' }));
  const { request, calls } = stubApi([
    [/^GET .*page=1$/, () => filler],
    [/^GET .*page=2$/, () => [{ id: 9, user: BOT, body: `${COMMENT_MARKER}\nold`, html_url: 'https://github.com/o/r/pull/7#c-9' }]],
    [/^PATCH .*\/issues\/comments\/9$/, payload => ({ html_url: `https://github.com/o/r/pull/7#c-9-${payload.body}` })],
  ]);

  assert.deepEqual(await upsertComment({ request, repoApi: REPO_API, prNumber: '7', body: 'new' }),
    { action: 'edited', url: 'https://github.com/o/r/pull/7#c-9' });
  assert.deepEqual(calls.map(call => call.split(' ')[0]), ['GET', 'GET', 'PATCH']);
});

test('readBaseBaseline reads the base commit\'s file raw, and reports a missing one or a failed read', async() => {
  const sha = '0123456789abcdef0123456789abcdef01234567';
  const found = stubApi([[/^GET .*\/contents\/tests\/a11y\/axe-baseline\.json\?ref=0123456789abcdef/, () => '{"entries": []}']]);

  assert.deepEqual(await readBaseBaseline({ request: found.request, repoApi: REPO_API, sha }), { text: '{"entries": []}' });
  assert.deepEqual(found.calls, [`GET ${REPO_API}/contents/tests/a11y/axe-baseline.json?ref=${sha} (raw)`]);

  assert.deepEqual(await readBaseBaseline({ request: stubApi([]).request, repoApi: REPO_API, sha }),
    { error: 'the base commit 0123456789ab has no tests/a11y/axe-baseline.json' });

  const broken = stubApi([[/./, () => { throw Object.assign(new Error('GET … answered 500: {"message":"boom"}'), { status: 500 }); }]]);

  assert.deepEqual(await readBaseBaseline({ request: broken.request, repoApi: REPO_API, sha }),
    { error: 'reading the base commit\'s tests/a11y/axe-baseline.json answered 500' });
  assert.deepEqual(await readBaseBaseline({ request: found.request, repoApi: REPO_API, sha: '' }),
    { error: 'no base commit was given (A11Y_BASE_SHA)' });
});

test('the base commit is the checked-out merge commit\'s first parent, so a rebuilt merge ref compares like with like', async() => {
  const merge = stubApi([[/^GET .*\/commits\/m1$/, () => ({ sha: 'm1', parents: [{ sha: 'develop-tip' }, { sha: 'head' }] })]]);

  assert.deepEqual(await baseCommit({ request: merge.request, repoApi: REPO_API, checkedOut: 'm1', payloadBase: 'stale-base' }), { sha: 'develop-tip' });
  assert.deepEqual(merge.calls, [`GET ${REPO_API}/commits/m1`]);

  const single = stubApi([[/^GET .*\/commits\/h1$/, () => ({ sha: 'h1', parents: [{ sha: 'p' }] })]]);

  assert.deepEqual(await baseCommit({ request: single.request, repoApi: REPO_API, checkedOut: 'h1', payloadBase: 'b1' }), { sha: 'b1' },
    'a checkout that is not a merge commit falls back to the pull request\'s base commit');
  assert.deepEqual(await baseCommit({ request: single.request, repoApi: REPO_API, checkedOut: '', payloadBase: 'b1' }), { sha: 'b1' });

  const broken = stubApi([[/./, () => { throw Object.assign(new Error('boom'), { status: 500 }); }]]);

  assert.deepEqual(await baseCommit({ request: broken.request, repoApi: REPO_API, checkedOut: '0123456789abcdef', payloadBase: 'b1' }),
    { error: 'reading the checked-out commit 0123456789ab answered 500' }, 'a failed read is unknown growth, never a guess from a stale base');
});
