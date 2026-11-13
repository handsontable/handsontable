import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EVIDENCE_SCHEMA, mergeEvidence } from '../a11y-evidence.mjs';
import { siteChecks } from '../a11y-site-checks.mjs';

// tests/AGENTS.md ("A11y: the site checks beyond axe"): a site check's check run annotates a finding on its page's entry
// in the site's page list, the line the site's scan annotates. Most website pages take their id from the route and
// have no `id:` line, so a report that read the product's lines put them on line 1. This runs the real script, dry.

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PAGES_FILE = 'tests/a11y/website/pages.mjs';

test('a website check run annotates a page whose id comes from its route on that page\'s own entry', (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'site-evidence-report-'));

  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const part = {
    schema: EVIDENCE_SCHEMA,
    target: { page: 'home', theme: 'desktop', state: 'none', url: 'https://handsontable.com/' },
    durationMs: 10,
    environment: { browser: 'chromium', browserVersion: '140.0' },
    findings: [{ kind: 'skip-link-missing', criteria: ['2.4.1'], severity: 'serious', step: 'the page', reason: 'No skip link' }],
  };

  writeFileSync(path.join(dir, 'website-structure.json'),
    JSON.stringify(mergeEvidence({ check: 'website-structure', checks: siteChecks('website'), parts: [part] })));

  // A clean environment: in CI the runner's own GITHUB_* variables would make the script append to the job summary.
  const result = spawnSync(process.execPath, ['scripts/a11y-evidence-report.mjs', '--dry-run'], {
    cwd: TESTS_ROOT,
    encoding: 'utf8',
    env: { PATH: process.env.PATH, HOT_A11Y_SITE: 'website', A11Y_EVIDENCE_DIR: dir, A11Y_CHECKS: 'website-structure' },
  });

  assert.equal(result.status, 0, result.stderr);

  const [payload] = JSON.parse(result.stdout.slice(result.stdout.indexOf('[')));
  const [annotation] = payload.annotations;
  const lines = readFileSync(path.join(TESTS_ROOT, '..', PAGES_FILE), 'utf8').split('\n');

  assert.equal(payload.name, 'A11y / website-structure report');
  assert.equal(annotation.path, PAGES_FILE);
  assert.equal(lines[annotation.start_line - 1].trim(), 'page(\'/\'),', 'the home page is annotated on `page(\'/\')`, not on line 1');
});
