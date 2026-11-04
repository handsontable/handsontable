import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { job, steps } from '../lib/workflow-text.mjs';

// The docs staging and preview builds write the internal test key into the executed examples
// (`DOCS_TEST_LICENSE_KEY=true`, read by docs/src/plugins/preview-license-key.mjs), so their grids run
// off handsontable.com without the lock screen. The docs config refuses the key in a production build,
// and the build check fails a build that leaks it. This file pins the workflow half:
//
//   1. only the staging deploy and the local-build visual dispatch set the flag, and the production
//      image build never does;
//   2. the staging deploy sets it on the build step itself, so the pull request previews and the
//      develop deploys the visual seed photographs carry the same key.

const FLAG = 'DOCS_TEST_LICENSE_KEY';
const root = repoRoot();
const WORKFLOWS = path.join(root, '.github', 'workflows');
const read = file => readFileSync(path.join(WORKFLOWS, file), 'utf8');

test('only the docs staging deploy and the local-build visual dispatch set the flag', () => {
  const setters = readdirSync(WORKFLOWS)
    .filter(file => /\.ya?ml$/.test(file))
    .filter(file => read(file).includes(FLAG))
    .sort();

  assert.deepEqual(setters, ['docs-staging.yml', 'docs-visual-tests.yml']);
});

test('the production docs image never gets the key', () => {
  const docsPackage = JSON.parse(readFileSync(path.join(root, 'docs', 'package.json'), 'utf8'));

  assert.match(docsPackage.scripts['docs:docker:build:production'], /BUILD_MODE=production/);
  assert.ok(!docsPackage.scripts['docs:docker:build:production'].includes(FLAG));
  assert.ok(!read('docs-production.yml').includes(FLAG));
});

test('the staging deploy sets the flag on its build step, for every branch', () => {
  const build = steps(job(read('docs-staging.yml'), 'preview'))
    .find(step => step.includes('name: Build docs (for staging preview)'));

  assert.ok(build, 'docs-staging.yml has no "Build docs (for staging preview)" step.');
  // A plain 'true', not an expression: a pull request preview that lost the key would differ from the
  // develop seed on every example page.
  assert.match(build, new RegExp(`^ {10}${FLAG}: 'true'$`, 'm'));
});
