import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  SITES,
  SITE_CHECKS,
  SITE_CHECK_KINDS,
  siteCheckId,
  siteChecks,
  siteEvidenceArtifact,
  siteOf,
  siteOutputDir,
} from '../a11y-site-checks.mjs';
import { EVIDENCE_CHECKS, WCAG_CRITERIA, checksForRun, mergeEvidence, validateEvidence } from '../a11y-evidence.mjs';

// tests/AGENTS.md ("A11y: the site checks beyond axe"): the registry of the checks on a deployed site, read by
// `playwright.a11y-sites.config.ts`, the checks reporter, the report script, the findings ledger and the catalog.

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('a site check is named by its site and kind, and never shares an id with a product check', () => {
  assert.deepEqual(SITES, ['docs']);
  assert.deepEqual(Object.keys(siteChecks('docs')), ['docs-structure', 'docs-keyboard', 'docs-focus-contrast', 'docs-reflow', 'docs-forced-colors-motion']);
  assert.equal(siteCheckId('docs', 'keyboard'), 'docs-keyboard');

  for (const id of Object.keys(SITE_CHECKS)) {
    assert.ok(!Object.hasOwn(EVIDENCE_CHECKS, id), `${id} is also a product check`);
  }
});

test('every site check names a spec that exists, WCAG 2.2 criteria, and stays out of the short suite', () => {
  const specs = readdirSync(path.join(TESTS_ROOT, 'a11y/sites'));

  for (const [id, check] of Object.entries(SITE_CHECKS)) {
    assert.ok(specs.includes(check.spec), `${id}: a11y/sites/${check.spec} does not exist`);
    assert.equal(check.pullRequest, false, `${id} reads a deployed site and runs from its site's workflow only`);
    assert.ok(check.criteria.length > 0, `${id} evidences no criterion`);
    for (const criterion of check.criteria) {
      assert.ok(Object.hasOwn(WCAG_CRITERIA, criterion), `${id}: ${criterion} is not a WCAG 2.2 criterion`);
    }
    assert.ok(check.title.startsWith('Docs site: '), `${id}: the title names its site`);
  }
  for (const [kind, definition] of Object.entries(SITE_CHECK_KINDS)) {
    assert.ok(definition.sites.every(site => SITES.includes(site)), `${kind} names a site this tier does not have`);
  }
});

test('the site comes from HOT_A11Y_SITE, docs when unset, and an unknown one is refused', () => {
  assert.equal(siteOf(undefined), 'docs');
  assert.equal(siteOf(''), 'docs');
  assert.equal(siteOf('docs'), 'docs');
  assert.throws(() => siteOf('blog'), /HOT_A11Y_SITE must be one of docs/);
});

test('a subset run names site check ids, read through the shared checksForRun()', () => {
  const docs = siteChecks('docs');

  assert.deepEqual(checksForRun({}, docs), Object.keys(docs));
  assert.deepEqual(checksForRun({ A11Y_CHECKS: 'docs-reflow,docs-keyboard' }, docs), ['docs-keyboard', 'docs-reflow']);
  assert.throws(() => checksForRun({ A11Y_CHECKS: 'keyboard-walker' }, docs), /names no check "keyboard-walker"/);
});

test('a site writes into its own folder and artifact, outside the product checks\' and the flake ledger\'s glob', () => {
  assert.equal(siteOutputDir('docs'), 'test-results/a11y-docs-checks');
  assert.equal(siteEvidenceArtifact('docs'), 'docs-a11y-checks-evidence');
  assert.ok(!siteEvidenceArtifact('docs').startsWith('playwright-report-'));
});

test('a site check document merges and validates against the site registry, and is refused by the product one', () => {
  const docs = siteChecks('docs');
  const doc = mergeEvidence({
    check: 'docs-structure',
    checks: docs,
    parts: [{
      schema: 1, target: { page: 'js-introduction', theme: 'light', state: 'none', url: '/docs/javascript-data-grid/' }, durationMs: 10,
      findings: [{ kind: 'heading-h1-missing', criteria: ['1.3.1', '2.4.6'], severity: 'moderate', selector: 'h1', reason: 'No main heading' }],
    }],
  });

  assert.deepEqual(validateEvidence(doc, { checks: docs }), []);
  assert.equal(doc.title, 'Docs site: Page structure, titles, and consistency');
  assert.ok(validateEvidence(doc).length > 0, 'the product registry does not know a site check');
});

test('the site config builds one project per check of the site, with the site registry in its reporter', () => {
  const config = readFileSync(path.join(TESTS_ROOT, 'playwright.a11y-sites.config.ts'), 'utf8');

  assert.match(config, /siteOf\(process\.env\.HOT_A11Y_SITE\)/);
  assert.match(config, /checksForRun\(process\.env, checks\)/);
  assert.match(config, /\['\.\/reporters\/a11y-checks\.ts', \{ checks, outputDir: path\.join\(TESTS_ROOT, outputDir\), baseUrl \}\]/);
  assert.match(config, /serviceWorkers: 'block'/);
});
