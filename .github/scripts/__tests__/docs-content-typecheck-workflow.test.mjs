import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// Pins the wiring of the docs examples type check (DEV-3420): the checks.yml filter, the test.yml
// input, the docs.yml job and the composite action. Text-based, like presence-gate-workflow.test.mjs.

const read = rel => readFileSync(path.join(repoRoot(), rel), 'utf8');
const checks = read('.github/workflows/checks.yml');
const test_ = read('.github/workflows/test.yml');
const docs = read('.github/workflows/docs.yml');
const action = read('.github/actions/docs-content-typecheck/action.yml');

test('the router exposes a docs-content-types flag for the example trees and the checker', () => {
  const filter = checks.slice(checks.indexOf('docs-content-types:\n              - '));

  assert.match(checks, /docs-content-types: \{ value: '\$\{\{ jobs\.scope\.outputs\.docs-content-types \}\}' \}/);
  assert.match(checks, /docs-content-types: \$\{\{ steps\.path-filter\.outputs\.docs-content-types \}\}/);
  ['javascript/*.ts', 'react/*.tsx', 'vue/*.vue', 'docs/content-type-check/**'].forEach((glob) => {
    assert.ok(filter.slice(0, 700).includes(glob), `the docs-content-types filter lacks ${glob}`);
  });
});

test('test.yml hands the flag to the docs module', () => {
  assert.match(test_, /run-content-types: \$\{\{ needs\.checks\.outputs\.docs-content-types == 'true' \}\}/);
});

test('the content-types job is PR-only, scope-gated, and diffs against the PR base commit', () => {
  const start = docs.indexOf('\n  content-types:');
  const body = docs.slice(start, docs.indexOf('\n  # Cheap, early label read'));

  assert.notEqual(start, -1, 'docs.yml has no content-types job');
  assert.match(body, /if: inputs\.is-pr && inputs\.run-content-types/);
  assert.match(body, /base-sha: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
  assert.match(docs, /needs: \[ lint, plugins, angular-types, content-types \]/);
});

test('the action builds only the core types and needs no extra install', () => {
  assert.match(action, /run: npm run build:types --prefix handsontable/);
  assert.doesNotMatch(action, /npm run build --prefix/);
  assert.match(action, /uses: \.\/\.github\/actions\/setup-workspace/);
  assert.match(action, /BASE_REF: \$\{\{ inputs\.base-sha \}\}/);
  assert.match(action, /npm run docs:type-check-content --prefix docs/);
});

test('check.mjs imports only built-in modules and its own lib', () => {
  const source = read('docs/content-type-check/check.mjs') + read('docs/content-type-check/lib.mjs');
  const specifiers = [...source.matchAll(/^import .* from '([^']+)';$/gm)].map(match => match[1]);

  assert.ok(specifiers.length >= 5);
  specifiers.forEach((specifier) => {
    assert.ok(
      specifier.startsWith('node:') || specifier.startsWith('./'),
      `check.mjs imports ${specifier}; only node: built-ins are allowed (no install step is guaranteed)`,
    );
  });
});
