import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { job, jobIds, steps } from '../lib/workflow-text.mjs';

// Pins the wiring of the docs examples type check (DEV-3420): the checks.yml filters, the test.yml
// input, the docs.yml job, the composite action and the docs scripts. Text-based, like
// presence-gate-workflow.test.mjs, so each assertion is anchored to a key at its indent.

const read = rel => readFileSync(path.join(repoRoot(), rel), 'utf8');
const checks = read('.github/workflows/checks.yml');
const test_ = read('.github/workflows/test.yml');
const docs = read('.github/workflows/docs.yml');
const action = read('.github/actions/docs-content-typecheck/action.yml');
const docsPackage = JSON.parse(read('docs/package.json'));
const contentTypesJob = job(docs, 'content-types');

/**
 * @param {string} text The checks.yml source.
 * @param {string} name The filter key.
 * @returns {string[]} The globs of the filter: its list items, up to the next filter key.
 */
function filterGlobs(text, name) {
  const lines = text.split('\n');
  const start = lines.findIndex(line => line === `            ${name}:`);
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

/**
 * @param {string} glob A path filter glob.
 * @returns {string} The literal part before the first `*`.
 */
const literalPrefix = glob => glob.split('*')[0];

/**
 * @param {string} source A module source.
 * @returns {string[]} The specifiers of its static imports and re-exports, whatever the quotes and the form.
 */
function importSpecifiers(source) {
  const code = source.replace(/^\s*(\/\/|\*|\/\*).*$/gm, '');
  const imports = [...code.matchAll(/^\s*import\s+(?:[^;]*?\sfrom\s+)?(['"])([^'"]+)\1/gm)];
  const reExports = [...code.matchAll(/^\s*export\s+(?:\*(?:\s+as\s+\w+)?|\{[^}]*\})\s+from\s+(['"])([^'"]+)\1/gm)];

  return [...imports, ...reExports].map(match => match[2]);
}

test('the router exposes a docs-content-types flag for the example trees and the checker', () => {
  assert.match(checks, /docs-content-types: \{ value: '\$\{\{ jobs\.scope\.outputs\.docs-content-types \}\}' \}/);
  assert.match(checks, /docs-content-types: \$\{\{ steps\.path-filter\.outputs\.docs-content-types \}\}/);
  assert.deepEqual(filterGlobs(checks, 'docs-content-types'), [
    './docs/content/**/javascript/*.ts',
    './docs/content/**/react/*.tsx',
    './docs/content/**/vue/*.vue',
    './docs/content-type-check/**',
    './.github/actions/docs-content-typecheck/**',
  ]);
});

test('every docs-content-types glob is also matched by the docs filter, the only thing that starts the docs module', () => {
  const docsGlobs = filterGlobs(checks, 'docs');
  const prefixes = docsGlobs.filter(glob => glob.endsWith('/**')).map(literalPrefix);

  assert.ok(docsGlobs.length > 0, 'the docs filter was not found');

  for (const glob of filterGlobs(checks, 'docs-content-types')) {
    assert.ok(
      prefixes.some(prefix => glob.startsWith(prefix)),
      `${glob} sets docs-content-types, but test.yml starts the Docs module only on the docs flag, which does not match it`,
    );
  }

  assert.match(test_, /\n {2}docs:\n[\s\S]*?needs\.checks\.outputs\.docs == 'true'/);
});

test('test.yml hands the flag to the docs module', () => {
  assert.match(test_, /run-content-types: \$\{\{ needs\.checks\.outputs\.docs-content-types == 'true' \}\}/);
});

test('the content-types job is PR-only, scope-gated, blocking, and diffs against the PR base commit', () => {
  assert.ok(jobIds(docs).includes('content-types'), 'docs.yml has no content-types job');
  assert.match(contentTypesJob, /^ {4}if: inputs\.is-pr && \(inputs\.run-all \|\| inputs\.run-content-types\)$/m);
  assert.match(contentTypesJob, /^ {4}timeout-minutes: \d+$/m);
  assert.doesNotMatch(contentTypesJob, /continue-on-error/, 'a failing check must fail the job');
  assert.match(contentTypesJob, /^ {10}fetch-depth: 2$/m, 'the base is the merge ref\'s first parent, so two commits are needed');
  assert.doesNotMatch(contentTypesJob, /base\.sha/, 'the payload base.sha is frozen (.ai/CI.md)');
  assert.ok(
    steps(contentTypesJob).some(step => /^- uses: \.\/\.github\/actions\/docs-content-typecheck$/m.test(step.trim())),
    'the job must call the docs-content-typecheck action',
  );
  assert.match(docs, /needs: \[ lint, plugins, angular-types, content-types \]/);
});

test('the action resolves the base through GITHUB_OUTPUT and gates both later steps on it', () => {
  const actionSteps = action.split(/^ {4}(?=- )/m).slice(1);
  const byName = name => actionSteps.find(step => step.includes(`name: ${name}`)) ?? '';
  const resolve = byName('Resolve the base commit');
  const build = byName('Build the core types');
  const check = byName('Run type check');

  assert.match(resolve, /^ {6}id: base$/m);
  assert.match(resolve, /echo "ref=\$\(git rev-parse HEAD\^1\)" >> "\$GITHUB_OUTPUT"/);
  assert.match(resolve, /echo "ref=" >> "\$GITHUB_OUTPUT"/);
  assert.doesNotMatch(action, /GITHUB_ENV/, 'the later steps read steps.base.outputs.ref, so GITHUB_ENV would skip both');
  assert.match(build, /^ {6}if: steps\.base\.outputs\.ref != ''$/m);
  assert.match(build, /run: npm run build:types --prefix handsontable/);
  assert.match(check, /^ {6}if: steps\.base\.outputs\.ref != ''$/m);
  assert.match(check, /run: npm run docs:type-check-content --prefix docs/);
  assert.match(check, /BASE_REF: \$\{\{ steps\.base\.outputs\.ref \}\}/);
  assert.doesNotMatch(action, /continue-on-error/, 'a failing check must fail the job');
  assert.doesNotMatch(action, /npm run build --prefix/, 'only the core types are built');
  assert.doesNotMatch(action, /base\.sha|base-sha/, 'the payload base.sha is frozen (.ai/CI.md)');
  assert.match(action, /^ {4}- uses: \.\/\.github\/actions\/setup-workspace$/m);
});

test('the docs scripts run the checker and its tests', () => {
  assert.equal(docsPackage.scripts['docs:type-check-content'], 'node content-type-check/check.mjs');
  assert.ok(
    docsPackage.scripts['docs:test:plugins'].split(' ').includes('content-type-check/__tests__/*.test.mjs'),
    'docs:test:plugins must run content-type-check/__tests__/*.test.mjs, or the checker\'s tests stop running in CI',
  );
});

test('check.mjs and lib.mjs import only the allowed modules, statically', () => {
  const allowed = new Set([
    'node:child_process', 'node:fs', 'node:module', 'node:os', 'node:path', 'node:url', './lib.mjs',
  ]);
  const sources = [read('docs/content-type-check/check.mjs'), read('docs/content-type-check/lib.mjs')];
  const specifiers = sources.flatMap(importSpecifiers);

  assert.ok(specifiers.length > 5, 'the import scan found almost nothing, so its pattern is broken');
  assert.deepEqual(
    specifiers.filter(specifier => !allowed.has(specifier)),
    [],
    'a module outside the allowed list is imported (no install step is guaranteed)',
  );
  assert.doesNotMatch(
    sources.join('\n').replace(/^\s*(\/\/|\*|\/\*).*$/gm, ''),
    /\bimport\s*\(|\brequire\s*\(/,
    'dynamic import() or require() hides a dependency from this guard',
  );
});

test('the import scan sees every import form', () => {
  const source = [
    'import a from \'one\';',
    'import { b,',
    '  c } from "two";',
    'import \'three\';',
    'import * as d from \'four\';',
    'export * from \'five\';',
    'export { e } from "six";',
    'export const notAnImport = \'seven\';',
  ].join('\n');

  assert.deepEqual(importSpecifiers(source), ['one', 'two', 'three', 'four', 'five', 'six']);
});
