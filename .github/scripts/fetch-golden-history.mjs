#!/usr/bin/env node

/**
 * Populates `performance-tests/golden/history/` with the last HISTORY_FETCH_COUNT
 * timestamped develop golden snapshots from the local `gh-pages` ref, for
 * `computeMedianSnapshot()` (performance-tests/lib/median-snapshot.mjs) to filter
 * and median over.
 *
 * This script does no filtering by `windowSource` and no math -- it only dumps raw
 * files. All of that lives in median-snapshot.mjs, which is unit tested; this script
 * stays a thin, shell-free wrapper around `git ls-tree`/`git show` against the
 * `gh-pages` ref that both golden-restore call sites (the "Fetch golden snapshots
 * from GitHub Pages" step in .github/workflows/performance-tests.yml and
 * .github/actions/performance-run/action.yml) already fetch locally before this
 * runs, so no network fetch is needed here.
 *
 * Shared between those two call sites specifically so they cannot drift on the
 * fetch count or the timestamp pattern the way several of their other duplicated
 * blocks already do.
 *
 * Usage: node .github/scripts/fetch-golden-history.mjs
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from './lib/repo-root.mjs';

// Only needs to exceed MEDIAN_WINDOW_SIZE (performance-tests/lib/median-snapshot.mjs)
// after windowSource filtering -- generous on purpose since re-fetching a few extra
// small JSON files is cheap.
export const HISTORY_FETCH_COUNT = 20;
const TIMESTAMPED_DIR = /^(.*\/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z))$/;
// Anchored via repoRoot(), not a bare relative path -- a CI runner's cwd is always the
// repo root so this made no difference there, but a bare relative path resolves
// against whatever directory a manual/local invocation happens to run from.
const HISTORY_DIR = join(repoRoot(), 'performance-tests', 'golden', 'history');

/**
 * @param {string} lsTreeOutput -- stdout of `git ls-tree --name-only gh-pages -- performance-reports/develop/`
 * @param {number} [count]
 * @returns {Array<{dir: string, name: string}>} newest-first, capped at `count`
 */
export function selectHistoryDirs(lsTreeOutput, count = HISTORY_FETCH_COUNT) {
  return lsTreeOutput
    .split('\n')
    .map(line => TIMESTAMPED_DIR.exec(line.trim()))
    .filter(Boolean)
    .map(match => ({ dir: match[1], name: match[2] }))
    // The timestamp format is fixed-width and zero-padded, so lexicographic order
    // is chronological order -- no Date parsing needed here. Explicit 0 for the
    // equal case: a plain `< ? 1 : -1` breaks the comparator contract on a tie
    // (e.g. two identically-timestamped dirs) and can sort unstably.
    .sort((a, b) => {
      if (a.name === b.name) {
        return 0;
      }

      return a.name < b.name ? 1 : -1;
    })
    .slice(0, count);
}

/* c8 ignore start -- exercises real git/fs, covered by manual verification, not unit tests */
function main() {
  // Cleared, not just created: an entry from a previous invocation (a stale local
  // history/ from an earlier manual run, or a dir since removed from gh-pages) would
  // otherwise linger and keep outranking a fresh single-file golden forever.
  rmSync(HISTORY_DIR, { recursive: true, force: true });
  mkdirSync(HISTORY_DIR, { recursive: true });

  let lsTreeOutput;

  try {
    lsTreeOutput = execFileSync(
      'git',
      ['ls-tree', '--name-only', 'gh-pages', '--', 'performance-reports/develop/'],
      // `cwd` is load-bearing, not decoration: the `performance-reports/develop/`
      // pathspec is resolved by git relative to the process cwd, not the repo root --
      // discovered when this script, invoked from a subdirectory, silently returned
      // zero matches instead of erroring. Anchoring both git calls here mirrors
      // HISTORY_DIR's repoRoot() anchoring above for the same reason.
      { encoding: 'utf8', cwd: repoRoot() }
    );
  } catch (err) {
    // Distinguish a real git failure (missing gh-pages ref, corrupt local clone) from
    // the legitimate "nothing there yet" case below -- both would otherwise look like
    // an empty history and print the same harmless-sounding message.
    console.warn(`Warning: git ls-tree failed (${err.message}) -- treating history as empty`);
    lsTreeOutput = '';
  }

  const dirs = selectHistoryDirs(lsTreeOutput);

  if (dirs.length === 0) {
    console.log('No timestamped develop runs found on gh-pages -- median baseline will fall back to latest.json');

    return;
  }

  let fetched = 0;

  for (const { dir, name } of dirs) {
    try {
      const content = execFileSync('git', ['show', `gh-pages:${dir}/snapshots.json`], {
        encoding: 'utf8',
        cwd: repoRoot(),
      });

      writeFileSync(join(HISTORY_DIR, `${name}.json`), content, 'utf8');
      fetched += 1;
    } catch {
      // A missing snapshots.json for one timestamped dir shouldn't block the rest.
    }
  }

  console.log(`Fetched ${fetched} historical snapshot(s) for median baseline`);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main();
}
/* c8 ignore stop */
