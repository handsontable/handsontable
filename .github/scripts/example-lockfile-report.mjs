#!/usr/bin/env node
/**
 * Reports what happened to the tracked example lockfiles during a release cut (DEV-2714).
 *
 * `examples/next/<category>/<framework>/package-lock.json` (nine tracked files) records the
 * dependency set CI tested. `publish.yml`'s `first-rc-build` is the only automated writer: it
 * installs the examples and then commits the whole tree with a bare `git add .`. The float gate
 * next to it only looks at `pnpm-lock.yaml`, so anything that happened to these nine used to go
 * in unseen.
 *
 * `examples/scripts/clean-subpackages.mjs` no longer deletes them, so `npm install` reuses the
 * committed resolution and the expected delta is nothing. This step reports the exception rather
 * than blocking on it: these trees build documentation demos and visual-test fixtures and ship
 * in no bundle, so a transitive patch bump must not red a release candidate. What it must not do
 * is stay invisible.
 *
 * Always exits 0. Never mutates a lockfile: `npm audit` is read-only, and `npm audit fix` must
 * never run here (it prunes a workspace tree whose leaves are absent and reports a bogus clean
 * result).
 *
 * Usage: node .github/scripts/example-lockfile-report.mjs [repository-root]
 *
 * The root defaults to this file's own checkout, which is what CI wants. Pass one to report on a
 * different checkout.
 *
 * Env:
 *   GITHUB_STEP_SUMMARY  file the report is appended to, in addition to stdout.
 *   SKIP_AUDIT           set to any value to omit the per-lockfile audit (offline, or tests).
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// `:(glob)` asks for strict pathname semantics: a single `*` stops at a `/`, and only `**` spans
// directory levels. Without it git's default matching lets `*` swallow separators, so a pattern
// meant for one level quietly matches any depth.
const LOCKFILE_PATHSPEC = ':(glob)examples/**/package-lock.json';

/**
 * Run a git command in `cwd` and return its stdout, or `null` when it fails.
 *
 * A release job with no `HEAD`, or a `git` that refuses the pathspec, must degrade to "nothing
 * to report" rather than take the job down: this script is report-only by design.
 *
 * @param {string[]} args Arguments for `git`.
 * @param {string} cwd Directory to run in.
 * @returns {string|null} Trimmed stdout, or `null` if the command failed.
 */
export function git(args, cwd) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', cwd, maxBuffer: 64 * 1024 * 1024 }).trim();
  } catch {
    return null;
  }
}

/**
 * Collect the tracked lockfiles that differ from `HEAD`, and any untracked lockfile that no
 * ignore rule covers.
 *
 * Compared against `HEAD` rather than the index, so a step that stages a lockfile before this one
 * runs cannot hide it.
 *
 * `--exclude-standard` is deliberate. Per-example lockfiles are ignored by `examples/.gitignore`,
 * so a bare `git add .` cannot commit them and listing them would be noise. What survives the
 * filter is a lockfile at a path no pattern reaches -- a new framework or category directory
 * under `examples/` -- which `git add .` would commit into the release.
 *
 * @param {string} cwd Repository root.
 * @returns {{changed: string[], untracked: string[], stat: string, failed: boolean}} The report's
 *   raw material, and whether any git call failed.
 */
export function collect(cwd) {
  const names = git(['diff', '--name-only', 'HEAD', '--', LOCKFILE_PATHSPEC], cwd);
  const stat = git(['diff', '--stat', 'HEAD', '--', LOCKFILE_PATHSPEC], cwd);
  const others = git(['ls-files', '--others', '--exclude-standard', '--', LOCKFILE_PATHSPEC], cwd);
  const lines = value => (value ? value.split('\n').filter(Boolean) : []);

  // `null` is a failed command, `''` is a command that found nothing. Collapsing the two would
  // turn an unborn `HEAD`, an ownership refusal, or a git that rejects the pathspec into a
  // confident all-clear, which is the failure this whole step exists to prevent.
  return {
    changed: lines(names),
    untracked: lines(others),
    stat: stat || '',
    failed: names === null || stat === null || others === null,
  };
}

/**
 * Read the advisory counts `npm audit` reports for one lockfile.
 *
 * `--package-lock-only` reads the lockfile and resolves nothing, so it cannot rewrite the file it
 * is measuring. A non-zero exit is normal (npm exits non-zero when it finds advisories), and so
 * is a registry failure on an air-gapped runner; both come back through the same path, so a
 * missing report is reported as unknown instead of being treated as clean.
 *
 * @param {string} lockfile Repository-relative path to a `package-lock.json`.
 * @param {string} cwd Repository root.
 * @returns {string} A one-line severity summary.
 */
export function auditSummary(lockfile, cwd) {
  let stdout;

  try {
    stdout = execFileSync('npm', ['audit', '--package-lock-only', '--json'], {
      encoding: 'utf8',
      cwd: path.join(cwd, path.dirname(lockfile)),
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
      // A hanging registry would otherwise stall `first-rc-build` with nothing to catch. The
      // kill lands in the `catch` below and reads as an unavailable audit.
      timeout: 60_000,
    });
  } catch (error) {
    // npm exits non-zero when it finds advisories, and still prints the report.
    stdout = error.stdout;
  }

  if (!stdout) {
    return 'audit unavailable';
  }

  let vulnerabilities;

  try {
    ({ vulnerabilities } = JSON.parse(stdout).metadata ?? {});
  } catch {
    return 'audit unavailable';
  }

  if (!vulnerabilities) {
    return 'audit unavailable';
  }

  const counts = ['critical', 'high', 'moderate', 'low']
    .filter(severity => vulnerabilities[severity] > 0)
    .map(severity => `${vulnerabilities[severity]} ${severity}`);

  return counts.length > 0 ? counts.join(', ') : 'no advisories';
}

/**
 * Build the report body for a collected state.
 *
 * @param {{changed: string[], untracked: string[], stat: string}} state From `collect`.
 * @param {(lockfile: string) => string} audit Severity summary for one lockfile.
 * @returns {string} Markdown, without a trailing newline.
 */
export function report(state, audit) {
  const { changed, untracked, stat, failed } = state;

  if (failed) {
    return 'Could not determine whether the example lockfiles changed: at least one `git` call '
      + 'failed (see the job log for the error). Treat this as unknown, not as unchanged, and '
      + 'check `git status -- examples` on the release branch before trusting the commit.';
  }

  if (changed.length === 0 && untracked.length === 0) {
    return 'The tracked example lockfiles are unchanged. This release installs the dependency '
      + 'set CI tested.';
  }

  const out = ['### Example lockfiles changed during this cut', ''];

  if (changed.length > 0) {
    out.push('```', stat, '```', '');
    out.push('| Lockfile | npm audit |', '| --- | --- |');
    changed.forEach(lockfile => out.push(`| \`${lockfile}\` | ${audit(lockfile)} |`));
    out.push('');
  }

  if (untracked.length > 0) {
    out.push('Untracked lockfiles no ignore rule covers, which `git add .` would commit:', '');
    untracked.forEach(lockfile => out.push(`- \`${lockfile}\``));
    out.push('');
  }

  out.push(
    'These files ship in no bundle, so this does not block the release. Land the intended '
    + 'lockfile change on `develop` (`node ./scripts/clean-subpackages.mjs next '
    + '--reset-lockfiles` in `examples/`, then review the diff) so the next cut starts from a '
    + 'reviewed set.'
  );

  return out.join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { repoRoot } = await import('./lib/repo-root.mjs');
  const root = process.argv[2] ? path.resolve(process.argv[2]) : repoRoot();
  const state = collect(root);
  const audit = process.env.SKIP_AUDIT
    ? () => 'audit skipped'
    : lockfile => auditSummary(lockfile, root);
  const body = report(state, audit);

  console.log(body);

  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${body}\n`);
    } catch (error) {
      // The step summary is where the report is meant to be read, but it is not worth a release
      // for: stdout already carries the same text into the job log.
      console.log(`Could not write the job summary: ${error.message}`);
    }
  }
}
