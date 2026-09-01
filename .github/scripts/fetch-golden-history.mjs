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
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Only needs to exceed MEDIAN_WINDOW_SIZE (performance-tests/lib/median-snapshot.mjs)
// after windowSource filtering -- generous on purpose since re-fetching a few extra
// small JSON files is cheap.
export const HISTORY_FETCH_COUNT = 20;
const TIMESTAMPED_DIR = /^(.*\/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z))$/;
const HISTORY_DIR = join('performance-tests', 'golden', 'history');

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
    // is chronological order -- no Date parsing needed here.
    .sort((a, b) => (a.name < b.name ? 1 : -1))
    .slice(0, count);
}

/* c8 ignore start -- exercises real git/fs, covered by manual verification, not unit tests */
function main() {
  mkdirSync(HISTORY_DIR, { recursive: true });

  let lsTreeOutput;

  try {
    lsTreeOutput = execFileSync(
      'git',
      ['ls-tree', '--name-only', 'gh-pages', '--', 'performance-reports/develop/'],
      { encoding: 'utf8' }
    );
  } catch {
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
      const content = execFileSync('git', ['show', `gh-pages:${dir}/snapshots.json`], { encoding: 'utf8' });

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
