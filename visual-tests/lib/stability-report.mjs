/**
 * The pure half of the stability verdict: which downloaded renders exist, which captures differ between
 * them byte for byte, and how the summary reads. `scripts/stability-verdict.mjs` adds the file system
 * and the reg-cli spawn around these.
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

/**
 * Resolves the downloaded renders under a directory, oldest iteration first.
 *
 * The directory is made absolute here, once. The verdict script hands these paths to reg-cli with a
 * different working directory (the visual-tests package, where reg-cli is installed), so a relative
 * argument would otherwise be resolved twice against two different roots — and reg-cli compares two
 * directories that do not exist, reports zero changes, and the script dies reading a report that was
 * written somewhere else.
 *
 * @param {string} runsDir The directory `download-artifact` filled, relative or absolute.
 * @returns {string[]} Absolute paths of the `stability-<n>` directories, sorted by `n`.
 */
export function collectRuns(runsDir) {
  const root = resolve(runsDir);

  if (!existsSync(root)) {
    return [];
  }

  return readdirSync(root)
    .filter(name => /^stability-\d+$/.test(name))
    .sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))
    .map(name => join(root, name));
}

/**
 * Lists every PNG under a directory, relative to that directory.
 *
 * @param {string} dir The directory to walk.
 * @returns {string[]} Relative PNG paths, sorted.
 */
export function pngsUnder(dir) {
  const out = [];
  const walk = (d) => {
    readdirSync(d).forEach((entry) => {
      const full = join(d, entry);

      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (entry.endsWith('.png')) {
        out.push(relative(dir, full));
      }
    });
  };

  walk(dir);

  return out.sort();
}

/**
 * Finds the captures that are not byte-identical across every run.
 *
 * A capture absent from a run (a spec that failed all its retries there, a partial upload) counts as
 * unstable and is reported with the runs it is missing from, rather than crashing the verdict; the
 * union of every run's captures is judged, so a capture the first run lacks is not hidden either.
 *
 * @param {string[]} runs Absolute run directories.
 * @param {(file: string) => string | null} hashOf Returns a capture's digest, or `null` when the file is absent.
 * @param {(dir: string) => string[]} [listPngs] Lists a run's captures; injectable for tests.
 * @returns {{ files: string[], unstable: Array<{ file: string, distinct: number, missingIn: string[] }> }}
 * Every capture seen, and the unstable ones sorted by how many distinct renders they produced.
 */
export function byteStability(runs, hashOf, listPngs = pngsUnder) {
  const files = [...new Set(runs.flatMap(run => listPngs(run)))].sort();
  const unstable = [];

  files.forEach((file) => {
    const hashes = new Set();
    const missingIn = [];

    runs.forEach((run) => {
      const hash = hashOf(join(run, file));

      if (hash === null) {
        missingIn.push(run.split(/[\\/]/).pop());
      } else {
        hashes.add(hash);
      }
    });

    if (hashes.size > 1 || missingIn.length > 0) {
      unstable.push({ file, distinct: hashes.size, missingIn });
    }
  });

  unstable.sort((a, b) => (b.distinct + b.missingIn.length) - (a.distinct + a.missingIn.length));

  return { files, unstable };
}

/**
 * The closing line of the summary, from the pairwise comparison results.
 *
 * @param {Array<number | null>} changedPerPair Changed-item counts, `null` for a pair reg-cli could not compare.
 * @returns {{ line: string, failed: boolean }} The Markdown line and whether the run should be red.
 */
export function verdictLine(changedPerPair) {
  const errored = changedPerPair.filter(c => c === null).length;
  const changed = changedPerPair.reduce((sum, c) => sum + (c ?? 0), 0);

  if (errored > 0) {
    return { line: `**Verdict: ${errored} pair(s) could not be compared; no verdict.**`, failed: true };
  }

  if (changed > 0) {
    return { line: `**Verdict: the gate would have failed on ${changed} item(s).**`, failed: true };
  }

  return { line: '**Verdict: the gate would have passed every pair.**', failed: false };
}
