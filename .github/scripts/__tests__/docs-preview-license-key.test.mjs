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
//   1. only the staging deploy and the local-build visual dispatch set the flag (no other workflow
//      and no composite action), and the production image build never does;
//   2. the staging deploy sets it on the build step itself, so the pull request previews and the
//      develop deploys the visual seed photographs carry the same key;
//   3. the local-build visual dispatch leaves it off on a release branch, whose baseline RC staging
//      renders without the key.

const FLAG = 'DOCS_TEST_LICENSE_KEY';
const root = repoRoot();
const WORKFLOWS = path.join(root, '.github', 'workflows');
const read = file => readFileSync(path.join(WORKFLOWS, file), 'utf8');
// The flag as a YAML key: a comment or a script that names it does not set it.
const SETS_FLAG = new RegExp(`^\\s*${FLAG}:`, 'm');

test('the setter match reads a YAML key, not a mention', () => {
  assert.ok(SETS_FLAG.test(`        env:\n          ${FLAG}: 'true'`));
  assert.ok(!SETS_FLAG.test(`# Never set ${FLAG} here.`));
});

test('only the docs staging deploy and the local-build visual dispatch set the flag', () => {
  const yamlFiles = ['workflows', 'actions']
    .flatMap(dir => readdirSync(path.join(root, '.github', dir), { recursive: true })
      .filter(file => /\.ya?ml$/.test(file))
      .map(file => path.posix.join(dir, file.split(path.sep).join('/'))));
  const setters = yamlFiles
    .filter(file => SETS_FLAG.test(readFileSync(path.join(root, '.github', file), 'utf8')))
    .sort();

  assert.ok(yamlFiles.some(file => file.startsWith('actions/')), 'The scan found no composite action.');
  assert.deepEqual(setters, ['workflows/docs-staging.yml', 'workflows/docs-visual-tests.yml']);
});

test('the production docs image never gets the key', () => {
  const docsPackage = JSON.parse(readFileSync(path.join(root, 'docs', 'package.json'), 'utf8'));

  assert.match(docsPackage.scripts['docs:docker:build:production'], /BUILD_MODE=production/);
  assert.ok(!docsPackage.scripts['docs:docker:build:production'].includes(`${FLAG}=`));
  assert.ok(!SETS_FLAG.test(read('docs-production.yml')));
});

test('the staging deploy sets the flag on its build step, for every branch', () => {
  const build = steps(job(read('docs-staging.yml'), 'preview'))
    .find(step => step.includes('name: Build docs (for staging preview)'));

  assert.ok(build, 'docs-staging.yml has no "Build docs (for staging preview)" step.');
  // A plain 'true', not an expression: a pull request preview that lost the key would differ from the
  // develop seed on every example page.
  assert.match(build, new RegExp(`^ {10}${FLAG}: 'true'$`, 'm'));
});

test('the local-build visual dispatch leaves the key off on a release branch', () => {
  const build = steps(job(read('docs-visual-tests.yml'), 'run-tests'))
    .find(step => step.includes('name: Build documentation'));

  assert.ok(build, 'docs-visual-tests.yml has no "Build documentation" step in its `run-tests` job.');
  assert.match(build, new RegExp(`^ {10}${FLAG}: \\$\\{\\{ !startsWith\\(github\\.ref_name, 'release/'\\) && 'true' \\|\\| '' \\}\\}$`, 'm'));
});
