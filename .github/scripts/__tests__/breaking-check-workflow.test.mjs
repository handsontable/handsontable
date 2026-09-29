import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The workflow's safety properties are shapes in YAML no unit test of the
// script can see: it must stay advisory (standalone, never a CI Gate input),
// its API-writing step must carry the fork/Dependabot guard, and the actions
// must stay pinned. Modeled on docs-sync-workflow.test.mjs.
const workflowsDir = path.join(repoRoot(), '.github/workflows');
const source = readFileSync(path.join(workflowsDir, 'breaking-check.yml'), 'utf8');

/**
 * The text of the step whose `name:` is `name`, up to the next step.
 */
function stepText(name) {
  const start = source.indexOf(`- name: ${name}\n`);

  assert.notEqual(start, -1, `step not found: ${name}`);

  const next = source.indexOf('\n      - ', start + 1);

  return source.slice(start, next === -1 ? undefined : next);
}

test('triggers on pull requests touching shippable source or the check itself', () => {
  assert.match(source, /on:\n {2}pull_request:\n {4}types: \[opened, synchronize, reopened, ready_for_review\]/);

  for (const glob of [
    'handsontable/src/**',
    'wrappers/**',
    '.github/scripts/breaking-check.mjs',
    '.github/scripts/lib/breaking-check/**',
    '.github/scripts/lib/docs-sync/github.mjs',
    '.github/scripts/lib/changelog-gate.mjs',
    '.github/scripts/lib/presence-gate.mjs',
    '.github/scripts/lib/strip-html-comments.mjs',
    '.github/scripts/lib/repo-root.mjs',
    '.github/workflows/breaking-check.yml',
  ]) {
    assert.ok(source.includes(`- '${glob}'`), `missing path filter ${glob}`);
  }
});

test('declares least-privilege permissions and a per-PR cancelling concurrency group', () => {
  assert.match(source, /^permissions:\n {2}contents: read\n {2}pull-requests: write$/m);
  assert.match(source, /concurrency:\n {2}group: breaking-check-\$\{\{ github\.event\.pull_request\.number \}\}\n {2}cancel-in-progress: true/);
});

test('checks out two commits and installs no dependencies', () => {
  assert.match(source, /fetch-depth: 2\n\s+persist-credentials: false/);
  assert.match(source, /node-version-file: '\.nvmrc'/);
  assert.doesNotMatch(source, /pnpm|npm ci|npm install/);
});

test('pins every action to a commit SHA', () => {
  const uses = source.match(/uses: \S+/g) ?? [];

  assert.equal(uses.length, 2);

  for (const line of uses) {
    assert.match(line, /uses: [\w./-]+@[0-9a-f]{40}$/, line);
  }
});

test('both steps are continue-on-error so the check never fails a run', () => {
  assert.match(stepText('Detect'), /continue-on-error: true/);
  assert.match(stepText('Comment'), /continue-on-error: true/);
});

test('Detect diffs the merge commit against its first parent and stays unguarded', () => {
  const detect = stepText('Detect');

  assert.match(detect, /--merge-parent/);
  assert.doesNotMatch(detect, /\n\s+if:/);
  assert.match(detect, /LITELLM_BASE_URL: \$\{\{ secrets\.LITELLM_BASE_URL \}\}/);
  assert.match(detect, /LITELLM_API_KEY: \$\{\{ secrets\.LITELLM_API_KEY \}\}/);
});

test('Comment carries the canonical fork and Dependabot guard, character for character', () => {
  const comment = stepText('Comment');

  assert.ok(
    comment.includes(
      "        if: github.event_name != 'pull_request'\n"
      + '          || (github.event.pull_request.head.repo.full_name == github.repository\n'
      + "              && github.actor != 'dependabot[bot]')\n",
    ),
    'the guard text drifted from .ai/CI.md',
  );
  assert.match(comment, /GH_TOKEN: \$\{\{ github\.token \}\}/);
  // The number reaches the shell through env, never interpolated into the script text.
  assert.match(comment, /PR_NUMBER: \$\{\{ github\.event\.pull_request\.number \}\}/);
  assert.match(comment, /--comment "\$PR_NUMBER"/);
  assert.doesNotMatch(comment, /run:[\s\S]*\$\{\{/);
});

test('no other workflow references the check, so it cannot become a CI Gate input', () => {
  for (const file of readdirSync(workflowsDir).filter((f) => /\.ya?ml$/.test(f) && f !== 'breaking-check.yml')) {
    assert.doesNotMatch(
      readFileSync(path.join(workflowsDir, file), 'utf8'),
      /breaking-check/,
      `${file} references breaking-check; the check must stay advisory and standalone`,
    );
  }
});

test('paths cover every module the entry point imports, transitively', () => {
  const scripts = path.join(repoRoot(), '.github/scripts');
  const seen = new Set();
  const walk = (file) => {
    if (seen.has(file)) {
      return;
    }
    seen.add(file);

    for (const match of readFileSync(file, 'utf8').matchAll(/from\s+'(\.[^']+)'/g)) {
      walk(path.resolve(path.dirname(file), match[1]));
    }
  };

  walk(path.join(scripts, 'breaking-check.mjs'));

  for (const file of seen) {
    const rel = path.relative(repoRoot(), file).split(path.sep).join('/');
    const covered = rel.startsWith('.github/scripts/lib/breaking-check/')
      ? source.includes("'.github/scripts/lib/breaking-check/**'")
      : source.includes(`'${rel}'`);

    assert.ok(covered, `${rel} is imported by the check but missing from the workflow paths`);
  }
});
