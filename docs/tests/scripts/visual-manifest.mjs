/**
 * Writes the docs suite's reg-suit manifest, the file `visual-tests/scripts/visual-gate.mjs` reads.
 *
 * All the branching lives in `../lib/visual-manifest.mjs`, which is pure and unit-tested; this
 * wrapper only reads the Playwright report and the recorded baseline, writes the JSON, and sets the
 * exit code. `.github/actions/docs-visual-run` is the only caller.
 *
 * Usage:
 *   node docs/tests/scripts/visual-manifest.mjs compare <report.json> <screenshots-dir> <out.json> [baseline.txt]
 *   node docs/tests/scripts/visual-manifest.mjs seed <screenshots-dir> <out.json>
 *
 * A missing or unparsable report exits 1 with the reason. The gate then finds no manifest and blocks
 * with "could not compare", which is the right verdict for a run that died — never a green one.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { listPngs, manifestFromReport, manifestFromTree } from '../lib/visual-manifest.mjs';

const USAGE = 'Usage: node docs/tests/scripts/visual-manifest.mjs compare <report.json> <screenshots-dir> '
  + '<out.json> [baseline.txt]\n'
  + '       node docs/tests/scripts/visual-manifest.mjs seed <screenshots-dir> <out.json>';

/**
 * Writes a manifest, creating its directory.
 *
 * @param {string} target Where to write.
 * @param {object} manifest What to write.
 */
function write(target, manifest) {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
}

const [mode, ...args] = process.argv.slice(2);

if (mode === 'seed') {
  const [screenshotsDir, target] = args;

  if (!screenshotsDir || !target) {
    console.error(USAGE);
    process.exitCode = 1;
  } else {
    const manifest = manifestFromTree(listPngs(screenshotsDir));

    write(target, manifest);
    console.log(`Seed manifest: ${manifest.actualItems.length} golden records under ${screenshotsDir}.`);
  }
} else if (mode === 'compare') {
  const [reportPath, screenshotsDir, target, baselinePath] = args;

  if (!reportPath || !screenshotsDir || !target) {
    console.error(USAGE);
    process.exitCode = 1;
  } else {
    let report = null;

    try {
      report = JSON.parse(readFileSync(reportPath, 'utf-8'));
    } catch (error) {
      // Never fall back to an empty report: that would produce a manifest with nothing in any bucket,
      // which reads as "nothing was compared" only because the gate checks for it — and would read as
      // a clean run to anything that did not.
      console.error(`Could not read the Playwright report at ${reportPath}: ${error.message}`);
      console.error('The run produced no usable report, so no manifest is written and the gate blocks.');
      process.exitCode = 1;
    }

    if (report) {
      // `baseline.txt` is what the action recorded between the golden-record sync and the run. Its
      // absence is a hand-run, not a run with no goldens, so the tree on disk stands in: after a
      // comparison that tree still holds exactly the fetched goldens, because `updateSnapshots:
      // 'none'` on CI writes none of its own.
      let baseline;

      try {
        baseline = readFileSync(baselinePath, 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
      } catch {
        baseline = listPngs(screenshotsDir);
        console.log(`No baseline list at ${baselinePath ?? '<none given>'}; reading the `
          + `${baseline.length} golden records on disk instead.`);
      }

      const manifest = manifestFromReport({ report, baseline });

      write(target, manifest);
      console.log(`Docs visual manifest: ${manifest.failedItems.length} changed, ${manifest.newItems.length} new, `
        + `${manifest.deletedItems.length} deleted, ${manifest.passedItems.length} passing `
        + `(baseline: ${manifest.expectedItems.length}).`);

      // A page that failed before it compared anything is not a difference to approve. Left in
      // `failedItems` it would read as `changed`, and a reviewer would be asked to accept a page
      // that never rendered in the same all-or-nothing click as the real diffs — while the
      // Playwright step's `continue-on-error: true` keeps anything else from going red. So the run
      // fails here instead, the way the gate blocks when it cannot tell the visual state.
      if (manifest.erroredItems.length > 0) {
        console.error('');
        console.error(`${manifest.erroredItems.length} page(s) failed without comparing a screenshot — `
          + 'the preview did not render them, so there is nothing to approve:');
        manifest.erroredItems.forEach(item => console.error(`  ${item}`));
        console.error('');
        console.error('Read the Playwright report before treating this as a visual difference.');
        process.exitCode = 1;
      }
    }
  }
} else {
  console.error(USAGE);
  process.exitCode = 1;
}
