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
 *   GATE_BASE   Base ref/SHA to diff against. In CI, pass the base branch's
 *               LIVE tip (`origin/<base.ref>`, fetched by the step), never the
 *               payload's frozen `base.sha` — see the blocking-gate rule in
 *               .ai/CI.md. Locally, pre-push passes the merge-base with
 *               origin/develop. When unset, the gate is a branch push and is
 *               skipped.
 *   GATE_PR_BODY_FILE  Path to a file holding the LIVE PR body (the `presence`
 *               job in checks.yml writes it from the API). Feeds the one
 *               body-dependent advisory warning; absent or unreadable, that
 *               check is skipped silently. GATE_PR_BODY carries the body
 *               inline when no file is given.
 *
 * The verdict is printed as GitHub-flavored Markdown so a workflow step can post
 * it as a sticky PR comment. Below the verdict the CLI prints ADVISORY warnings
 * (lib/presence-warnings.mjs): frozen-suite growth, the empty red-spec field,
 * RTL correlation, Walkontable routing, visual-only coverage. They never touch
 * the exit code, in either mode. In GitHub Actions each is also emitted as a
 * `::warning` annotation — on stderr, so the Markdown piped to the step summary
 * stays clean. The annotation title, `Test-presence gate (<type>)`, is what the
 * month-later tally of `visual-only-coverage` filters on (the advisory
 * paragraph in .ai/LOCAL-ENFORCEMENT.md), so it is pinned end to end by
 * presence-gate-cli.test.mjs — do not reword it.
 */
import { execSync, execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { evaluate, isCommentOnlyChange, isSource, COVERAGE_HINTS } from './lib/presence-gate.mjs';
import { collectWarnings, renderWarnings, isAdvisoryPath } from './lib/presence-warnings.mjs';

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
 * Read the range's commits with the files each one changed, so a
 * `Refactor-only:` trailer waives only its own commit's files. In CI the
 * checkout is the PR's merge ref, whose merge commit carries no trailer.
 * `git log --name-only` lists no files for a merge commit anyway; --no-merges
 * states that intent instead of relying on the default.
 *
 * @param {string} range The commit range, e.g. `<base>..HEAD`.
 * @returns {{message: string, files: string[]}[]} One entry per commit.
 */
function readCommits(range) {
  const out = execFileSync('git', ['-c', 'core.quotePath=false', 'log', '--no-merges', '--name-only',
    '--format=%x1e%B%x1d', range], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

  return out.split('\x1e').filter(record => record.includes('\x1d')).map((record) => {
    const [message, files] = record.split('\x1d');

    return { message, files: files.split('\n').map(f => f.trim()).filter(Boolean) };
  });
}

/**
 * Run git and return stdout.
 *
 * @param {string[]} args Git arguments.
 * @returns {string} Stdout.
 */
function git(args) {
  return execFileSync('git', ['-c', 'core.quotePath=false', ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/**
 * Parse the hunk headers of a `git diff -U0` into the line numbers it removed
 * (in the old file) and added (in the new one).
 *
 * @param {string} diff The unified diff with zero context.
 * @returns {{removed: number[], added: number[]}} 1-based line numbers.
 */
function changedLines(diff) {
  const removed = [];
  const added = [];

  for (const [, from, fromCount, to, toCount] of diff.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm)) {
    const span = (start, count) => Array.from(
      { length: count === undefined ? 1 : Number(count) },
      (_, k) => Number(start) + k,
    );

    removed.push(...span(from, fromCount));
    added.push(...span(to, toCount));
  }

  return { removed, added };
}

/**
 * The source files among `paths` whose diff changes comments and whitespace
 * only, judged on both versions of each file (isCommentOnlyChange). Any git
 * failure leaves the file out, so it still needs a test — the safe direction.
 * Only modified and renamed `.ts`/`.js`/`.tsx` files qualify; a new, deleted,
 * or `.vue` file is judged as code.
 *
 * @param {string} base The base ref.
 * @param {{status: string, oldPath: string, path: string}[]} changes Parsed diff entries.
 * @param {Set<string>} paths The source files to judge.
 * @returns {string[]} The comment-only files.
 */
function readCommentOnly(base, changes, paths) {
  let mergeBase;

  try {
    mergeBase = git(['merge-base', base, 'HEAD']).trim();
  } catch {
    // No merge-base: every file is judged as code, and the verdict stands.
    return [];
  }

  const found = [];

  for (const change of changes) {
    if (!paths.has(change.path) || !'MR'.includes(change.status) || !/\.(ts|js|tsx)$/.test(change.path)) {
      continue;
    }
    try {
      const baseText = git(['show', `${mergeBase}:${change.oldPath}`]);
      const headText = git(['show', `HEAD:${change.path}`]);
      const diff = git(['diff', '-U0', '--no-color', mergeBase, 'HEAD', '--', change.oldPath, change.path]);
      const lines = changedLines(diff);

      if (isCommentOnlyChange({ baseText, headText, ...lines })) {
        found.push(change.path);
      }
    } catch {
      // Unreadable: judged as code.
    }
  }

  return found;
}

/**
 * Read the unified diff of the files the advisory detectors look at: source,
 * tests, and the whole Playwright package (`isAdvisoryPath`). The gate's own
 * classifier calls a page object or helper under `tests/**` 'neither', yet the
 * RTL detector pairs a source change with exactly those files — filtering on
 * the classifier alone would drop them here and the warning would fire on a
 * paired change. Limiting the pathspec keeps a lockfile or a docs rewrite out
 * of the buffer; `--unified=0` keeps it to the changed lines. Both sides of a
 * rename go into the pathspec so git can still pair them.
 *
 * @param {string} range The diff range, e.g. `<base>...HEAD`.
 * @param {{status: string, oldPath: string, path: string}[]} changes Parsed diff entries.
 * @returns {string} The unified diff, empty when nothing relevant changed.
 */
function readDiff(range, changes) {
  const paths = new Set();

  for (const change of changes) {
    if (change.status !== 'D' && isAdvisoryPath(change.path)) {
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

let changes;
let commits;

try {
  changes = readChanges(`${base}...HEAD`);
  commits = readCommits(`${base}..HEAD`);
} catch (error) {
  // A tooling gap (an unknown base ref, a clone too shallow to reach the fork
  // point) is a skip, never a block — in either mode, the way the ratchet
  // treats it. In Actions the skip is also a visible annotation.
  const why = String(error.message).split('\n')[0];

  console.log(`presence-gate: could not read the diff against "${base}" (${why}) — skipped.`);
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.error(`::warning title=Test-presence gate skipped::could not read the diff against ${base}`);
  }
  process.exit(0);
}

let result = evaluate(changes, commits);

// Only a failing verdict pays for reading both versions of each uncovered file:
// a JSDoc-only edit is not a behavior change.
if (result.reason === 'missing-coverage') {
  const uncovered = new Set(result.uncovered.flatMap(({ files }) => files));
  const commentOnly = readCommentOnly(base, changes.filter(change => isSource(change)), uncovered);

  if (commentOnly.length > 0) {
    result = evaluate(changes, commits, { commentOnly });
  }
}

const lines = ['## Test-presence gate', ''];
if (result.pass) {
  if (result.reason === 'refactor-declared') {
    lines.push('✅ Pass — these source files changed with no test, but every commit that changed them carries '
      + 'a `Refactor-only:` trailer or is a `git revert`. Existing tests for the area must stay green.', '');
    lines.push(...result.waived.map(f => `- \`${f}\``));
  } else if (result.reason === 'comments-only') {
    lines.push('✅ Pass — these source files changed only in comments and whitespace (a JSDoc edit, for example), '
      + 'which changes no behavior:', '');
    lines.push(...result.commentOnly.map(f => `- \`${f}\``));
  } else {
    lines.push('✅ Pass.');
  }
} else if (result.reason === 'new-jasmine-spec') {
  lines.push('❌ A **new Jasmine `*.spec.js`** was added. The Jasmine suite is frozen — new E2E goes in `tests/e2e/` as Playwright (`*.spec.ts`). Editing an existing Jasmine spec is fine.', '');
  lines.push('New Jasmine files:');
  lines.push(...result.newJasmine.map(f => `- \`${f}\``));
} else if (result.reason === 'missing-coverage') {
  lines.push('❌ Source changed with no matching test change in the same package. For each package below, add a '
    + 'test where that package\'s tests live. For a pure refactor, add a `Refactor-only: <reason>` trailer to the '
    + 'commit that makes it – a trailer covers only the files its own commit changes.', '');

  for (const { group, files } of result.uncovered) {
    lines.push(`**${group}** – needs ${COVERAGE_HINTS[group]}:`);
    lines.push(...files.map(f => `- \`${f}\``), '');
  }
  lines.push('A deleted test does not count, and neither does a test in another package, `docs/tests/`, '
    + '`evals/`, `examples/`, or `performance-tests/`. A visual spec counts for any package.');
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
