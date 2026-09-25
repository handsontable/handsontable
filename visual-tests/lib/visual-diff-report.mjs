/**
 * Chooses what the `visual-diff-report` artifact carries: the report and the images of every difference.
 *
 * Pure: no file access, so which files a reviewer gets is unit-testable. `scripts/stage-diff-report.mjs` is
 * the thin wrapper that copies them out of `.reg/` for the upload step in `visual.yml`.
 *
 * Why a subset. The whole `.reg/` tree holds the tier's golden set twice (`expected/` and `actual/`): 110 MB
 * for #13577's pr-tier run (480 records, 28 changed), of which this subset is 24.5 MB, and a full-tier run
 * holds 3.5 times the records. A reviewer needs neither copy of the screenshots that passed. What the report shows for a difference is the expected, actual, and diff image of a changed item,
 * the actual image of a new one, and the expected image of a deleted one. Both comparison paths write the
 * same layout (`reg-suit compare` on the credentialed path, `compare-fork.mjs` through `reg-cli` on the
 * other), and `index.html` addresses its images relative to itself, so the subset opens as the same report.
 * The passing items are still listed there, without their images.
 */

/**
 * The report and its manifest, which go first whatever the comparison found.
 */
const REPORT_FILES = ['index.html', 'out.json'];

/**
 * A directory name from `out.json`, or reg-suit's own name when the report carries none.
 *
 * @param {unknown} value The `actualDir`, `expectedDir`, or `diffDir` value.
 * @param {string} fallback The name reg-suit uses.
 * @returns {string} The directory, relative to the working directory.
 */
function directoryOf(value, fallback) {
  return typeof value === 'string' && value !== '' ? value.replace(/\/+$/, '') : fallback;
}

/**
 * Whether a path stays inside the working directory. The names come from the render, which on a fork run
 * is the contributor's code, so a `..` segment or an absolute path is refused rather than followed.
 *
 * @param {string} file A path relative to the working directory.
 * @returns {boolean} `true` when copying it cannot reach outside.
 */
function staysInside(file) {
  return !file.startsWith('/')
    && !/^[A-Za-z]:/.test(file)
    && !file.split(/[\\/]/).some(segment => segment === '..');
}

/**
 * The files, relative to the working directory, that show a reviewer every difference in a comparison.
 *
 * @param {object|null} report Parsed `out.json`, or `null` when there is none.
 * @returns {{files: string[], refused: string[]}} The files to stage, report first and each listed once,
 * and the paths refused because they would leave the working directory.
 */
export function reviewFiles(report) {
  if (!report) {
    return { files: [], refused: [] };
  }

  const list = key => (Array.isArray(report[key]) ? report[key].filter(item => typeof item === 'string') : []);
  const actual = directoryOf(report.actualDir, 'actual');
  const expected = directoryOf(report.expectedDir, 'expected');
  const diff = directoryOf(report.diffDir, 'diff');
  const candidates = [
    ...REPORT_FILES,
    ...list('failedItems').flatMap(item => [`${expected}/${item}`, `${actual}/${item}`]),
    // reg-cli names a diff after its item with the extension swapped for `.png`, and lists the result here.
    ...list('diffItems').map(item => `${diff}/${item}`),
    ...list('newItems').map(item => `${actual}/${item}`),
    ...list('deletedItems').map(item => `${expected}/${item}`),
  ];
  const unique = [...new Set(candidates)];

  return {
    files: unique.filter(staysInside),
    refused: unique.filter(file => !staysInside(file)),
  };
}
