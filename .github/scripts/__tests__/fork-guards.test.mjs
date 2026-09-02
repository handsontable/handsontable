import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// Fork PRs and Dependabot PRs both run on a read-only GITHUB_TOKEN with no
// Actions secrets. A step that comments, pushes to a ref, or hard-depends on a
// secret must be guarded or it 403s and fails `CI Gate`, which passes only on
// `success|skipped` -- making every external contribution unmergeable (DEV-2592).
//
// This asserts the SHAPE of that guard, not the behavior, because the behavior is
// only observable on a real fork run and so cannot be reached from CI on an
// internal branch. It exists because the guard is duplicated across seven sites
// in five files: the failure mode is a future edit adding a fork-hostile step, or
// copying a half-guard, and noticing only when an external contributor is blocked.
// It plays the same role for these sites that `esTarget.unit.js` plays for the
// three-place ES floor.

const root = repoRoot();
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');

/**
 * Extract the folded `if:` expression that follows a named job or step.
 *
 * Text-based, not YAML-parsed: no YAML parser is a dependency of the repo root,
 * and adding one to assert a comment-adjacent shape is not worth it.
 */
function guardAfter(source, anchor) {
  const lines = source.split('\n');
  const at = lines.findIndex((l) => l.includes(anchor));

  assert.notEqual(at, -1, `anchor not found: ${anchor}`);

  // Scan forward for the `if:` belonging to this block, then fold its
  // continuation lines. Stop at the next `- name:` so we never read a sibling's
  // condition and report a pass that belongs to a different step.
  let expression = null;

  for (let i = at + 1; i < Math.min(at + 25, lines.length); i += 1) {
    const line = lines[i];

    if (expression === null) {
      if (/^\s*-\s+name:/.test(line)) break;

      const m = line.match(/^\s*if:\s*(.*)$/);

      if (m) expression = m[1];
      continue;
    }

    // Continuation lines of a folded plain scalar: more indented, and not a key.
    if (/^\s*(&&|\|\||\()/.test(line)) {
      expression += ` ${line.trim()}`;
      continue;
    }
    break;
  }

  return expression;
}

// file -> anchor for every step or job that must carry the guard.
const GUARDED_SITES = [
  ['.github/actions/performance-run/action.yml', 'name: Deploy PR report to GitHub Pages'],
  ['.github/actions/performance-run/action.yml', 'name: Post performance summary to pull request'],
  ['.github/actions/performance-run/action.yml', 'name: Compute report URL'],
  ['.github/workflows/performance-tests.yml', 'name: Deploy PR report to GitHub Pages'],
  ['.github/workflows/performance-tests.yml', 'name: Post performance summary to pull request'],
  ['.github/workflows/performance-tests.yml', 'name: Compute report URL'],
  ['.github/workflows/integration.yml', 'name: Post PR preview comment'],
  ['.github/workflows/code-quality.yml', '  sonarcloud:'],
  ['.github/workflows/code-quality.yml', '  fossa:'],
  ['.github/workflows/docs.yml', '  preview:'],
  ['.github/workflows/pr-manual-qa-label.yml', '  sync:'],
];

test('every fork-hostile site carries both halves of the canonical guard', () => {
  for (const [file, anchor] of GUARDED_SITES) {
    const expression = guardAfter(read(file), anchor);

    assert.ok(expression, `${file} (${anchor}): no if: condition found`);

    assert.match(
      expression,
      /github\.event\.pull_request\.head\.repo\.full_name == github\.repository/,
      `${file} (${anchor}): missing the same-repo half of the guard`
    );

    // Dependabot PRs are same-repo, so the same-repo comparison alone passes
    // while the token is downgraded exactly like a fork's.
    assert.match(
      expression,
      /github\.actor != 'dependabot\[bot\]'/,
      `${file} (${anchor}): missing the Dependabot half of the guard`
    );

    // Either the `!= 'pull_request'` fallback (so the RC path via publish.yml and
    // the develop push keep working), or an `== 'pull_request'` conjunction on a
    // step that only runs on PRs anyway.
    assert.match(
      expression,
      /github\.event_name (!=|==) 'pull_request'/,
      `${file} (${anchor}): guard has no event check, so it would misfire on a non-PR event`
    );
  }
});

test('the guarded-site list in AGENTS.md names every file that carries a guard', () => {
  const agents = read('AGENTS.md');
  const start = agents.indexOf('Do not guard a step just because it names a secret');

  assert.notEqual(start, -1, 'AGENTS.md has no fork-guard bullet');

  const bullet = agents.slice(start, agents.indexOf('\n- ', start + 1));

  for (const file of new Set(GUARDED_SITES.map(([f]) => path.basename(f)))) {
    assert.ok(
      bullet.includes(file),
      `AGENTS.md's guarded-site list does not mention ${file}; the docs and the workflows have drifted`
    );
  }
});

// Regression lock. @argos-ci/core falls back to tokenless upload on public GitHub
// Actions repos, so this step genuinely works with an empty ARGOS_TOKEN: verified
// on fork PR #13207 (run 32481421878), where it passed and the Argos App reported
// build 5874. It was guarded once, on the false premise that naming a secret
// implies needing one, which silently removed visual review for every external
// contributor. An absent secret is an empty string, not a 403.
test('the Argos upload is NOT fork-guarded (tokenless upload works on forks)', () => {
  const expression = guardAfter(read('.github/workflows/visual.yml'), 'name: Upload the screenshots to Argos CI');

  assert.equal(
    expression,
    null,
    'the Argos upload step has an if: condition. If it is a fork guard, remove it: '
      + 'tokenless upload works on forks and guarding it deletes visual review for external contributors.'
  );
});

test('no workflow uses pull_request_target', () => {
  const dir = path.join(root, '.github/workflows');

  for (const file of readdirSync(dir).filter((f) => f.endsWith('.yml'))) {
    assert.doesNotMatch(
      readFileSync(path.join(dir, file), 'utf8'),
      /pull_request_target/,
      `${file} uses pull_request_target, which runs fork-controlled code with a write token`
    );
  }
});
