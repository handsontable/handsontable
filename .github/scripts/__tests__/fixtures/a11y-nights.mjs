/**
 * Small accessibility nights for the tests of the findings ledger's history, fix progress and digest: a catalog with
 * a cluster of each kind, nights of each workflow as `readA11yArtifacts()` hands them over, and a way to merge them in
 * order. The numbers the tests pin are worked out from these, so each night says in a line what it holds.
 */
import {
  A11Y_NIGHTLY_WORKFLOW,
  DOCS_A11Y_WORKFLOW,
  READER_NIGHTLY_WORKFLOW,
  WEBSITE_A11Y_WORKFLOW,
  mergeA11yLedger,
} from '../../lib/a11y-ledger.mjs';
import { runContextFromRun } from '../../lib/test-health.mjs';
import { ISSUES_SCHEMA, compileIssuesCatalog } from '../../../../tests/lib/a11y-issues.mjs';

export const WORKFLOWS = { a11y: A11Y_NIGHTLY_WORKFLOW, reader: READER_NIGHTLY_WORKFLOW, docs: DOCS_A11Y_WORKFLOW, website: WEBSITE_A11Y_WORKFLOW };
export const HEAD_SHA = '6db6aee0147010789d9a6ff43fa9280f7337a060';

/**
 * A catalog with a cluster of each kind the progress tells apart: owned by one task, owned by two, owned by none, and
 * not a defect.
 *
 * @param {object[]} [extra] Clusters to put first, so their rules win.
 * @param {string[]} [without] Ids of the clusters to leave out, for a catalog that renamed or dropped one.
 * @returns {object} The compiled catalog.
 */
export function catalogOf(extra = [], without = []) {
  return compileIssuesCatalog({
    schema: ISSUES_SCHEMA,
    triageLimit: 0,
    clusters: [
      ...extra,
      { id: 'focus-lost', title: 'The focus is lost', tracker: 'TASK-1', match: [{ source: 'checks', kinds: ['focus-lost'] }] },
      { id: 'menu-roles', title: 'Menu items have no menu parent', tracker: ['TASK-2', 'TASK-3'],
        match: [{ source: 'checks', kinds: ['menu-role'] }, { source: 'docs', rules: ['aria-required-parent'] }] },
      { id: 'site-contrast', title: 'Text contrast on the website', tracker: 'TASK-4', match: [{ source: 'website', rules: ['color-contrast'] }] },
      { id: 'target-small', title: 'Targets under 24 px', match: [{ source: 'checks', kinds: ['target-small'] }] },
      { id: 'reader-wording', title: 'The reader words it its own way', notDefect: 'reader-behavior',
        match: [{ source: 'reader', kinds: ['golden-differs'] }] },
    ].filter(cluster => !without.includes(cluster.id)),
  });
}

export const CATALOG = catalogOf();

/**
 * A finding of the keyboard walker on a page of the main theme, as `readA11yArtifacts()` hands it over.
 *
 * @param {string} kind The kind.
 * @param {string} page The page.
 * @param {object} [fields] Fields to override.
 * @returns {object} The finding.
 */
export function walker(kind, page, fields = {}) {
  return { source: 'checks', check: 'keyboard-walker', kind, rule: null, cause: null, page, theme: 'main', state: null, variant: null,
    where: 'Tab 1', criteria: ['2.4.3'], severity: 'serious', reason: 'A reason', url: null, issue: null, ...fields };
}

/**
 * A night of the A11y nightly holding the walker's findings.
 *
 * @param {object[]} findings The findings.
 * @param {string[]} [measured] The pages the walker measured with every step taken.
 * @returns {object} The night.
 */
export function a11yNight(findings, measured = ['a', 'b', 'c']) {
  const problems = Math.max(0, 3 - measured.length);

  return {
    source: 'a11y',
    findings,
    coverage: { checks: { 'keyboard-walker': measured.map(page => `${page}|main|`) }, axe: null, reader: [], golden: [] },
    problems,
    checks: { 'keyboard-walker': { targets: Math.max(3, measured.length), measured: measured.length, findings: findings.length, problems } },
    axe: null,
    reader: {},
  };
}

/**
 * A night of a site scan (`docs` or `website`) holding axe findings of one rule.
 *
 * @param {'docs'|'website'} source The site.
 * @param {string} rule The axe rule.
 * @param {string[]} pages The pages that show it.
 * @returns {object} The night.
 */
export function siteNight(source, rule, pages) {
  const findings = pages.map(page => ({ source, check: `${source}-axe`, kind: 'axe-violation', rule, cause: null, page, theme: 'light', state: null,
    variant: null, where: 'td[role="menuitem"]', criteria: ['1.3.1'], severity: 'critical', reason: 'A reason', url: null, issue: null, nodes: 1 }));

  return { source, findings, coverage: { checks: {}, axe: true, reader: [], golden: [] }, problems: 0, checks: {},
    axe: { complete: true, findings: findings.length, problems: 0 }, reader: {} };
}

/**
 * A night of the Screen reader nightly whose one transcript differs from its golden on the given steps.
 *
 * @param {string[]} steps The steps that differ.
 * @returns {object} The night.
 */
export function readerNight(steps) {
  const findings = steps.map(step => ({ source: 'reader', check: 'nvda-chromium', kind: 'golden-differs', rule: null, cause: null, page: 'grid-core',
    theme: null, state: null, variant: null, where: step, criteria: [], severity: 'advisory', reason: 'A reason', url: null, issue: null }));

  return { source: 'reader', findings, coverage: { checks: {}, axe: null, reader: ['nvda-chromium|grid-core'], golden: ['nvda-chromium|grid-core'] },
    problems: 0, checks: {}, axe: null,
    reader: { 'nvda-chromium': { 'grid-core': { steps: ['one', 'two'], failed: [], golden: steps.length > 0 ? 'differs' : 'match', incomplete: null } } } };
}

/**
 * Merges nights into a ledger, in order.
 *
 * @param {object|null} start The ledger to start from.
 * @param {Array<[number, string, object, object?]>} nights `[run id, completion time, night, options]`; the options take
 * `attempt`, `catalog` and whatever `mergeA11yLedger()` does.
 * @returns {{doc: object, results: object[]}} The ledger and every merge's result.
 */
export function record(start, nights) {
  const results = [];
  let doc = start;

  for (const [id, at, night, { attempt = 1, catalog = CATALOG, ...options } = {}] of nights) {
    const run = runContextFromRun({ id, run_attempt: attempt, name: WORKFLOWS[night.source], head_branch: 'develop', head_sha: HEAD_SHA,
      event: 'workflow_dispatch', updated_at: at, conclusion: 'success', html_url: `https://github.com/handsontable/handsontable/actions/runs/${id}` });
    const result = mergeA11yLedger(doc, night, run, catalog, { now: new Date(at), ...options });

    results.push(result);
    doc = result.doc;
  }

  return { doc, results };
}

/**
 * The nights of three audits over two weeks: a first one of the grid alone, then two of all four workflows, with a
 * grid-only night in between.
 *
 * - 2026-11-03: the reader's two golden differences; three lost focuses (pages a, b, c) and two menu rows, one advisory.
 * - 2026-11-10, the first full audit: page c's lost focus is gone; two small targets are new, one naming an AAA
 *   criterion alone; the docs site shows one menu row and the website two contrast rows.
 * - 2026-11-12, the grid alone: page b's small target is gone.
 * - 2026-11-17, the second full audit: both lost focuses are gone, the small target is back, one finding is unsorted,
 *   one golden difference is gone, and the website shows a third contrast row.
 *
 * @returns {Array<[number, string, object]>} The nights, for `record()`.
 */
export function threeAuditNights() {
  const menu = [walker('menu-role', 'a'), walker('menu-role', 'b', { severity: 'advisory' })];
  const smallTarget = walker('target-small', 'a', { criteria: ['2.5.5'] });

  return [
    [100, '2026-11-03T04:00:00Z', readerNight(['one', 'two'])],
    [101, '2026-11-03T05:00:00Z', a11yNight([walker('focus-lost', 'a'), walker('focus-lost', 'b'), walker('focus-lost', 'c'), ...menu])],
    [110, '2026-11-10T04:00:00Z', readerNight(['one', 'two'])],
    [111, '2026-11-10T05:00:00Z', a11yNight([walker('focus-lost', 'a'), walker('focus-lost', 'b'), ...menu, smallTarget, walker('target-small', 'b')])],
    [112, '2026-11-10T06:00:00Z', siteNight('docs', 'aria-required-parent', ['intro'])],
    [113, '2026-11-10T06:30:00Z', siteNight('website', 'color-contrast', ['home', 'pricing'])],
    [115, '2026-11-12T05:00:00Z', a11yNight([walker('focus-lost', 'a'), walker('focus-lost', 'b'), ...menu, smallTarget])],
    [120, '2026-11-17T04:00:00Z', readerNight(['one'])],
    [121, '2026-11-17T05:00:00Z', a11yNight([...menu, smallTarget, walker('target-small', 'b'), walker('mystery', 'c')])],
    [122, '2026-11-17T06:00:00Z', siteNight('docs', 'aria-required-parent', ['intro'])],
    [123, '2026-11-17T06:10:00Z', siteNight('website', 'color-contrast', ['home', 'pricing', 'demo'])],
  ];
}
