import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The workflow's safety properties are shapes in YAML that no unit test of the
// script can see: the token it uses, the permissions it declares, and that a
// manual dispatch defaults to a dry run. This pins them the way
// fork-guards.test.mjs pins the guard expressions.
const source = readFileSync(path.join(repoRoot(), '.github/workflows/docs-sync.yml'), 'utf8');

test('runs on a weekday schedule and on manual dispatch that defaults to dry run', () => {
  assert.match(source, /schedule:\n\s+- cron: '0 6 \* \* 1-5'/);
  assert.match(source, /workflow_dispatch:/);
  assert.match(source, /dry_run:[\s\S]*?type: boolean[\s\S]*?default: true/);
});

test('uses the release GitHub App token and never GITHUB_TOKEN', () => {
  assert.match(source, /actions\/create-github-app-token@/);
  assert.match(source, /client-id: \$\{\{ secrets\.RELEASE_APP_CLIENT_ID \}\}/);
  assert.match(source, /private-key: \$\{\{ secrets\.RELEASE_APP_PRIVATE_KEY \}\}/);
  assert.doesNotMatch(source, /secrets\.GITHUB_TOKEN/);
  assert.match(source, /GH_TOKEN: \$\{\{ steps\.app-token\.outputs\.token \}\}/);
  assert.match(source, /persist-credentials: false/);
});

test('declares no default permissions and one concurrency group', () => {
  assert.match(source, /^permissions: \{\}$/m);
  assert.match(source, /concurrency:\n\s+group: docs-sync\n\s+cancel-in-progress: false/);
});

test('passes the LiteLLM secrets and the model variable to the script', () => {
  assert.match(source, /LITELLM_BASE_URL: \$\{\{ secrets\.LITELLM_BASE_URL \}\}/);
  assert.match(source, /LITELLM_API_KEY: \$\{\{ secrets\.LITELLM_API_KEY \}\}/);
  assert.match(source, /DOCS_SYNC_MODEL: \$\{\{ vars\.DOCS_SYNC_MODEL \}\}/);
  assert.match(source, /run: node \.github\/scripts\/docs-sync\.mjs/);
});
