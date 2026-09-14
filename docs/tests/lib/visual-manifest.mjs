/**
 * Turns Playwright's JSON report into the reg-suit manifest the core visual gate reads.
 *
 * The docs suite compares with `toHaveScreenshot`, not with reg-suit, so it has no `out.json` of its
 * own — and until DEV-2860 it had no verdict either: a cache miss re-baselined the goldens and passed.
 * The baseline now lives in R2 under `docs/base/<branch>/` and this adapter is what lets
 * `visual-tests/scripts/visual-gate.mjs` judge a docs run exactly as it judges a core one: same
 * buckets, same comment, same `changed` verdict holding the same kind of environment approval.
 *
 * Pure and dependency-free apart from `node:fs` in `listPngs`, so every branch that decides whether a
 * docs pull request can merge is unit-tested without a browser or a bucket.
 *
 * Two things the report cannot tell us on its own, and how they are supplied:
 *
 * - **Which golden a test owns.** Playwright names a snapshot inside the matcher call, and the report
 *   carries the test's title, not the file it compared. Every `toHaveScreenshot` test therefore pushes
 *   a `snapshot` annotation naming its golden, relative to the screenshots root
 *   (`visualDocs.spec.ts/js-introduction.png`) — pushed as the FIRST statement of the test body so a
 *   page parked with `test.fixme()` still declares its golden and is never read as a deletion.
 * - **Which goldens existed before the run.** A deleted golden (a page dropped from `paths.js`) is one
 *   that is in the baseline and that no test declares; a new one is declared but absent. The report
 *   sees neither, so the workflow records the fetched baseline in `baseline.txt` between the sync and
 *   the run, and passes it here.
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Playwright's message when a golden is absent, from `matchers/expect.js`: "A snapshot doesn't exist
 * at <path>." With `updateSnapshots: 'none'` on CI that is a failed test rather than a silent write,
 * and it means "new item", not "changed item" — the difference between "review this page for the
 * first time" and "this page changed".
 */
const MISSING_SNAPSHOT = /snapshot doesn't exist/i;

/**
 * The annotation type every `toHaveScreenshot` test pushes to name its golden.
 */
const SNAPSHOT_ANNOTATION = 'snapshot';

/**
 * @typedef {object} VisualManifest
 * @property {string[]} failedItems Goldens whose comparison found a difference.
 * @property {string[]} newItems Goldens a test declares that the baseline does not hold yet.
 * @property {string[]} deletedItems Goldens in the baseline that no test declares any more.
 * @property {string[]} passedItems Goldens that matched.
 * @property {string[]} expectedItems The baseline this run was compared against.
 * @property {string[]} actualItems Everything this run rendered or tried to.
 * @property {string[]} diffItems The items with a diff image — the changed ones.
 */

/**
 * Every `snapshot` annotation a report entry carries.
 *
 * Read from the test AND from its results: an annotation pushed at runtime lands on the result, and
 * Playwright copies the last result's annotations onto the test. Taking the union keeps the adapter
 * correct whichever way a given version reports it, and a retry cannot lose the declaration.
 *
 * @param {object} test One `JSONReportTest`.
 * @returns {string[]} The golden paths it declares, deduplicated.
 */
function snapshotsOf(test) {
  const annotations = [
    ...(Array.isArray(test.annotations) ? test.annotations : []),
    ...(Array.isArray(test.results) ? test.results : [])
      .flatMap(result => (Array.isArray(result?.annotations) ? result.annotations : [])),
  ];

  return [...new Set(annotations
    .filter(annotation => annotation?.type === SNAPSHOT_ANNOTATION && annotation.description)
    .map(annotation => String(annotation.description)))];
}

/**
 * Whether a failed test failed for want of a golden rather than because the page changed.
 *
 * Every error of every attempt is searched: a missing golden is missing on the retry too, and reading
 * only the last result would depend on which attempt the reporter serialized last.
 *
 * @param {object} test One `JSONReportTest`.
 * @returns {boolean} `true` when an error says the snapshot does not exist.
 */
function isMissingSnapshot(test) {
  return (Array.isArray(test.results) ? test.results : []).some((result) => {
    const messages = [
      result?.error?.message,
      ...(Array.isArray(result?.errors) ? result.errors.map(error => error?.message) : []),
    ];

    return messages.some(message => typeof message === 'string' && MISSING_SNAPSHOT.test(message));
  });
}

/**
 * Walks a report's suites, which nest one level per file and per `describe`.
 *
 * @param {object[]} suites The suites to walk.
 * @param {(test: object) => void} visit Called once per test.
 */
function walkSuites(suites, visit) {
  (Array.isArray(suites) ? suites : []).forEach((suite) => {
    (Array.isArray(suite.specs) ? suite.specs : []).forEach((spec) => {
      (Array.isArray(spec.tests) ? spec.tests : []).forEach(visit);
    });

    walkSuites(suite.suites, visit);
  });
}

/**
 * The manifest of a comparison run.
 *
 * A test whose status is `skipped` (a page parked with `test.fixme()`, or skipped by a condition)
 * lands in no bucket: it was not compared, so it is neither passing nor changed — but it DID declare
 * its golden, which is what keeps a parked page from being reported as a deletion on every run.
 *
 * @param {object} options Inputs.
 * @param {object|null} options.report The parsed Playwright JSON report.
 * @param {string[]} [options.baseline] The goldens that existed before the run, relative to the
 * screenshots root.
 * @returns {VisualManifest} The manifest, every bucket sorted.
 */
export function manifestFromReport({ report, baseline = [] }) {
  const passed = new Set();
  const failed = new Set();
  const added = new Set();
  const declared = new Set();

  walkSuites(report?.suites, (test) => {
    const snapshots = snapshotsOf(test);

    if (snapshots.length === 0) {
      // A spec that takes no screenshot (the functional project, or a helper test that slipped into
      // this project) declares nothing and owns no golden.
      return;
    }

    snapshots.forEach(snapshot => declared.add(snapshot));

    if (test.status === 'expected' || test.status === 'flaky') {
      // `flaky` is a pass: the golden matched on a retry. The core suite's own answer to a capture
      // that only matches on a re-render is the same one — it counts, and the flake is visible in
      // the report rather than in the verdict.
      snapshots.forEach(snapshot => passed.add(snapshot));

      return;
    }

    if (test.status === 'unexpected') {
      const bucket = isMissingSnapshot(test) ? added : failed;

      snapshots.forEach(snapshot => bucket.add(snapshot));
    }
  });

  const expectedItems = [...new Set(baseline)].sort();
  const deletedItems = expectedItems.filter(item => !declared.has(item));
  const sorted = set => [...set].sort();

  return {
    failedItems: sorted(failed),
    newItems: sorted(added),
    deletedItems,
    passedItems: sorted(passed),
    expectedItems,
    actualItems: sorted(new Set([...passed, ...failed, ...added])),
    diffItems: sorted(failed),
  };
}

/**
 * The manifest of a freshly rendered baseline.
 *
 * A seed is its own reference, so every golden is "passing" and the three difference buckets are
 * empty. This manifest is what the probe finds at `docs/base/<branch>/out.json`; the gate never reads
 * it, which is why the action writes it under a different name during a bootstrap — a run that
 * created the baseline must report "baseline created", not "all screenshots match".
 *
 * @param {string[]} files The rendered goldens, relative to the screenshots root.
 * @returns {VisualManifest} The manifest.
 */
export function manifestFromTree(files) {
  const items = [...new Set(files)].sort();

  return {
    failedItems: [],
    newItems: [],
    deletedItems: [],
    passedItems: items,
    expectedItems: items,
    actualItems: items,
    diffItems: [],
  };
}

/**
 * Every PNG under a directory, relative to it, with `/` separators whatever the platform uses.
 *
 * @param {string} dir The screenshots root.
 * @returns {string[]} Sorted relative paths; empty when the directory does not exist.
 */
export function listPngs(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  const found = [];
  const walk = (current) => {
    readdirSync(current).forEach((entry) => {
      const full = join(current, entry);

      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (entry.endsWith('.png')) {
        found.push(relative(dir, full).split(sep).join('/'));
      }
    });
  };

  walk(dir);

  return found.sort();
}
