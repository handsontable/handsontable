/**
 * Renders the verdict of a stability matrix: which captures differ across the downloaded runs, and
 * how many of those differences the suite's own comparison would report.
 *
 * Reads `<dir>/stability-<n>/**\/*.png` as produced by `.github/workflows/visual-stability.yml`, prints
 * Markdown for the job summary, and exits non-zero when reg-cli reports any changed item or a pair
 * could not be compared, so the run is red exactly when the gate would have been (or when it cannot
 * tell). The decisions live in `../lib/stability-report.mjs`; this file adds the file system and the
 * reg-cli spawn.
 *
 * Usage: node visual-tests/scripts/stability-verdict.mjs <runs-dir>
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { toleranceFlags } from '../lib/tolerance-flags.mjs';
import { byteStability, collectRuns, verdictLine } from '../lib/stability-report.mjs';

const ROOT = join(import.meta.dirname, '..');

/**
 * @param {string} file A capture path.
 * @returns {string | null} Its sha256 prefix, or `null` when the file is absent.
 */
function hashOf(file) {
  if (!existsSync(file)) {
    return null;
  }

  return createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 12);
}

if (!process.argv[2]) {
  console.error('Usage: node visual-tests/scripts/stability-verdict.mjs <runs-dir>');
  process.exitCode = 1;
} else {
  const runs = collectRuns(process.argv[2]);

  console.log('### Visual stability');
  console.log('');

  if (runs.length < 2) {
    console.log(`${runs.length} render(s) downloaded; nothing to compare. Every render job failed or was skipped.`);
    process.exitCode = 1;
  } else {
    const [reference, ...others] = runs;
    const { files, unstable } = byteStability(runs, hashOf);
    const runners = runs
      .map((run) => {
        try {
          return readFileSync(join(run, 'runner.txt'), 'utf8').trim().replace(/^Model name:\s*/, '');
        } catch {
          return 'unknown';
        }
      })
      .reduce((acc, model) => acc.set(model, (acc.get(model) || 0) + 1), new Map());

    console.log(`${runs.length} renders of one commit, ${files.length} captures.`);
    console.log('');
    console.log(`**Runners:** ${[...runners].map(([model, n]) => `${n}× ${model}`).join(', ')}`);
    console.log('');
    console.log(`**Byte-unstable captures:** ${unstable.length}`);

    if (unstable.length) {
      console.log('');
      console.log('| Capture | Distinct renders | Missing in |');
      console.log('| --- | ---: | --- |');
      unstable.forEach(({ file, distinct, missingIn }) => {
        console.log(`| \`${file}\` | ${distinct} | ${missingIn.join(', ') || '—'} |`);
      });
    }

    // The verdict the gate would deliver: every later run against the first, at the suite's tolerances.
    const flags = toleranceFlags(JSON.parse(readFileSync(join(ROOT, 'regconfig.json'), 'utf8')));
    const changedPerPair = [];

    console.log('');
    console.log(`**Under the suite's comparison** (reg-cli ${flags.join(' ')}):`);
    console.log('');
    console.log('| Pair | Changed |');
    console.log('| --- | ---: |');

    // The artifact's own name, not its position: `collectRuns` returns whatever iterations uploaded,
    // so a cancelled or failed middle render leaves a hole (stability-1, 2, 5) and a positional label
    // would send whoever opens the summary to the wrong artifact.
    const nameOf = run => run.split(/[\\/]/).pop();

    others.forEach((run) => {
      // `runs` are absolute, so the paths mean the same thing under reg-cli's working directory.
      const pair = `${nameOf(run)} vs ${nameOf(reference)}`;
      const outDir = join(run, '..', `diff-${nameOf(run)}`);
      const result = spawnSync('npx', [
        '--no', 'reg-cli', run, reference, join(outDir, 'diff'),
        '-J', join(outDir, 'out.json'), '-I', ...flags,
      ], { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' });

      if (result.status !== 0 || !existsSync(join(outDir, 'out.json'))) {
        changedPerPair.push(null);
        console.log(`| ${pair} | could not compare (reg-cli exit ${result.status}) |`);

        return;
      }

      const report = JSON.parse(readFileSync(join(outDir, 'out.json'), 'utf8'));
      // Every bucket the real gate blocks on, not `failedItems` alone: a capture one render produced
      // and the other did not is reg-cli's `newItems`/`deletedItems`, and the gate counts those.
      const differing = [...report.failedItems, ...report.newItems, ...report.deletedItems];

      changedPerPair.push(differing.length);

      if (differing.length) {
        const items = differing.map(f => `\`${f}\``).join(', ');

        console.log(`| ${pair} | ${differing.length}: ${items} |`);
      } else {
        console.log(`| ${pair} | 0 |`);
      }
    });

    // A capture missing from any render is part of the verdict, not just of the table above: reg-cli
    // exits 0 under `-I` whatever it finds, so a matrix whose renders died early would otherwise read
    // "the gate would have passed every pair" with a byte-stability table full of "missing in".
    const missing = unstable.filter(entry => entry.missingIn.length > 0).length;
    // `files` is the union of what the runs produced. Zero means every render died before it
    // photographed anything, and that is the one shape where `missing` is also zero (nothing can be
    // absent from a set nobody filled) and every pair compares two empty directories for 0 changed.
    const { line, failed } = verdictLine(changedPerPair, { missing, captures: files.length });

    console.log('');
    console.log(line);

    if (failed) {
      process.exitCode = 1;
    }
  }
}
