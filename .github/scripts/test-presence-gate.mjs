#!/usr/bin/env node
/**
 * Presence gate CLI.
 *
 * Runs the pure evaluator (lib/presence-gate.mjs) against the current PR diff.
 * Derives the base ref from the PR event when available, skips cleanly on
 * branch pushes, and exits non-zero only in block mode.
 *
 * Env:
 *   GATE_MODE   'warn' (default) exits 0 always; 'block' exits 1 on failure.
 *   GATE_BASE   Base ref/SHA to diff against. In CI, pass
 *               github.event.pull_request.base.sha. When unset, the gate is a
 *               branch push and is skipped.
 *
 * The verdict is printed as GitHub-flavored Markdown so a workflow step can post
 * it as a sticky PR comment.
 */
import { execSync } from 'node:child_process';
import { evaluate } from './lib/presence-gate.mjs';

const base = process.env.GATE_BASE;
const mode = process.env.GATE_MODE === 'block' ? 'block' : 'warn';

if (!base) {
  console.log('presence-gate: no GATE_BASE (branch push) — skipped.');
  process.exit(0);
}

/**
 * Parse `git diff --name-status` into `{ status, path }` entries.
 *
 * @param {string} range The diff range, e.g. `<base>...HEAD`.
 * @returns {{status: string, path: string}[]} Parsed diff entries.
 */
function readChanges(range) {
  const out = execSync(`git diff --name-status ${range}`, { encoding: 'utf8' });
  return out.split('\n').filter(Boolean).map((line) => {
    const [status, ...rest] = line.split('\t');
    // For renames (Rxxx) git prints old\tnew — take the new path.
    return { status: status[0], path: rest[rest.length - 1] };
  });
}

/**
 * Read `Refactor-only:` trailers from the commits in the range.
 *
 * @param {string} range The commit range, e.g. `<base>..HEAD`.
 * @returns {string[]} Trailer lines.
 */
function readTrailers(range) {
  const out = execSync(`git log ${range} --format=%B`, { encoding: 'utf8' });
  return out.split('\n').filter(l => /^Refactor-only:/i.test(l.trim()));
}

const changes = readChanges(`${base}...HEAD`);
const trailers = readTrailers(`${base}..HEAD`);
const result = evaluate(changes, trailers);

const lines = ['## Test-presence gate', ''];
if (result.pass) {
  if (result.reason === 'refactor-declared') {
    lines.push('✅ Pass — source changed with no test, but a `Refactor-only:` trailer declares this a refactor. Existing tests for the area must stay green.');
  } else {
    lines.push('✅ Pass.');
  }
} else if (result.reason === 'new-jasmine-spec') {
  lines.push('❌ A **new Jasmine `*.spec.js`** was added. The Jasmine suite is frozen — new E2E goes in `tests/e2e/` as Playwright (`*.spec.ts`). Editing an existing Jasmine spec is fine.', '');
  lines.push('New Jasmine files:');
  lines.push(...result.newJasmine.map(f => `- \`${f}\``));
} else if (result.reason === 'missing-coverage') {
  lines.push('❌ Source changed with no matching test change. Add a Playwright `*.spec.ts` (`tests/e2e/`), a Jest `*.unit.js`, or a `*.types.ts` — or add a `Refactor-only: <reason>` commit trailer if this is a pure refactor.', '');
  lines.push('Source files needing a test:');
  lines.push(...result.sourceFiles.map(f => `- \`${f}\``));
}

console.log(lines.join('\n'));

if (!result.pass && mode === 'block') {
  process.exitCode = 1;
}
