#!/usr/bin/env node
/**
 * Pre-push gate (invoked by lefthook). The local, fast mirror of the CI
 * enforcement: a change must carry a test, and any changed Playwright spec is
 * run so a new test is proven before it is pushed. Bypassable with
 * `git push --no-verify` — CI is the real guarantee.
 *
 * Scoped to stay fast: it runs the presence gate (no build) and only the
 * Playwright specs the push touches. The full unit/E2E suites are CI's job.
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

/**
 * Resolve the base ref to diff against — the merge-base with the trunk.
 *
 * @returns {string} A ref/SHA usable in `git diff <base>...HEAD`.
 */
function resolveBase() {
  for (const ref of ['origin/develop', 'develop']) {
    try {
      return execSync(`git merge-base ${ref} HEAD`, { encoding: 'utf8' }).trim();
    } catch {
      // try the next candidate
    }
  }

  return 'develop';
}

/**
 * Map the pushed diff to the Playwright specs that must run.
 * Pure so it can be unit-tested; returns paths relative to `tests/`.
 *
 * @param {string[]} changed Repo-relative changed paths.
 * @returns {string[]} Spec paths relative to the `tests/` package.
 */
export function changedPlaywrightSpecs(changed) {
  return changed
    .filter(f => /^tests\/e2e\/.+\.spec\.ts$/.test(f))
    .map(f => f.replace(/^tests\//, ''));
}

// Exit early when imported by a test.
if (import.meta.url === `file://${process.argv[1]}`) {
  const base = resolveBase();

  // 1) Presence gate (block mode).
  const gate = spawnSync('node', ['.github/scripts/test-presence-gate.mjs'], {
    stdio: 'inherit',
    env: { ...process.env, GATE_MODE: 'block', GATE_BASE: base },
  });

  if (gate.status !== 0) {
    process.exit(gate.status ?? 1);
  }

  // 2) Run any Playwright spec the push changed, so a new test is proven.
  const changed = execSync(`git diff --name-only ${base}...HEAD`, { encoding: 'utf8' })
    .split('\n').filter(Boolean);
  const specs = changedPlaywrightSpecs(changed).filter(s => existsSync(`tests/${s}`));

  if (specs.length > 0) {
    console.log(`pre-push: running ${specs.length} changed Playwright spec(s)…`);
    const pw = spawnSync('npx', ['playwright', 'test', '--project=e2e-chromium', ...specs], {
      cwd: 'tests',
      stdio: 'inherit',
    });

    if (pw.status !== 0) {
      process.exit(pw.status ?? 1);
    }
  }

  console.log('pre-push: ok');
}
