import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { job, steps } from '../lib/workflow-text.mjs';

/**
 * The docs search (Algolia DocSearch) renders in production builds and in builds with
 * `DOCS_SEARCH=true`. The staging deploy sets the flag on its build step, so the pull request
 * preview, which the `functional` job in `docs.yml` tests, has the search, and the search specs in
 * `docs/tests/docsPopupKeyboard.spec.ts` run instead of skipping. Develop staging, which the visual
 * seed photographs, comes from the same step, so a preview and the baseline render the same header.
 * This file pins both halves: the workflows set the flag, and the docs config and header read it.
 */

const FLAG = 'DOCS_SEARCH';
const root = repoRoot();
const read = file => readFileSync(path.join(root, file), 'utf8');

/**
 * Finds one named step of a workflow job.
 *
 * @param {string} workflow The workflow path from the repository root.
 * @param {string} jobId The job id.
 * @param {string} name The step name.
 * @returns {string} The step text.
 */
function step(workflow, jobId, name) {
  const found = steps(job(read(workflow), jobId)).find(text => text.includes(`name: ${name}`));

  assert.ok(found, `${workflow} has no "${name}" step in its \`${jobId}\` job.`);

  return found;
}

test('the staging deploy sets the flag on its build step, for every branch', () => {
  const build = step('.github/workflows/docs-staging.yml', 'preview', 'Build docs (for staging preview)');

  assert.match(build, new RegExp(`^ {10}${FLAG}: 'true'$`, 'm'));
});

test('the local-build visual dispatch sets the flag, as every baseline has the search', () => {
  const build = step('.github/workflows/docs-visual-tests.yml', 'run-tests', 'Build documentation');

  assert.match(build, new RegExp(`^ {10}${FLAG}: 'true'$`, 'm'));
});

test('the docs config adds the search plugin when production mode or the flag is on', () => {
  const config = read('docs/astro.config.mjs');

  assert.match(config, /^const searchEnabled = isProduction \|\| process\.env\.DOCS_SEARCH === 'true';$/m);
  assert.match(config, /\.\.\.\(searchEnabled\s*\?\s*\[\s*starlightDocSearch\(/);
  assert.match(config, /'import\.meta\.env\.PUBLIC_DOCS_SEARCH': JSON\.stringify\(searchEnabled \? 'true' : ''\)/);
});

test('the header renders the search from the same flag', () => {
  const header = read('docs/src/components/Header.astro');

  assert.match(header, /^const shouldRenderSearch = import\.meta\.env\.PUBLIC_DOCS_SEARCH === 'true';$/m);
});
