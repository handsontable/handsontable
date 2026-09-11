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

    others.forEach((run, index) => {
      // `runs` are absolute, so the paths mean the same thing under reg-cli's working directory.
      const outDir = join(run, '..', `diff-${index + 2}`);
      const result = spawnSync('npx', [
        '--no', 'reg-cli', run, reference, join(outDir, 'diff'),
        '-J', join(outDir, 'out.json'), '-I', ...flags,
      ], { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' });

      if (result.status !== 0 || !existsSync(join(outDir, 'out.json'))) {
        changedPerPair.push(null);
        console.log(`| run ${index + 2} vs run 1 | could not compare (reg-cli exit ${result.status}) |`);

        return;
      }

      const report = JSON.parse(readFileSync(join(outDir, 'out.json'), 'utf8'));
      const changed = report.failedItems.length;

      changedPerPair.push(changed);

      if (changed) {
        const items = report.failedItems.map(f => `\`${f}\``).join(', ');

        console.log(`| run ${index + 2} vs run 1 | ${changed}: ${items} |`);
      } else {
        console.log(`| run ${index + 2} vs run 1 | 0 |`);
      }
    });

    const { line, failed } = verdictLine(changedPerPair);

    console.log('');
    console.log(line);

    if (failed) {
      process.exitCode = 1;
    }
  }
}
