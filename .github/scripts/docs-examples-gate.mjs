#!/usr/bin/env node

/**
 * Pre-check for `docs-examples-sync.yml` (DEV-3029): decides whether a push
 * actually changed example content -- not just prose -- under
 * `docs/content/guides/**`/`docs/content/recipes/**`, so a typo-only doc
 * commit can skip minting a cross-repo token and dispatching to
 * `handsontable/examples` entirely.
 *
 * Every branch below defaults to "dispatch" on ambiguity: a wrong `false`
 * silently drops a real example sync, while a wrong `true` only costs one
 * no-op run in the importer. This entrypoint must never exit non-zero -- a
 * failed step could, depending on `if:` wiring, block the dispatch instead of
 * allowing it.
 *
 * Env:
 *   BEFORE_SHA  github.event.before -- unset/empty for workflow_dispatch.
 *   AFTER_SHA   github.event.after.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { isExampleRelevant } from './lib/docs-examples-gate.mjs';
import { repoRoot } from './lib/repo-root.mjs';

const PATHS = ['docs/content/guides', 'docs/content/recipes'];

// git diff --name-status's first letter: A(dd), M(odify), D(elete), R(ename),
// C(opy), T(ype change). Anything unlisted (there is nothing else today) is
// treated as a modification.
const STATUS_NAMES = { A: 'added', M: 'modified', D: 'removed', R: 'renamed', C: 'copied', T: 'modified' };

/**
 * @param {string} root
 * @param {string[]} args
 * @returns {string}
 */
function git(root, args) {
  // core.quotePath=false: a non-ASCII path in `--name-status` output would
  // otherwise be C-quoted/escaped, breaking the plain tab-split below.
  return execFileSync('git', ['-c', 'core.quotePath=false', ...args], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

/**
 * @param {string} root
 * @param {string} sha
 * @param {string} path
 * @returns {string|null} The file's full text at `sha`, or `null` when it
 *   does not exist there (an added or removed file) or cannot be read.
 */
function readBlob(root, sha, path) {
  try {
    return git(root, ['show', `${sha}:${path}`]);
  } catch {
    return null;
  }
}

/**
 * @param {string} root Repository root.
 * @param {string} before `BEFORE_SHA` (may be empty).
 * @param {string} after `AFTER_SHA` (may be empty).
 * @returns {{needsSync: boolean, reason: string}}
 */
export function decide(root, before, after) {
  if (!before) {
    return { needsSync: true, reason: 'manual dispatch (workflow_dispatch) always proceeds' };
  }

  if (/^0+$/.test(before)) {
    return { needsSync: true, reason: 'new branch push (before SHA is all zeros); nothing to diff against' };
  }

  const nameStatus = git(root, ['diff', '--name-status', '-M', before, after, '--', ...PATHS]).trim();

  if (nameStatus === '') {
    return { needsSync: false, reason: 'no changed files under docs/content/guides or docs/content/recipes' };
  }

  const lines = nameStatus.split('\n');

  for (const line of lines) {
    const cols = line.split('\t');
    const status = STATUS_NAMES[cols[0][0]] ?? 'modified';
    // A rename/copy line is "R100\told\tnew" -- the third column is the
    // current path a future run would see this file at.
    const path = cols.length > 2 ? cols[2] : cols[1];

    let diffText = '';
    let beforeText = null;
    let afterText = null;

    if (path.endsWith('.md')) {
      if (status === 'modified') {
        diffText = git(root, ['diff', '--unified=0', before, after, '--', path]);
        beforeText = readBlob(root, before, path);
        afterText = readBlob(root, after, path);
      } else if (status === 'added') {
        afterText = readBlob(root, after, path);
      } else if (status === 'removed') {
        beforeText = readBlob(root, before, path);
      }
      // 'renamed'/'copied' never need blobs -- isExampleRelevant is always
      // true for them regardless of content.
    }

    if (isExampleRelevant({ path, status, diffText, beforeText, afterText })) {
      return { needsSync: true, reason: `${path}: ${status} change touches example content` };
    }
  }

  return { needsSync: false, reason: `${lines.length} file(s) changed under the docs path filter, all prose-only -- skipping` };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Location-derived, not git-derived (see lib/repo-root.mjs) -- correct
  // regardless of the cwd the workflow step happens to run from.
  const root = repoRoot();
  let result;

  try {
    result = decide(root, process.env.BEFORE_SHA ?? '', process.env.AFTER_SHA ?? '');
  } catch (error) {
    console.log(`::warning::docs-examples-gate: detection failed, dispatching conservatively: ${error.message}`);
    result = { needsSync: true, reason: `detection failed: ${error.message}` };
  }

  console.log(`needs_sync=${result.needsSync} -- ${result.reason}`);

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `needs_sync=${result.needsSync}\n`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `**Examples sync gate:** \`needs_sync=${result.needsSync}\` -- ${result.reason}\n`,
    );
  }
}
