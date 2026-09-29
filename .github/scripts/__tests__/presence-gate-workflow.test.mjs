import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The CI half of the presence gate's base. `presence-gate-precision-cli.test.mjs`
// proves the CLI judges only the branch's own changes and commits when it is
// handed the base branch's LIVE tip; this pins that `checks.yml` hands it that.
// The gate reports today and is meant to block (DEV-3066), and a blocking
// diff-scoped gate must never take the event payload's frozen `base.sha`
// (.ai/CI.md): on a stale re-run, every later base commit would read as this
// PR's untested source change. Text-based, like `lint-ratchet-workflow.test.mjs`.

const lines = readFileSync(path.join(repoRoot(), '.github/workflows/checks.yml'), 'utf8').split('\n');
const at = lines.findIndex(line => /-\s+name:\s+Evaluate test-presence gate/.test(line));
const step = [];

for (let i = at + 1; at !== -1 && i < lines.length && !/^\s*-\s+name:/.test(lines[i]); i += 1) {
  step.push(lines[i]);
}

const body = step.join('\n');

test('the presence gate diffs from the live tip of the PR base branch, never the payload base SHA', () => {
  assert.notEqual(at, -1, 'checks.yml has no `Evaluate test-presence gate` step');
  assert.doesNotMatch(body, /\$\{\{[^}]*base\.sha/, 'the gate step reads the payload base SHA');
  assert.match(body, /BASE_REF: \$\{\{ github\.event\.pull_request\.base\.ref \}\}/);
  assert.match(
    body,
    /git fetch [^\n]*origin "\+refs\/heads\/\$\{BASE_REF\}:refs\/remotes\/origin\/\$\{BASE_REF\}"/,
    'the step must refresh the base branch before diffing from it',
  );
  assert.match(body, /GATE_BASE="origin\/\$\{BASE_REF\}" node \.github\/scripts\/test-presence-gate\.mjs/);
});

test('the presence gate blocks in CI', () => {
  // The verdict is the gate; the advisories stay warnings inside the CLI. A
  // revert to warn would turn "tests are required" back into a report that
  // nothing enforces once `--no-verify` skips the pre-push copy.
  assert.match(body, /^\s+GATE_MODE: block\s*$/m, 'the gate step must run with GATE_MODE: block');
  assert.doesNotMatch(lines[at], /\(warn\)/, 'the step name must not call a blocking gate "(warn)"');
});

test('a failed refresh of the base branch is a warning, not a red job', () => {
  assert.match(
    body,
    /git fetch [^\n]*\\\n\s+\|\| echo "::warning::[^\n]*origin\/\$\{BASE_REF\}/,
    'the fetch has no `|| echo "::warning::…"` fallback',
  );
});

test('the presence job checks out full history, so the base branch and the merge-base are local', () => {
  const job = lines.findIndex(line => /^ {2}presence:$/.test(line));
  const end = lines.findIndex((line, i) => i > job && /^ {2}[A-Za-z0-9_-]+:$/.test(line));
  const jobBody = lines.slice(job, end === -1 ? undefined : end).join('\n');

  assert.notEqual(job, -1, 'checks.yml has no `presence` job');
  assert.match(jobBody, /fetch-depth: 0/, 'the presence job needs the full history');
});
