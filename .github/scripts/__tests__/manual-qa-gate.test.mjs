import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The manual-QA gate spans four files that must agree, and two of the ways they
// can disagree are invisible until a real PR exercises them:
//
//   1. the tickbox regex lives in BOTH checks.yml (which routes the gate) and
//      pr-manual-qa-label.yml (label + arm). If one drifts, a ticked PR gets a
//      label with no gate, or a gate with no label;
//   2. the PR template carries the line the regex matches, so rewording the
//      template silently disables the gate for every new PR;
//   3. the label workflow MUTATES labels on a pull request, which GitHub bills
//      to `pull-requests: write` — with only `issues: write` the add succeeds
//      and the REMOVE 403s (observed on PR #13179), so unticking the box left
//      a red "Requires Manual QA" label behind.
//
// Text-based, like fork-guards.test.mjs: no YAML parser is a dependency of the
// repo root, and these are shape assertions, not behavior.

const root = repoRoot();
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');

// The one true tickbox pattern, as written in the workflows.
const REGEX_LITERAL = String.raw`/^\s*-\s*\[[xX]\]\s+This change needs a manual QA pass/m`;
// The template line's wording is the regex's contract.
const TEMPLATE_LINE = 'This change needs a manual QA pass';

test('the tickbox regex is identical everywhere it is duplicated', () => {
  for (const file of ['.github/workflows/checks.yml', '.github/workflows/pr-manual-qa-label.yml']) {
    assert.ok(
      read(file).includes(REGEX_LITERAL),
      `${file} does not carry the canonical tickbox regex — the routing, the label and the `
        + 'arm check would disagree about whether manual QA was requested'
    );
  }
});

test('the PR template carries the line the regex matches, and only unticked', () => {
  const template = read('.github/PULL_REQUEST_TEMPLATE.md');
  const line = template.split('\n').find((candidate) => candidate.includes(TEMPLATE_LINE));

  assert.ok(line, 'the PR template no longer offers the manual-QA tickbox');

  // Rebuild the regex from its literal so the test cannot drift from the source.
  const [, pattern, flags] = REGEX_LITERAL.match(/^\/(.*)\/([a-z]*)$/);
  const ticked = new RegExp(pattern, flags);

  assert.ok(!ticked.test(line), 'the template ships the manual-QA box pre-ticked');
  assert.ok(
    ticked.test(line.replace('- [ ]', '- [x]')),
    'ticking the template line does not match the regex — the wording and the pattern have drifted'
  );
});

test('the label workflow can both add and REMOVE the label', () => {
  const workflow = read('.github/workflows/pr-manual-qa-label.yml');
  const permissions = workflow.slice(workflow.indexOf('\npermissions:'), workflow.indexOf('\nconcurrency:'));

  // Adding a label to a PR is accepted with `issues: write` alone; removing one
  // is not. Without this, unticking the box fails with a 403 and the PR keeps a
  // red label that no longer reflects its state.
  assert.match(
    permissions,
    /pull-requests: write/,
    'pr-manual-qa-label.yml needs `pull-requests: write` — label REMOVAL 403s without it'
  );
  assert.match(permissions, /issues: write/, 'pr-manual-qa-label.yml needs `issues: write` to label at all');
  // The arm job re-runs the Tests workflow.
  assert.match(permissions, /actions: write/, 'pr-manual-qa-label.yml needs `actions: write` to re-run Tests');
});

test('the gate module asserts an approval instead of trusting the environment', () => {
  const workflow = read('.github/workflows/manual-qa.yml');

  // A missing or drifted `manual-qa` environment is auto-created UNPROTECTED and
  // the job then runs straight through, so reaching the step proves nothing.
  assert.match(
    workflow,
    /actions\/runs\/\{run_id\}\/approvals/,
    'manual-qa.yml no longer reads the run approvals — the gate would fail OPEN on environment drift'
  );
  assert.match(
    workflow,
    /core\.setFailed/,
    'manual-qa.yml no longer fails closed when no approval is recorded'
  );
});
