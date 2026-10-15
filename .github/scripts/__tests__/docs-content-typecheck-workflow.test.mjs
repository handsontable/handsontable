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

/**
 * @param {string} text The checks.yml source.
 * @returns {string[]} The globs of the `docs-content-types` filter: its list items, up to the next filter key.
 */
function contentTypesFilter(text) {
  const lines = text.split('\n');
  const start = lines.findIndex(line => /^ {12}docs-content-types:\s*$/.test(line));
  const globs = [];

  for (let i = start + 1; start !== -1 && i < lines.length; i += 1) {
    const item = /^ {14}- '(.+)'\s*$/.exec(lines[i]);

    if (item) {
      globs.push(item[1]);
    } else if (/^ {12}\S/.test(lines[i])) {
      break;
    }
  }

  return globs;
}

test('the router exposes a docs-content-types flag for the example trees and the checker', () => {
  assert.match(checks, /docs-content-types: \{ value: '\$\{\{ jobs\.scope\.outputs\.docs-content-types \}\}' \}/);
  assert.match(checks, /docs-content-types: \$\{\{ steps\.path-filter\.outputs\.docs-content-types \}\}/);
  assert.deepEqual(contentTypesFilter(checks), [
    './docs/content/**/javascript/*.ts',
    './docs/content/**/react/*.tsx',
    './docs/content/**/vue/*.vue',
    './docs/content-type-check/**',
    './.github/actions/docs-content-typecheck/**',
  ]);
});

test('test.yml hands the flag to the docs module', () => {
  assert.match(test_, /run-content-types: \$\{\{ needs\.checks\.outputs\.docs-content-types == 'true' \}\}/);
});

test('the content-types job is PR-only, scope-gated, and diffs against the PR base commit', () => {
  const start = docs.indexOf('\n  content-types:');
  const body = docs.slice(start, docs.indexOf('\n  # Cheap, early label read'));

  assert.notEqual(start, -1, 'docs.yml has no content-types job');
  assert.match(body, /if: inputs\.is-pr && \(inputs\.run-all \|\| inputs\.run-content-types\)/);
  assert.match(body, /fetch-depth: 2/, 'the base is the merge ref\'s first parent, so two commits are needed');
  assert.doesNotMatch(body, /base\.sha/, 'the payload base.sha is frozen (.ai/CI.md)');
  assert.match(docs, /needs: \[ lint, plugins, angular-types, content-types \]/);
});

test('the action builds only the core types and needs no extra install', () => {
  assert.match(action, /run: npm run build:types --prefix handsontable/);
  assert.doesNotMatch(action, /npm run build --prefix/);
  assert.match(action, /uses: \.\/\.github\/actions\/setup-workspace/);
  assert.match(action, /BASE_REF: \$\{\{ steps\.base\.outputs\.ref \}\}/);
  assert.match(action, /git rev-parse HEAD\^1/);
  assert.doesNotMatch(action, /base\.sha|base-sha/, 'the payload base.sha is frozen (.ai/CI.md)');
  assert.match(action, /npm run docs:type-check-content --prefix docs/);
});

test('check.mjs and lib.mjs import only the allowed modules, statically', () => {
  const allowed = new Set([
    'node:child_process', 'node:fs', 'node:module', 'node:path', 'node:url', './lib.mjs',
  ]);
  const source = read('docs/content-type-check/check.mjs') + read('docs/content-type-check/lib.mjs');
  const specifiers = [...source.matchAll(/^import\s[^;]*?from\s+'([^']+)';$/gms)].map(match => match[1]);

  assert.deepEqual(
    specifiers.filter(specifier => !allowed.has(specifier)),
    [],
    'a module outside the allowed list is imported (no install step is guaranteed)',
  );
  assert.doesNotMatch(
    source.replace(/^\s*(\/\/|\*|\/\*).*$/gm, ''),
    /\bimport\s*\(|\brequire\s*\(/,
    'dynamic import() or require() hides a dependency from this guard',
  );
});
