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
 *   GATE_PR_BODY_FILE  Path to a file holding the LIVE PR body (the `presence`
 *               job in checks.yml writes it from the API). Feeds the one
 *               body-dependent advisory warning; absent or unreadable, that
 *               check is skipped silently. GATE_PR_BODY carries the body
 *               inline when no file is given.
 *
 * The verdict is printed as GitHub-flavored Markdown so a workflow step can post
 * it as a sticky PR comment. Below the verdict the CLI prints ADVISORY warnings
 * (lib/presence-warnings.mjs): frozen-suite growth, the empty red-spec field,
 * RTL correlation, Walkontable routing. They never touch the exit code, in
 * either mode. In GitHub Actions each is also emitted as a `::warning`
 * annotation — on stderr, so the Markdown piped to the step summary stays clean.
 */
import { execSync, execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { evaluate, classify } from './lib/presence-gate.mjs';
import { collectWarnings, renderWarnings } from './lib/presence-warnings.mjs';

const base = process.env.GATE_BASE;
const mode = process.env.GATE_MODE === 'block' ? 'block' : 'warn';

if (!base) {
  console.log('presence-gate: no GATE_BASE (branch push) — skipped.');
  process.exit(0);
}

/**
 * Parse `git diff --name-status` into `{ status, oldPath, path }` entries.
 *
 * @param {string} range The diff range, e.g. `<base>...HEAD`.
 * @returns {{status: string, oldPath: string, path: string}[]} Parsed diff entries.
 */
function readChanges(range) {
  const out = execSync(`git diff --name-status ${range}`, { encoding: 'utf8' });
  return out.split('\n').filter(Boolean).map((line) => {
    const [status, ...rest] = line.split('\t');
    // For renames (Rxxx) git prints old\tnew — take the new path, keep the old
    // one so a pathspec-limited diff still sees the rename.
    return { status: status[0], oldPath: rest[0], path: rest[rest.length - 1] };
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

/**
 * Read the unified diff of the source and test files in the change set — the
 * only files the advisory detectors look at. Limiting the pathspec keeps a
 * lockfile or a docs rewrite out of the buffer; `--unified=0` keeps it to the
 * changed lines. Both sides of a rename go into the pathspec so git can still
 * pair them.
 *
 * @param {string} range The diff range, e.g. `<base>...HEAD`.
 * @param {{status: string, oldPath: string, path: string}[]} changes Parsed diff entries.
 * @returns {string} The unified diff, empty when nothing relevant changed.
 */
function readDiff(range, changes) {
  const paths = new Set();

  for (const change of changes) {
    if (change.status !== 'D' && classify(change.path) !== 'neither') {
      paths.add(change.path);
      paths.add(change.oldPath);
    }
  }

  if (paths.size === 0) {
    return '';
  }

  return execFileSync('git', ['diff', '--unified=0', '--no-color', range, '--', ...paths], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

/**
 * Read the live PR body handed in by CI, if any.
 *
 * @returns {string|undefined} The body, or undefined when none is available.
 */
function readPrBody() {
  const file = process.env.GATE_PR_BODY_FILE;

  if (file) {
    try {
      return readFileSync(file, 'utf8');
    } catch {
      // The API step was skipped or failed: the body-dependent check is skipped.
      return undefined;
    }
  }

  return process.env.GATE_PR_BODY || undefined;
}

/**
 * Format one warning as a GitHub Actions annotation command. Workflow commands
 * take a single line, with `%`, CR, and LF percent-encoded.
 *
 * @param {{type: string, message: string}} warning The warning.
 * @returns {string} The `::warning` line.
 */
function annotation(warning) {
  const text = warning.message
    .replace(/[`*]/g, '')
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A');

  return `::warning title=Test-presence gate (${warning.type})::${text}`;
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

// Advisory warnings: never the exit code, in either mode. A failure while
// gathering them (an unreadable body file, a diff that will not fit the
// buffer) is silence plus a one-line note — the gate must never false-block.
try {
  const warnings = collectWarnings({
    changes,
    diff: readDiff(`${base}...HEAD`, changes),
    prBody: readPrBody(),
  });
  const rendered = renderWarnings(warnings);

  if (rendered.length > 0) {
    console.log(['', ...rendered].join('\n'));
  }

  if (process.env.GITHUB_ACTIONS === 'true') {
    for (const warning of warnings) {
      console.error(annotation(warning));
    }
  }
} catch (error) {
  console.log(`\n_Advisory warnings skipped: ${String(error.message).split('\n')[0]}_`);
}

if (!result.pass && mode === 'block') {
  process.exitCode = 1;
}
