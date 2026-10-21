import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareViolations } from '../a11y-baseline.mjs';
import { escapeHtml, heatBin, renderHtmlReport } from '../a11y-report.mjs';

const PAGES = [
  { id: 'grid', fixture: 'grid.html', state: 'none', surface: 'the plain grid' },
  { id: 'context-menu', fixture: 'context-menu-checked-items.html', state: 'context-menu', surface: 'the context menu' },
  { id: 'dialog', fixture: 'dialog-states.html', query: 'template=confirm', state: 'none', surface: 'a dialog' },
];
const ISSUES = [
  { id: 'grid-roles', title: 'The grid root holds children its role does not allow', tracker: 'DEV-2964' },
  { id: 'menu-roles', title: 'Menu items have no menu parent' },
];
const JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';

/**
 * A finding as `findingsFromScan()` produces it.
 *
 * @param {object} [overrides] Fields to replace.
 * @returns {object} The finding.
 */
function finding(overrides = {}) {
  return {
    page: 'grid', theme: 'main', rule: 'aria-required-children', target: 'div.ht-wrapper[role="treegrid"]', impact: 'critical',
    help: 'Certain ARIA roles must contain particular children', helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/aria-required-children',
    wcag: ['1.3.1'], html: '<div class="ht-wrapper" role="treegrid">', selector: ['#ht_1'], ancestry: ['html > body > div:nth-child(2) > div'],
    box: { x: 16, y: 40, width: 300, height: 180 }, failureSummary: 'Fix any of the following', nodes: 1,
    ...overrides,
  };
}

/**
 * A scan as the reporter hands it to the renderer.
 *
 * @param {string} page The page.
 * @param {string} theme The theme.
 * @param {object} [overrides] Fields to replace.
 * @returns {object} The scan.
 */
function scan(page, theme, overrides = {}) {
  return { page, theme, fixture: `${page}.html`, surface: `${page} surface`, state: 'none', counts: { violations: 1, incomplete: 0 },
    incomplete: [], durationMs: 1200, screenshot: null, clip: null, marks: [], ...overrides };
}

/**
 * Renders a report over a small run.
 *
 * @param {object} input The baseline entries, the findings, the scans and run overrides.
 * @returns {string} The HTML.
 */
function render({ baseline = [], violations = [], scans = [scan('grid', 'main')], run = {}, issues = ISSUES } = {}) {
  const verdict = compareViolations({ baseline, issues, violations, scanned: scans, mode: 'warn' });

  return renderHtmlReport({ verdict, scans, pages: PAGES, run: { generatedAt: '2026-10-20T08:00:00Z', engines: ['4.14.0'], ...run } });
}

const entry = overrides => ({ page: 'grid', theme: 'main', rule: 'aria-required-children', target: 'div.ht-wrapper[role="treegrid"]',
  impact: 'critical', nodes: 1, issue: 'grid-roles', ...overrides });

test('escapeHtml escapes the five characters HTML reads', () => {
  assert.equal(escapeHtml('<a href="x">&\'</a>'), '&#60;a href=&#34;x&#34;&#62;&#38;&#39;&#60;/a&#62;');
  assert.equal(escapeHtml(null), '');
});

test('heatBin maps a count to one of six steps, and zero to none', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 12].map(count => heatBin(count, 12)), [0, 1, 1, 2, 2, 3, 3, 6]);
  assert.equal(heatBin(1, 1), 6, 'the largest count takes the darkest step');
  assert.equal(heatBin(3, 0), 0);
});

test('the report is one self-contained document, dark by default, with no external script, style, font or image', () => {
  const html = render({ baseline: [entry(), entry({ page: 'context-menu', issue: 'menu-roles' })], violations: [finding()] });

  assert.match(html, /^<!doctype html>\n<html lang="en" data-theme="dark">/);
  assert.doesNotMatch(html, /<script[^>]+src=|<link\b|@import|url\(\s*["']?https?:|<img[^>]+src="https?:/i);
  assert.match(html, /<button type="button" class="theme-toggle" hidden aria-pressed="false">Light theme<\/button>/,
    'the toggle is hidden until the script shows it, so the page reads the same without JavaScript');
});

test('a new finding\'s card locates every element: the fixture to open, the steps, selector, DOM path, box and markup', () => {
  const html = render({
    baseline: [entry({ page: 'dialog', issue: 'menu-roles' }), entry({ page: 'dialog', rule: 'other' })],
    violations: [
      finding(),
      finding({ page: 'context-menu', rule: 'label', target: 'textarea.handsontableInput', help: 'Form elements must have labels',
        selector: ['.handsontableInput'], html: '<textarea class="handsontableInput">', ancestry: ['html > body > div > textarea'], box: null }),
    ],
    scans: [scan('grid', 'main'), scan('context-menu', 'main', { fixture: 'context-menu-checked-items.html', state: 'context-menu' }), scan('dialog', 'main')],
  });
  const card = html.slice(html.indexOf('<article class="card s-new"'), html.indexOf('</article>'));

  assert.match(card, /<dt>Open<\/dt><dd><a href="http:\/\/localhost:8123\/tests\/fixtures\/demo\/context-menu-checked-items\.html\?theme=main">context-menu on main<\/a>/);
  assert.match(card, /<dt>Then<\/dt><dd>select cell \(1, 1\) \(hot\.selectCell\(1, 1\)\), then press Shift\+F10<\/dd>/);
  assert.match(card, /<code class="sel">\.handsontableInput<\/code>\s*<span class="box"><span class="muted">no box: hidden or not rendered<\/span>/);
  assert.match(card, /DOM path<\/p><pre class="path">html &#62; body &#62; div &#62; textarea<\/pre>/);
  assert.match(card, /Markup<\/p><pre>&#60;textarea class=&#34;handsontableInput&#34;&#62;<\/pre>/);
  assert.match(html, /<span class="box">x 16, y 40 · 300 × 180 px<\/span>/);
});

test('a finding with many elements lists the first eight and folds the rest', () => {
  const many = Array.from({ length: 11 }, (_, index) => finding({ rule: 'label', target: 'td', selector: [`td:nth-child(${index + 1})`] }));
  const html = render({ violations: many });

  assert.equal((html.match(/<li class="element">/g) ?? []).length, 11);
  assert.match(html, /<details class="more"><summary>3 more elements<\/summary><ol class="elements" start="9">/);
});

test('every value from axe, the fixtures and the baseline is escaped', () => {
  const hostile = '<img src=x onerror=alert(1)>"\'&';
  const html = render({
    baseline: [entry({ page: 'context-menu', issue: 'menu-roles' }), entry({ target: hostile })],
    issues: [{ id: 'grid-roles', title: hostile }, { id: 'menu-roles', title: 'm' }],
    violations: [finding({ rule: hostile, target: hostile, help: hostile, html: hostile, failureSummary: hostile, selector: [hostile], ancestry: [hostile] })],
    scans: [scan('grid', 'main', { fixture: hostile, surface: hostile })],
  });

  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&#60;img src=x onerror=alert\(1\)&#62;&#34;&#39;&#38;/);
});

test('a help link is written only for a plain https URL, and a script URL never appears', () => {
  const html = render({ violations: [
    finding({ helpUrl: 'javascript:alert(1)' }),
    finding({ rule: 'label', target: 'textarea', help: 'Form elements must have labels', helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/label' }),
  ] });

  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /<a href="https:\/\/dequeuniversity\.com\/rules\/axe\/4\.14\/label">Form elements must have labels<\/a>/);
  assert.match(html, /<p class="help">Certain ARIA roles must contain particular children <span class="muted">/, 'the unsafe one is plain text');
});

test('a screenshot is embedded only as an image data URI, with its numbered legend and crop origin', () => {
  const marks = [{ n: 1, status: 'new', rule: 'aria-required-children', target: 'div.ht-wrapper[role="treegrid"]', issue: null, nodes: 1 }];
  const clip = { x: 8, y: 12, width: 400, height: 300 };
  const good = render({ violations: [finding()], scans: [scan('grid', 'main', { screenshot: JPEG, marks, clip })] });
  const forged = render({ violations: [finding()], scans: [scan('grid', 'main', { screenshot: 'data:text/html,<script>alert(1)</script>', marks })] });
  const remote = render({ violations: [finding()], scans: [scan('grid', 'main', { screenshot: 'https://example.test/x.png', marks })] });

  assert.match(good, /<img src="data:image\/jpeg;base64,[^"]+" alt="Screenshot of grid on main, mark 1 outlined\./);
  assert.match(good, /\(the area from x 8, y 12\)/);
  assert.match(good, /<span class="num s-new" title="Mark 1 on the screenshot">1<\/span>/, 'each element carries its mark number');
  assert.match(good, /<span class="num s-new">1<\/span>\s*New: <code>aria-required-children<\/code>/);
  assert.doesNotMatch(forged, /<img |<script>alert/);
  assert.doesNotMatch(remote, /<img /);
});

test('a clean run says nothing needs action, with zeroed tiles and the known issues', () => {
  const html = render({ baseline: [entry(), entry({ page: 'context-menu', issue: 'menu-roles' })], violations: [finding()],
    scans: [scan('grid', 'main'), scan('context-menu', 'horizon')] });

  assert.match(html, /class="headline t-ok"><span aria-hidden="true">✔<\/span> No new accessibility findings: 1 known, in 2 known issues/);
  assert.match(html, /<p class="empty"><span aria-hidden="true">✔<\/span> Nothing:/);
  assert.match(html, /<li class="tile s-new zero">/);
  assert.match(html, /<details class="issue" id="issue-grid-roles">[\s\S]*Tracker<\/dt><dd>DEV-2964/);
  assert.match(html, /<details class="issue" id="issue-menu-roles">[\s\S]*Tracker<\/dt><dd><span class="muted">none yet/);
});

test('a grown finding says how many elements are new, and improved and fixed entries get tables', () => {
  const html = render({
    baseline: [entry(), entry({ page: 'context-menu', issue: 'menu-roles' }), entry({ page: 'dialog', issue: 'menu-roles', nodes: 3 })],
    violations: [finding(), finding(), finding({ page: 'dialog' })],
    scans: [scan('grid', 'main'), scan('context-menu', 'main'), scan('dialog', 'main')],
  });

  assert.match(html, /class="headline t-warn"><span aria-hidden="true">⚠<\/span> 1 grown, 1 improved, 1 stale \(warn mode\)/);
  assert.match(html, /<article class="card s-grown"[\s\S]*?<dt>Elements<\/dt><dd>2, 1 more than the 1 recorded/);
  assert.match(html, /<caption><span class="chip s-improved">[\s\S]*?Improved: lower the recorded count<\/caption>/);
  assert.match(html, /<caption><span class="chip s-stale"><span aria-hidden="true">✔<\/span> Fixed<\/span> Fixed: delete the entry<\/caption>/);
});

test('the heatmap counts findings per page and theme, links each cell to its fixture, and flags the cells that need action', () => {
  const html = render({
    baseline: [entry(), entry({ theme: 'horizon' }), entry({ page: 'context-menu', issue: 'menu-roles', rule: 'aria-required-parent', target: 'td' })],
    violations: [finding(), finding({ theme: 'horizon' }), finding({ theme: 'horizon', rule: 'label', target: 'textarea' }),
      finding({ page: 'context-menu', rule: 'aria-required-parent', target: 'td' })],
    scans: [scan('grid', 'main'), scan('grid', 'horizon'), scan('context-menu', 'main')],
  });
  const table = html.slice(html.indexOf('<table class="heatmap">'), html.indexOf('</table>', html.indexOf('<table class="heatmap">')));

  assert.match(table, /<th scope="row"><a href="#scan-grid">grid<\/a><\/th><td class="heat h3"><a href="http:\/\/localhost:8123\/tests\/fixtures\/demo\/grid\.html\?theme=main">1<\/a><\/td><td class="heat h6"><a href="[^"]+theme=horizon">2<\/a> <span class="flag"/);
  assert.match(table, /<td class="heat na">not scanned<\/td>/);
  assert.doesNotMatch(table, /dialog/, 'a page with no scan is left out');
  assert.match(table, /<tfoot><tr><th scope="row">Total<\/th><td class="num-cell">2<\/td><td class="num-cell">2<\/td><td class="num-cell">0<\/td><\/tr><\/tfoot>/);
});

test('tooling problems and notes are shown at the top', () => {
  const html = render({ run: { problems: ['the baseline is <broken>'], notes: ['axe-core 4.15.0 ran'] } });

  assert.match(html, /<section class="problems"[^>]*><ul><li><strong>Tooling problem:<\/strong> the baseline is &#60;broken&#62;<\/li><li><strong>Note:<\/strong> axe-core 4\.15\.0 ran<\/li>/);
});
