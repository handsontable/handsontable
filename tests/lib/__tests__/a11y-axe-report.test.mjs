import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareViolations } from '../a11y-baseline.mjs';
import { combineScans, escapeHtml, summaryHtml } from '../a11y-axe-report.mjs';

const scan = (page, theme, violations, incomplete = []) => ({ page, theme, axeCoreVersion: '4.14.0', violations, incomplete });
const rule = (id, targets, extra = {}) => ({
  id, impact: 'critical', help: `${id} help`, helpUrl: `https://dequeuniversity.com/rules/axe/4.14/${id}`, description: `${id} description`,
  tags: ['wcag2a', 'wcag412'], nodes: targets.map(target => ({ target, html: `<td class="x">${target}</td>`, failureSummary: 'Fix any of the following:\n  x' })),
  ...extra,
});

test('escapeHtml escapes the five characters HTML reads', () => {
  assert.equal(escapeHtml('<a href="x">&\'</a>'), '&#60;a href=&#34;x&#34;&#62;&#38;&#39;&#60;/a&#62;');
  assert.equal(escapeHtml(undefined), '');
});

test('combineScans folds every scan into one result per rule, each node located by page and theme', () => {
  const combined = combineScans([
    scan('grid', 'main', [rule('label', [['textarea']])], [rule('color-contrast', [['td']], { impact: 'serious' })]),
    scan('grid', 'horizon', [rule('label', [['.handsontableInput']]), rule('aria-required-parent', [['td'], ['td'], ['td']])]),
  ], 'https://github.com/o/r/actions/runs/1');

  assert.equal(combined.url, 'https://github.com/o/r/actions/runs/1');
  assert.deepEqual(combined.testEngine, { name: 'axe-core', version: '4.14.0' });
  assert.deepEqual(combined.violations.map(item => [item.id, item.nodes.length]), [['aria-required-parent', 3], ['label', 2]],
    'one result per rule, the rule with the most nodes first');
  assert.deepEqual(combined.violations[1].nodes.map(node => node.target), [['grid · main › textarea'], ['grid · horizon › .handsontableInput']]);
  assert.equal(combined.violations[1].help, 'label help', 'the rule\'s own text is kept');
  assert.deepEqual(combined.incomplete.map(item => item.id), ['color-contrast']);
});

test('summaryHtml says what needs action and lists the known issues, every value escaped', () => {
  const hostile = '<img src=x onerror=alert(1)>';
  const verdict = compareViolations({
    baseline: [{ page: 'grid', theme: 'main', rule: 'label', target: 'textarea', impact: 'critical', nodes: 1, issue: 'names' }],
    issues: [{ id: 'names', title: `Inputs have no name ${hostile}` }],
    violations: [
      { page: 'grid', theme: 'main', rule: 'label', target: 'textarea', nodes: 1 },
      { page: 'grid', theme: 'main', rule: 'image-alt', target: hostile, help: hostile, nodes: 1 },
    ],
    scanned: [{ page: 'grid', theme: 'main' }],
    mode: 'warn',
  });
  const html = summaryHtml(verdict, { scans: 1, problems: [hostile] });

  assert.match(html, /<p><strong>1 new \(warn mode\)<\/strong><\/p>/);
  assert.match(html, /Warn mode\. 1 scans compared with tests\/a11y\/axe-baseline\.json: 1 new, 0 grown, 1 matched/);
  assert.match(html, /<li><strong>New<\/strong>: image-alt on &#60;img src=x/);
  assert.match(html, /<li>Inputs have no name &#60;img src=x onerror=alert\(1\)&#62; \(names\): 1 finding<\/li>/);
  assert.match(html, /<p><strong>Tooling problem: &#60;img/);
  assert.doesNotMatch(html, /<img/);
});
