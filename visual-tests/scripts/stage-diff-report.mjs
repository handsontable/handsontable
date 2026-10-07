/**
 * Stages the `visual-diff-report` artifact: copies the report and the images of every difference out of
 * `.reg/` into a directory of their own (`../lib/visual-diff-report.mjs` decides which files).
 *
 * Runs in `visual.yml`'s Compare job right before the upload step, under the same condition. Two reasons it
 * exists rather than an upload of `.reg/` itself. `.reg` is a dot-directory, and upload-artifact skips hidden
 * paths by default, so that upload matched nothing and reported success on every run. And the whole tree is
 * the tier's golden set twice over, most of it screenshots that passed.
 *
 * It never fails the job. The artifact is for reading, not a verdict, so a problem staging it is a
 * `::warning` and a missing artifact, never a red Compare over a build the gate already judged. The one
 * exception is a missing or non-empty destination: that is a broken workflow line, not a broken run.
 *
 * `VISUAL_GATE_DIR` moves the `.reg/` directory it reads, as it does for `visual-gate.mjs` and
 * `compare-record.mjs`. Nothing in CI sets it for this script; the tests do.
 *
 * Usage: node visual-tests/scripts/stage-diff-report.mjs <destination>
 */

import { copyFile, mkdir, readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { reviewFiles } from '../lib/visual-diff-report.mjs';

const PACKAGE_ROOT = join(import.meta.dirname, '..');
const REG_DIR = process.env.VISUAL_GATE_DIR ? resolve(process.env.VISUAL_GATE_DIR) : join(PACKAGE_ROOT, '.reg');
const destination = process.argv[2] ? resolve(process.argv[2]) : '';

/**
 * The entries of a directory, or `null` when it does not exist.
 *
 * @param {string} dir The directory.
 * @returns {Promise<string[]|null>} Its entries.
 */
async function entriesOf(dir) {
  try {
    return await readdir(dir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

if (!destination) {
  console.error('Usage: node visual-tests/scripts/stage-diff-report.mjs <destination>');
  process.exitCode = 1;
} else if ((await entriesOf(destination))?.length > 0) {
  // Staging over an existing tree would mix two runs' images in one report. Refused rather than cleared:
  // a wrong argument must never delete anything.
  console.error(`Refusing to stage into ${destination}: the directory is not empty.`);
  process.exitCode = 1;
} else {
  try {
    let report = null;

    try {
      report = JSON.parse(await readFile(join(REG_DIR, 'out.json'), 'utf8'));
    } catch (error) {
      // A comparison step that died before writing its report. The gate has already said so.
      console.log(`No comparison result read (${error.message}); there is no diff report to stage.`);
    }

    const { files, refused } = reviewFiles(report);
    const missing = [];
    let bytes = 0;

    for (const file of files) {
      const source = join(REG_DIR, file);
      const target = join(destination, file);

      try {
        bytes += (await stat(source)).size;
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }

        missing.push(file);
        continue;
      }

      await mkdir(dirname(target), { recursive: true });
      await copyFile(source, target);
    }

    if (refused.length > 0) {
      console.log(`::warning title=Visual diff report::${refused.length} path(s) in out.json leave the working `
        + `directory and were not staged, for example ${refused.slice(0, 3).join(', ')}.`);
    }

    // Every file in the list is one the report itself names, so a gap is a report that lies about its
    // images: worth saying, since the reviewer who downloads the artifact would otherwise see a broken pane.
    if (report && missing.length > 0) {
      console.log(`::warning title=Visual diff report::${missing.length} file(s) the report names are not in `
        + `${REG_DIR}, for example ${missing.slice(0, 3).join(', ')}.`);
    }

    console.log(`Visual diff report: ${files.length - missing.length} file(s), `
      + `${(bytes / 1048576).toFixed(1)} MB, staged in ${destination}.`);
  } catch (error) {
    console.log(`::warning title=Visual diff report::The diff report was not staged: ${error.message}`);
  }
}
