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

test('the weekday schedule is live at 05:00 UTC, with manual dispatch defaulting to a dry run', () => {
  // Enabled (not commented): the daily run is the rollout's live trigger.
  assert.match(source, /^\s*schedule:\n\s*- cron: '0 5 \* \* 1-5'/m);
  assert.doesNotMatch(source, /#\s*- cron:/);
  assert.match(source, /^\s*workflow_dispatch:\s*$/m);
  assert.match(source, /dry_run:[\s\S]*?type: boolean[\s\S]*?default: true/);
  // A scheduled run is never a dry run; a manual dispatch defaults to one.
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

test('uses the built-in GITHUB_TOKEN, not a GitHub App', () => {
  // Same approach as handsontable/examples: GITHUB_TOKEN with the scopes granted
  // per-workflow, so there is no App to install or keep permissioned.
  assert.doesNotMatch(source, /create-github-app-token/);
  assert.doesNotMatch(source, /RELEASE_APP/);
  // Both sites -- the push remote and the Sync step -- must carry it; a positive
  // match on one would stay green if the other were dropped.
  assert.equal((source.match(/GH_TOKEN: \$\{\{ github\.token \}\}/g) ?? []).length, 2);
  assert.match(source, /persist-credentials: false/);
});

test('grants the write scopes the token needs, including issues for labels', () => {
  // `issues: write` is load-bearing -- labels are the Issues API, and the run
  // creates the `docs-sync` labels and applies one to its pull request.
  assert.match(source, /^permissions:\n\s+contents: write\n\s+pull-requests: write\n\s+issues: write$/m);
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
