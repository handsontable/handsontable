import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The manual-QA gate spans three files that must agree, and both ways they can
// disagree are invisible until a real PR exercises them:
//
//   1. the PR template carries the line the Checks router's regex matches, so
//      rewording either side silently disables the gate for every new PR — and
//      nothing goes red, the module is simply never routed;
//   2. the gate module must keep asserting a recorded approval: a missing or
//      drifted `manual-qa` environment is auto-created UNPROTECTED, and the
//      job would then run straight through;
//
// Text-based, like fork-guards.test.mjs: no YAML parser is a dependency of the
// repo root, and these are shape assertions, not behavior.

const root = repoRoot();
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');

// The one true tickbox pattern, as written in the workflows.
const REGEX_LITERAL = String.raw`/^\s*-\s*\[[xX]\]\s+MANUAL QA NEEDED/m`;
// The template line's wording is the regex's contract.
const TEMPLATE_LINE = 'MANUAL QA NEEDED';

test('the router carries the canonical tickbox regex', () => {
  assert.ok(
    read('.github/workflows/checks.yml').includes(REGEX_LITERAL),
    'checks.yml does not carry the canonical tickbox regex, so the router and the PR template '
      + 'disagree about whether manual QA was requested'
  );
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
