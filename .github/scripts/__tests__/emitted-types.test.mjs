import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// Emitted Types is on CI Gate's `needs` list. GitHub reports a job timeout as
// `cancelled`, and the gate treats that as a failure, so a 15-minute budget
// that attw regularly exceeded blocked otherwise-green PRs (#13373, #13375).
// The workflow comments record the three constraints this file pins: the
// timeout floor, a single cached install instead of three `npx -y` downloads,
// and attw limited to the typed public roots. A revert of any of those puts
// the race back.

const WORKFLOW = readFileSync(
  path.join(repoRoot(), '.github/workflows/emitted-types.yml'),
  'utf8'
);

test('the Emitted Types job budget is at least 30 minutes', () => {
  const timeout = Number(/timeout-minutes:\s*(\d+)/.exec(WORKFLOW)?.[1]);

  assert.ok(
    timeout >= 30,
    `timeout-minutes (${timeout}) must be >= 30 — 15 minutes cancelled on a cold npx + full-export attw`
  );
});

test('type-check tools are installed once, not via three cold npx -y calls', () => {
  const withoutComments = WORKFLOW.replace(/#[^\n]*/g, '');

  assert.match(
    WORKFLOW,
    /name: Install type-check tools/,
    'expected a single Install type-check tools step'
  );
  assert.match(
    WORKFLOW,
    /actions\/cache@/,
    'expected an npm cache so the install is not a cold download every run'
  );
  assert.equal(
    (withoutComments.match(/npx\s+-y/g) || []).length,
    0,
    'do not bring back per-step `npx -y` — each one is an uncached registry fetch'
  );
});

test('attw checks the typed public roots, not every exports path', () => {
  assert.match(
    WORKFLOW,
    /--entrypoints\s+\.\s+base\s+registry\s+settings/,
    'attw must pass --entrypoints . base registry settings'
  );
  assert.doesNotMatch(
    WORKFLOW,
    /npx\s+-y\s+@arethetypeswrong\/cli/,
    'do not invoke attw through npx -y'
  );
});
