import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareViolations, renderSummary, validateBaseline } from '../a11y-baseline.mjs';
import { agentFindings } from '../a11y-findings.mjs';
import { renderHtmlReport } from '../a11y-report.mjs';
import { DOCS_BASELINE_FILE, PRODUCT_SUITE, docsSuite, suiteFor } from '../a11y-suites.mjs';
import {
  ALL_FRAMEWORK_SLUGS,
  DEFAULT_DOCS_BASE_URL,
  DOCS_FRAMEWORKS,
  DOCS_PAGES,
  DOCS_THEMES,
  EXTRA_PAGES,
  docsBaseUrl,
  docsStateSteps,
  docsUrl,
  guidePages,
  servedSlug,
} from '../../a11y/docs/pages.mjs';

// tests/AGENTS.md, "A11y: the docs site scan": the page list, the deploy a run reads, the committed docs
// baseline, and the shared comparator, reports and findings run through the docs suite.

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const VISUAL_PATHS = require('../../../docs/tests/paths.js');
const STATES = ['none', 'versions-menu', 'support-menu', 'docs-assistant', 'search', 'phone-navigation'];

test('the docs page list takes every guide page of the visual list once, every framework for the accessibility pages', () => {
  const ids = DOCS_PAGES.map(page => page.id);

  assert.equal(new Set(ids).size, ids.length, 'page ids are unique');
  for (const page of DOCS_PAGES) {
    assert.match(page.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${page.id}: a kebab-case id, as the baseline and the ledger key it`);
    assert.ok(page.id.length <= 80, `${page.id}: the ledger keeps page ids up to 80 characters`);
    assert.match(page.path, /^\/[a-z0-9-]+-data-grid\/(?:[\w./-]+\/)?$/, `${page.id}: a path under a framework's root, with its trailing slash`);
    assert.ok(STATES.includes(page.state), `${page.id}: a state the spec opens`);
    assert.ok(page.surface, `${page.id}: says what it covers`);
  }

  // Every slug the docs visual suite photographs is scanned in one framework, the accessibility pages in all four.
  const slugs = new Set(Object.values(VISUAL_PATHS).flatMap(list => list.map(({ path: file }) => (file.endsWith('/introduction') ? 'introduction' : servedSlug(file)))));
  const guides = guidePages();

  for (const slug of slugs) {
    const variants = guides.filter(page => page.id.endsWith(`-${slug.replace(/[^a-z0-9-]+/g, '-')}`)
      && DOCS_FRAMEWORKS.some(framework => page.id === `${framework.prefix}-${slug.replace(/[^a-z0-9-]+/g, '-')}`));

    assert.equal(variants.length, ALL_FRAMEWORK_SLUGS.includes(slug) ? 4 : 1, `${slug}: scanned ${variants.length} times`);
  }
  assert.equal(guides.length, slugs.size - ALL_FRAMEWORK_SLUGS.length + (ALL_FRAMEWORK_SLUGS.length * 4));
  // A page in JavaScript where the page has one: the chrome and the prose are the same in every framework.
  assert.ok(guides.find(page => page.id === 'js-introduction'));
  assert.equal(guides.find(page => page.id === 'js-introduction').path, '/javascript-data-grid/');
  assert.equal(guides.find(page => page.id === 'vue-accessibility').path, '/vue-data-grid/accessibility/');
  // A guide is opened where the docs serve it: its permalink, not the visual list's folder name.
  assert.equal(servedSlug('guides/configuration/understanding-metadata/understanding-metadata'), 'metadata-and-inheritance');
  assert.equal(guides.find(page => page.id === 'js-metadata-and-inheritance')?.path, '/javascript-data-grid/metadata-and-inheritance/');
  assert.equal(servedSlug('guides/no-such-section/no-such-page/no-such-page'), 'no-such-page', 'the list\'s segment when the file is elsewhere');
  assert.deepEqual(DOCS_PAGES.slice(-EXTRA_PAGES.length), EXTRA_PAGES);
  assert.deepEqual(DOCS_THEMES, ['light', 'dark']);
});

test('the chrome states are reached from the keyboard, and the steps say how', () => {
  const step = id => docsStateSteps(DOCS_PAGES.find(page => page.id === id), 'dark');

  assert.match(step('chrome-versions-menu'), /^pick the dark theme .*#versions-trigger\) and press Enter$/);
  assert.match(step('chrome-docs-assistant'), /"Ask AI" button .* and press Enter$/);
  assert.match(step('chrome-phone-navigation'), /^make the window 390 by 844 CSS px, pick the dark theme/);
  assert.equal(DOCS_PAGES.find(page => page.id === 'chrome-search').requires, 'search', 'search exists in production builds only');
  assert.equal(DOCS_PAGES.find(page => page.id === 'js-not-found').status, 404);
});

test('docsBaseUrl reads the deploy a run names, and refuses what a dispatch input should not be', () => {
  assert.equal(docsBaseUrl(undefined), DEFAULT_DOCS_BASE_URL);
  assert.equal(docsBaseUrl(''), DEFAULT_DOCS_BASE_URL);
  assert.equal(docsBaseUrl('https://pr-14200.handsontable-docs-staging.pages.dev/docs/'), 'https://pr-14200.handsontable-docs-staging.pages.dev/docs');
  assert.equal(docsBaseUrl('http://localhost:4321/docs'), 'http://localhost:4321/docs');
  assert.throws(() => docsBaseUrl('http://example.com/docs'), /must be an https URL/);
  assert.throws(() => docsBaseUrl('javascript:alert(1)'), /must be an https URL/);
  assert.throws(() => docsBaseUrl('file:///etc/passwd'), /must be an https URL/);
  assert.throws(() => docsBaseUrl('https://user:secret@example.com/docs'), /no credentials, query or fragment/);
  assert.throws(() => docsBaseUrl('https://example.com/docs?x=1'), /no credentials, query or fragment/);
  assert.throws(() => docsBaseUrl('not a url'), /Invalid URL/);
  assert.equal(docsUrl(DOCS_PAGES[0], 'light', 'https://example.com/docs'), `https://example.com/docs${DOCS_PAGES[0].path}`);
  assert.throws(() => suiteFor('docs', { docsBaseUrl: 'http://example.com' }), /must be an https URL/, 'the reporter checks it too');
});

test('the catalog and the ledger read the docs constants without loading the page list', () => {
  // pages.mjs loads the docs visual list and reads every guide's source; the collector needs two constants.
  for (const file of ['tests/lib/a11y-issues.mjs', '.github/scripts/lib/a11y-ledger.mjs']) {
    const source = readFileSync(path.join(TESTS_ROOT, '..', file), 'utf8');

    assert.match(source, /from '[./]+(?:tests\/)?a11y\/docs\/constants\.mjs'/, `${file} reads the constants module`);
    assert.doesNotMatch(source, /a11y\/docs\/pages\.mjs'/, `${file} does not load the page list`);
  }
});

test('the docs suite keeps its own files, artifact and report name, and locates a page by its root-relative path', () => {
  const suite = suiteFor('docs', { docsBaseUrl: 'https://pr-1.example.dev/docs' });

  assert.equal(suite.id, 'docs');
  assert.equal(suite.baselineFile, DOCS_BASELINE_FILE);
  assert.equal(suite.artifact, 'docs-a11y-axe-results');
  assert.equal(suite.outputDir, 'test-results/a11y-docs');
  assert.notEqual(suite.reportFile, PRODUCT_SUITE.reportFile, 'a run that calls both scans uploads both reports, named after the file');
  assert.deepEqual(suite.themes, DOCS_THEMES);
  assert.deepEqual(suite.locate(DOCS_PAGES[0], 'dark'), {
    path: `/docs${DOCS_PAGES[0].path}`,
    href: `https://pr-1.example.dev/docs${DOCS_PAGES[0].path}`,
    steps: docsStateSteps(DOCS_PAGES[0], 'dark'),
  });
  assert.equal(suiteFor('product'), PRODUCT_SUITE);
  assert.throws(() => suiteFor('website'), /Unknown a11y suite "website"/);
});

test('the committed docs baseline validates against the docs pages and color schemes', () => {
  const doc = JSON.parse(readFileSync(path.join(TESTS_ROOT, DOCS_BASELINE_FILE), 'utf8'));
  const options = { pages: DOCS_PAGES.map(page => page.id), themes: DOCS_THEMES, pagesFile: 'tests/a11y/docs/pages.mjs' };

  assert.deepEqual(validateBaseline(doc, options), []);
  // A product page or theme is not a docs one.
  const bad = { ...doc, issues: [{ id: 'docs-x', title: 'A problem' }],
    entries: [{ page: 'grid', theme: 'main', rule: 'region', target: 'div', impact: 'moderate', nodes: 1, issue: 'docs-x' }] };
  const problems = validateBaseline(bad, options);

  assert.ok(problems.some(problem => /grid/.test(problem) && /tests\/a11y\/docs\/pages\.mjs/.test(problem)), problems.join('\n'));
  assert.ok(problems.some(problem => /main/.test(problem)), problems.join('\n'));
});

test('the comparator, the summary, the HTML report and the findings run through the docs suite', () => {
  const suite = docsSuite('https://example.dev/docs');
  const page = DOCS_PAGES.find(entry => entry.id === 'js-introduction');
  const violation = { page: page.id, theme: 'dark', rule: 'link-in-text-block', target: 'a', impact: 'serious', help: 'Links must be distinguishable',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/link-in-text-block', wcag: ['1.4.1'], html: '<a href="/x">x</a>', selector: ['main a'],
    ancestry: ['html > body > main > a'], box: null, failureSummary: 'Fix it', nodes: 1 };
  const verdict = compareViolations({ baseline: [], issues: [], violations: [violation], scanned: [{ page: page.id, theme: 'dark' }], mode: 'warn',
    baselineFile: suite.baselineFile });

  assert.equal(verdict.newViolations.length, 1);
  assert.match(verdict.newViolations[0].remedy, /tests\/a11y\/docs\/docs-baseline\.json/, 'the remedy names the docs baseline');
  assert.match(renderSummary(verdict, { title: suite.title }), /^## A11y \/ docs axe/m);

  const findings = agentFindings({ verdict, pages: DOCS_PAGES, suite });

  assert.equal(findings.needsAction[0].url, '/docs/javascript-data-grid/', 'root-relative, whatever deploy the run read');
  assert.equal(findings.baseUrl, 'https://example.dev/docs', 'the document names the deploy, so the ledger records staging only');
  assert.equal('baseUrl' in agentFindings({ verdict, pages: DOCS_PAGES }), false, 'the product scan reads fixtures, no deploy');
  assert.match(findings.about, /docs site scan/);
  assert.match(findings.reproduce.scan, /test:a11y-docs/);
  assert.equal(findings.pages[page.id].fixture, '/docs/javascript-data-grid/');

  const html = renderHtmlReport({ verdict, scans: [{ page: page.id, theme: 'dark', screenshot: null, counts: {} }], pages: DOCS_PAGES,
    run: { generatedAt: '2026-11-05T08:00:00Z', engines: ['4.14.0'] }, suite });

  assert.match(html, /<title>Docs site accessibility report/);
  assert.ok(html.includes('href="https://example.dev/docs/javascript-data-grid/"'), 'a page links to the deploy the run read');
  assert.ok(!html.includes('localhost:8123'), 'never the fixture server');
});
