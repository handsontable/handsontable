#!/usr/bin/env node

/**
 * Fails the release when `pnpm-lock.yaml` differs from `HEAD`.
 *
 * A release must ship the exact dependency set CI already tested. `pnpm-lock.yaml`
 * records `specifier: workspace:^` for every in-repo dependency and never a package's
 * own version, so bumping the version can never legitimately change it. Any difference
 * during a cut therefore means the specifiers re-resolved, and the release would build
 * against dependencies no CI run has seen.
 *
 * That is DEV-2667: the 18.1.0-rc1 cut deleted the lockfile and reinstalled, floating
 * 509 packages (core-js 3.37/3.49 -> 3.50, browserslist 4.28.2 -> 4.28.8, hyperformula
 * 3.3.0 -> 3.4.0). Every leg consuming a production bundle went red and stayed red for
 * six release candidates.
 *
 * Nothing downstream catches this on its own: a floated lockfile is internally
 * consistent, so `pnpm install --frozen-lockfile` installs it happily. Only this check
 * catches it.
 *
 * Usage: node .github/scripts/lockfile-float-gate.mjs <stage> <source-branch>
 *
 *   stage          What the job was doing, for the error message. For example
 *                  'bumping the version'.
 *   source-branch  Where the operator must land the intended lockfile change. This is
 *                  the branch the job builds from, NOT always `develop` -- the RC and
 *                  stable jobs build from the release branch, so telling them to fix
 *                  develop would send them round the loop for nothing.
 */

import { execFileSync } from 'node:child_process';

const LOCKFILE = 'pnpm-lock.yaml';

const [, , stage = 'cutting this release', sourceBranch = 'the branch this release builds from'] = process.argv;

/**
 * Read the working tree's difference from `HEAD` for the lockfile.
 *
 * Compared against `HEAD` rather than the index so a step that stages the file before
 * this runs cannot hide a change.
 *
 * @param {string[]} args Extra arguments for `git diff`.
 * @returns {string} The command's stdout.
 */
function gitDiff(args) {
  return execFileSync('git', ['diff', ...args, 'HEAD', '--', LOCKFILE], { encoding: 'utf8' });
}

const changed = gitDiff(['--name-only']).trim() !== '';

if (!changed) {
  console.log(`${LOCKFILE} is unchanged. Dependencies match the set CI tested.`);
  process.exit(0);
}

console.log(gitDiff(['--stat']));
console.log(
  `::error::${LOCKFILE} changed while ${stage}, so dependencies floated away from the set `
  + 'CI tested. Refusing to build a release from an untested dependency graph. Land the '
  + `intended lockfile change on ${sourceBranch}, let CI verify it, then re-run this release.`
);

process.exit(1);
