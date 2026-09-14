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

test('the weekday schedule is landed disabled, pending rollout step 1, with manual dispatch live and defaulting to dry run', () => {
  // Commented out, not removed: the cron expression stays reviewable and a
  // follow-up pull request re-enables it by uncommenting these two lines.
  assert.match(source, /^\s*#\s*schedule:\n\s*#\s*- cron: '0 6 \* \* 1-5'/m);
  assert.match(source, /^\s*workflow_dispatch:\s*$/m);
  assert.match(source, /dry_run:[\s\S]*?type: boolean[\s\S]*?default: true/);
  assert.match(
    source,
    /DRY_RUN: \$\{\{ github\.event_name == 'workflow_dispatch' && inputs\.dry_run \|\| 'false' \}\}/,
  );
});

test('is named distinctly from the examples sync and the production deploy', () => {
  // "Docs Sync" read as a sibling of "Docs Examples Sync" despite doing an
  // unrelated job; the verb-first name says what this one does and where, and
  // sets it apart from "Docs Production Deployment", which actually deploys.
  assert.match(source, /^name: Sync Docs Content to Production$/m);
});

test('uses the release GitHub App token and never GITHUB_TOKEN', () => {
  assert.match(source, /actions\/create-github-app-token@/);
  assert.match(source, /client-id: \$\{\{ secrets\.RELEASE_APP_CLIENT_ID \}\}/);
  assert.match(source, /private-key: \$\{\{ secrets\.RELEASE_APP_PRIVATE_KEY \}\}/);
  assert.doesNotMatch(source, /secrets\.GITHUB_TOKEN/);
  assert.doesNotMatch(source, /github\.token/);
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
  assert.match(source, /DOCS_SYNC_TEMPERATURE: \$\{\{ vars\.DOCS_SYNC_TEMPERATURE \}\}/);
  assert.match(source, /DOCS_SYNC_JSON_MODE: \$\{\{ vars\.DOCS_SYNC_JSON_MODE \}\}/);
  assert.match(source, /DOCS_SYNC_REVIEWERS: \$\{\{ vars\.DOCS_SYNC_REVIEWERS \}\}/);
  assert.match(source, /run: node \.github\/scripts\/docs-sync\.mjs/);
});
